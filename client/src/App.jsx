import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public & Presentation View Layers
import LandingPage from './pages/LandingPage'; 
import LoginPage from './pages/LoginPage';
import RequestAccess from './pages/RequestAccess';
import Unauthorized from './pages/Unauthorized';

// Analytical Dashboard Entrypoints
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import MethodistDashboard from './pages/setup/MethodistDashboard'; 
import TeacherDashboard from './pages/teacher/Dashboard';

// Core Planning Context Components
import SetupWizard from './pages/setup/SetupWizard';
import ScheduleView from './pages/setup/ScheduleView';
import StaffManagement from './pages/setup/StaffManagement'; 
import TeacherClaims from './pages/setup/TeacherClaims';

// Нові ERP модулі кабінету методиста
import TeachersRegistry from './pages/setup/TeachersRegistry';
import ResourcesManagement from './pages/setup/ResourcesManagement';
import VersionsControl from './pages/setup/VersionsControl';

function DashboardSwitcher() {
  const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : {};
  
  if (user.isActive === false) {
    console.warn('[Security Gateway]: Deactivated profile context locked out from active dashboard routers.');
    return <Navigate to="/unauthorized" replace />;
  }

  if (user.role === 'Methodist') {
    return <MethodistDashboard />;
  }
  if (user.role === 'Teacher') {
    return <TeacherDashboard />;
  }
  
  return <Navigate to="/unauthorized" replace />;
}

function RootRouteGuard() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');

  if (token && rawUser) {
    try {
      const user = JSON.parse(rawUser);
      
      if (user.isActive === false) {
        return <LandingPage />;
      }

      if (user.role === 'SuperAdmin') {
        return <Navigate to="/superadmin/dashboard" replace />;
      } else if (user.role === 'Methodist' || user.role === 'Teacher') {
        return <Navigate to="/dashboard" replace />;
      }
    } catch (e) {
      return <LandingPage />;
    }
  }

  return <LandingPage />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* --- 🔓 PUBLIC ROUTING SEGMENTS (ДОСТУПНІ БЕЗ ЛОГІНУ) --- */}
        <Route path="/" element={<RootRouteGuard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* ФІКС: Роут для гостьового перегляду розкладу з useParams, повністю відкритий */}
        <Route path="/public/schedule/:publicVersionId" element={<ScheduleView />} />

        {/* --- 🔐 SUPERADMIN ISOLATED SECTOR --- */}
        <Route 
          path="/superadmin/*" 
          element = {
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* --- 🔐 PROTECTED INSTITUTIONAL APPLICATION SHELL (DYNAMIC LAYOUT) --- */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['Methodist', 'Teacher']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Universal dashboard gatekeeper switcher routing entrypoint */}
          <Route path="/dashboard" element={<DashboardSwitcher />} />
          
          <Route 
            path="/teacher-claims" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <TeacherClaims />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <StaffManagement />
              </ProtectedRoute>
            } 
          />

          {/* Маршрути нових повноцінних ERP сторінок для Координатора */}
          <Route 
            path="/teachers-registry" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <TeachersRegistry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resources-management" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <ResourcesManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/versions-control" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <VersionsControl />
              </ProtectedRoute>
            } 
          />

          {/* Methodist Core Configuration Flow Wizard */}
          <Route 
            path="/setup/*" 
            element={
              <ProtectedRoute allowedRoles={['Methodist']}>
                <SetupWizard />
              </ProtectedRoute>
            } 
          />

          {/* Внутрішній розклад авторизованого користувача (Методист/Викладач в системному Layout) */}
          <Route path="/my-schedule" element={<ScheduleView />} />
        </Route>

        {/* --- FALLBACK & CATCH-ALL ROUTER REDIRECTS --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;