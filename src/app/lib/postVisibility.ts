import type { Prisma } from "@/db";
import { roleHierarchy } from "@/app/shared/constants";

/**
 * Who may read a post.
 *
 * - PUBLIC:       everyone, also visitors that are not logged in
 * - ORGANIZATION: members of the post's organization
 * - COACH:        the author, plus coaches (and admins, who include the coach
 *                 role in `roleHierarchy`) of the post's organization
 *
 * The author can always read their own posts. A post without an organization
 * can therefore only be PUBLIC or private to its author.
 *
 * Coach access is currently by role in the organization. When coach-student
 * assignments exist (roadmap phase 5) this is the one place to narrow it.
 */
export const POST_VISIBILITY = {
  PUBLIC: "PUBLIC",
  ORGANIZATION: "ORGANIZATION",
  COACH: "COACH",
} as const;

export type PostVisibilityValue = (typeof POST_VISIBILITY)[keyof typeof POST_VISIBILITY];

export type Viewer = {
  id: string;
  memberships: { organizationId: string; role: string }[];
} | null;

export type PostAccessFields = {
  userId: string;
  organizationId: string | null;
  visibility: PostVisibilityValue;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

// Roles that count as "coach": every role whose hierarchy includes COACH.
const COACH_ROLES = Object.entries(roleHierarchy)
  .filter(([, included]) => included.includes("COACH"))
  .map(([role]) => role);

function organizationIds(viewer: NonNullable<Viewer>, roles?: string[]): string[] {
  return viewer.memberships
    .filter((m) => !roles || roles.includes(m.role))
    .map((m) => m.organizationId);
}

/** Can this viewer read this single post? Mirrors `visiblePostsWhere`. */
export function canViewPost(post: PostAccessFields, viewer: Viewer): boolean {
  if (viewer && post.userId === viewer.id) return true;
  if (post.status !== "PUBLISHED") return false;

  switch (post.visibility) {
    case POST_VISIBILITY.PUBLIC:
      return true;
    case POST_VISIBILITY.ORGANIZATION:
      return (
        !!viewer &&
        !!post.organizationId &&
        organizationIds(viewer).includes(post.organizationId)
      );
    case POST_VISIBILITY.COACH:
      return (
        !!viewer &&
        !!post.organizationId &&
        organizationIds(viewer, COACH_ROLES).includes(post.organizationId)
      );
    default:
      return false; // unknown visibility: fail closed
  }
}

/**
 * Prisma `where` for the feed: published posts the viewer may read.
 * Own drafts are not part of the feed.
 */
export function visiblePostsWhere(viewer: Viewer): Prisma.PostWhereInput {
  const visible: Prisma.PostWhereInput[] = [{ visibility: POST_VISIBILITY.PUBLIC }];

  if (viewer) {
    visible.push({ userId: viewer.id });

    const orgIds = organizationIds(viewer);
    if (orgIds.length > 0) {
      visible.push({
        visibility: POST_VISIBILITY.ORGANIZATION,
        organizationId: { in: orgIds },
      });
    }

    const coachOrgIds = organizationIds(viewer, COACH_ROLES);
    if (coachOrgIds.length > 0) {
      visible.push({
        visibility: POST_VISIBILITY.COACH,
        organizationId: { in: coachOrgIds },
      });
    }
  }

  return { status: "PUBLISHED", OR: visible };
}
