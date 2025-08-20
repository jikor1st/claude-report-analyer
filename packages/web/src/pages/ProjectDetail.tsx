import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarIcon,
  CodeBracketIcon,
  ArrowLeftIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

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

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dateStats, setDateStats] = useState<DateStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiAnalyzing, setAIAnalyzing] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      loadProjectDetails();
      loadSessions();
    }
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      const foundProject = data.projects.find((p: Project) => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        setError('프로젝트를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('프로젝트 정보를 불러오는데 실패했습니다.');
      console.error(err);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/sessions`);
      const data = await response.json();
      setSessions(data.sessions || []);
      setDateStats(data.dateStats || []);
      setError('');
    } catch (err) {
      setError('세션 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aiAnalyzeSession = async (sessionId: string) => {
    setAIAnalyzing(sessionId);
    try {
      const response = await fetch(
        `http://localhost:3001/api/projects/${projectId}/sessions/${encodeURIComponent(sessionId)}/ai-analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success && data.aiAnalysis) {
        await loadSessions();
        navigate(`/report/${projectId}/${sessionId}`);
      }
      setError('');
    } catch (err) {
      setError('AI 세션 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAIAnalyzing('');
    }
  };

  const aiAnalyzeProject = async () => {
    setAIAnalyzing('project');
    try {
      const response = await fetch(
        `http://localhost:3001/api/projects/${projectId}/ai-analyze`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success && data.aiAnalysis) {
        await loadProjectDetails();
        navigate(`/report/${projectId}`);
      }
      setError('');
    } catch (err) {
      setError('AI 프로젝트 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setAIAnalyzing('');
    }
  };

  const filteredSessions = selectedDate
    ? sessions.filter(s => s.date === selectedDate)
    : sessions;

  const getProjectDisplayName = (name: string) => {
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      return parts.slice(-2).join('/');
    }
    return name;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60000);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 ${minutes % 60}분`;
  };

  if (!project && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">프로젝트를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project ? getProjectDisplayName(project.name) : '로딩중...'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {project?.path}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {project?.aiAnalysis ? (
              <button
                onClick={() => navigate(`/report/${projectId}`)}
                className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg hover:shadow-lg transition-all"
              >
                <SparklesIcon className="h-5 w-5 inline mr-2" />
                전체 리포트 보기
              </button>
            ) : (
              <button
                onClick={aiAnalyzeProject}
                disabled={aiAnalyzing === 'project'}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all"
              >
                {aiAnalyzing === 'project' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 inline mr-2" />
                    프로젝트 전체 AI 분석
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">총 세션</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.filter(s => s.aiAnalysis).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI 분석 완료</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dateStats.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">활동 날짜</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((sessions.filter(s => s.aiAnalysis).length / Math.max(sessions.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">분석률</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      {dateStats.length > 0 && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">날짜별 필터</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDate('')}
              className={`px-4 py-2 rounded-lg transition-all ${
                !selectedDate
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
              }`}
            >
              전체 ({sessions.length})
            </button>
            {dateStats.map(stat => (
              <button
                key={stat.date}
                onClick={() => setSelectedDate(stat.date)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  selectedDate === stat.date
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                <span>{stat.date}</span>
                <span className="text-xs opacity-80">
                  ({stat.analyzedCount}/{stat.sessionCount})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800">
        <div className="p-6 border-b border-gray-200 dark:border-dark-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              세션 목록 {selectedDate && `(${selectedDate})`}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredSessions.length}개 세션
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-dark-800 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">세션이 없습니다</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors ${
                  session.aiAnalysis ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (session.aiAnalysis) {
                    navigate(`/report/${projectId}/${session.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <CodeBracketIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {session.id.replace('.jsonl', '')}
                      </h3>
                      {session.aiAnalysis && (
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          AI 분석 완료
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>소요시간: {formatDuration(session.startTime, session.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>{session.messageCount} 메시지</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.aiAnalysis ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/report/${projectId}/${session.id}`);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm rounded-lg hover:shadow-lg transition-all"
                      >
                        리포트 보기
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          aiAnalyzeSession(session.id);
                        }}
                        disabled={aiAnalyzing === session.id}
                        className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center space-x-2"
                      >
                        {aiAnalyzing === session.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            <span>분석 중...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4" />
                            <span>AI 분석</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}