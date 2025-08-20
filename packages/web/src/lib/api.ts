const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Report {
  filename: string;
  createdAt: string;
  analyzedAt: string;
  sourcePath: string;
  filesAnalyzed: number;
  totalSessions: number;
  totalMessages: number;
}

export interface ReportDetail {
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
}

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

class ApiClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getReports(): Promise<{ total: number; reports: Report[] }> {
    return this.fetch('/api/results');
  }

  async getLatestReport(): Promise<{ filename: string; report: ReportDetail }> {
    return this.fetch('/api/results/latest');
  }

  async getReport(filename: string): Promise<{ filename: string; report: ReportDetail }> {
    return this.fetch(`/api/results/${filename}`);
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.fetch('/health');
  }
}

export const api = new ApiClient();