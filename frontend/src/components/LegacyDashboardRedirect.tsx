import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultPathForRole } from '../lib/roleRoutes';

/**
 * Maps old `/dashboard` URLs to the role-specific app shell after the three-dashboard split.
 */
const LegacyDashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rest = pathname.replace(/^\/dashboard/, '') || '/';
  const role = user.role;

  if (role === 'SuperAdmin') {
    const map: Record<string, string> = {
      '/': '/super-admin',
      '/members': '/super-admin/members',
      '/events': '/super-admin',
      '/blogs': '/super-admin',
      '/payments': '/super-admin/payments',
      '/profile': '/super-admin',
      '/admin/organizations': '/super-admin/organizations',
    };
    return <Navigate to={map[rest] ?? '/super-admin'} replace />;
  }

  if (role === 'organAdmin') {
    const map: Record<string, string> = {
      '/': '/org',
      '/members': '/org/members',
      '/events': '/org/events',
      '/blogs': '/org/blogs',
      '/payments': '/org/payments',
      '/profile': '/org/profile',
      '/admin/organizations': '/super-admin/organizations',
    };
    return <Navigate to={map[rest] ?? '/org'} replace />;
  }

  const map: Record<string, string> = {
    '/': '/member',
    '/members': '/member/profile',
    '/events': '/member/events',
    '/blogs': '/member/blog',
    '/payments': '/member/payments',
    '/profile': '/member/profile',
  };
  return <Navigate to={map[rest] ?? defaultPathForRole(role)} replace />;
};

export default LegacyDashboardRedirect;
