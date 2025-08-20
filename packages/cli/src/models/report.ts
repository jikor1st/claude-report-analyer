export interface SessionReport {
  id: string;
  sessionCount: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  codeBlocks: number;
  topics: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface AnalysisReport {
  version: string;
  analyzedAt: string;
  sourcePath: string;
  filesAnalyzed: number;
  sessions: SessionReport[];
  summary: {
    totalSessions: number;
    totalMessages: number;
    totalCodeBlocks: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    topTopics: string[];
  };
  metadata: {
    analyzerVersion: string;
    platform: string;
    nodeVersion: string;
  };
}