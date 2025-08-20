import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: string;
  metadata?: Record<string, any>;
}

export class JSONLParser {
  async parseFile(filePath: string): Promise<Session[]> {
    const sessions: Session[] = [];
    const currentSession: Session = {
      id: `session-${Date.now()}`,
      messages: [],
      createdAt: new Date().toISOString()
    };

    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          
          // Claude Code JSONL \ud615\uc2dd\uc5d0 \ub9de\uac8c \ud30c\uc2f1
          if (data.type === 'message' || data.role) {
            const message: Message = {
              role: data.role || 'user',
              content: data.content || data.text || '',
              timestamp: data.timestamp || data.created_at
            };
            currentSession.messages.push(message);
          }
        } catch (error) {
          // \ud30c\uc2f1 \uc624\ub958 \ubb34\uc2dc\ud558\uace0 \uacc4\uc18d \uc9c4\ud589
          console.warn(`Failed to parse line: ${line.substring(0, 50)}...`);
        }
      }
    }

    if (currentSession.messages.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  async parseContent(content: string): Promise<Session[]> {
    const lines = content.split('\\n');
    const sessions: Session[] = [];
    const currentSession: Session = {
      id: `session-${Date.now()}`,
      messages: [],
      createdAt: new Date().toISOString()
    };

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'message' || data.role) {
            const message: Message = {
              role: data.role || 'user',
              content: data.content || data.text || '',
              timestamp: data.timestamp || data.created_at
            };
            currentSession.messages.push(message);
          }
        } catch (error) {
          // \ud30c\uc2f1 \uc624\ub958 \ubb34\uc2dc
        }
      }
    }

    if (currentSession.messages.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }
}