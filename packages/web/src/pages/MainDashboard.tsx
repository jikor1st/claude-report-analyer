import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  FolderIcon, 
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  CheckCircleIcon
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

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  trend?: string;
}

function StatCard({ icon, title, value, subtitle, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-gray-500'} flex items-center`}>
            {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
            {trend === 'up' ? '+12%' : '0%'}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function MainDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
      
      // Generate recent activity from projects
      const activities = (data.projects || [])
        .slice(0, 5)
        .map((p: Project) => ({
          id: p.id,
          name: p.name,
          action: p.aiAnalysis ? 'AI 분석 완료' : '새 세션 추가',
          time: p.lastModified,
          type: p.aiAnalysis ? 'analysis' : 'session'
        }));
      setRecentActivity(activities);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStats = () => {
    const totalSessions = projects.reduce((sum, p) => sum + p.sessionCount, 0);
    const analyzedProjects = projects.filter(p => p.analyzed).length;
    const aiAnalyzedProjects = projects.filter(p => p.aiAnalysis).length;
    const activeProjects = projects.filter(p => {
      const lastMod = new Date(p.lastModified);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastMod > dayAgo;
    }).length;
    return { totalSessions, analyzedProjects, aiAnalyzedProjects, activeProjects };
  };

  const stats = getTotalStats();

  const getProjectDisplayName = (name: string) => {
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      const relevantParts = parts.slice(-3);
      return relevantParts.join('/');
    }
    return name;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const topProjects = projects
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Claude Code 분석 대시보드</h1>
        <p className="text-blue-100 mb-6">AI 대화 세션을 분석하고 개발 인사이트를 얻으세요</p>
        <div className="flex space-x-6">
          <div>
            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-blue-100">총 프로젝트</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.totalSessions}</p>
            <p className="text-blue-100">총 세션</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.aiAnalyzedProjects}</p>
            <p className="text-blue-100">AI 분석 완료</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderIcon className="h-6 w-6 text-blue-600" />}
          title="활성 프로젝트"
          value={stats.activeProjects}
          subtitle="24시간 내 활동"
          color="bg-blue-100"
          trend="up"
        />
        <StatCard
          icon={<DocumentTextIcon className="h-6 w-6 text-green-600" />}
          title="총 세션"
          value={stats.totalSessions}
          subtitle="모든 프로젝트"
          color="bg-green-100"
        />
        <StatCard
          icon={<SparklesIcon className="h-6 w-6 text-purple-600" />}
          title="AI 분석"
          value={stats.aiAnalyzedProjects}
          subtitle="완료된 분석"
          color="bg-purple-100"
        />
        <StatCard
          icon={<ChartBarIcon className="h-6 w-6 text-orange-600" />}
          title="분석률"
          value={`${Math.round((stats.aiAnalyzedProjects / Math.max(projects.length, 1)) * 100)}%`}
          subtitle="전체 프로젝트 대비"
          color="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">인기 프로젝트</h2>
            <span className="text-sm text-gray-500">세션 수 기준</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : topProjects.length > 0 ? (
              topProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getProjectDisplayName(project.name)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {project.sessionCount} 세션
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.aiAnalysis && (
                      <SparklesIcon className="h-4 w-4 text-purple-500" />
                    )}
                    <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">프로젝트가 없습니다</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
            <button
              onClick={fetchProjects}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              새로고침
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/project/${activity.id}`)}
                >
                  <div className={`
                    p-2 rounded-lg mt-0.5
                    ${activity.type === 'analysis' ? 'bg-purple-100' : 'bg-blue-100'}
                  `}>
                    {activity.type === 'analysis' ? (
                      <SparklesIcon className="h-4 w-4 text-purple-600" />
                    ) : (
                      <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getProjectDisplayName(activity.name)}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.time)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">최근 활동이 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <BeakerIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">새 프로젝트 분석</p>
              <p className="text-sm text-gray-500">Claude Code 세션 분석 시작</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">리포트 보기</p>
              <p className="text-sm text-gray-500">생성된 분석 리포트 확인</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">활동 캘린더</p>
              <p className="text-sm text-gray-500">일별 개발 활동 확인</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}