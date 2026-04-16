import { Request, Response } from 'express';

export type SystemConfig = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  telebirrPhone?: string;
};

// In-memory config for the demo. Replace with DB-backed storage if needed.
let currentConfig: SystemConfig = {
  platformName: 'OMMS',
  supportEmail: 'support@example.com',
  maintenanceMode: false,
  telebirrPhone: '0911234567',
};

export const getSystemConfig = (_req: Request, res: Response) => {
  res.status(200).json(currentConfig);
};

export const updateSystemConfig = (req: Request, res: Response) => {
  try {
    const { platformName, supportEmail, maintenanceMode, telebirrPhone } = req.body as Partial<SystemConfig>;

    if (typeof platformName !== 'string' || !platformName.trim()) {
      return res.status(400).json({ message: 'platformName is required' });
    }
    if (typeof supportEmail !== 'string' || !supportEmail.trim()) {
      return res.status(400).json({ message: 'supportEmail is required' });
    }
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ message: 'maintenanceMode must be a boolean' });
    }

    currentConfig = {
      platformName: platformName.trim(),
      supportEmail: supportEmail.trim(),
      maintenanceMode,
      telebirrPhone: telebirrPhone?.trim() || currentConfig.telebirrPhone,
    };

    res.status(200).json(currentConfig);
  } catch (error) {
    res.status(500).json({ message: 'Error updating system config', error });
  }
};

