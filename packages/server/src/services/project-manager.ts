import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execAsync = promisify(exec);

export interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  sessionCount: number;
  analyzed: boolean;
  aiAnalysis?: any;
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
  aiAnalysis?: any;
}

export class ProjectManager {
  private baseDir: string = '';
  private projects: Map<string, Project> = new Map();
  private sessions: Map<string, Session[]> = new Map();
  private analysisResults: Map<string, any> = new Map();
  private aiAnalysisResults: Map<string, any> = new Map();
  private reportsDir: string;

  constructor() {
    // 리포트 디렉토리 설정
    this.reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'claude-reports');
    
    // 환경 변수에서 경로 읽기, 없으면 기본 경로 사용
    const envPath = process.env.CLAUDE_CODE_PROJECTS_PATH;
    console.log('환경 변수 CLAUDE_CODE_PROJECTS_PATH:', envPath);
    
    if (envPath && envPath.trim() !== '') {
      // 환경 변수의 ~ 처리
      this.baseDir = envPath.replace(/^~/, process.env.HOME || '');
      console.log(`환경 변수에서 프로젝트 경로 설정: ${this.baseDir}`);
    } else {
      // 기본 Claude Code 경로들 시도
      const possiblePaths = [
        path.join(process.env.HOME || '', '.claude', 'projects'),
        path.join(process.env.HOME || '', '.config', 'claude-code', 'projects'),
        path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'projects'),
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
          
          // AI 분석 여부 확인
          const aiAnalysis = this.getAIAnalysis(entry.name);
          
          const project: Project = {
            id: entry.name,
            name: entry.name,
            path: projectPath,
            lastModified: stats.mtime,
            sessionCount,
            analyzed: this.analysisResults.has(entry.name),
            aiAnalysis: aiAnalysis || undefined
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
      
      // AI 분석 여부 확인
      const aiAnalysis = this.getAIAnalysis(projectId, relativePath);
      
      const session: Session = {
        id: relativePath,
        projectId,
        date: startTime.toLocaleDateString('ko-KR'),
        startTime,
        endTime,
        messageCount,
        analyzed: false,
        analysisResult: null,
        aiAnalysis: aiAnalysis || undefined
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
  
  // AI 분석 결과 저장
  storeAIAnalysis(projectId: string, sessionId: string | null, analysis: any): void {
    const key = sessionId ? `${projectId}:${sessionId}` : projectId;
    this.aiAnalysisResults.set(key, analysis);
    
    // 세션에도 저장
    if (sessionId) {
      const sessions = this.sessions.get(projectId) || [];
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.aiAnalysis = analysis;
      }
    }
  }
  
  // AI 분석 결과 가져오기 - 항상 파일 시스템에서 최신 상태 확인
  getAIAnalysis(projectId: string, sessionId?: string): any {
    const key = sessionId ? `${projectId}:${sessionId}` : projectId;
    
    // 항상 파일 시스템을 먼저 확인하여 실시간 반영
    try {
      const cleanSessionId = sessionId ? sessionId.replace('.jsonl', '') : undefined;
      const fileName = cleanSessionId 
        ? `ai-analysis-${projectId}-${cleanSessionId}.json`
        : `ai-analysis-${projectId}.json`;
      const filePath = path.join(this.reportsDir, projectId, fileName);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = JSON.parse(content);
        // 메모리 캐시 업데이트
        this.aiAnalysisResults.set(key, result);
        return result;
      } else {
        // 파일이 없으면 메모리 캐시도 삭제
        this.aiAnalysisResults.delete(key);
        
        // 세션에서도 제거
        if (sessionId) {
          const sessions = this.sessions.get(projectId) || [];
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            delete session.aiAnalysis;
          }
        }
      }
    } catch (error) {
      console.log('AI 분석 파일 읽기 실패:', error);
      // 파일 읽기 실패 시 메모리 캐시 삭제
      this.aiAnalysisResults.delete(key);
    }
    
    return null;
  }

  // 특정 날짜의 세션들 가져오기
  async getSessionsByDate(projectId: string, date: string): Promise<Session[]> {
    const sessions = await this.getProjectSessions(projectId);
    return sessions.filter(s => s.date === date);
  }
  
  // 프로젝트 정보 가져오기
  async getProject(projectId: string): Promise<Project | null> {
    return this.projects.get(projectId) || null;
  }
  
  // 세션 파일 읽기 및 파싱
  async readSessionFile(sessionPath: string): Promise<any> {
    try {
      const content = await fsPromises.readFile(sessionPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const messages: any[] = [];
      let startTime: Date | null = null;
      let endTime: Date | null = null;
      let codeBlocks = 0;
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          // Claude Code 세션 형식에서 메시지 추출
          if (data.type === 'user' && data.message) {
            const messageContent = typeof data.message.content === 'string' 
              ? data.message.content 
              : (Array.isArray(data.message.content) 
                ? data.message.content.map((c: any) => typeof c === 'string' ? c : c.text || '').join(' ')
                : data.message.text || '');
            
            messages.push({
              role: 'user',
              content: messageContent,
              timestamp: data.timestamp
            });
            
            // 코드 블록 카운트
            const codeMatches = messageContent.match(/```[\w]*\n[\s\S]*?```/g);
            if (codeMatches) codeBlocks += codeMatches.length;
            
            const timestamp = new Date(data.timestamp);
            if (!startTime || timestamp < startTime) startTime = timestamp;
            if (!endTime || timestamp > endTime) endTime = timestamp;
          } else if (data.type === 'assistant' && data.message) {
            const messageContent = Array.isArray(data.message.content)
              ? data.message.content.map((c: any) => c.text || '').join(' ')
              : (data.message.content || data.message.text || '');
            
            messages.push({
              role: 'assistant', 
              content: messageContent,
              timestamp: data.timestamp
            });
            
            // 코드 블록 카운트
            const codeMatches = messageContent.match(/```[\w]*\n[\s\S]*?```/g);
            if (codeMatches) codeBlocks += codeMatches.length;
            
            const timestamp = new Date(data.timestamp);
            if (!startTime || timestamp < startTime) startTime = timestamp;
            if (!endTime || timestamp > endTime) endTime = timestamp;
          }
        } catch (e) {
          // JSON 파싱 오류 무시
        }
      }
      
      return {
        messages,
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
        totalCodeBlocks: codeBlocks,
        dateRange: {
          start: startTime?.toISOString() || 'Unknown',
          end: endTime?.toISOString() || 'Unknown'
        }
      };
    } catch (error) {
      console.error('세션 파일 읽기 오류:', error);
      return {
        messages: [],
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        dateRange: { start: 'Unknown', end: 'Unknown' }
      };
    }
  }
}

// 싱글톤 인스턴스 (지연 생성)
let _projectManager: ProjectManager | null = null;

export function getProjectManager(): ProjectManager {
  if (!_projectManager) {
    _projectManager = new ProjectManager();
  }
  return _projectManager;
}

// 설정 변경 시 인스턴스 재생성
export function resetProjectManager(): void {
  _projectManager = null;
}

// 기존 코드 호환성을 위한 export
export const projectManager = getProjectManager();