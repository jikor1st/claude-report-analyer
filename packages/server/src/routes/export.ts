import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

const router = Router();

// JSON 내보내기
router.post('/export/json', async (req, res) => {
  try {
    const report = req.body;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="claude-report.json"');
    res.json(report);
  } catch (error) {
    console.error('JSON 내보내기 오류:', error);
    res.status(500).json({ error: 'JSON 내보내기 실패' });
  }
});

// Markdown 내보내기
router.post('/export/markdown', async (req, res) => {
  try {
    const report = req.body;
    
    // Markdown 생성
    const markdown = generateMarkdown(report);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="claude-report.md"');
    res.send(markdown);
  } catch (error) {
    console.error('Markdown 내보내기 오류:', error);
    res.status(500).json({ error: 'Markdown 내보내기 실패' });
  }
});

// PDF 내보내기 (간단한 구현 - 실제로는 클라이언트에서 처리)
router.post('/export/pdf', async (req, res) => {
  try {
    const report = req.body;
    
    // PDF 생성은 클라이언트에서 처리하도록 Markdown을 반환
    const markdown = generateMarkdown(report);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="claude-report.md"');
    res.send(markdown);
  } catch (error) {
    console.error('PDF 내보내기 오류:', error);
    res.status(500).json({ error: 'PDF 내보내기 실패' });
  }
});

function generateMarkdown(report: any): string {
  const { summary, sessions, metadata } = report;
  
  let markdown = `# Claude Code 대화 세션 분석 리포트\n\n`;
  markdown += `생성 일시: ${new Date(metadata.generatedAt).toLocaleString('ko-KR')}\n\n`;
  
  markdown += `## 📊 전체 요약\n\n`;
  markdown += `- **총 세션 수**: ${summary.totalSessions}\n`;
  markdown += `- **총 메시지 수**: ${summary.totalMessages}\n`;
  markdown += `- **총 코드 블록**: ${summary.totalCodeBlocks}\n`;
  markdown += `- **평균 메시지/세션**: ${summary.averageMessagesPerSession}\n\n`;
  
  markdown += `### 주요 토픽\n\n`;
  summary.topTopics.forEach((topic: string) => {
    markdown += `- ${topic}\n`;
  });
  
  markdown += `\n## 📝 세션별 상세 분석\n\n`;
  
  sessions.forEach((session: any, index: number) => {
    markdown += `### 세션 ${index + 1}\n\n`;
    markdown += `- **시작 시간**: ${new Date(session.startTime).toLocaleString('ko-KR')}\n`;
    markdown += `- **종료 시간**: ${new Date(session.endTime).toLocaleString('ko-KR')}\n`;
    markdown += `- **지속 시간**: ${session.duration}분\n`;
    markdown += `- **메시지 수**: ${session.totalMessages}\n`;
    markdown += `- **코드 블록 수**: ${session.codeBlocks}\n\n`;
    
    if (session.topics.length > 0) {
      markdown += `**토픽**: ${session.topics.join(', ')}\n\n`;
    }
    
    if (session.files.length > 0) {
      markdown += `**작업한 파일**:\n`;
      session.files.forEach((file: string) => {
        markdown += `- ${file}\n`;
      });
      markdown += '\n';
    }
  });
  
  return markdown;
}

export default router;