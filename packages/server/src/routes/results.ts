import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export const resultsRouter = Router();

// 분석 결과 디렉토리 (프로젝트 루트 기준)
const REPORTS_DIR = path.resolve(process.cwd(), '../../claude-reports');

// 모든 분석 결과 목록 조회
resultsRouter.get('/', async (req, res, next) => {
  try {
    // 디렉토리 확인
    if (!fs.existsSync(REPORTS_DIR)) {
      return res.status(404).json({ 
        error: '분석 결과가 없습니다.',
        message: 'claude-reports 디렉토리가 존재하지 않습니다.'
      });
    }

    // JSON 파일 목록 가져오기
    const files = await fsPromises.readdir(REPORTS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      return res.status(404).json({ 
        error: '분석 결과가 없습니다.',
        message: 'JSON 리포트 파일이 없습니다.'
      });
    }

    // 각 파일의 메타데이터 수집
    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = await fsPromises.stat(filePath);
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const report = JSON.parse(content);
        
        return {
          filename: file,
          createdAt: stats.mtime,
          analyzedAt: report.analyzedAt,
          sourcePath: report.sourcePath,
          filesAnalyzed: report.filesAnalyzed,
          totalSessions: report.summary?.totalSessions || 0,
          totalMessages: report.summary?.totalMessages || 0
        };
      })
    );

    // 최신순으로 정렬
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      total: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
});

// 최신 분석 결과 조회
resultsRouter.get('/latest', async (req, res, next) => {
  try {
    // 디렉토리 확인
    if (!fs.existsSync(REPORTS_DIR)) {
      return res.status(404).json({ 
        error: '분석 결과가 없습니다.',
        message: 'claude-reports 디렉토리가 존재하지 않습니다.'
      });
    }

    // JSON 파일 목록 가져오기
    const files = await fsPromises.readdir(REPORTS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      return res.status(404).json({ 
        error: '분석 결과가 없습니다.',
        message: 'JSON 리포트 파일이 없습니다.'
      });
    }

    // 가장 최신 파일 찾기
    let latestFile = null;
    let latestTime = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(REPORTS_DIR, file);
      const stats = await fsPromises.stat(filePath);
      
      if (stats.mtime.getTime() > latestTime) {
        latestTime = stats.mtime.getTime();
        latestFile = file;
      }
    }

    if (!latestFile) {
      return res.status(404).json({ error: '분석 결과를 찾을 수 없습니다.' });
    }

    // 최신 파일 내용 읽기
    const filePath = path.join(REPORTS_DIR, latestFile);
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const report = JSON.parse(content);

    res.json({
      filename: latestFile,
      report
    });
  } catch (error) {
    next(error);
  }
});

// 특정 분석 결과 조회
resultsRouter.get('/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // 보안: 경로 트래버설 방지
    if (filename.includes('../') || filename.includes('..\\')) {
      return res.status(400).json({ error: '잘못된 파일명입니다.' });
    }

    const filePath = path.join(REPORTS_DIR, filename);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: '파일을 찾을 수 없습니다.',
        filename 
      });
    }

    // 파일 내용 읽기
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const report = JSON.parse(content);

    res.json({
      filename,
      report
    });
  } catch (error) {
    next(error);
  }
});