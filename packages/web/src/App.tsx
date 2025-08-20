import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">
                Claude Report Analyzer
              </h1>
              <nav className="flex space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600 py-4'
                      : 'text-gray-600 hover:text-gray-900 py-4'
                  }
                >
                  대시보드
                </NavLink>
                <NavLink
                  to="/calendar"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600 py-4'
                      : 'text-gray-600 hover:text-gray-900 py-4'
                  }
                >
                  캘린더
                </NavLink>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600 py-4'
                      : 'text-gray-600 hover:text-gray-900 py-4'
                  }
                >
                  리포트
                </NavLink>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;