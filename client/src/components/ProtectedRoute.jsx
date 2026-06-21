import { Navigate, useLocation } from 'react-router-dom';

/**
 * Structural Security Guard Component.
 * Validates session tokens and enforces strict role-based access control (RBAC).
 * Gracefully synchronizes across persistent (localStorage) and session-based (sessionStorage) buckets.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  // 1. Retrieve raw storage strings safely from either persistent or session cache
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  let user = null;

  // 2. Safe Parsing Block to guard against UI crashes caused by corrupted storage states
  if (token && rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch (parseError) {
      console.error('Core Security Guard: Failed to parse user credentials metadata. Purging corrupted session.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // 3. Authentication Check: If key credentials are missing, reroute immediately to access gate
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Authorization / RBAC Check: Enforce structural boundaries based on validated institutional roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Core Security Guard: Access denied for role "${user.role}" at pathway "${location.pathname}".`);
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. Success Pipeline: Yield child elements forward if all structural security gates clear successfully
  return children;
};

export default ProtectedRoute;