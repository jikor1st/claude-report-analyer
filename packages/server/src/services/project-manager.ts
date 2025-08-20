import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  sessionCount: number;
  analyzed: boolean;
}

export interface Session {
  id: string;
  projectId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  analyzed: boolean;
  analysisResult?: any;
}

export class ProjectManager {
  private baseDir: string = '';
  private projects: Map<string, Project> = new Map();
  private sessions: Map<string, Session[]> = new Map();
  private analysisResults: Map<string, any> = new Map();

  constructor() {
    // 환경 변수에서 경로 읽기, 없으면 기본 경로 사용
    const envPath = process.env.CLAUDE_CODE_PROJECTS_PATH;
    if (envPath) {
      // 환경 변수의 ~ 처리
      this.baseDir = envPath.replace(/^~/, process.env.HOME || '');
      console.log(`환경 변수에서 프로젝트 경로 설정: ${this.baseDir}`);
    } else {
      // 기본 Claude Code 경로들 시도
      const possiblePaths = [
        path.join(process.env.HOME || '', '.config', 'claude-code', 'projects'),
        path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude-code', 'projects'),
        path.join(process.cwd(), 'test-projects')
      ];
      
      let foundPath = false;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          this.baseDir = possiblePath;
          console.log(`프로젝트 경로 발견: ${this.baseDir}`);
          foundPath = true;
          break;
        }
      }
      
      // 아무 경로도 없으면 테스트 경로 사용
      if (!foundPath) {
        this.baseDir = path.join(process.cwd(), 'test-projects');
        console.log(`기본 테스트 경로 사용: ${this.baseDir}`);
      }
    }
    
    this.initialize();
  }

  private async initialize() {
    // 디렉토리 존재 확인
    if (!fs.existsSync(this.baseDir)) {
      console.warn(`프로젝트 디렉토리가 없습니다. 생성 중: ${this.baseDir}`);
      try {
        await fsPromises.mkdir(this.baseDir, { recursive: true });
        console.log(`프로젝트 디렉토리 생성됨: ${this.baseDir}`);
      } catch (error) {
        console.error(`프로젝트 디렉토리 생성 실패: ${error}`);
      }
    } else {
      console.log(`프로젝트 디렉토리 확인: ${this.baseDir}`);
    }
  }

  // 모든 프로젝트 스캔
  async scanProjects(): Promise<Project[]> {
    try {
      const entries = await fsPromises.readdir(this.baseDir, { withFileTypes: true });
      const projects: Project[] = [];

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const projectPath = path.join(this.baseDir, entry.name);
          const stats = await fsPromises.stat(projectPath);
          
          // JSONL 파일 개수 확인
          const sessionCount = await this.countJSONLFiles(projectPath);
          
          const project: Project = {
            id: entry.name,
            name: entry.name,
            path: projectPath,
            lastModified: stats.mtime,
            sessionCount,
            analyzed: this.analysisResults.has(entry.name)
          };
          
          projects.push(project);
          this.projects.set(project.id, project);
        }
      }

      return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('프로젝트 스캔 오류:', error);
      return [];
    }
  }

  // JSONL 파일 개수 계산
  private async countJSONLFiles(dirPath: string): Promise<number> {
    let count = 0;
    
    async function scan(dir: string): Promise<void> {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          count++;
        }
      }
    }
    
    await scan(dirPath);
    return count;
  }

  // 프로젝트의 세션 목록 가져오기
  async getProjectSessions(projectId: string): Promise<Session[]> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    // 캐시된 세션이 있으면 반환
    if (this.sessions.has(projectId)) {
      return this.sessions.get(projectId) || [];
    }

    // JSONL 파일들을 날짜별로 그룹화
    const sessions = await this.scanProjectSessions(project.path, projectId);
    this.sessions.set(projectId, sessions);
    
    return sessions;
  }

  // 프로젝트 세션 스캔
  private async scanProjectSessions(projectPath: string, projectId: string): Promise<Session[]> {
    const sessions: Session[] = [];
    const jsonlFiles: string[] = [];
    
    // JSONL 파일 찾기
    async function findJSONL(dir: string): Promise<void> {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await findJSONL(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          jsonlFiles.push(fullPath);
        }
      }
    }
    
    await findJSONL(projectPath);
    
    // 각 JSONL 파일을 세션으로 변환
    for (const file of jsonlFiles) {
      const stats = await fsPromises.stat(file);
      const relativePath = path.relative(projectPath, file);
      
      // 파일 내용의 첫 줄과 마지막 줄을 읽어 시간 정보 추출
      const { startTime, endTime, messageCount } = await this.extractSessionInfo(file);
      
      const session: Session = {
        id: relativePath,
        projectId,
        date: startTime.toLocaleDateString('ko-KR'),
        startTime,
        endTime,
        messageCount,
        analyzed: false,
        analysisResult: null
      };
      
      sessions.push(session);
    }
    
    // 날짜순으로 정렬
    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // 세션 정보 추출
  private async extractSessionInfo(filePath: string): Promise<{
    startTime: Date;
    endTime: Date;
    messageCount: number;
  }> {
    try {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      let startTime = new Date();
      let endTime = new Date();
      let messageCount = 0;
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'conversation.message') {
            messageCount++;
            const timestamp = new Date(data.created_at || data.timestamp);
            
            if (messageCount === 1) {
              startTime = timestamp;
            }
            endTime = timestamp;
          }
        } catch (e) {
          // JSON 파싱 오류 무시
        }
      }
      
      return { startTime, endTime, messageCount };
    } catch (error) {
      console.error(`세션 정보 추출 오류 (${filePath}):`, error);
      return {
        startTime: new Date(),
        endTime: new Date(),
        messageCount: 0
      };
    }
  }

  // 세션 분석 실행
  async analyzeSession(projectId: string, sessionId: string): Promise<any> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    const sessionPath = path.join(project.path, sessionId);
    
    // CLI를 사용하여 분석 실행
    const cliPath = path.resolve(process.cwd(), 'packages/cli/dist/index.js');
    const outputDir = path.resolve(process.cwd(), 'claude-reports', projectId);
    
    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      await fsPromises.mkdir(outputDir, { recursive: true });
    }
    
    try {
      const { stdout, stderr } = await execAsync(
        `node "${cliPath}" analyze "${sessionPath}" -o "${outputDir}" -f json`,
        { maxBuffer: 1024 * 1024 * 10 }
      );
      
      // 분석 결과 읽기
      const reportFiles = await fsPromises.readdir(outputDir);
      const latestReport = reportFiles
        .filter(f => f.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestReport) {
        const reportPath = path.join(outputDir, latestReport);
        const content = await fsPromises.readFile(reportPath, 'utf-8');
        const result = JSON.parse(content);
        
        // 세션 상태 업데이트
        const sessions = this.sessions.get(projectId) || [];
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          session.analyzed = true;
          session.analysisResult = result;
        }
        
        return result;
      }
      
      throw new Error('분석 결과를 찾을 수 없습니다');
    } catch (error: any) {
      console.error('세션 분석 오류:', error);
      throw new Error(`분석 실행 실패: ${error.message}`);
    }
  }

  // 프로젝트 전체 분석
  async analyzeProject(projectId: string): Promise<any> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    // CLI를 사용하여 전체 프로젝트 분석
    const cliPath = path.resolve(process.cwd(), 'packages/cli/dist/index.js');
    const outputDir = path.resolve(process.cwd(), 'claude-reports', projectId);
    
    if (!fs.existsSync(outputDir)) {
      await fsPromises.mkdir(outputDir, { recursive: true });
    }
    
    try {
      const { stdout, stderr } = await execAsync(
        `node "${cliPath}" analyze "${project.path}" -o "${outputDir}" -f all`,
        { maxBuffer: 1024 * 1024 * 10 }
      );
      
      // 분석 결과 읽기
      const reportFiles = await fsPromises.readdir(outputDir);
      const latestReport = reportFiles
        .filter(f => f.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestReport) {
        const reportPath = path.join(outputDir, latestReport);
        const content = await fsPromises.readFile(reportPath, 'utf-8');
        const result = JSON.parse(content);
        
        // 프로젝트 상태 업데이트
        project.analyzed = true;
        this.analysisResults.set(projectId, result);
        
        return result;
      }
      
      throw new Error('분석 결과를 찾을 수 없습니다');
    } catch (error: any) {
      console.error('프로젝트 분석 오류:', error);
      throw new Error(`분석 실행 실패: ${error.message}`);
    }
  }

  // 분석 결과 가져오기
  getAnalysisResult(projectId: string): any {
    return this.analysisResults.get(projectId);
  }

  // 특정 날짜의 세션들 가져오기
  async getSessionsByDate(projectId: string, date: string): Promise<Session[]> {
    const sessions = await this.getProjectSessions(projectId);
    return sessions.filter(s => s.date === date);
  }
}

// 싱글톤 인스턴스
export const projectManager = new ProjectManager();