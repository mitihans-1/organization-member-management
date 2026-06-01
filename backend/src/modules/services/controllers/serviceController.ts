import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { resolveCatalogWhere, resolveRequestContext } from '../../../utils/catalogScope';
import { sendNewServiceNotification } from '../../../services/emailService';
import {
  countPlatformServiceSubscribers,
  createPlatformService,
  deletePlatformService,
  filterPlatformServicesForBrowse,
  getPlatformServiceById,
  listPlatformServices,
  shouldMergePlatformCatalog,
  subscribeUserToPlatformService,
  updatePlatformService,
} from '../../../data/predefinedCatalogStore';

const prisma = new PrismaClient();

export const getServices = async (req: any, res: Response) => {
  try {
    const ctx = await resolveRequestContext(req);
    const mode = req.query.mode === 'dashboard' ? 'browse_dashboard' : 'browse_navbar';
    const where = await resolveCatalogWhere(req, mode);
    const isPublicOnly = ctx.role === 'guest';

    const dbServices = await prisma.service.findMany({
      where: {
        ...where,
        ...(isPublicOnly && { visibility: 'public' }),
      },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
    });

    let services: any[] = dbServices;
    if (shouldMergePlatformCatalog(mode)) {
      const platform = filterPlatformServicesForBrowse(listPlatformServices(), isPublicOnly);
      const withCounts = await Promise.all(
        platform.map(async (s) => ({
          ...s,
          _count: { subscribers: await countPlatformServiceSubscribers(s.id) },
        })),
      );
      services = [...withCounts, ...dbServices];
    }

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
};

export const createService = async (req: any, res: Response) => {
  try {
    const {
      title,
      code,
      description,
      image,
      status,
      category,
      contactEmail,
      price,
      payment_required,
      owner,
      department,
      duration,
      requiredDocuments,
      eligibilityRules,
      slaHours,
      renewalRule,
      isPredefined,
      visibility,
    } = req.body;
    const finalImage = req.file ? req.file.path : image;

    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }

    const predefined =
      req.user?.role === 'SuperAdmin' &&
      (isPredefined === true || isPredefined === 'true');

    if (predefined) {
      const service = createPlatformService({
        title,
        code: code || null,
        description,
        image: finalImage ?? null,
        category: category || 'general',
        status: status || 'Active',
        visibility: visibility || 'public',
        contactEmail: contactEmail || null,
        price: price ? parseFloat(price) : null,
        payment_required: payment_required === true || payment_required === 'true',
        owner: owner || null,
        department: department || null,
        duration: duration || null,
        requiredDocuments:
          requiredDocuments && requiredDocuments !== ''
            ? requiredDocuments.split(',').map((doc: string) => doc.trim()).filter(Boolean)
            : [],
        eligibilityRules: eligibilityRules || null,
        slaHours: slaHours ? parseInt(slaHours, 10) : null,
        renewalRule: renewalRule || null,
      });
      return res.status(201).json(service);
    }

    const service = await prisma.service.create({
      data: {
        title,
        code: code || null,
        description,
        image: finalImage,
        category: category || 'general',
        categoryName: category || 'general',
        contactEmail: contactEmail || null,
        organizationId: orgId || null,
        status: status || 'Active',
        visibility: visibility || 'public',
        price: price ? parseFloat(price) : null,
        fee: price ? parseFloat(price) : null,
        payment_required: payment_required === true || payment_required === 'true',
        owner: owner || null,
        department: department || null,
        duration: duration || null,
        requiredDocuments:
          requiredDocuments && requiredDocuments !== ''
            ? requiredDocuments.split(',').map((doc: string) => doc.trim()).filter(Boolean)
            : [],
        eligibilityRules: eligibilityRules || null,
        slaHours: slaHours ? parseInt(slaHours, 10) : null,
        renewalRule: renewalRule || null,
        isPredefined: false,
      },
    });

    if (service.organizationId && service.status === 'Active') {
      const org = await prisma.organization.findUnique({
        where: { id: service.organizationId },
      });

      const members = await prisma.user.findMany({
        where: {
          organizationId: service.organizationId,
          role: 'member',
          is_verified: true,
        },
      });

      if (members.length > 0) {
        await prisma.notification.createMany({
          data: members.map((member) => ({
            userId: member.id,
            title: `New Service: ${service.title}`,
            link: '/member/services',
          })),
        });

        for (const member of members) {
          sendNewServiceNotification(
            member.email,
            member.name,
            service.title || 'New Service',
            service.description,
            org?.name || undefined,
            member.id,
          ).catch((emailError) => {
            console.error(`Failed to send service email notification to ${member.email}:`, emailError);
          });
        }
      }
    }

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service', error });
  }
};

export const updateService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      code,
      description,
      status,
      category,
      contactEmail,
      price,
      payment_required,
      owner,
      department,
      duration,
      requiredDocuments,
      eligibilityRules,
      slaHours,
      renewalRule,
      visibility,
    } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const platform = getPlatformServiceById(id);
    if (platform) {
      if (req.user?.role !== 'SuperAdmin') {
        return res.status(403).json({
          message: 'Platform predefined services can only be edited by SuperAdmin.',
        });
      }
      const updated = updatePlatformService(id, {
        ...(title !== undefined && { title, name: title }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category, categoryName: category }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status !== undefined && { status }),
        ...(visibility !== undefined && { visibility }),
        ...(price !== undefined && {
          price: price ? parseFloat(price) : null,
          fee: price ? parseFloat(price) : null,
        }),
        ...(payment_required !== undefined && {
          payment_required: payment_required === true || payment_required === 'true',
        }),
        ...(owner !== undefined && { owner }),
        ...(department !== undefined && { department }),
        ...(duration !== undefined && { duration }),
        ...(requiredDocuments !== undefined &&
          requiredDocuments !== null &&
          requiredDocuments !== '' && {
            requiredDocuments: requiredDocuments
              .split(',')
              .map((doc: string) => doc.trim())
              .filter(Boolean),
          }),
        ...(eligibilityRules !== undefined && { eligibilityRules }),
        ...(slaHours !== undefined && { slaHours: slaHours ? parseInt(slaHours, 10) : null }),
        ...(renewalRule !== undefined && { renewalRule }),
      });
      if (!updated) return res.status(404).json({ message: 'Service not found' });
      return res.status(200).json(updated);
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (category !== undefined) {
      updateData.category = category;
      updateData.categoryName = category;
    }
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (status !== undefined) updateData.status = status;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (price !== undefined) {
      updateData.price = price ? parseFloat(price) : null;
      updateData.fee = price ? parseFloat(price) : null;
    }
    if (payment_required !== undefined) {
      updateData.payment_required = payment_required === true || payment_required === 'true';
    }
    if (owner !== undefined) updateData.owner = owner;
    if (department !== undefined) updateData.department = department;
    if (duration !== undefined) updateData.duration = duration;
    if (requiredDocuments !== undefined && requiredDocuments !== null && requiredDocuments !== '') {
      updateData.requiredDocuments = requiredDocuments
        .split(',')
        .map((doc: string) => doc.trim())
        .filter(Boolean);
    }
    if (eligibilityRules !== undefined) updateData.eligibilityRules = eligibilityRules;
    if (slaHours !== undefined) updateData.slaHours = slaHours ? parseInt(slaHours, 10) : null;
    if (renewalRule !== undefined) updateData.renewalRule = renewalRule;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error });
  }
};

export const deleteService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (getPlatformServiceById(id)) {
      if (req.user?.role !== 'SuperAdmin') {
        return res.status(403).json({
          message: 'Platform predefined services can only be deleted by SuperAdmin.',
        });
      }
      if (!deletePlatformService(id)) {
        return res.status(404).json({ message: 'Service not found' });
      }
      return res.status(204).send();
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });

    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error });
  }
};

export const subscribeToService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const platform = getPlatformServiceById(id);
    if (platform) {
      if (platform.payment_required) {
        return res.status(400).json({
          message: 'This service requires payment. Please use the payment subscription flow.',
        });
      }
      try {
        await subscribeUserToPlatformService(userId, id);
      } catch (e: any) {
        if (e.message === 'ALREADY_SUBSCRIBED') {
          return res.status(400).json({ message: 'You are already subscribed to this service.' });
        }
        throw e;
      }
      return res.status(200).json({ message: 'Successfully subscribed to service' });
    }

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.payment_required) {
      return res.status(400).json({
        message: 'This service requires payment. Please use the payment subscription flow.',
      });
    }

    const alreadySubscribed = await prisma.service.findFirst({
      where: {
        id,
        subscribers: { some: { id: userId } },
      },
    });

    if (alreadySubscribed) {
      return res.status(400).json({ message: 'You are already subscribed to this service.' });
    }

    await prisma.service.update({
      where: { id },
      data: {
        subscribers: { connect: { id: userId } },
      },
    });

    res.status(200).json({ message: 'Successfully subscribed to service' });
  } catch (error) {
    console.error('Service Subscription Error:', error);
    res.status(500).json({ message: 'Error subscribing to service', error });
  }
};
