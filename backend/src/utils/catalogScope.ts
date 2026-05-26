import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CatalogRole = 'guest' | 'member' | 'orgAdmin' | 'SuperAdmin';

export async function resolveRequestContext(req: any): Promise<{
  role: CatalogRole;
  organizationId?: string;
}> {
  const tokenUser = req.user;
  if (!tokenUser?.userId) {
    return { role: 'guest' };
  }

  let organizationId = tokenUser.organizationId as string | undefined;
  let role = (tokenUser.role as string) || 'guest';

  if (!organizationId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { organizationId: true, role: true },
    });
    organizationId = dbUser?.organizationId ?? undefined;
    role = dbUser?.role ?? role;
  }

  if (role === 'SuperAdmin') return { role: 'SuperAdmin', organizationId };
  if (role === 'orgAdmin') return { role: 'orgAdmin', organizationId };
  if (role === 'member') return { role: 'member', organizationId };
  return { role: 'guest' };
}

/** Platform catalog only (guest / first visit). */
export function platformCatalogWhere() {
  return { isPredefined: true };
}

/** Member: only their organization's items. */
export function memberCatalogWhere(organizationId: string) {
  return { organizationId, isPredefined: false };
}

/** Org admin navbar pages: platform predefined + own org content. */
export function orgAdminCatalogWhere(organizationId: string) {
  return {
    OR: [{ isPredefined: true }, { organizationId, isPredefined: false }],
  };
}

export function orgAdminManageWhere(organizationId: string) {
  return { organizationId, isPredefined: false };
}

export async function resolveCatalogWhere(
  req: any,
  mode: 'browse' | 'manage' = 'browse'
) {
  const ctx = await resolveRequestContext(req);

  if (mode === 'manage') {
    if (ctx.role === 'orgAdmin' && ctx.organizationId) {
      return orgAdminManageWhere(ctx.organizationId);
    }
    if (ctx.role === 'SuperAdmin') {
      return { isPredefined: false };
    }
  }

  if (ctx.role === 'member' && ctx.organizationId) {
    return memberCatalogWhere(ctx.organizationId);
  }

  if (ctx.role === 'orgAdmin' && ctx.organizationId) {
    return orgAdminCatalogWhere(ctx.organizationId);
  }

  return platformCatalogWhere();
}
