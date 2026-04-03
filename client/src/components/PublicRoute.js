import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../api/client';

function PublicRoute({ children }) {
  if (getAccessToken()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default PublicRoute;
