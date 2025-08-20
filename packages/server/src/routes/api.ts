import { Router } from 'express';
import { resultsRouter } from './results';
import exportRouter from './export';
import analyzeRouter from './analyze';
import projectsRouter from './projects';

export const router = Router();

// Projects 엔드포인트 (주요 기능)
router.use('/', projectsRouter);

// Results 엔드포인트
router.use('/results', resultsRouter);

// Export 엔드포인트
router.use('/', exportRouter);

// Analyze 엔드포인트
router.use('/', analyzeRouter);

// API 루트
router.get('/', (req, res) => {
  res.json({
    name: 'Claude Report Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      results: '/api/results',
      latestResult: '/api/results/latest'
    }
  });
});