import { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { mockApi } from '../services/mockApi';
import logoImg from '../../img/Pervye_logotip_tsvetnoy_Montazhnaya_oblast_1.png';
import avatarAdmin from '../../img/face-young-handsome-man_251136-17557.jpg';
import avatarManager from '../../img/confused-shocked-guy-raising-eyebrows-standing-stupor_176420-19590.jpg';
import avatarSidorova from '../../img/portrait-charming-young-lady-looking-confidently-camera-showing-her-natural-beauty-against_680097-1094.jpg';

const NAV = [
  { to: '/districts', id: 'districts', label: 'Районы', icon: '\u2022' },
  { to: '/users', id: 'users', label: 'Пользователи', icon: '\u2022' },
  { to: '/data', id: 'data', label: 'Отчёты', icon: '\u2022' },
  { to: '/analytics', id: 'analytics', label: 'Аналитика', icon: '\u2022' },
  { to: '/plans', id: 'plans', label: 'Планирование', icon: '\u2022' },
  { to: '/projects', id: 'projects', label: 'Проекты', icon: '\u2022' },
  { to: '/tasks', id: 'tasks', label: 'Задачи', icon: '\u2022' },
  { to: '/profile', id: 'profile', label: 'Личный кабинет', icon: '\u2022' },
];

export function ProtectedLayout() {
  const session = mockApi.getSession();
  if (!session.loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

function AppLayout() {
  const { canSeeModule, role, executorPerson } = useRole();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const roleAvatar =
    role === 'admin'
      ? avatarAdmin
      : role === 'manager'
        ? avatarManager
        : executorPerson === 'Сидорова'
          ? avatarSidorova
          : executorPerson === 'Петров'
            ? avatarManager
            : avatarAdmin;

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileMenuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src={logoImg} alt="Первые" />
        </div>
        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Навигация</div>
          {NAV.filter((item) => canSeeModule(item.id)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
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
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Открыть меню"
          >
            {'\u2630'}
          </button>
          <label className="search-pill">
            <span aria-hidden>{'\u2315'}</span>
            <input type="search" placeholder="Поиск" readOnly />
          </label>
          <div className="top-bar__actions">
            <button type="button" className="icon-btn" title="Настройки">
              {'\u2699'}
            </button>
            <button type="button" className="icon-btn" title="Уведомления">
              {'\u2764'}
            </button>
            <button
              type="button"
              className="icon-btn"
              title="Профиль"
              onClick={() => navigate('/profile')}
            >
              <img src={roleAvatar} alt="" />
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          onClick={closeMobileMenu}
          aria-label="Закрыть меню"
        />
      )}
    </div>
  );
}
