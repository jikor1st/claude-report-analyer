import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  sessionCount: number;
  analyzed: boolean;
}

interface Session {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  analyzed: boolean;
  analysisResult?: any;
}

interface DateStats {
  date: string;
  sessionCount: number;
  analyzedCount: number;
  totalMessages: number;
}

function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dateStats, setDateStats] = useState<DateStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string>('');
  const [error, setError] = useState('');

  // 프로젝트 목록 로드
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects);
      setError('');
    } catch (err) {
      setError('프로젝트 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 선택시 세션 로드
  const selectProject = async (project: Project) => {
    setSelectedProject(project);
    setLoading(true);
    setSelectedDate('');
    
    try {
      const response = await fetch(`/api/projects/${project.id}/sessions`);
      const data = await response.json();
      setSessions(data.sessions);
      setDateStats(data.dateStats);
      setError('');
    } catch (err) {
      setError('세션 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 세션 분석
  const analyzeDate = async (date: string) => {
    if (!selectedProject) return;
    
    setAnalyzing(date);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/analyze-date/${encodeURIComponent(date)}`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      // 세션 목록 새로고침
      await selectProject(selectedProject);
      setError('');
    } catch (err) {
      setError(`${date} 분석 중 오류가 발생했습니다.`);
      console.error(err);
    } finally {
      setAnalyzing('');
    }
  };

  // 개별 세션 분석
  const analyzeSession = async (sessionId: string) => {
    if (!selectedProject) return;
    
    setAnalyzing(sessionId);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/sessions/${encodeURIComponent(sessionId)}/analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      // 세션 목록 새로고침
      await selectProject(selectedProject);
      setError('');
    } catch (err) {
      setError('세션 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAnalyzing('');
    }
  };

  // 프로젝트 전체 분석
  const analyzeProject = async () => {
    if (!selectedProject) return;
    
    setAnalyzing('project');
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      // 프로젝트 목록 새로고침
      await loadProjects();
      await selectProject(selectedProject);
      setError('');
    } catch (err) {
      setError('프로젝트 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAnalyzing('');
    }
  };

  // 날짜별 필터링된 세션
  const filteredSessions = selectedDate
    ? sessions.filter(s => s.date === selectedDate)
    : sessions;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Claude Code 프로젝트 분석 대시보드
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로젝트 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">프로젝트 목록</h2>
                <button
                  onClick={loadProjects}
                  disabled={loading}
                  className="text-blue-500 hover:text-blue-700"
                >
                  새로고침
                </button>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">
                    프로젝트가 없습니다.
                  </div>
                ) : (
                  projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => selectProject(project)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProject?.id === project.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        세션: {project.sessionCount}개
                        {project.analyzed && (
                          <span className="ml-2 text-green-600">✓ 분석됨</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(project.lastModified).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 세션 분석 영역 */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="space-y-6">
                {/* 프로젝트 정보 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedProject.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedProject.path}
                      </p>
                    </div>
                    <button
                      onClick={analyzeProject}
                      disabled={analyzing === 'project'}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {analyzing === 'project' ? '분석 중...' : '전체 분석'}
                    </button>
                  </div>

                  {/* 통계 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {sessions.length}
                      </div>
                      <div className="text-sm text-gray-600">총 세션</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {sessions.filter(s => s.analyzed).length}
                      </div>
                      <div className="text-sm text-gray-600">분석 완료</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {dateStats.length}
                      </div>
                      <div className="text-sm text-gray-600">활동 날짜</div>
                    </div>
                  </div>
                </div>

                {/* 날짜별 분석 */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">날짜별 세션</h3>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => setSelectedDate('')}
                        className={`px-3 py-1 rounded ${
                          !selectedDate
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        전체
                      </button>
                      {dateStats.map(stat => (
                        <button
                          key={stat.date}
                          onClick={() => setSelectedDate(stat.date)}
                          className={`px-3 py-1 rounded flex items-center gap-2 ${
                            selectedDate === stat.date
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <span>{stat.date}</span>
                          <span className="text-xs">
                            ({stat.analyzedCount}/{stat.sessionCount})
                          </span>
                          {stat.analyzedCount < stat.sessionCount && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeDate(stat.date);
                              }}
                              disabled={analyzing === stat.date}
                              className="ml-1 text-xs bg-white text-blue-500 px-2 py-0.5 rounded hover:bg-gray-100"
                            >
                              {analyzing === stat.date ? '분석 중...' : '분석'}
                            </button>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* 세션 목록 */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredSessions.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">
                          세션이 없습니다.
                        </div>
                      ) : (
                        filteredSessions.map(session => (
                          <div
                            key={session.id}
                            className="border rounded-lg p-3 hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {session.id}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {new Date(session.startTime).toLocaleTimeString('ko-KR')} - 
                                  {new Date(session.endTime).toLocaleTimeString('ko-KR')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  메시지: {session.messageCount}개
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.analyzed ? (
                                  <span className="text-green-600 text-sm">✓ 분석됨</span>
                                ) : (
                                  <button
                                    onClick={() => analyzeSession(session.id)}
                                    disabled={analyzing === session.id}
                                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                                  >
                                    {analyzing === session.id ? '분석 중...' : '분석'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                왼쪽에서 프로젝트를 선택하세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDashboard;