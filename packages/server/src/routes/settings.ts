import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

const router = Router();

// 현재 설정 조회
router.get('/settings', async (req, res) => {
  try {
    const settings = {
      claudeCodeProjectsPath: process.env.CLAUDE_CODE_PROJECTS_PATH || '',
      port: process.env.PORT || '3001',
      reportsDir: process.env.REPORTS_DIR || './claude-reports',
      // 실제 사용 중인 경로 정보
      actualProjectsPath: await getActualProjectsPath(),
      pathExists: false
    };
    
    // 경로 존재 여부 확인
    if (settings.actualProjectsPath) {
      settings.pathExists = fs.existsSync(settings.actualProjectsPath);
    }
    
    res.json(settings);
  } catch (error: any) {
    console.error('설정 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 설정 업데이트
router.post('/settings', async (req, res) => {
  try {
    const { claudeCodeProjectsPath } = req.body;
    
    if (!claudeCodeProjectsPath) {
      return res.status(400).json({ error: '프로젝트 경로가 필요합니다.' });
    }
    
    // 경로 확장 (~ 처리)
    const expandedPath = claudeCodeProjectsPath.replace(/^~/, process.env.HOME || '');
    
    // 경로 존재 확인
    if (!fs.existsSync(expandedPath)) {
      return res.status(400).json({ 
        error: '지정한 경로가 존재하지 않습니다.',
        path: expandedPath 
      });
    }
    
    // .env 파일 업데이트
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = await fsPromises.readFile(envPath, 'utf-8');
    }
    
    // CLAUDE_CODE_PROJECTS_PATH 업데이트
    if (envContent.includes('CLAUDE_CODE_PROJECTS_PATH=')) {
      envContent = envContent.replace(
        /CLAUDE_CODE_PROJECTS_PATH=.*/,
        `CLAUDE_CODE_PROJECTS_PATH=${claudeCodeProjectsPath}`
      );
    } else {
      envContent += `\nCLAUDE_CODE_PROJECTS_PATH=${claudeCodeProjectsPath}`;
    }
    
    await fsPromises.writeFile(envPath, envContent);
    
    // 환경 변수 업데이트 (현재 프로세스)
    process.env.CLAUDE_CODE_PROJECTS_PATH = claudeCodeProjectsPath;
    
    // ProjectManager 인스턴스 재생성하여 즉시 적용
    const { resetProjectManager } = await import('../services/project-manager');
    resetProjectManager();
    
    res.json({
      success: true,
      message: '설정이 저장되었습니다.',
      settings: {
        claudeCodeProjectsPath,
        actualPath: expandedPath
      }
    });
  } catch (error: any) {
    console.error('설정 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 가능한 Claude Code 경로 제안
router.get('/settings/suggested-paths', async (req, res) => {
  try {
    const home = process.env.HOME || '';
    const suggestedPaths = [
      {
        path: path.join(home, '.claude', 'projects'),
        label: 'Claude Code 기본 경로',
        exists: false
      },
      {
        path: path.join(home, '.config', 'claude-code', 'projects'),
        label: 'Linux/Unix 대체 경로',
        exists: false
      },
      {
        path: path.join(home, 'Library', 'Application Support', 'Claude', 'projects'),
        label: 'macOS 대체 경로',
        exists: false
      },
      {
        path: path.join(home, 'Documents', 'claude-projects'),
        label: 'Documents 폴더',
        exists: false
      }
    ];
    
    // 각 경로 존재 여부 확인
    for (const suggested of suggestedPaths) {
      suggested.exists = fs.existsSync(suggested.path);
    }
    
    res.json({ suggestedPaths });
  } catch (error: any) {
    console.error('경로 제안 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실제 사용 중인 프로젝트 경로 가져오기
async function getActualProjectsPath(): Promise<string> {
  const envPath = process.env.CLAUDE_CODE_PROJECTS_PATH;
  if (envPath) {
    return envPath.replace(/^~/, process.env.HOME || '');
  }
  
  const possiblePaths = [
    path.join(process.env.HOME || '', '.config', 'claude-code', 'projects'),
    path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude-code', 'projects'),
    path.join(process.cwd(), 'test-projects')
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return path.join(process.cwd(), 'test-projects');
}

export default router;