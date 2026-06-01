import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  PLATFORM_BLOG_SEED,
  PLATFORM_EVENT_SEED,
  PLATFORM_SERVICE_SEED,
} from './predefinedCatalogSeed';

const prisma = new PrismaClient();

/** Stable 24-char hex platform IDs: a0..01, b0..01, c0..01 */
export function platformId(prefix: string, index: number): string {
  const suffix = index.toString(16).padStart(2, '0');
  const padLen = 24 - prefix.length - suffix.length;
  return `${prefix}${'0'.repeat(Math.max(0, padLen))}${suffix}`;
}

const CATALOG_NOW = new Date();

export type PlatformServiceRecord = {
  id: string;
  title: string;
  name: string;
  code: string | null;
  description: string;
  image: string | null;
  category: string;
  categoryName: string;
  status: string;
  visibility: string;
  owner: string | null;
  department: string | null;
  duration: string | null;
  requiredDocuments: string[];
  eligibilityRules: string | null;
  slaHours: number | null;
  renewalRule: string | null;
  contactEmail: string | null;
  organizationId: null;
  price: number | null;
  fee: number | null;
  payment_required: boolean;
  isPredefined: true;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformEventRecord = {
  id: string;
  title: string;
  description: string;
  date: Date;
  end_date: Date | null;
  location: string | null;
  image: string | null;
  organizer: string | null;
  capacity: number | null;
  registrationDeadline: Date | null;
  status: string;
  category: string;
  virtualLink: string | null;
  contactEmail: string | null;
  organizationId: null;
  isPredefined: true;
  visibility: string;
  price: number | null;
  payment_required: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformBlogRecord = {
  id: string;
  title: string;
  content: string;
  image: string | null;
  status: string;
  category: string;
  tags: string | null;
  readTime: number | null;
  author_id: string;
  organizationId: null;
  isPredefined: true;
  visibility: string;
  price: number | null;
  payment_required: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function initServices(): PlatformServiceRecord[] {
  return PLATFORM_SERVICE_SEED.map((s, i) => {
    const price = (s as { price?: number }).price ?? null;
    const payment_required = (s as { payment_required?: boolean }).payment_required ?? false;
    return {
      id: platformId('a0', i + 1),
      title: s.title,
      name: s.title,
      code: s.code ?? null,
      description: s.description,
      image: null,
      category: s.category,
      categoryName: s.category,
      status: s.status,
      visibility: 'public',
      owner: s.owner ?? null,
      department: s.department ?? null,
      duration: s.duration ?? null,
      requiredDocuments: [],
      eligibilityRules: null,
      slaHours: s.slaHours ?? null,
      renewalRule: s.renewalRule ?? null,
      contactEmail: null,
      organizationId: null,
      price,
      fee: price,
      payment_required,
      isPredefined: true as const,
      createdAt: CATALOG_NOW,
      updatedAt: CATALOG_NOW,
    };
  });
}

function initEvents(): PlatformEventRecord[] {
  const base = Date.now();
  return PLATFORM_EVENT_SEED.map((e, i) => ({
    id: platformId('b0', i + 1),
    title: e.title,
    description: e.description,
    date: new Date(base + e.daysFromNow * 86400000),
    end_date: null,
    location: e.location,
    image: null,
    organizer: e.organizer ?? null,
    capacity: null,
    registrationDeadline: null,
    status: e.status,
    category: e.category,
    virtualLink: null,
    contactEmail: (e as { contactEmail?: string }).contactEmail ?? null,
    organizationId: null,
    isPredefined: true as const,
    visibility: 'public',
    price: (e as { price?: number }).price ?? null,
    payment_required: (e as { payment_required?: boolean }).payment_required ?? false,
    createdAt: CATALOG_NOW,
    updatedAt: CATALOG_NOW,
  }));
}

function initBlogs(): PlatformBlogRecord[] {
  return PLATFORM_BLOG_SEED.map((b, i) => ({
    id: platformId('c0', i + 1),
    title: b.title,
    content: b.content,
    image: null,
    status: 'published',
    category: 'general',
    tags: null,
    readTime: null,
    author_id: platformId('d0', 1),
    organizationId: null,
    isPredefined: true as const,
    visibility: 'public',
    price: null,
    payment_required: false,
    createdAt: CATALOG_NOW,
    updatedAt: CATALOG_NOW,
  }));
}

let platformServices: PlatformServiceRecord[] = initServices();
let platformEvents: PlatformEventRecord[] = initEvents();
let platformBlogs: PlatformBlogRecord[] = initBlogs();

export function isPlatformServiceId(id: string): boolean {
  return platformServices.some((s) => s.id === id);
}

export function isPlatformEventId(id: string): boolean {
  return platformEvents.some((e) => e.id === id);
}

export function isPlatformBlogId(id: string): boolean {
  return platformBlogs.some((b) => b.id === id);
}

export function getPlatformServiceById(id: string): PlatformServiceRecord | undefined {
  return platformServices.find((s) => s.id === id);
}

export function getPlatformEventById(id: string): PlatformEventRecord | undefined {
  return platformEvents.find((e) => e.id === id);
}

export function getPlatformBlogById(id: string): PlatformBlogRecord | undefined {
  return platformBlogs.find((b) => b.id === id);
}

export function listPlatformServices(): PlatformServiceRecord[] {
  return [...platformServices];
}

export function listPlatformEvents(): PlatformEventRecord[] {
  return [...platformEvents];
}

export function listPlatformBlogs(): PlatformBlogRecord[] {
  return [...platformBlogs];
}

function newObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function createPlatformService(
  data: Partial<PlatformServiceRecord> & { title: string; description: string },
): PlatformServiceRecord {
  const now = new Date();
  const price = data.price ?? null;
  const item: PlatformServiceRecord = {
    id: newObjectId(),
    title: data.title,
    name: data.title,
    code: data.code ?? null,
    description: data.description,
    image: data.image ?? null,
    category: data.category ?? 'general',
    categoryName: data.categoryName ?? data.category ?? 'general',
    status: data.status ?? 'Active',
    visibility: data.visibility ?? 'public',
    owner: data.owner ?? null,
    department: data.department ?? null,
    duration: data.duration ?? null,
    requiredDocuments: data.requiredDocuments ?? [],
    eligibilityRules: data.eligibilityRules ?? null,
    slaHours: data.slaHours ?? null,
    renewalRule: data.renewalRule ?? null,
    contactEmail: data.contactEmail ?? null,
    organizationId: null,
    price,
    fee: price,
    payment_required: data.payment_required ?? false,
    isPredefined: true,
    createdAt: now,
    updatedAt: now,
  };
  platformServices = [item, ...platformServices];
  return item;
}

export function updatePlatformService(
  id: string,
  patch: Partial<PlatformServiceRecord>,
): PlatformServiceRecord | null {
  const idx = platformServices.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const prev = platformServices[idx];
  const price = patch.price !== undefined ? patch.price : prev.price;
  const next: PlatformServiceRecord = {
    ...prev,
    ...patch,
    id: prev.id,
    isPredefined: true,
    organizationId: null,
    name: patch.title ?? prev.name ?? prev.title,
    categoryName: patch.categoryName ?? patch.category ?? prev.categoryName,
    fee: price,
    updatedAt: new Date(),
  };
  platformServices[idx] = next;
  return next;
}

export function deletePlatformService(id: string): boolean {
  const len = platformServices.length;
  platformServices = platformServices.filter((s) => s.id !== id);
  return platformServices.length < len;
}

export function createPlatformEvent(
  data: Partial<PlatformEventRecord> & { title: string; description: string; date: Date },
): PlatformEventRecord {
  const now = new Date();
  const item: PlatformEventRecord = {
    id: newObjectId(),
    title: data.title,
    description: data.description,
    date: data.date,
    end_date: data.end_date ?? null,
    location: data.location ?? null,
    image: data.image ?? null,
    organizer: data.organizer ?? null,
    capacity: data.capacity ?? null,
    registrationDeadline: data.registrationDeadline ?? null,
    status: data.status ?? 'upcoming',
    category: data.category ?? 'general',
    virtualLink: data.virtualLink ?? null,
    contactEmail: data.contactEmail ?? null,
    organizationId: null,
    isPredefined: true,
    visibility: data.visibility ?? 'public',
    price: data.price ?? null,
    payment_required: data.payment_required ?? false,
    createdAt: now,
    updatedAt: now,
  };
  platformEvents = [item, ...platformEvents];
  return item;
}

export function updatePlatformEvent(
  id: string,
  patch: Partial<PlatformEventRecord>,
): PlatformEventRecord | null {
  const idx = platformEvents.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = { ...platformEvents[idx], ...patch, id, isPredefined: true as const, organizationId: null, updatedAt: new Date() };
  platformEvents[idx] = next;
  return next;
}

export function deletePlatformEvent(id: string): boolean {
  const len = platformEvents.length;
  platformEvents = platformEvents.filter((e) => e.id !== id);
  return platformEvents.length < len;
}

export function createPlatformBlog(
  data: Partial<PlatformBlogRecord> & { title: string; content: string; author_id: string },
): PlatformBlogRecord {
  const now = new Date();
  const item: PlatformBlogRecord = {
    id: newObjectId(),
    title: data.title,
    content: data.content,
    image: data.image ?? null,
    status: data.status ?? 'published',
    category: data.category ?? 'general',
    tags: data.tags ?? null,
    readTime: data.readTime ?? null,
    author_id: data.author_id,
    organizationId: null,
    isPredefined: true,
    visibility: data.visibility ?? 'public',
    price: data.price ?? null,
    payment_required: data.payment_required ?? false,
    createdAt: now,
    updatedAt: now,
  };
  platformBlogs = [item, ...platformBlogs];
  return item;
}

export function updatePlatformBlog(
  id: string,
  patch: Partial<PlatformBlogRecord>,
): PlatformBlogRecord | null {
  const idx = platformBlogs.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  const next = { ...platformBlogs[idx], ...patch, id, isPredefined: true as const, organizationId: null, updatedAt: new Date() };
  platformBlogs[idx] = next;
  return next;
}

export function deletePlatformBlog(id: string): boolean {
  const len = platformBlogs.length;
  platformBlogs = platformBlogs.filter((b) => b.id !== id);
  return platformBlogs.length < len;
}

export async function countPlatformServiceSubscribers(serviceId: string): Promise<number> {
  return prisma.user.count({
    where: { subscribedServicesIds: { has: serviceId } },
  });
}

export async function countPlatformEventAttendees(eventId: string): Promise<number> {
  return prisma.user.count({
    where: { attendedEventsIds: { has: eventId } },
  });
}

export async function getPlatformAuthor() {
  const admin = await prisma.user.findFirst({
    where: { role: 'SuperAdmin' },
    select: { id: true, name: true, email: true },
  });
  return (
    admin ?? {
      id: platformId('d0', 1),
      name: 'OMMS Platform',
      email: 'platform@omms.io',
    }
  );
}

export async function attachBlogAuthors<T extends { author_id: string }>(
  blogs: T[],
): Promise<(T & { author: { id: string; name: string; email: string } })[]> {
  const author = await getPlatformAuthor();
  return blogs.map((b) => ({
    ...b,
    author:
      b.author_id === author.id
        ? author
        : { id: b.author_id, name: 'OMMS Platform', email: 'platform@omms.io' },
  }));
}

export function shouldMergePlatformCatalog(
  mode: 'browse_navbar' | 'browse_dashboard' | 'manage',
): boolean {
  return mode === 'browse_navbar';
}

export function filterPlatformServicesForBrowse(
  items: PlatformServiceRecord[],
  publicOnly: boolean,
): PlatformServiceRecord[] {
  return items.filter((s) => !publicOnly || s.visibility === 'public');
}

export function filterPlatformEventsForBrowse(
  items: PlatformEventRecord[],
  publicOnly: boolean,
): PlatformEventRecord[] {
  return items.filter((e) => !publicOnly || e.visibility === 'public');
}

export function filterPlatformBlogsForBrowse(
  items: PlatformBlogRecord[],
  publishedOnly: boolean,
): PlatformBlogRecord[] {
  return items.filter((b) => !publishedOnly || b.status === 'published');
}

export async function userSubscribedToPlatformService(
  userId: string,
  serviceId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscribedServicesIds: true },
  });
  return user?.subscribedServicesIds.includes(serviceId) ?? false;
}

export async function userRegisteredForPlatformEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { attendedEventsIds: true },
  });
  return user?.attendedEventsIds.includes(eventId) ?? false;
}

export async function subscribeUserToPlatformService(
  userId: string,
  serviceId: string,
): Promise<void> {
  if (await userSubscribedToPlatformService(userId, serviceId)) {
    throw new Error('ALREADY_SUBSCRIBED');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { subscribedServicesIds: { push: serviceId } },
  });
}

export async function registerUserForPlatformEvent(
  userId: string,
  eventId: string,
): Promise<void> {
  if (await userRegisteredForPlatformEvent(userId, eventId)) {
    throw new Error('ALREADY_REGISTERED');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { attendedEventsIds: { push: eventId } },
  });
}
