import { Request, Response, NextFunction } from 'express';

export const isEventManager = (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user?.role === 'orgAdmin' || user?.role === 'EventManager') {
    return next();
  }
  return res.status(403).json({ message: 'Event Manager or Org Admin permission required' });
};

export const isEventCoordinator = (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user?.role === 'orgAdmin' || user?.role === 'EventManager' || user?.role === 'EventCoordinator') {
    return next();
  }
  return res.status(403).json({ message: 'Event Coordinator or higher permission required' });
};

export const isEventParticipant = (req: any, res: Response, next: NextFunction) => {
  return next();
};
