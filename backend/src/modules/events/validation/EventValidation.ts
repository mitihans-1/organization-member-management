import { Request, Response, NextFunction } from 'express';

export const validateCreateEvent = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, date } = req.body;
  if (!title || !description || !date) {
    return res.status(400).json({
      message: 'Title, description, and date are required'
    });
  }
  next();
};

export const validateCreateEventParticipant = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const validateCreateEventAttendance = (req: Request, res: Response, next: NextFunction) => {
  next();
};
