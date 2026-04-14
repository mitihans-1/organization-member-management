import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAttributeDefinitions = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, organization_name: true }
    });

    let orgId = user?.organizationId;
    if (!orgId && user?.organization_name) {
      const org = await prisma.organization.findFirst({
        where: { name: user.organization_name }
      });
      if (org) {
        orgId = org.id;
        await prisma.user.update({
          where: { id: req.user.userId },
          data: { organizationId: org.id }
        });
      }
    }

    if (!orgId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }

    const definitions = await prisma.customAttributeDefinition.findMany({
      where: { organizationId: orgId },
    });
    res.status(200).json(definitions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attribute definitions', error });
  }
};

export const createAttributeDefinition = async (req: any, res: Response) => {
  try {
    const { name, type, required } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, organization_name: true }
    });

    let orgId = user?.organizationId;
    if (!orgId && user?.organization_name) {
      const org = await prisma.organization.findFirst({
        where: { name: user.organization_name }
      });
      if (org) {
        orgId = org.id;
        await prisma.user.update({
          where: { id: req.user.userId },
          data: { organizationId: org.id }
        });
      }
    }

    if (!orgId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }

    const definition = await prisma.customAttributeDefinition.create({
      data: {
        name,
        type,
        required: !!required,
        organizationId: orgId,
      },
    });
    res.status(201).json(definition);
  } catch (error: any) {
    console.error('Error creating attribute definition:', error);
    res.status(500).json({ message: 'Error creating attribute definition', error: error.message || error });
  }
};

export const updateAttributeDefinition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, required } = req.body;
    
    const definition = await prisma.customAttributeDefinition.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        required,
      },
    });
    res.status(200).json(definition);
  } catch (error) {
    res.status(500).json({ message: 'Error updating attribute definition', error });
  }
};

export const deleteAttributeDefinition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.customAttributeDefinition.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting attribute definition', error });
  }
};

export const getMemberAttributeValues = async (req: any, res: Response) => {
  try {
    const { memberId } = req.params;
    const values = await prisma.memberAttributeValue.findMany({
      where: { memberId: parseInt(memberId) },
      include: { attribute: true }
    });
    res.status(200).json(values);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member attribute values', error });
  }
};

export const updateMemberAttributeValues = async (req: any, res: Response) => {
  try {
    const { memberId } = req.params;
    const { values } = req.body; // Array of { attributeId: number, value: string }

    const operations = values.map((v: any) => 
      prisma.memberAttributeValue.upsert({
        where: {
          memberId_attributeId: {
            memberId: parseInt(memberId),
            attributeId: v.attributeId,
          }
        },
        update: { value: v.value.toString() },
        create: {
          memberId: parseInt(memberId),
          attributeId: v.attributeId,
          value: v.value.toString(),
        }
      })
    );

    await Promise.all(operations);
    res.status(200).json({ message: 'Values updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating member attribute values', error });
  }
};
