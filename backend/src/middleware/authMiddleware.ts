import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config/jwtConfig';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error('JWT Verification Error (403):', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

/** Sets req.user when a valid token is present; continues without user otherwise. */
export const optionalAuthenticateToken = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
};
