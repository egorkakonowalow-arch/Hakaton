import { Routes, Route, Navigate } from 'react-router-dom';
import { mockApi } from './services/mockApi';
import { ProtectedLayout } from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import DataCollection from './components/DataCollection';
import Planning from './components/Planning';
import Tasks from './components/Tasks';
import Analytics from './components/Analytics';
import UserProfile from './components/UserProfile';
import Districts from './components/Districts';
import UsersAdmin from './components/UsersAdmin';
import Projects from './components/Projects';
import RoleHomeRedirect from './components/RoleHomeRedirect';

function LoginGate({ children }) {
  const s = mockApi.getSession();
  if (s.loggedIn) return <RoleHomeRedirect />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginGate>
            <Login />
          </LoginGate>
        }
      />
      <Route
        path="/register"
        element={
          <LoginGate>
            <Register />
          </LoginGate>
        }
      />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<RoleHomeRedirect />} />
        <Route path="districts" element={<Districts />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="data" element={<DataCollection />} />
        <Route path="projects" element={<Projects />} />
        <Route path="plans" element={<Planning />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
