#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeCommand } from './commands/analyze.js';
import { VERSION } from '@claude-report-analyzer/shared/dist/index.js';

const program = new Command();

program
  .name('claude-analyzer')
  .description('Claude Report Analyzer - Claude Code 대화 세션 자동 분석 도구')
  .version(VERSION);

program
  .command('analyze')
  .description('지정된 폴더의 JSONL 파일을 분석합니다')
  .argument('<path>', '분석할 폴더 경로')
  .option('-o, --output <path>', '결과 출력 경로', './claude-reports')
  .option('-v, --verbose', '자세한 로그 출력')
  .action(analyzeCommand);

program.parse();

if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('\n클로드 리포트 분석기 v' + VERSION));
  console.log(chalk.gray('사용법: claude-analyzer <command> [options]\n'));
  program.outputHelp();
}