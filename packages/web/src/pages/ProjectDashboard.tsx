import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  sessionCount: number;
  analyzed: boolean;
  aiAnalysis?: any;
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
  aiAnalysis?: any;
}

interface DateStats {
  date: string;
  sessionCount: number;
  analyzedCount: number;
  totalMessages: number;
}

function ProjectDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dateStats, setDateStats] = useState<DateStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalyzing, setAIAnalyzing] = useState<string>('');

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


  // AI 세션 분석
  const aiAnalyzeSession = async (sessionId: string) => {
    if (!selectedProject) return;
    
    setAIAnalyzing(sessionId);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/sessions/${encodeURIComponent(sessionId)}/ai-analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success && data.aiAnalysis) {
        // 세션 목록 새로고침하여 분석 상태 업데이트
        await selectProject(selectedProject);
        
        // 리포트 페이지로 이동
        navigate(`/report/${selectedProject.id}/${sessionId}`);
      }
      setError('');
    } catch (err) {
      setError('AI 세션 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAIAnalyzing('');
    }
  };

  // AI 프로젝트 분석
  const aiAnalyzeProject = async () => {
    if (!selectedProject) return;
    
    setAIAnalyzing('project');
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/ai-analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success && data.aiAnalysis) {
        // 프로젝트 목록 새로고침하여 분석 상태 업데이트
        await loadProjects();
        await selectProject(selectedProject);
        
        // 리포트 페이지로 이동
        navigate(`/report/${selectedProject.id}`);
      }
      setError('');
    } catch (err) {
      setError('AI 프로젝트 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAIAnalyzing('');
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
                      onClick={() => {
                        if (project.aiAnalysis && selectedProject?.id === project.id) {
                          // 이미 선택된 프로젝트이고 AI 분석이 있으면 리포트로 이동
                          navigate(`/report/${project.id}`);
                        } else {
                          selectProject(project);
                        }
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProject?.id === project.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        세션: {project.sessionCount}개
                        {project.aiAnalysis && (
                          <>
                            <span className="ml-2 text-green-600">✓ AI 분석됨</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/report/${project.id}`);
                              }}
                              className="ml-2 text-purple-600 hover:text-purple-800 text-xs"
                            >
                              리포트 보기
                            </button>
                          </>
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
                    <div className="flex gap-2">
                      <button
                        onClick={aiAnalyzeProject}
                        disabled={aiAnalyzing === 'project'}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                      >
                        {aiAnalyzing === 'project' ? 'AI 분석 중...' : 'AI 분석'}
                      </button>
                      {selectedProject.aiAnalysis && (
                        <button
                          onClick={() => navigate(`/report/${selectedProject.id}`)}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          리포트 보기
                        </button>
                      )}
                    </div>
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
                        {sessions.filter(s => s.aiAnalysis).length}
                      </div>
                      <div className="text-sm text-gray-600">AI 분석 완료</div>
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
                            className={`border rounded-lg p-3 hover:bg-gray-50 ${session.aiAnalysis ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (session.aiAnalysis) {
                                navigate(`/report/${selectedProject.id}/${session.id}`);
                              }
                            }}
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
                                {session.aiAnalysis ? (
                                  <>
                                    <span className="text-green-600 text-sm">✓ AI 분석됨</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/report/${selectedProject.id}/${session.id}`);
                                      }}
                                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200"
                                    >
                                      리포트
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      aiAnalyzeSession(session.id);
                                    }}
                                    disabled={aiAnalyzing === session.id}
                                    className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
                                  >
                                    {aiAnalyzing === session.id ? 'AI 분석 중...' : 'AI 분석'}
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