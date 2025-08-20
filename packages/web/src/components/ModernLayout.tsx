import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  FolderIcon,
  SparklesIcon,
  ClockIcon,
  ArrowRightIcon,
  CommandLineIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';

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

export default function ModernLayout({ children }: LayoutProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    // Check system dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
      // Count unanalyzed projects as notifications
      const unanalyzed = (data.projects || []).filter((p: Project) => !p.aiAnalysis).length;
      setNotifications(unanalyzed);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProjectDisplayName = (name: string) => {
    if (name.startsWith('-Users-')) {
      const parts = name.split('-');
      const relevantParts = parts.slice(-2);
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
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const menuItems = [
    { path: '/', icon: HomeIcon, label: '대시보드', badge: null },
    { path: '/calendar', icon: CalendarIcon, label: '캘린더', badge: null },
    { path: '/reports', icon: DocumentTextIcon, label: '리포트', badge: null },
    { path: '/settings', icon: Cog6ToothIcon, label: '설정', badge: null },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-dark-950' : 'bg-gray-50'}`}>
      {/* Modern Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-800">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/25">
                <CommandLineIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Claude Analyzer</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI 코드 분석 플랫폼</p>
              </div>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트 검색... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-dark-800 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
              />
              <kbd className="absolute right-4 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs text-gray-500 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
              <BellIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Server Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">서버 정상</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex pt-16">
        {/* Modern Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800
          transition-transform duration-300 ease-in-out pt-16
        `}>
          <div className="flex flex-col h-full">
            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {/* Main Menu */}
              <div className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  메인 메뉴
                </h3>
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all
                      ${isActive(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Projects Section */}
              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    프로젝트 ({filteredProjects.length})
                  </h3>
                  <button
                    onClick={fetchProjects}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    새로고침
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="space-y-1">
                    {filteredProjects.slice(0, 10).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => navigate(`/project/${project.id}`)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg transition-all group
                          ${location.pathname.includes(project.id)
                            ? 'bg-gray-100 dark:bg-dark-800'
                            : 'hover:bg-gray-50 dark:hover:bg-dark-800/50'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <FolderIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {getProjectDisplayName(project.name)}
                            </p>
                            <div className="flex items-center space-x-3 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {project.sessionCount} 세션
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(project.lastModified)}
                              </span>
                            </div>
                          </div>
                          {project.aiAnalysis && (
                            <SparklesIcon className="h-4 w-4 text-accent-purple flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    프로젝트가 없습니다
                  </p>
                )}
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-800">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{projects.length} 프로젝트</span>
                <span>{projects.filter(p => p.aiAnalysis).length} 분석됨</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-950">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Search Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}