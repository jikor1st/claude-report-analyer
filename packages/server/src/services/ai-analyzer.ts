import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

const execAsync = promisify(exec);

export interface AIAnalysisResult {
  projectId: string;
  sessionId?: string;
  analysis: {
    summary: string;
    keyInsights: string[];
    technicalDetails: string[];
    recommendations: string[];
    complexity: 'low' | 'medium' | 'high';
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    codeChanges?: string[];
    filesModified?: string[];
    technologies?: string[];
    errors?: string[];
    performance?: string;
  };
  analyzedAt: Date;
  model: string;
}

export class AIAnalyzer {
  private claudeCommand: string = 'claude'; // Claude Code CLI 명령어
  private reportsDir: string;
  
  constructor() {
    // Claude Code CLI 사용 가능 여부 확인
    this.checkClaudeAvailability();
    // 보고서 저장 디렉토리 설정
    this.reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'claude-reports');
    this.ensureReportsDir();
  }
  
  private async ensureReportsDir(): Promise<void> {
    if (!fs.existsSync(this.reportsDir)) {
      await fsPromises.mkdir(this.reportsDir, { recursive: true });
    }
  }

  private async checkClaudeAvailability(): Promise<boolean> {
    try {
      await execAsync('which claude');
      console.log('Claude Code CLI 사용 가능');
      return true;
    } catch (error) {
      console.warn('Claude Code CLI를 찾을 수 없습니다. AI 분석 기능이 제한됩니다.');
      return false;
    }
  }

  // 저장된 분석 결과 확인 - 항상 파일 시스템에서 확인
  private async getStoredAnalysis(projectId: string, sessionId?: string): Promise<AIAnalysisResult | null> {
    try {
      // 세션 ID에서 .jsonl 확장자 제거
      const cleanSessionId = sessionId ? sessionId.replace('.jsonl', '') : undefined;
      
      const fileName = cleanSessionId 
        ? `ai-analysis-${projectId}-${cleanSessionId}.json`
        : `ai-analysis-${projectId}.json`;
      const filePath = path.join(this.reportsDir, projectId, fileName);
      
      console.log(`AI 분석 파일 확인: ${filePath}`);
      
      // 파일 시스템에서 실시간 확인
      if (fs.existsSync(filePath)) {
        const stats = await fsPromises.stat(filePath);
        console.log(`파일 수정 시간: ${stats.mtime.toISOString()}`);
        
        const content = await fsPromises.readFile(filePath, 'utf-8');
        console.log(`저장된 AI 분석 결과 로드: ${fileName}`);
        return JSON.parse(content);
      } else {
        console.log(`AI 분석 파일 없음: ${fileName}`);
      }
    } catch (error) {
      console.log('저장된 분석 결과 없음:', error);
    }
    return null;
  }
  
  // 분석 결과 저장
  private async saveAnalysis(analysis: AIAnalysisResult, projectId: string, sessionId?: string): Promise<void> {
    try {
      const projectDir = path.join(this.reportsDir, projectId);
      if (!fs.existsSync(projectDir)) {
        await fsPromises.mkdir(projectDir, { recursive: true });
      }
      
      // 세션 ID에서 .jsonl 확장자 제거
      const cleanSessionId = sessionId ? sessionId.replace('.jsonl', '') : undefined;
      
      const fileName = cleanSessionId 
        ? `ai-analysis-${projectId}-${cleanSessionId}.json`
        : `ai-analysis-${projectId}.json`;
      const filePath = path.join(projectDir, fileName);
      
      await fsPromises.writeFile(filePath, JSON.stringify(analysis, null, 2));
      console.log(`AI 분석 결과 저장됨: ${filePath}`);
    } catch (error) {
      console.error('AI 분석 결과 저장 실패:', error);
    }
  }
  
  // 세션 데이터를 AI로 분석
  async analyzeSession(sessionData: any, projectId: string, sessionId?: string): Promise<AIAnalysisResult> {
    // 저장된 분석 결과 먼저 확인
    const storedAnalysis = await this.getStoredAnalysis(projectId, sessionId);
    if (storedAnalysis) {
      console.log('저장된 AI 분석 결과 사용');
      return storedAnalysis;
    }
    
    try {
      const isAvailable = await this.checkClaudeAvailability();
      if (!isAvailable) {
        return this.getFallbackAnalysis(sessionData, projectId, sessionId);
      }

      // 분석할 컨텐츠 준비
      const analysisPrompt = this.createAnalysisPrompt(sessionData);
      
      // 임시 파일에 프롬프트 저장
      const tempFile = path.join(process.cwd(), `temp-analysis-${Date.now()}.txt`);
      await fsPromises.writeFile(tempFile, analysisPrompt, 'utf-8');

      // Claude Code CLI로 분석 실행 - 파일 입력 방식 사용
      const command = `${this.claudeCommand} < "${tempFile}"`;
      
      let stdout = '';
      let stderr = '';
      
      try {
        const result = await execAsync(command, {
          maxBuffer: 1024 * 1024 * 10, // 10MB
          timeout: 120000 // 120초 타임아웃으로 증가
        });
        stdout = result.stdout;
        stderr = result.stderr;
        console.log('Claude CLI 응답 길이:', stdout.length);
      } catch (execError: any) {
        console.error('Claude CLI 실행 에러:', execError);
        // 에러가 발생해도 stdout이 있으면 사용
        if (execError.stdout) {
          stdout = execError.stdout;
          console.log('에러 발생했지만 stdout 사용:', stdout.length);
        } else {
          throw execError;
        }
      }

      // 임시 파일 삭제
      try {
        if (fs.existsSync(tempFile)) {
          await fsPromises.unlink(tempFile);
        }
      } catch (unlinkError) {
        console.log('임시 파일 삭제 실패:', unlinkError);
      }

      // 결과 파싱
      const analysis = this.parseAnalysisResult(stdout);

      const result: AIAnalysisResult = {
        projectId,
        sessionId,
        analysis,
        analyzedAt: new Date(),
        model: 'claude-code-local'
      };
      
      // 분석 결과 저장
      await this.saveAnalysis(result, projectId, sessionId);
      
      return result;
    } catch (error) {
      console.error('AI 분석 오류:', error);
      // 오류 시 기본 분석 반환
      return this.getFallbackAnalysis(sessionData, projectId, sessionId);
    }
  }

  // 프로젝트 전체를 AI로 분석
  async analyzeProject(projectData: any, projectId: string): Promise<AIAnalysisResult> {
    // 저장된 분석 결과 먼저 확인
    const storedAnalysis = await this.getStoredAnalysis(projectId);
    if (storedAnalysis) {
      console.log('저장된 프로젝트 AI 분석 결과 사용');
      return storedAnalysis;
    }
    
    try {
      const isAvailable = await this.checkClaudeAvailability();
      if (!isAvailable) {
        return this.getFallbackAnalysis(projectData, projectId);
      }

      const analysisPrompt = `다음 프로젝트의 Claude Code 대화 세션을 분석해주세요:

프로젝트 정보:
- 총 세션 수: ${projectData.summary?.totalSessions || 0}
- 총 메시지 수: ${projectData.summary?.totalMessages || 0}
- 코드 블록 수: ${projectData.summary?.totalCodeBlocks || 0}
- 기간: ${projectData.summary?.dateRange?.start} ~ ${projectData.summary?.dateRange?.end}

주요 작업 내용을 분석하고 다음을 포함해서 한국어로 답변해주세요:
1. 전체 요약 (2-3문장)
2. 핵심 인사이트 3개
3. 기술적 세부사항 3개
4. 개선 권장사항 3개
5. 프로젝트 복잡도 평가 (low/medium/high)
6. 주요 토픽 5개
7. 전반적인 감정 톤 (positive/neutral/negative)

세션 데이터:
${JSON.stringify(projectData.sessions?.slice(0, 5), null, 2)}`;

      // Claude Code CLI로 분석 실행
      const command = `echo '${analysisPrompt.replace(/'/g, "'\\''")}' | ${this.claudeCommand}`;
      
      const { stdout } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 60000 // 60초 타임아웃
      });

      const analysis = this.parseAnalysisResult(stdout);

      const result: AIAnalysisResult = {
        projectId,
        analysis,
        analyzedAt: new Date(),
        model: 'claude-code-local'
      };
      
      // 분석 결과 저장
      await this.saveAnalysis(result, projectId);
      
      return result;
    } catch (error) {
      console.error('프로젝트 AI 분석 오류:', error);
      return this.getFallbackAnalysis(projectData, projectId);
    }
  }

  // 분석 프롬프트 생성
  private createAnalysisPrompt(sessionData: any): string {
    const messages = sessionData.messages || [];
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant');
    
    // 메시지 내용 추출 및 정리
    const getUserContent = (msg: any): string => {
      if (typeof msg.content === 'string') {
        return msg.content;
      } else if (Array.isArray(msg.content)) {
        return msg.content.map((c: any) => c.text || '').join(' ');
      } else if (msg.content?.content) {
        return msg.content.content;
      }
      return '';
    };

    // 전체 대화 내용 수집 (생략 없이)
    const allUserMessages = userMessages.map((m: any) => {
      const content = getUserContent(m);
      return content.length > 500 ? content.slice(0, 500) + '...' : content;
    });
    
    const allAssistantResponses = assistantMessages.slice(0, 10).map((m: any) => {
      const content = getUserContent(m);
      return content.length > 500 ? content.slice(0, 500) + '...' : content;
    });

    // 상세한 코드 분석과 작업 패턴 감지
    const codeBlocks: {lang: string, code: string, purpose: string}[] = [];
    const fileChanges: Map<string, string[]> = new Map();
    const technologies: Set<string> = new Set();
    const commands: string[] = [];
    const errors: string[] = [];
    const problemsSolved: string[] = [];
    
    messages.forEach((msg: any, msgIndex: number) => {
      const content = getUserContent(msg);
      const role = msg.role;
      
      // 코드 블록 상세 추출
      const codeMatches = content.matchAll(/```(\w*)\n([\s\S]*?)```/g);
      for (const match of codeMatches) {
        const lang = match[1] || 'plain';
        const code = match[2];
        technologies.add(lang);
        
        // 코드의 목적 추론
        let purpose = 'implementation';
        if (code.includes('test') || code.includes('describe')) purpose = 'testing';
        else if (code.includes('interface') || code.includes('type')) purpose = 'types';
        else if (lang === 'json') purpose = 'configuration';
        else if (lang === 'bash' || lang === 'sh') purpose = 'command';
        
        codeBlocks.push({ lang, code: code.slice(0, 200), purpose });
      }
      
      // 파일 작업 패턴 감지
      const filePatterns = [
        /(?:Edit|Write|Create|Update|Modified|Added|Deleted).*?([\w\-\/]+\.(ts|tsx|js|jsx|json|md|css|html|py|java|go|rs))/gi,
        /File: ([\w\-\/]+\.(ts|tsx|js|jsx|json|md|css|html|py|java|go|rs))/gi,
        /([\w\-\/]+\.(ts|tsx|js|jsx|json|md|css|html|py|java|go|rs))/g
      ];
      
      filePatterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const fileName = match[1] || match[0];
          if (!fileChanges.has(fileName)) {
            fileChanges.set(fileName, []);
          }
          
          // 작업 유형 추론
          const context = content.slice(Math.max(0, match.index! - 50), match.index! + 100);
          if (context.includes('Edit') || context.includes('수정')) {
            fileChanges.get(fileName)!.push('edited');
          } else if (context.includes('Create') || context.includes('생성')) {
            fileChanges.get(fileName)!.push('created');
          } else if (context.includes('Delete') || context.includes('삭제')) {
            fileChanges.get(fileName)!.push('deleted');
          }
        }
      });
      
      // 명령어 추출
      const cmdMatches = content.matchAll(/(?:npm|yarn|pnpm|git|cd|mkdir|curl|wget)\s+[^\n]+/g);
      for (const match of cmdMatches) {
        commands.push(match[0]);
      }
      
      // 에러 패턴 감지
      if (content.includes('error') || content.includes('Error') || content.includes('에러')) {
        const errorContext = content.slice(Math.max(0, content.indexOf('error') - 100), content.indexOf('error') + 200);
        errors.push(errorContext);
      }
      
      // 문제 해결 패턴 감지
      if (role === 'user' && (content.includes('안 돼') || content.includes('에러') || content.includes('문제') || content.includes('error') || content.includes('not working'))) {
        const nextAssistantMsg = messages[msgIndex + 1];
        if (nextAssistantMsg && nextAssistantMsg.role === 'assistant') {
          const solution = getUserContent(nextAssistantMsg).slice(0, 200);
          problemsSolved.push(`문제: ${content.slice(0, 100)} → 해결: ${solution}`);
        }
      }
    });

    // 메시지가 없을 경우 처리
    if (messages.length === 0) {
      return `세션 데이터가 비어있습니다. 분석할 수 없습니다.`;
    }
    
    // 작업 유형 분류
    const workTypes = new Set<string>();
    if (codeBlocks.some(b => b.purpose === 'implementation')) workTypes.add('구현');
    if (codeBlocks.some(b => b.purpose === 'testing')) workTypes.add('테스트');
    if (errors.length > 0) workTypes.add('디버깅');
    if (fileChanges.size > 10) workTypes.add('대규모 리팩토링');
    if (commands.some(c => c.includes('install'))) workTypes.add('환경 설정');

    // 작업 유형별 상세 분석
    const implementationDetails: string[] = [];
    const debuggingDetails: string[] = [];
    const refactoringDetails: string[] = [];
    
    // 구현 세부사항 추출
    codeBlocks.forEach(block => {
      if (block.purpose === 'implementation') {
        const summary = block.code.split('\n')[0] || '';
        if (summary) implementationDetails.push(`${block.lang}: ${summary.slice(0, 100)}`);
      }
    });
    
    // 디버깅 세부사항 추출
    errors.forEach((error, idx) => {
      if (idx < 3) {
        debuggingDetails.push(error.slice(0, 150));
      }
    });
    
    // 파일별 작업 통계
    const fileStats = new Map<string, number>();
    fileChanges.forEach((actions, file) => {
      fileStats.set(file, actions.length);
    });
    const topFiles = [...fileStats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => `${file} (${count}회 수정)`);

    const summary = `
세션 통계:
- 총 메시지: ${messages.length}개
- 코드 블록: ${codeBlocks.length}개  
- 수정 파일: ${fileChanges.size}개
- 기술 스택: ${[...technologies].slice(0, 3).join(', ') || '미확인'}

사용자 요청:
${allUserMessages[0] ? allUserMessages[0].slice(0, 100) : '요청 없음'}

파일 변경:
${topFiles.slice(0, 3).join(', ') || '없음'}
`.trim();

    return `다음 세션을 분석하여 MDX 형식의 리포트를 생성하세요:

${summary}

다음과 같은 MDX 형식으로 응답하세요:

# 세션 분석 리포트

${messages.length > 0 ? '이 세션에서 진행된 작업을 분석했습니다.' : '세션 데이터가 없습니다.'}

## 주요 작업 내용

${allUserMessages[0] ? '사용자가 요청한 작업을 수행했습니다.' : '특별한 요청이 없었습니다.'}

### 구현 사항
- 첫 번째 구현 내용
- 두 번째 구현 내용
- 세 번째 구현 내용

### 기술적 세부사항
- ${[...technologies][0] || 'JavaScript'} 사용
- ${codeBlocks.length}개의 코드 블록 작성
- ${fileChanges.size}개 파일 수정

## 개선 제안
1. 코드 리뷰 수행 권장
2. 테스트 커버리지 확대 필요
3. 문서화 작업 권장

## 성과 요약
전체적으로 ${messages.length > 10 ? '활발한' : '일반적인'} 개발 활동이 진행되었습니다.

---
*복잡도: ${messages.length > 50 ? 'high' : messages.length > 20 ? 'medium' : 'low'}*
*감정톤: neutral*`;
  }

  // AI 응답을 MDX로 저장
  private parseAnalysisResult(rawOutput: string): AIAnalysisResult['analysis'] {
    try {
      // 전체 MDX 내용을 summary에 저장
      let mdxContent = rawOutput.trim();
      
      // 복잡도 추출
      let complexity: 'low' | 'medium' | 'high' = 'medium';
      if (mdxContent.includes('복잡도: high')) complexity = 'high';
      else if (mdxContent.includes('복잡도: low')) complexity = 'low';
      
      // 감정톤 추출
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (mdxContent.includes('감정톤: positive')) sentiment = 'positive';
      else if (mdxContent.includes('감정톤: negative')) sentiment = 'negative';

      // MDX가 비어있거나 너무 짧으면 기본값 사용
      if (!mdxContent || mdxContent.length < 50) {
        mdxContent = `# 세션 분석 리포트

이 세션에 대한 분석을 진행했습니다.

## 주요 내용
- 개발 작업 수행
- 코드 구현 및 개선

## 개선 제안
- 코드 리뷰 권장
- 테스트 작성 필요
- 문서화 권장

---
*복잡도: medium*
*감정톤: neutral*`;
      }

      return {
        summary: mdxContent, // MDX 전체를 summary에 저장
        keyInsights: [],
        technicalDetails: [],
        recommendations: [],
        complexity,
        topics: ['개발', '프로그래밍'],
        sentiment
      };
    } catch (error) {
      console.error('AI 응답 파싱 오류:', error);
      return this.getDefaultAnalysis();
    }
  }

  // 섹션별 내용 저장 헬퍼
  private saveSection(section: string, content: string, result: any): void {
    const lines = content.split('\n').filter(line => line.trim());
    
    switch (section) {
      case 'summary':
        result.summary = lines.join(' ');
        break;
        
      case 'insights':
        lines.forEach(line => {
          if (line.match(/^[-•\d.]/)) {
            result.keyInsights.push(line.replace(/^[-•\d.]+\s*/, '').trim());
          }
        });
        break;
        
      case 'technical':
        lines.forEach(line => {
          if (line.match(/^[-•\d.]/)) {
            result.technicalDetails.push(line.replace(/^[-•\d.]+\s*/, '').trim());
          }
        });
        break;
        
      case 'files':
        lines.forEach(line => {
          if (line.includes(':') || line.includes('`')) {
            const file = line.replace(/[`:].*$/, '').replace(/^[-•\d.]+\s*/, '').trim();
            if (file) result.filesModified.push(file);
          }
        });
        break;
        
      case 'technologies':
        lines.forEach(line => {
          const techs = line.split(/[,:]/).map(t => t.trim()).filter(t => t && !t.includes('언어') && !t.includes('프레임워크'));
          result.technologies.push(...techs);
        });
        break;
        
      case 'errors':
        lines.forEach(line => {
          if (line.includes('문제') || line.includes('에러') || line.match(/^[-•\d.]/)) {
            result.errors.push(line.replace(/^[-•\d.]+\s*/, '').trim());
          }
        });
        break;
        
      case 'recommendations':
        lines.forEach(line => {
          if (line.match(/^[-•\d.]/)) {
            result.recommendations.push(line.replace(/^[-•\d.]+\s*/, '').trim());
          }
        });
        break;
        
      case 'performance':
        result.performance = lines.join(' ');
        break;
        
      case 'complexity':
        const complexityText = content.toLowerCase();
        if (complexityText.includes('high') || complexityText.includes('높')) {
          result.complexity = 'high';
        } else if (complexityText.includes('low') || complexityText.includes('낮')) {
          result.complexity = 'low';
        } else {
          result.complexity = 'medium';
        }
        break;
        
      case 'topics':
        lines.forEach(line => {
          const keywords = line.split(/[,、]/).map(k => k.trim().replace(/^[-•\d.#]+\s*/, '')).filter(k => k);
          result.topics.push(...keywords);
        });
        break;
        
      case 'sentiment':
        const sentimentText = content.toLowerCase();
        if (sentimentText.includes('positive') || sentimentText.includes('긍정')) {
          result.sentiment = 'positive';
        } else if (sentimentText.includes('negative') || sentimentText.includes('부정')) {
          result.sentiment = 'negative';
        } else {
          result.sentiment = 'neutral';
        }
        break;
    }
  }

  // Claude Code를 사용할 수 없을 때의 기본 분석
  private getFallbackAnalysis(data: any, projectId: string, sessionId?: string): AIAnalysisResult {
    const messageCount = data.totalMessages || data.messages?.length || 0;
    const codeBlocks = data.totalCodeBlocks || 0;
    
    return {
      projectId,
      sessionId,
      analysis: {
        summary: `이 ${sessionId ? '세션' : '프로젝트'}에서는 총 ${messageCount}개의 메시지가 교환되었으며, ${codeBlocks}개의 코드 블록이 작성되었습니다.`,
        keyInsights: [
          `총 ${messageCount}개의 대화 메시지 교환`,
          `${codeBlocks}개의 코드 블록 작성`,
          `활발한 개발 활동 진행`
        ],
        technicalDetails: [
          `메시지 수: ${messageCount}`,
          `코드 블록: ${codeBlocks}`,
          `평균 메시지/세션: ${data.averageMessagesPerSession || 'N/A'}`
        ],
        recommendations: [
          '코드 리뷰 수행 권장',
          '문서화 작업 필요',
          '테스트 코드 작성 권장'
        ],
        complexity: messageCount > 100 ? 'high' : messageCount > 50 ? 'medium' : 'low',
        topics: data.topics || ['개발', '코딩', '프로그래밍'],
        sentiment: 'neutral'
      },
      analyzedAt: new Date(),
      model: 'fallback-statistics'
    };
  }

  // 기본 분석 결과
  private getDefaultAnalysis(): AIAnalysisResult['analysis'] {
    return {
      summary: '세션 분석이 완료되었습니다.',
      keyInsights: ['개발 작업 진행', '코드 작성', '문제 해결'],
      technicalDetails: ['다양한 기술 사용', '코드 구현', '디버깅'],
      recommendations: ['코드 리뷰', '테스트 작성', '문서화'],
      complexity: 'medium',
      topics: ['개발', '프로그래밍', '코딩', '디버깅', '구현'],
      sentiment: 'neutral'
    };
  }
}

// 싱글톤 인스턴스
export const aiAnalyzer = new AIAnalyzer();