import React, { useEffect, useState } from 'react';
import '../layout.css';
import '../index.css';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Badge } from 'antd';
import Logo from '../assets/KFW-Logo.png';
import api, { setAccessToken } from '../api/client';
import { clearUser } from '../redux/userSlice';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setCollapsed(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const closeMobileNav = () => {
    if (window.matchMedia('(max-width: 768px)').matches) setCollapsed(true);
  };

  if (!user) {
    return (
      <div className="layout-app layout-app--guest">
        <header className="guest-header">
          <Link to="/packages" className="guest-header__brand">
            Pulsed
          </Link>
          <div className="guest-header__actions">
            <Link to="/packages">Packages</Link>
            <Link to="/login" className="btn btn-sm btn-primary guest-header__cta">
              Sign in
            </Link>
          </div>
        </header>
        <main className="main-body main-body--guest">{children}</main>
      </div>
    );
  }

  const menu = [];
  menu.push({ name: 'Home', path: '/', icon: 'ri-home-4-line', end: true });
  menu.push({ name: 'Packages', path: '/packages', icon: 'ri-price-tag-3-line' });
  if (user?.role === 'client') {
    menu.push({ name: 'Dashboard', path: '/dashboard', icon: 'ri-dashboard-3-line' });
  }
  if (user?.role === 'trainer' || user?.role === 'admin') {
    menu.push({ name: 'Trainer hub', path: '/trainer', icon: 'ri-team-line' });
  }
  menu.push({ name: 'Profile', path: '/profile', icon: 'ri-user-settings-line' });
  menu.push({ name: 'Forms', path: '/forms', icon: 'ri-file-list-3-line' });

  const logout = async () => {
    closeMobileNav();
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    dispatch(clearUser());
    navigate('/login');
  };

  const roleLabel =
    user?.role === 'admin' ? 'Admin' : user?.role === 'trainer' ? 'Trainer' : 'Client';

  return (
    <div className={`layout-app${!collapsed ? ' layout-app--nav-open' : ''}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setCollapsed(true)}
      />
      <aside id="app-sidebar" className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__brand">
          <img className="logo" src={Logo} alt="" />
          {!collapsed && <span className="sidebar__brand-text">Pulsed</span>}
        </div>
        <nav className="sidebar__nav">
          {menu.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.end}
              onClick={closeMobileNav}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              <i className={m.icon} aria-hidden />
              <span>{m.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button
            type="button"
            className="nav-link nav-link--logout"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => logout()}
          >
            <i className="ri-logout-box-r-line" aria-hidden />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="top-header">
          <div className="top-header__left">
            <button
              type="button"
              className="remix-icons"
              aria-label={collapsed ? 'Open menu' : 'Close menu'}
              aria-expanded={!collapsed}
              aria-controls="app-sidebar"
              onClick={() => setCollapsed((c) => !c)}
            >
              <i className={collapsed ? 'ri-menu-2-line' : 'ri-menu-fold-line'} />
            </button>
          </div>
          <div className="top-header__right">
            <Link to="/profile" className="user-menu-link">
              <span className="user-menu-link__text">{user?.name}</span>
              <span className="role-pill">{roleLabel}</span>
            </Link>
            <Badge count={0} size="small">
              <button
                type="button"
                className="remix-icons"
                aria-label="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <i className="ri-notification-3-line" />
              </button>
            </Badge>
          </div>
        </header>
        <main className="main-body">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
