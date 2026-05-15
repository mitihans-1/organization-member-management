import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EventService {
  // Event participant methods
  static async getEventParticipants(eventId: string) {
    return prisma.eventParticipant.findMany({
      where: { eventId },
    });
  }

  static async addEventParticipant(eventId: string, userId: string) {
    return prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  // Event attendance methods
  static async getEventAttendances(eventId: string) {
    return prisma.eventAttendance.findMany({
      where: { eventId },
    });
  }

  static async checkInAttendance(eventId: string, userId: string) {
    return prisma.eventAttendance.create({
      data: {
        eventId,
        userId,
        checkedInAt: new Date(),
      },
    });
  }

  // Event media methods
  static async getEventMedia(eventId: string) {
    return prisma.eventMedia.findMany({
      where: { eventId },
    });
  }

  static async addEventMedia(eventId: string, media: any) {
    return prisma.eventMedia.create({
      data: {
        eventId,
        ...media,
      },
    });
  }

  // Event report methods
  static async createEventReport(eventId: string, report: any) {
    return prisma.eventReport.create({
      data: {
        eventId,
        ...report,
      },
    });
  }

  // Event announcement methods
  static async createEventAnnouncement(eventId: string, announcement: any) {
    return prisma.eventAnnouncement.create({
      data: {
        eventId,
        ...announcement,
      },
    });
  }
}
