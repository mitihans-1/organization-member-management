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

/** Guest: public org catalog items only (platform predefined merged in controllers). */
export function guestBrowseWhere() {
  return {
    isPredefined: false,
    visibility: 'public',
  };
}

/** Member/OrgAdmin navbar: own org + other orgs' public items (platform predefined merged in controllers). */
export function navbarBrowseWhere(organizationId: string) {
  return {
    isPredefined: false,
    OR: [
      { organizationId },
      { visibility: 'public', organizationId: { not: organizationId } },
    ],
  };
}

/** Member/OrgAdmin dashboard sidebar: only own org (public + private). */
export function dashboardBrowseWhere(organizationId: string) {
  return {
    organizationId,
    isPredefined: false,
  };
}

export function orgAdminManageWhere(organizationId: string) {
  return { organizationId, isPredefined: false };
}

export async function resolveCatalogWhere(
  req: any,
  mode: 'browse_navbar' | 'browse_dashboard' | 'manage' = 'browse_navbar'
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

  if (ctx.role === 'guest') {
    return guestBrowseWhere();
  }

  if (ctx.organizationId) {
    if (mode === 'browse_dashboard') {
      return dashboardBrowseWhere(ctx.organizationId);
    }
    return navbarBrowseWhere(ctx.organizationId);
  }

  return guestBrowseWhere();
}
