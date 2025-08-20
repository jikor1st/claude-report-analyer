import { useState } from 'react';
import { api } from '../lib/api';

interface AnalysisResult {
  projectName: string;
  sessions: any[];
  dateRange: {
    start: string;
    end: string;
  };
  statistics: {
    totalSessions: number;
    totalMessages: number;
    totalCodeBlocks: number;
    averageMessagesPerSession: number;
  };
}

function ProjectAnalyzer() {
  const [projectPath, setProjectPath] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectPath) {
      setError('프로젝트 경로를 입력해주세요.');
      return;
    }

    setAnalyzing(true);
    setError('');
    
    try {
      // CLI 도구를 통해 분석 실행
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: projectPath }),
      });

      if (!response.ok) {
        throw new Error('분석 실패');
      }

      const data = await response.json();
      setResult(data);
      
      // 최신 리포트 가져오기
      const latestReport = await api.getLatestReport();
      if (latestReport && latestReport.report) {
        processReportData(latestReport.report);
      }
    } catch (err) {
      setError('분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const processReportData = (report: any) => {
    // 날짜별로 세션 그룹화
    const sessionsByDate = new Map<string, any[]>();
    
    report.sessions.forEach((session: any) => {
      if (session.dateRange && session.dateRange.start) {
        const date = new Date(session.dateRange.start).toLocaleDateString('ko-KR');
        if (!sessionsByDate.has(date)) {
          sessionsByDate.set(date, []);
        }
        sessionsByDate.get(date)?.push(session);
      }
    });

    setResult({
      projectName: projectPath.split('/').pop() || 'Unknown Project',
      sessions: report.sessions,
      dateRange: report.summary.dateRange,
      statistics: {
        totalSessions: report.summary.totalSessions,
        totalMessages: report.summary.totalMessages,
        totalCodeBlocks: report.summary.totalCodeBlocks,
        averageMessagesPerSession: report.summary.averageMessagesPerSession || 0,
      },
    });
  };

  const getSessionsByDate = () => {
    if (!result) return new Map();
    
    const sessionsByDate = new Map<string, any[]>();
    result.sessions.forEach((session) => {
      if (session.dateRange && session.dateRange.start) {
        const date = new Date(session.dateRange.start).toLocaleDateString('ko-KR');
        if (!sessionsByDate.has(date)) {
          sessionsByDate.set(date, []);
        }
        sessionsByDate.get(date)?.push(session);
      }
    });
    
    return sessionsByDate;
  };

  const sessionsByDate = getSessionsByDate();
  const filteredSessions = selectedDate 
    ? sessionsByDate.get(selectedDate) || []
    : result?.sessions || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Claude Code 프로젝트 분석
        </h2>
        
        {/* 프로젝트 경로 입력 */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="프로젝트 폴더 경로를 입력하세요 (예: ~/.config/claude-code/projects/my-project)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {analyzing ? '분석 중...' : '분석 시작'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 분석 결과 */}
        {result && (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">총 세션</div>
                <div className="text-2xl font-bold text-blue-900">
                  {result.statistics.totalSessions}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">총 메시지</div>
                <div className="text-2xl font-bold text-green-900">
                  {result.statistics.totalMessages}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">코드 블록</div>
                <div className="text-2xl font-bold text-purple-900">
                  {result.statistics.totalCodeBlocks}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-orange-600 text-sm font-medium">평균 메시지/세션</div>
                <div className="text-2xl font-bold text-orange-900">
                  {result.statistics.averageMessagesPerSession.toFixed(1)}
                </div>
              </div>
            </div>

            {/* 날짜 선택 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">날짜별 분석</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDate('')}
                  className={`px-3 py-1 rounded ${
                    !selectedDate 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  전체
                </button>
                {Array.from(sessionsByDate.keys()).sort().map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-3 py-1 rounded ${
                      selectedDate === date 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {date} ({sessionsByDate.get(date)?.length}개)
                  </button>
                ))}
              </div>
            </div>

            {/* 세션 목록 */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {selectedDate ? `${selectedDate} 세션` : '전체 세션'} 
                  ({filteredSessions.length}개)
                </h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredSessions.map((session, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          세션 {index + 1}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(session.dateRange.start).toLocaleString('ko-KR')} - 
                          {new Date(session.dateRange.end).toLocaleString('ko-KR')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          메시지: {session.totalMessages} | 코드 블록: {session.codeBlocks}
                        </div>
                        {session.topics && session.topics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {session.topics.slice(0, 3).map((topic: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {topic.slice(0, 30)}...
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button className="text-blue-500 hover:text-blue-700">
                        상세보기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 세션 상세 */}
            {selectedSession && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto m-4">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">세션 상세 정보</h3>
                      <button
                        onClick={() => setSelectedSession(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">시작 시간</div>
                          <div className="font-medium">
                            {new Date(selectedSession.dateRange.start).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">종료 시간</div>
                          <div className="font-medium">
                            {new Date(selectedSession.dateRange.end).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">총 메시지</div>
                          <div className="font-medium">{selectedSession.totalMessages}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">코드 블록</div>
                          <div className="font-medium">{selectedSession.codeBlocks}</div>
                        </div>
                      </div>
                      
                      {selectedSession.topics && selectedSession.topics.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">주요 토픽</div>
                          <div className="space-y-2">
                            {selectedSession.topics.map((topic: string, i: number) => (
                              <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                                {topic}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectAnalyzer;