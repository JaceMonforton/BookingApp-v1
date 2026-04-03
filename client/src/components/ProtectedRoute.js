import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { getAccessToken, setAccessToken } from '../api/client';
import { setUser, clearUser } from '../redux/userSlice';
import { showLoading, hideLoading } from '../redux/alertSlice';
import axios from 'axios';

/**
 * @param {string} [allowedRoles] comma-separated e.g. "client" or "trainer,admin"
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  const rolesList = useMemo(
    () =>
      allowedRoles ? allowedRoles.split(',').map((s) => s.trim()).filter(Boolean) : null,
    [allowedRoles]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        dispatch(showLoading());
        let token = getAccessToken();
        if (!token) {
          try {
            const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
            token = res.data?.data?.accessToken;
            if (token) setAccessToken(token);
            if (res.data?.data?.user) dispatch(setUser(res.data.data.user));
          } catch {
            setAccessToken(null);
            dispatch(clearUser());
            if (!cancelled) navigate('/login', { replace: true });
            return;
          }
        }
        if (!getAccessToken()) {
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }
        const me = await api.get('/api/auth/me');
        if (me.data?.success && me.data.data) {
          dispatch(setUser(me.data.data));
          const role = me.data.data.role;
          if (rolesList && rolesList.length && !rolesList.includes(role)) {
            if (!cancelled) navigate('/', { replace: true });
            return;
          }
        } else {
          dispatch(clearUser());
          setAccessToken(null);
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }
      } catch {
        dispatch(clearUser());
        setAccessToken(null);
        if (!cancelled) navigate('/login', { replace: true });
      } finally {
        dispatch(hideLoading());
        if (!cancelled) setReady(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, rolesList]);

  if (!ready) return null;
  if (!getAccessToken() || !user) return <Navigate to="/login" replace />;
  if (rolesList && rolesList.length && !rolesList.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute;
