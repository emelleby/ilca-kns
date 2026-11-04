import { requestInfo } from "rwsdk/worker";
import { db, type User } from "@/db";
import { roleHierarchy } from "@/app/shared/constants";

/**
 * Authorization guards for server functions.
 *
 * Every function exported from a "use server" file is an HTTP endpoint that anyone can
 * call directly with any arguments. Route interceptors do not protect them. Each such
 * function must start with one of these guards (or be listed as PUBLIC/TOKEN in
 * src/app/auth/__tests__/serverFunctionGuards.test.ts).
 *
 * Guards throw on denial so a caller can never confuse "denied" with "not found".
 */

export class AuthorizationError extends Error {
  constructor(message: "Unauthorized" | "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isSuperUser(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "SUPERUSER";
}

/** Signed-in user, or throws "Unauthorized". */
export function requireUser(): User {
  const user = requestInfo.ctx?.user as User | null | undefined;
  if (!user) throw new AuthorizationError("Unauthorized");
  return user;
}

/** Signed-in SUPERUSER, or throws. */
export function requireSuperUser(): User {
  const user = requireUser();
  if (!isSuperUser(user)) throw new AuthorizationError("Forbidden");
  return user;
}

/** The signed-in user acting on their own data (userId), or a SUPERUSER. */
export function requireSelfOrSuperUser(userId: string): User {
  const user = requireUser();
  if (user.id !== userId && !isSuperUser(user)) throw new AuthorizationError("Forbidden");
  return user;
}

/**
 * Roles that satisfy a minimum role, using roleHierarchy (ADMIN ⊇ COACH ⊇ MEMBER).
 * hasOrganizationRole(…, "COACH") accepts COACH and ADMIN.
 */
export function rolesAtLeast(minimumRole: keyof typeof roleHierarchy): string[] {
  return (Object.keys(roleHierarchy) as (keyof typeof roleHierarchy)[]).filter((role) =>
    roleHierarchy[role].includes(minimumRole),
  );
}

/** Whether userId has at least minimumRole in the organization. Does not consider SUPERUSER. */
export async function hasOrganizationRole(
  userId: string,
  organizationId: string,
  minimumRole: keyof typeof roleHierarchy,
): Promise<boolean> {
  const membership = await db.organizationMembership.findFirst({
    where: { userId, organizationId, role: { in: rolesAtLeast(minimumRole) } },
    select: { id: true },
  });
  return !!membership;
}

/** Signed-in user with at least minimumRole in the organization. SUPERUSER always passes. */
export async function requireOrganizationRole(
  organizationId: string,
  minimumRole: keyof typeof roleHierarchy,
): Promise<User> {
  const user = requireUser();
  if (isSuperUser(user)) return user;
  if (!(await hasOrganizationRole(user.id, organizationId, minimumRole))) {
    throw new AuthorizationError("Forbidden");
  }
  return user;
}
