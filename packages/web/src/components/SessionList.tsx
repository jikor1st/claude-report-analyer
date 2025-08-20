import React from 'react';
import { SessionReport } from '../lib/api';

interface SessionListProps {
  sessions: SessionReport[];
  loading?: boolean;
}

export function SessionList({ sessions, loading }: SessionListProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">세션 목록</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">세션 목록</h3>
        <div className="text-gray-500 text-center py-8">
          분석된 세션이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">세션 목록</h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{session.id}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {session.totalMessages}개 메시지 
                  ({session.userMessages} 사용자, {session.assistantMessages} 어시스턴트)
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session.codeBlocks} 코드 블록
                </span>
              </div>
            </div>
            
            {session.topics.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {session.topics.slice(0, 3).map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {topic}
                    </span>
                  ))}
                  {session.topics.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{session.topics.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {session.dateRange.start && (
              <div className="mt-2 text-xs text-gray-500">
                {new Date(session.dateRange.start).toLocaleDateString('ko-KR')}
                {session.dateRange.end && session.dateRange.end !== session.dateRange.start && (
                  <> ~ {new Date(session.dateRange.end).toLocaleDateString('ko-KR')}</>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}