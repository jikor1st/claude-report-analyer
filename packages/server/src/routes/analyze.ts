import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);
const router = Router();

// 프로젝트 분석 엔드포인트
router.post('/analyze', async (req, res) => {
  try {
    const { path: projectPath } = req.body;
    
    if (!projectPath) {
      return res.status(400).json({ error: '프로젝트 경로가 필요합니다.' });
    }

    // 경로 확장 (~ 처리)
    const expandedPath = projectPath.replace(/^~/, process.env.HOME || '');
    
    // CLI 도구를 사용하여 분석 실행
    const cliPath = path.resolve(process.cwd(), 'packages/cli/dist/index.js');
    const outputDir = path.resolve(process.cwd(), 'claude-reports');
    
    try {
      const { stdout, stderr } = await execAsync(
        `node "${cliPath}" analyze "${expandedPath}" -o "${outputDir}" -f all`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB 버퍼
      );
      
      if (stderr && !stderr.includes('✓')) {
        console.error('분석 중 경고:', stderr);
      }
      
      console.log('분석 완료:', stdout);
      
      // 분석 성공
      res.json({
        success: true,
        message: '분석이 완료되었습니다.',
        output: stdout
      });
    } catch (error: any) {
      console.error('분석 실행 오류:', error);
      return res.status(500).json({ 
        error: '분석 실행 중 오류가 발생했습니다.',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('분석 오류:', error);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 목록 조회 (간단한 구현)
router.get('/projects', async (req, res) => {
  try {
    // 실제로는 사용자가 지정한 경로에서 프로젝트를 스캔해야 함
    // 여기서는 예시 데이터 반환
    res.json({
      projects: [
        {
          name: 'Example Project',
          path: '~/.config/claude-code/projects/example',
          lastModified: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({ error: '프로젝트 목록 조회 중 오류가 발생했습니다.' });
  }
});

export default router;