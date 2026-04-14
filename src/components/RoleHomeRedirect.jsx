import { Navigate } from 'react-router-dom';

function readStoredRole() {
  try {
    const r = localStorage.getItem('mgmt_role');
    if (r === 'admin' || r === 'manager' || r === 'executor') return r;
  } catch {
    /* ignore */
  }
  return 'admin';
}

export default function RoleHomeRedirect() {
  const role = readStoredRole();
  if (role === 'admin') return <Navigate to="/districts" replace />;
  return <Navigate to="/analytics" replace />;
}
