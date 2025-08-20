import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // JSON 파싱 에러
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: '잘못된 JSON 형식입니다.',
      message: err.message
    });
    return;
  }

  // 일반 에러
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}