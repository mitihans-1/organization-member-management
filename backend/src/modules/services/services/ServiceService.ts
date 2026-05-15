import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ServiceService {
  // Service request methods
  static async getServiceRequests(serviceId: string) {
    return prisma.serviceRequest.findMany({
      where: { serviceId },
    });
  }

  static async createServiceRequest(data: any) {
    // Generate request number
    const lastRequest = await prisma.serviceRequest.findFirst({
      orderBy: { submittedAt: 'desc' },
    });
    const requestNumber = lastRequest 
      ? `SR-${parseInt(lastRequest.requestNumber.split('-')[1]) + 1}` 
      : 'SR-1001';

    return prisma.serviceRequest.create({
      data: {
        ...data,
        requestNumber,
      },
    });
  }

  // Service category methods
  static async getServiceCategories(organizationId?: string) {
    return prisma.serviceCategory.findMany({
      where: organizationId ? { organizationId } : {},
    });
  }

  static async createServiceCategory(data: any) {
    return prisma.serviceCategory.create({
      data,
    });
  }

  // Service approval methods
  static async getServiceApprovals(requestId: string) {
    return prisma.serviceApproval.findMany({
      where: { requestId },
    });
  }

  static async createServiceApproval(data: any) {
    return prisma.serviceApproval.create({
      data,
    });
  }

  // Service attachment methods
  static async getServiceAttachments(serviceId: string) {
    return prisma.serviceAttachment.findMany({
      where: { serviceId },
    });
  }

  static async addServiceAttachment(data: any) {
    return prisma.serviceAttachment.create({
      data,
    });
  }

  // Service feedback methods
  static async getServiceFeedbacks(serviceId: string) {
    return prisma.serviceFeedback.findMany({
      where: { serviceId },
    });
  }

  static async createServiceFeedback(data: any) {
    return prisma.serviceFeedback.create({
      data,
    });
  }

  // Service internal notes
  static async addInternalNote(data: any) {
    return prisma.serviceInternalNote.create({
      data,
    });
  }
}
