import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { defaultPathForRole } from '../lib/roleRoutes';

type Props = {
  children: React.ReactNode;
  /** If set, only these roles may access the route */
  roles?: User['role'][];
};

const PrivateRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-brand-deep">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={defaultPathForRole(user.role)} replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute;
