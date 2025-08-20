import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModernLayout from './components/ModernLayout';
import ModernDashboard from './pages/ModernDashboard';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import ReportView from './pages/ReportView';

function App() {
  return (
    <Router>
      <ModernLayout>
        <Routes>
          <Route path="/" element={<ModernDashboard />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report/:projectId" element={<ReportView />} />
          <Route path="/report/:projectId/:sessionId" element={<ReportView />} />
        </Routes>
      </ModernLayout>
    </Router>
  );
}

export default App;