import { Request, Response } from 'express';
import { predefinedPlans } from '../data/predefinedData';

export const getPlans = async (req: Request, res: Response) => {
  try {
    res.status(200).json(predefinedPlans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error });
  }
};

// Create/Update/Delete plans disabled because they're now predefined in code
export const createPlan = async (req: any, res: Response) => {
  try {
    res.status(400).json({ message: 'Predefined plans cannot be modified' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating plan', error });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    res.status(400).json({ message: 'Predefined plans cannot be modified' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    res.status(400).json({ message: 'Predefined plans cannot be deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error });
  }
};
