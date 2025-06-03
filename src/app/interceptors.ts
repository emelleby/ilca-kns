import { AppContext } from "@/worker";
import { db } from "@/db";

// Authentication interceptor
export const isAuthenticated = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
};

// SUPERUSER role interceptor
export const isSuperUser = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
  
  if (ctx.user.role !== "SUPERUSER") {
    return new Response("Access Denied: SUPERUSER role required", { 
      status: 403 
    });
  }
};

// Organization role checking function
async function checkOrganizationRole(
  userId: string, 
  organizationId: string, 
  requiredRoles: string[]
): Promise<boolean> {
  const membership = await db.organizationMembership.findFirst({
    where: {
      userId,
      organizationId,
      role: { in: requiredRoles }
    }
  });
  
  return !!membership;
}

// Organization Admin interceptor
export function requireOrganizationAdmin(organizationIdParam: string = "organizationId") {
  return async ({ ctx, params }: { ctx: AppContext; params: any }) => {
    if (!ctx.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/user/login" },
      });
    }

    const organizationId = params[organizationIdParam];
    if (!organizationId) {
      return new Response("Organization ID required", { status: 400 });
    }

    const hasAccess = await checkOrganizationRole(
      ctx.user.id, 
      organizationId, 
      ["ADMIN"]
    );

    if (!hasAccess) {
      return new Response("Access Denied: Organization Admin role required", { 
        status: 403 
      });
    }
  };
}

// Organization Coach interceptor (includes Admin permissions)
export function requireOrganizationCoach(organizationIdParam: string = "organizationId") {
  return async ({ ctx, params }: { ctx: AppContext; params: any }) => {
    if (!ctx.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/user/login" },
      });
    }

    const organizationId = params[organizationIdParam];
    if (!organizationId) {
      return new Response("Organization ID required", { status: 400 });
    }

    const hasAccess = await checkOrganizationRole(
      ctx.user.id, 
      organizationId, 
      ["ADMIN", "COACH"]
    );

    if (!hasAccess) {
      return new Response("Access Denied: Organization Coach role required", { 
        status: 403 
      });
    }
  };
}

// Organization Member interceptor (includes Admin and Coach permissions)
export function requireOrganizationMember(organizationIdParam: string = "organizationId") {
  return async ({ ctx, params }: { ctx: AppContext; params: any }) => {
    if (!ctx.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/user/login" },
      });
    }

    const organizationId = params[organizationIdParam];
    if (!organizationId) {
      return new Response("Organization ID required", { status: 400 });
    }

    const hasAccess = await checkOrganizationRole(
      ctx.user.id, 
      organizationId, 
      ["ADMIN", "COACH", "MEMBER"]
    );

    if (!hasAccess) {
      return new Response("Access Denied: Organization membership required", { 
        status: 403 
      });
    }
  };
}

// Helper function to get user's role in organization
export async function getUserOrganizationRole(
  userId: string, 
  organizationId: string
): Promise<string | null> {
  const membership = await db.organizationMembership.findFirst({
    where: {
      userId,
      organizationId
    }
  });
  
  return membership?.role || null;
}

// Helper function to check if user has any role in organization
export async function isOrganizationMember(
  userId: string, 
  organizationId: string
): Promise<boolean> {
  const membership = await db.organizationMembership.findFirst({
    where: {
      userId,
      organizationId
    }
  });
  
  return !!membership;
}
