import { Request, Response, NextFunction } from 'express';

export const isServiceManager = (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user?.role === 'orgAdmin' || user?.role === 'ServiceManager') {
    return next();
  }
  return res.status(403).json({ message: 'Service Manager or Org Admin permission required' });
};

export const isServiceOfficer = (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user?.role === 'orgAdmin' || user?.role === 'ServiceManager' || user?.role === 'ServiceOfficer') {
    return next();
  }
  return res.status(403).json({ message: 'Service Officer or higher permission required' });
};

export const isServiceReviewer = (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user?.role === 'orgAdmin' || user?.role === 'ServiceManager' || user?.role === 'ServiceReviewer') {
    return next();
  }
  return res.status(403).json({ message: 'Service Reviewer or higher permission required' });
};
