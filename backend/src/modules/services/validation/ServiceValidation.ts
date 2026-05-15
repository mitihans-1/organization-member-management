import { Request, Response, NextFunction } from 'express';

export const validateCreateService = (req: Request, res: Response, next: NextFunction) => {
  const { name, title, description } = req.body;
  if ((!name && !title) || !description) {
    return res.status(400).json({
      message: 'Name/title and description are required'
    });
  }
  next();
};

export const validateCreateServiceRequest = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const validateCreateServiceFeedback = (req: Request, res: Response, next: NextFunction) => {
  const { rating } = req.body;
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      message: 'Rating must be between 1 and 5'
    });
  }
  next();
};
