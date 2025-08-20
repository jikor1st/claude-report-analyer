import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { JSONLParser } from '../utils/jsonl-parser';
import { SessionAnalyzer } from '../core/session-analyzer';

interface AnalyzeOptions {
  output: string;
  verbose: boolean;
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
    
    for (const file of jsonlFiles) {
      const fileSpinner = ora(chalk.blue(`\ubd84\uc11d \uc911: ${path.basename(file)}`)).start();
      
      try {
        const sessions = await parser.parseFile(file);
        const analysis = await analyzer.analyze(sessions);
        
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
    await fsPromises.mkdir(outputDir, { recursive: true });
    
    const reportPath = path.join(outputDir, `report-${Date.now()}.json`);
    await fsPromises.writeFile(reportPath, JSON.stringify({ 
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: jsonlFiles.length,
      outputPath: outputDir
    }, null, 2));

    console.log(chalk.green(`\\n\u2713 \ubd84\uc11d \uc644\ub8cc!`));
    console.log(chalk.gray(`  \uacb0\uacfc\uac00 ${reportPath}\uc5d0 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`));

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