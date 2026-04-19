import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error });
  }
};

export const createPlan = async (req: any, res: Response) => {
  try {
    const { name, price, billing_cycle, type, max_members, duration_days } = req.body;
    const plan = await prisma.plan.create({
      data: {
        name,
        price,
        billing_cycle,
        type,
        max_members,
        duration_days,
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating plan', error });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, billing_cycle, type, max_members, duration_days } = req.body;
    const plan = await prisma.plan.update({
      where: { id: id },
      data: {
        name,
        price,
        billing_cycle,
        type,
        max_members,
        duration_days,
      },
    });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.plan.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error });
  }
};
