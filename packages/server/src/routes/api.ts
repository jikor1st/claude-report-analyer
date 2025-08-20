import { Router } from 'express';
import { resultsRouter } from './results';
import exportRouter from './export';

export const router = Router();

// Results 엔드포인트
router.use('/results', resultsRouter);

// Export 엔드포인트
router.use('/', exportRouter);

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