import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSystemConfig = async (_req: Request, res: Response) => {
  try {
    // Safely check if systemConfig exists on prisma client
    const systemConfigModel = (prisma as any).systemConfig || (prisma as any).system_configs;
    
    if (!systemConfigModel) {
        console.error('SystemConfig model not found on Prisma client');
        return res.status(200).json({
            platformName: 'OMMS',
            telebirrPhone: '0911234567',
            cbeBirrPhone: '0911234568',
            paymentInstructions: 'Please transfer to our bank accounts.',
            showLiveChat: false
        });
    }

    let config = await systemConfigModel.findFirst();
    
    // If no config exists, create the default one
    if (!config) {
      config = await systemConfigModel.create({
        data: {
          platformName: 'OMMS',
          supportEmail: 'support@omms.com',
          maintenanceMode: false,
          telebirrPhone: '0911234567',
          cbeBirrPhone: '0911234568',
          paymentInstructions: 'Please include your name in the transaction reason.',
          contactPhone: '+251 911 234 567',
          contactAddress: 'Addis Ababa, Ethiopia',
          contactEmail: 'info@omms.com',
          contactHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
          showLiveChat: false,
          liveChatUrl: '',
        },
      });
    }
    
    res.status(200).json(config);
  } catch (error: any) {
    console.error('Error in getSystemConfig:', error);
    res.status(500).json({ message: 'Error fetching system config', error: error.message || error });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const { 
      platformName, supportEmail, maintenanceMode, 
      telebirrPhone, cbeBirrPhone, paymentInstructions,
      contactPhone, contactAddress, contactEmail, contactHours,
      showLiveChat, liveChatUrl,
      facebookUrl, telegramUrl, linkedinUrl
    } = req.body;

    const systemConfigModel = (prisma as any).systemConfig || (prisma as any).system_configs;
    
    if (!systemConfigModel) {
        return res.status(400).json({ message: 'SystemConfig model not found on Prisma client' });
    }

    let config = await systemConfigModel.findFirst();

    if (config) {
      config = await systemConfigModel.update({
        where: { id: config.id },
        data: {
          platformName: platformName ?? config.platformName,
          supportEmail: supportEmail ?? config.supportEmail,
          maintenanceMode: maintenanceMode ?? config.maintenanceMode,
          telebirrPhone: telebirrPhone ?? config.telebirrPhone,
          cbeBirrPhone: cbeBirrPhone ?? config.cbeBirrPhone,
          paymentInstructions: paymentInstructions ?? config.paymentInstructions,
          contactPhone: contactPhone ?? config.contactPhone,
          contactAddress: contactAddress ?? config.contactAddress,
          contactEmail: contactEmail ?? config.contactEmail,
          contactHours: contactHours ?? config.contactHours,
          showLiveChat: showLiveChat ?? config.showLiveChat,
          liveChatUrl: liveChatUrl ?? config.liveChatUrl,
          facebookUrl: facebookUrl ?? config.facebookUrl,
          telegramUrl: telegramUrl ?? config.telegramUrl,
          linkedinUrl: linkedinUrl ?? config.linkedinUrl,
        },
      });
    } else {
      config = await systemConfigModel.create({
        data: {
          platformName: platformName || 'OMMS',
          supportEmail: supportEmail || 'support@omms.com',
          maintenanceMode: maintenanceMode || false,
          telebirrPhone: telebirrPhone || '0911234567',
          cbeBirrPhone: cbeBirrPhone || '0911234568',
          paymentInstructions: paymentInstructions || 'Please include your name in the transaction reason.',
          contactPhone: contactPhone || '+251 911 234 567',
          contactAddress: contactAddress || 'Addis Ababa, Ethiopia',
          contactEmail: contactEmail || 'info@omms.com',
          contactHours: contactHours || 'Mon - Fri: 8:00 AM - 5:00 PM',
          showLiveChat: showLiveChat || false,
          liveChatUrl: liveChatUrl || '',
          facebookUrl: facebookUrl || '',
          telegramUrl: telegramUrl || '',
          linkedinUrl: linkedinUrl || '',
        },
      });
    }

    res.status(200).json(config);
  } catch (error: any) {
    console.error('Error in updateSystemConfig:', error);
    res.status(500).json({ message: 'Error updating system config', error: error.message || error });
  }
};
