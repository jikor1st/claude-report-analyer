import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { router as apiRouter } from './routes/api';
import { errorHandler } from './middleware/error-handler';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API 라우터
app.use('/api', apiRouter);

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Claude Report Analyzer API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`   http://localhost:${PORT}`);
});