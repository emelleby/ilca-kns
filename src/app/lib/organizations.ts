import { db } from "@/db";

// Server-only organization helpers. Not a "use server" file: nothing here is callable
// from the browser. Callers are responsible for authorization.

export const ORGANIZATION_ROLES = ["ADMIN", "COACH", "MEMBER"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

/** Adds a membership. Returns null if the user is already a member. */
export async function addMembership(
  organizationId: string,
  userId: string,
  role: OrganizationRole = "MEMBER",
) {
  const existing = await db.organizationMembership.findFirst({
    where: { userId, organizationId },
    select: { id: true },
  });
  if (existing) return null;

  return db.organizationMembership.create({
    data: { userId, organizationId, role },
  });
}

/** A pending, unexpired invitation for the token, or null. */
export async function findValidInvitation(token: string) {
  const invitation = await db.organizationInvitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return null;
  }
  return invitation;
}
