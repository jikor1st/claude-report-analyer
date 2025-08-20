import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  CodeBracketIcon,
  CpuChipIcon,
  BoltIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  sessionCount: number;
  analyzed: boolean;
  aiAnalysis?: any;
}

interface ActivityData {
  date: string;
  sessions: number;
  messages: number;
  codeBlocks: number;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

export default function ModernDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    generateActivityData();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityData = () => {
    // Generate mock activity data for charts
    const data: ActivityData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        sessions: Math.floor(Math.random() * 20) + 5,
        messages: Math.floor(Math.random() * 100) + 50,
        codeBlocks: Math.floor(Math.random() * 50) + 10,
      });
    }
    setActivityData(data);
  };

  const stats = {
    totalProjects: projects.length,
    totalSessions: projects.reduce((sum, p) => sum + p.sessionCount, 0),
    analyzedProjects: projects.filter(p => p.aiAnalysis).length,
    activeToday: projects.filter(p => {
      const date = new Date(p.lastModified);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
  };

  const analysisRate = Math.round((stats.analyzedProjects / Math.max(stats.totalProjects, 1)) * 100);

  const techStackData = [
    { name: 'React', value: 35, fullMark: 100 },
    { name: 'TypeScript', value: 45, fullMark: 100 },
    { name: 'Node.js', value: 30, fullMark: 100 },
    { name: 'Python', value: 25, fullMark: 100 },
    { name: 'Docker', value: 20, fullMark: 100 },
  ];

  const projectTypeData = [
    { name: 'Frontend', value: 35 },
    { name: 'Backend', value: 25 },
    { name: 'Full Stack', value: 20 },
    { name: 'Data Science', value: 10 },
    { name: 'DevOps', value: 10 },
  ];

  const getProjectDisplayName = (name: string) => {
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      return parts.slice(-2).join('/');
    }
    return name;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-purple rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">안녕하세요! 👋</h1>
            <p className="text-primary-100 text-lg">
              오늘도 멋진 코드를 분석해볼까요? AI가 당신의 개발 여정을 도와드립니다.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <ClockIcon className="h-5 w-5" />
              <span className="font-medium">{new Date().toLocaleString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">전체 프로젝트</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">총 세션</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <CodeBracketIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">AI 분석</p>
                <p className="text-2xl font-bold">{stats.analyzedProjects}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <SparklesIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">오늘 활동</p>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <BoltIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend Chart */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">활동 트렌드</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedPeriod === 'week'
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800'
                }`}
              >
                월간
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSessions)" strokeWidth={2} />
              <Area type="monotone" dataKey="messages" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMessages)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tech Stack Radar Chart */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">기술 스택 분포</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={techStackData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 50]} stroke="#9ca3af" fontSize={10} />
              <Radar name="Usage" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">최근 프로젝트</h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              모두 보기 →
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        project.aiAnalysis 
                          ? 'bg-gradient-to-br from-accent-purple/20 to-accent-pink/20' 
                          : 'bg-gray-100 dark:bg-dark-800'
                      }`}>
                        {project.aiAnalysis ? (
                          <SparklesIcon className="h-5 w-5 text-accent-purple" />
                        ) : (
                          <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {getProjectDisplayName(project.name)}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {project.sessionCount} 세션
                          </span>
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {new Date(project.lastModified).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {project.aiAnalysis && (
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          분석 완료
                        </span>
                      )}
                      <ChartBarIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">프로젝트가 없습니다</p>
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        <div className="space-y-6">
          {/* Analysis Progress */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">분석 진행률</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400">
                    진행중
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                    {analysisRate}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-dark-800">
                <div 
                  style={{ width: `${analysisRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-500 to-accent-purple transition-all duration-500"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.analyzedProjects} / {stats.totalProjects} 프로젝트 분석 완료
              </p>
            </div>
          </div>

          {/* Project Types */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">프로젝트 유형</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={projectTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="group p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl hover:shadow-lg transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-500 rounded-xl text-white">
              <PlayIcon className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                새 분석 시작
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Claude Code 세션 분석하기
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="group p-6 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 dark:from-accent-purple/20 dark:to-accent-pink/20 rounded-2xl hover:shadow-lg transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl text-white">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-accent-purple">
                리포트 보기
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                분석 결과 확인하기
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className="group p-6 bg-gradient-to-br from-accent-teal/10 to-green-100 dark:from-accent-teal/20 dark:to-green-900/20 rounded-2xl hover:shadow-lg transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-accent-teal to-green-500 rounded-xl text-white">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-accent-teal">
                활동 타임라인
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                일별 개발 활동 보기
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}