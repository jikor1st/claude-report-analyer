import { Router } from 'express';
import { projectManager } from '../services/project-manager';

const router = Router();

// 모든 프로젝트 목록 조회
router.get('/projects', async (req, res) => {
  try {
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
    const result = projectManager.getAnalysisResult(projectId);
    
    if (!result) {
      return res.status(404).json({ error: '분석 결과가 없습니다.' });
    }
    
    res.json({
      projectId,
      result
    });
  } catch (error: any) {
    console.error('분석 결과 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 날짜별 분석 실행 (특정 날짜의 모든 세션 분석)
router.post('/projects/:projectId/analyze-date/:date', async (req, res) => {
  try {
    const { projectId, date } = req.params;
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