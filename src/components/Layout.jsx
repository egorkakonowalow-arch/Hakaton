import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { mockApi } from '../services/mockApi';
import logoImg from '../../img/Pervye_logotip_tsvetnoy_Montazhnaya_oblast_1.png';
import avatarDemo from '../../img/face-young-handsome-man_251136-17557.jpg';

const NAV = [
  { to: '/districts', id: 'districts', label: 'Районы', icon: '📍' },
  { to: '/users', id: 'users', label: 'Пользователи', icon: '👥' },
  { to: '/data', id: 'data', label: 'Отчёты', icon: '▤' },
  { to: '/analytics', id: 'analytics', label: 'Аналитика', icon: '▦' },
  { to: '/plans', id: 'plans', label: 'Планирование', icon: '▥' },
  { to: '/tasks', id: 'tasks', label: 'Задачи', icon: '✓' },
  { to: '/scenarios', id: 'scenarios', label: 'Сценарии', icon: 'ⓘ' },
  { to: '/profile', id: 'profile', label: 'Личный кабинет', icon: '●' },
];

export function ProtectedLayout() {
  const session = mockApi.getSession();
  if (!session.loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

function AppLayout() {
  const { canSeeModule } = useRole();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src={logoImg} alt="Первые" />
        </div>
        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Модули</div>
          {NAV.filter((item) => canSeeModule(item.id)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="top-bar">
          <label className="search-pill">
            <span aria-hidden>🔍</span>
            <input type="search" placeholder="Поиск" readOnly />
          </label>
          <div className="top-bar__actions">
            <button type="button" className="icon-btn" title="Настройки">
              ⚙
            </button>
            <button type="button" className="icon-btn" title="Уведомления">
              🔔
            </button>
            <button
              type="button"
              className="icon-btn"
              title="Профиль"
              onClick={() => navigate('/profile')}
            >
              <img src={avatarDemo} alt="" />
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
