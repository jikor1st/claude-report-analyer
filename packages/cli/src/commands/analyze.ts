import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { JSONLParser } from '../utils/jsonl-parser.js';
import { SessionAnalyzer } from '../core/session-analyzer.js';
import { ReportGenerator } from '../services/report-generator.js';
import { PDFGenerator } from '../services/pdf-generator.js';
import { AnalysisResult } from '../core/session-analyzer.js';

interface AnalyzeOptions {
  output: string;
  verbose: boolean;
  format?: 'json' | 'markdown' | 'pdf' | 'all';
}

export async function analyzeCommand(targetPath: string, options: AnalyzeOptions): Promise<void> {
  const spinner = ora(chalk.blue('\ud3f4\ub354\ub97c \uc2a4\uce94\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4...')).start();

  try {
    // \uacbd\ub85c \ud655\uc778
    const resolvedPath = path.resolve(targetPath);
    
    if (!fs.existsSync(resolvedPath)) {
      spinner.fail(chalk.red(`\uacbd\ub85c\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4: ${resolvedPath}`));
      process.exit(1);
    }

    // JSONL \ud30c\uc77c \ucc3e\uae30
    spinner.text = 'JSONL \ud30c\uc77c\uc744 \ucc3e\uace0 \uc788\uc2b5\ub2c8\ub2e4...';
    const jsonlFiles = await findJSONLFiles(resolvedPath);
    
    if (jsonlFiles.length === 0) {
      spinner.warn(chalk.yellow('JSONL \ud30c\uc77c\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.'));
      process.exit(0);
    }

    spinner.succeed(chalk.green(`${jsonlFiles.length}\uac1c\uc758 JSONL \ud30c\uc77c\uc744 \ucc3e\uc558\uc2b5\ub2c8\ub2e4.`));

    // \uac01 \ud30c\uc77c \ubd84\uc11d
    const analyzer = new SessionAnalyzer();
    const parser = new JSONLParser();
    const analysisResults = new Map<string, AnalysisResult>();
    
    for (const file of jsonlFiles) {
      const fileSpinner = ora(chalk.blue(`\ubd84\uc11d \uc911: ${path.basename(file)}`)).start();
      
      try {
        const sessions = await parser.parseFile(file);
        const analysis = await analyzer.analyze(sessions);
        analysisResults.set(path.basename(file), analysis);
        
        if (options.verbose) {
          console.log(chalk.gray(`\\n${file}:`));
          console.log(chalk.gray(`  - \uc138\uc158 \uc218: ${analysis.sessionCount}`));
          console.log(chalk.gray(`  - \ucd1d \uba54\uc2dc\uc9c0: ${analysis.totalMessages}`));
        }
        
        fileSpinner.succeed(chalk.green(`\u2713 ${path.basename(file)}`));
      } catch (error) {
        fileSpinner.fail(chalk.red(`\u2717 ${path.basename(file)}: ${error}`));
      }
    }

    // \uacb0\uacfc \uc800\uc7a5
    const outputDir = path.resolve(options.output);
    const reportGenerator = new ReportGenerator(outputDir);
    
    spinner.text = '분석 결과를 저장하고 있습니다...';
    const reportPath = await reportGenerator.generateReport(
      analysisResults,
      resolvedPath,
      jsonlFiles.length
    );
    
    // Markdown 요약 생성
    const format = options.format || 'all';
    let markdownPath: string | undefined;
    let pdfPath: string | undefined;
    
    if (format === 'markdown' || format === 'all') {
      markdownPath = await reportGenerator.generateMarkdownSummary(reportPath);
    }
    
    if (format === 'pdf' || format === 'all') {
      // Markdown 파일이 없으면 먼저 생성
      if (!markdownPath) {
        markdownPath = await reportGenerator.generateMarkdownSummary(reportPath);
      }
      const pdfGenerator = new PDFGenerator(outputDir);
      pdfPath = await pdfGenerator.generatePDFFromMarkdown(markdownPath);
    }

    console.log(chalk.green(`\\n\u2713 \ubd84\uc11d \uc644\ub8cc!`));
    
    if (format === 'json' || format === 'all') {
      console.log(chalk.gray(`  JSON \ub9ac\ud3ec\ud2b8: ${reportPath}`));
    }
    
    if (markdownPath && (format === 'markdown' || format === 'all')) {
      console.log(chalk.gray(`  Markdown \uc694\uc57d: ${markdownPath}`));
    }
    
    if (pdfPath) {
      console.log(chalk.gray(`  PDF \ubb38\uc11c: ${pdfPath}`));
    }

  } catch (error) {
    spinner.fail(chalk.red(`\ubd84\uc11d \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4: ${error}`));
    process.exit(1);
  }
}

async function findJSONLFiles(dirPath: string): Promise<string[]> {
  const jsonlFiles: string[] = [];
  
  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        jsonlFiles.push(fullPath);
      }
    }
  }
  
  const stats = await fsPromises.stat(dirPath);
  if (stats.isDirectory()) {
    await scanDirectory(dirPath);
  } else if (stats.isFile() && dirPath.endsWith('.jsonl')) {
    jsonlFiles.push(dirPath);
  }
  
  return jsonlFiles;
}