import { Session, Message } from '../utils/jsonl-parser.js';

export interface AnalysisResult {
  sessionCount: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  averageMessagesPerSession: number;
  topics: string[];
  codeBlocks: number;
  timestamps: {
    first: string | null;
    last: string | null;
  };
}

export class SessionAnalyzer {
  analyze(sessions: Session[]): AnalysisResult {
    const result: AnalysisResult = {
      sessionCount: sessions.length,
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      averageMessagesPerSession: 0,
      topics: [],
      codeBlocks: 0,
      timestamps: {
        first: null,
        last: null
      }
    };

    if (sessions.length === 0) {
      return result;
    }

    // \uba54\uc2dc\uc9c0 \ud1b5\uacc4
    for (const session of sessions) {
      result.totalMessages += session.messages.length;
      
      for (const message of session.messages) {
        if (message.role === 'user') {
          result.userMessages++;
        } else if (message.role === 'assistant') {
          result.assistantMessages++;
        }

        // \ucf54\ub4dc \ube14\ub85d \uac10\uc9c0
        const codeBlockMatches = message.content.match(/```/g);
        if (codeBlockMatches) {
          result.codeBlocks += Math.floor(codeBlockMatches.length / 2);
        }

        // \ud0c0\uc784\uc2a4\ud0ec\ud504 \ucd94\ucd9c
        if (message.timestamp) {
          if (!result.timestamps.first || message.timestamp < result.timestamps.first) {
            result.timestamps.first = message.timestamp;
          }
          if (!result.timestamps.last || message.timestamp > result.timestamps.last) {
            result.timestamps.last = message.timestamp;
          }
        }
      }
    }

    // \ud3c9\uade0 \uacc4\uc0b0
    result.averageMessagesPerSession = result.totalMessages / result.sessionCount;

    // \uc8fc\uc694 \ud1a0\ud53d \ucd94\ucd9c (\uac04\ub2e8\ud55c \ud0a4\uc6cc\ub4dc \uae30\ubc18)
    result.topics = this.extractTopics(sessions);

    return result;
  }

  private extractTopics(sessions: Session[]): string[] {
    const keywords = new Map<string, number>();
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      '\uc744', '\ub97c', '\uc774', '\uac00', '\uc5d0', '\uc5d0\uc11c', '\ub85c', '\uc73c\ub85c', '\uc758', '\ub3c4',
      '\ub294', '\uc740', '\ud558\ub2e4', '\ud558\uace0', '\uc788\ub2e4', '\ub418\ub2e4', '\uc774\ub2e4', '\uadf8', '\uc800', '\uac83'
    ]);

    for (const session of sessions) {
      for (const message of session.messages) {
        if (message.role === 'user') {
          // \uae30\ubcf8\uc801\uc778 \ud0a4\uc6cc\ub4dc \ucd94\ucd9c
          const words = message.content
            .toLowerCase()
            .replace(/[^\w\s\uac00-\ud7a3]/g, ' ')
            .split(/\\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word));

          for (const word of words) {
            keywords.set(word, (keywords.get(word) || 0) + 1);
          }
        }
      }
    }

    // \ube48\ub3c4\uc21c\uc73c\ub85c \uc815\ub82c\ud558\uc5ec \uc0c1\uc704 10\uac1c \ubc18\ud658
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}