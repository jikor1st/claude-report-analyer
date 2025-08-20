import { Router } from 'express';
import { resultsRouter } from './results';

export const router = Router();

// Results 엔드포인트
router.use('/results', resultsRouter);

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