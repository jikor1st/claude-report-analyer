import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export class PDFGenerator {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async generatePDFFromMarkdown(markdownPath: string): Promise<string> {
    // Markdown 파일 읽기
    const markdownContent = await fsPromises.readFile(markdownPath, 'utf-8');
    
    // Markdown을 HTML로 변환 (간단한 변환)
    const htmlContent = this.markdownToHTML(markdownContent);
    
    // PDF 파일 경로 생성
    const pdfPath = markdownPath.replace('.md', '.pdf');
    
    // Puppeteer로 PDF 생성
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // HTML 설정
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // PDF 생성
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });
      
      return pdfPath;
    } finally {
      await browser.close();
    }
  }

  private markdownToHTML(markdown: string): string {
    // 기본적인 Markdown을 HTML로 변환
    let html = markdown
      // 헤더 변환
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 굵은 글씨
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 코드 블록
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
      // 인라인 코드
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // 리스트
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/^- (.+)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.+)/gim, '<li>$1</li>')
      // 줄바꿈
      .replace(/\n\n/g, '</p><p>')
      // 링크
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // HTML 템플릿
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Report Analyzer - 분석 리포트</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    h1 {
      font-size: 28px;
      margin-bottom: 20px;
      color: #1a1a1a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    
    h2 {
      font-size: 22px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #2563eb;
    }
    
    h3 {
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #1e40af;
    }
    
    p {
      margin-bottom: 10px;
    }
    
    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
    }
    
    li {
      margin-bottom: 5px;
    }
    
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    strong {
      font-weight: 600;
      color: #1f2937;
    }
    
    a {
      color: #3b82f6;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
    
    .emoji {
      font-size: 1.2em;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
  }
}