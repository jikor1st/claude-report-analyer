import { Router } from 'express';
import * as path from 'path';
import { getProjectManager } from '../services/project-manager';
import { aiAnalyzer } from '../services/ai-analyzer';

const router = Router();

// 모든 프로젝트 목록 조회
router.get('/projects', async (req, res) => {
  try {
    const projectManager = getProjectManager();
    const projects = await projectManager.scanProjects();
    res.json({ projects });
  } catch (error: any) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 프로젝트의 세션 목록 조회
router.get('/projects/:projectId/sessions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectManager = getProjectManager();
    const sessions = await projectManager.getProjectSessions(projectId);
    
    // 날짜별로 그룹화
    const sessionsByDate = new Map<string, any[]>();
    sessions.forEach(session => {
      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, []);
      }
      sessionsByDate.get(session.date)?.push(session);
    });
    
    // 날짜별 통계 생성
    const dateStats = Array.from(sessionsByDate.entries()).map(([date, dateSessions]) => ({
      date,
      sessionCount: dateSessions.length,
      analyzedCount: dateSessions.filter(s => s.analyzed).length,
      totalMessages: dateSessions.reduce((sum, s) => sum + s.messageCount, 0)
    }));
    
    res.json({
      projectId,
      sessions,
      dateStats,
      totalSessions: sessions.length,
      analyzedSessions: sessions.filter(s => s.analyzed).length
    });
  } catch (error: any) {
    console.error('세션 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 날짜의 세션들 조회
router.get('/projects/:projectId/sessions/date/:date', async (req, res) => {
  try {
    const { projectId, date } = req.params;
    const projectManager = getProjectManager();
    const sessions = await projectManager.getSessionsByDate(projectId, date);
    
    res.json({
      projectId,
      date,
      sessions,
      totalSessions: sessions.length,
      analyzedSessions: sessions.filter(s => s.analyzed).length
    });
  } catch (error: any) {
    console.error('날짜별 세션 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 세션 분석 실행
router.post('/projects/:projectId/sessions/:sessionId/analyze', async (req, res) => {
  try {
    const { projectId, sessionId } = req.params;
    const projectManager = getProjectManager();
    
    // 분석 실행
    const result = await projectManager.analyzeSession(projectId, sessionId);
    
    res.json({
      success: true,
      projectId,
      sessionId,
      result
    });
  } catch (error: any) {
    console.error('세션 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 프로젝트 전체 분석 실행
router.post('/projects/:projectId/analyze', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectManager = getProjectManager();
    
    // 전체 분석 실행
    const result = await projectManager.analyzeProject(projectId);
    
    res.json({
      success: true,
      projectId,
      result
    });
  } catch (error: any) {
    console.error('프로젝트 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 프로젝트 분석 결과 조회
router.get('/projects/:projectId/analysis', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectManager = getProjectManager();
    const result = projectManager.getAnalysisResult(projectId);
    const aiResult = projectManager.getAIAnalysis(projectId);
    
    if (!result && !aiResult) {
      return res.status(404).json({ error: '분석 결과가 없습니다.' });
    }
    
    res.json({
      projectId,
      result,
      aiAnalysis: aiResult
    });
  } catch (error: any) {
    console.error('분석 결과 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 분석 결과 조회
router.get('/projects/:projectId/ai-analysis', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sessionId } = req.query;
    const projectManager = getProjectManager();
    const aiResult = projectManager.getAIAnalysis(projectId, sessionId as string | undefined);
    
    if (!aiResult) {
      return res.status(404).json({ error: 'AI 분석 결과가 없습니다.' });
    }
    
    res.json({
      projectId,
      sessionId,
      aiAnalysis: aiResult
    });
  } catch (error: any) {
    console.error('AI 분석 결과 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 분석 실행 (세션)
router.post('/projects/:projectId/sessions/:sessionId/ai-analyze', async (req, res) => {
  try {
    const { projectId, sessionId } = req.params;
    const projectManager = getProjectManager();
    
    // 기존 AI 분석 결과 확인
    const existingAnalysis = projectManager.getAIAnalysis(projectId, sessionId);
    if (existingAnalysis && !req.query.force) {
      return res.json({
        success: true,
        projectId,
        sessionId,
        aiAnalysis: existingAnalysis,
        cached: true
      });
    }
    
    // 실제 세션 파일 경로 생성
    const project = await projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    const sessionPath = path.join(project.path, sessionId);
    
    // 세션 파일 데이터 읽기 및 파싱
    const sessionData = await projectManager.readSessionFile(sessionPath);
    
    // AI 분석 실행
    const aiResult = await aiAnalyzer.analyzeSession(sessionData, projectId, sessionId);
    
    // 결과 저장
    projectManager.storeAIAnalysis(projectId, sessionId, aiResult);
    
    res.json({
      success: true,
      projectId,
      sessionId,
      aiAnalysis: aiResult
    });
  } catch (error: any) {
    console.error('AI 세션 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 분석 실행 (프로젝트 전체)
router.post('/projects/:projectId/ai-analyze', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectManager = getProjectManager();
    
    // 기존 AI 분석 결과 확인
    const existingAnalysis = projectManager.getAIAnalysis(projectId);
    if (existingAnalysis && !req.query.force) {
      return res.json({
        success: true,
        projectId,
        aiAnalysis: existingAnalysis,
        cached: true
      });
    }
    
    // 프로젝트 데이터 가져오기
    const projectData = projectManager.getAnalysisResult(projectId);
    
    if (!projectData) {
      // 프로젝트 분석 먼저 실행
      const analysisResult = await projectManager.analyzeProject(projectId);
      if (!analysisResult) {
        return res.status(404).json({ error: '프로젝트 분석 실패' });
      }
    }
    
    // AI 분석 실행
    const aiResult = await aiAnalyzer.analyzeProject(
      projectData || { projectId },
      projectId
    );
    
    // 결과 저장
    projectManager.storeAIAnalysis(projectId, null, aiResult);
    
    res.json({
      success: true,
      projectId,
      aiAnalysis: aiResult
    });
  } catch (error: any) {
    console.error('AI 프로젝트 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 날짜별 분석 실행 (특정 날짜의 모든 세션 분석)
router.post('/projects/:projectId/analyze-date/:date', async (req, res) => {
  try {
    const { projectId, date } = req.params;
    const projectManager = getProjectManager();
    const sessions = await projectManager.getSessionsByDate(projectId, date);
    
    const results = [];
    for (const session of sessions) {
      try {
        const result = await projectManager.analyzeSession(projectId, session.id);
        results.push({
          sessionId: session.id,
          success: true,
          result
        });
      } catch (error: any) {
        results.push({
          sessionId: session.id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      projectId,
      date,
      totalSessions: sessions.length,
      analyzedCount: results.filter(r => r.success).length,
      results
    });
  } catch (error: any) {
    console.error('날짜별 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;