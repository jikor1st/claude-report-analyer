import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderIcon, 
  ChartBarIcon, 
  HomeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  sessionCount: number;
  analyzed: boolean;
  aiAnalysis?: any;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
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

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProjectDisplayName = (name: string) => {
    // 긴 경로명을 짧게 표시
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      const relevantParts = parts.slice(-3); // 마지막 3개 부분만 표시
      return relevantParts.join('/');
    }
    return name;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const isProjectActive = (projectId: string) => {
    return location.pathname.includes(projectId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-40
        w-80 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'lg:w-80' : 'lg:w-20'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'lg:hidden'}`}>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Claude Analyzer</h1>
                <p className="text-xs text-gray-500">AI 대화 분석 도구</p>
              </div>
            </div>
            <button
              className="hidden lg:block p-1 hover:bg-gray-100 rounded"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <Bars3Icon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          {sidebarOpen && (
            <div className="mt-4 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Quick Links */}
          <div className={`mb-6 ${!sidebarOpen && 'lg:mb-4'}`}>
            {sidebarOpen && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                빠른 메뉴
              </h3>
            )}
            <Link
              to="/"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${location.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}
                ${!sidebarOpen && 'lg:justify-center lg:px-2'}
              `}
            >
              <HomeIcon className="h-5 w-5" />
              {sidebarOpen && <span className="font-medium">대시보드</span>}
            </Link>
          </div>

          {/* Projects List */}
          <div>
            {sidebarOpen && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  프로젝트 ({filteredProjects.length})
                </h3>
                <button
                  onClick={fetchProjects}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  새로고침
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProjects.map((project) => (
                  <div key={project.id}>
                    <button
                      onClick={() => {
                        toggleProject(project.id);
                        navigate(`/project/${project.id}`);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all
                        ${isProjectActive(project.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}
                        ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                      `}
                    >
                      <div className="flex items-center flex-1">
                        <div className="flex items-center space-x-2">
                          {expandedProjects.has(project.id) ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                          <FolderIcon className="h-5 w-5" />
                        </div>
                        {sidebarOpen && (
                          <div className="ml-2 flex-1 text-left">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium truncate">
                                {getProjectDisplayName(project.name)}
                              </span>
                              {project.aiAnalysis && (
                                <SparklesIcon className="h-4 w-4 text-purple-500" title="AI 분석됨" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center space-x-1">
                                <DocumentTextIcon className="h-3 w-3" />
                                <span>{project.sessionCount}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>{formatDate(project.lastModified)}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Expanded Project Details */}
                    {sidebarOpen && expandedProjects.has(project.id) && (
                      <div className="ml-8 mt-1 space-y-1">
                        <Link
                          to={`/project/${project.id}`}
                          className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          세션 목록 보기
                        </Link>
                        {project.aiAnalysis && (
                          <Link
                            to={`/report/${project.id}`}
                            className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            AI 분석 리포트
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>총 {projects.length}개 프로젝트</span>
              <span>{projects.filter(p => p.aiAnalysis).length}개 분석됨</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 ml-12 lg:ml-0">
              <nav className="flex items-center space-x-2 text-sm">
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  홈
                </Link>
                {location.pathname !== '/' && (
                  <>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">
                      {location.pathname.includes('project') ? '프로젝트' : '리포트'}
                    </span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}