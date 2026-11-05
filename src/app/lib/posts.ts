import { db } from "@/db";
import { canEditPost, visiblePostsWhere, type PostVisibilityValue, type Viewer } from "./postVisibility";

export type FeedPost = {
  id: string;
  title: string;
  content: string;
  category?: string;
  publishedAt: string;
  imageUrl?: string;
  kudos: number;
  comments: number;
  user: { name: string; avatarUrl: string };
  /** The viewer may edit and archive this post (canEditPost). UI hint only; the server re-checks. */
  canEdit: boolean;
};

/** Load who is looking: their id and organization roles. `null` = not logged in. */
export async function getViewer(userId: string | null | undefined): Promise<Viewer> {
  if (!userId) return null;

  const memberships = await db.organizationMembership.findMany({
    where: { userId },
    select: { organizationId: true, role: true },
  });

  return { id: userId, memberships };
}

/** Latest published posts the viewer is allowed to read (see postVisibility.ts). */
export async function getFeedPosts(viewer: Viewer, limit = 50): Promise<FeedPost[]> {
  const posts = await db.post.findMany({
    where: visiblePostsWhere(viewer),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      imageUrl: true,
      publishedAt: true,
      createdAt: true,
      userId: true,
      organizationId: true,
      user: {
        select: {
          username: true,
          profile: { select: { name: true, profilePicture: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category ?? undefined,
    imageUrl: post.imageUrl ?? undefined,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    kudos: 0, // likes arrive in roadmap phase 4
    comments: post._count.comments,
    user: {
      name: post.user.profile?.name || post.user.username,
      avatarUrl: post.user.profile?.profilePicture ?? "",
    },
    canEdit: canEditPost(post, viewer),
  }));
}

export type PostOrganization = { id: string; name: string };

/** Organizations the user is a member of, i.e. where they may create posts (canCreatePostIn). */
export async function getPostableOrganizations(userId: string): Promise<PostOrganization[]> {
  const memberships = await db.organizationMembership.findMany({
    where: { userId },
    select: { organization: { select: { id: true, name: true } } },
    orderBy: { organization: { name: "asc" } },
  });
  return memberships.map((m) => m.organization);
}

export type EditablePost = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: PostVisibilityValue;
  imageUrl: string;
  organization: PostOrganization | null;
};

/**
 * A post for the edit form, or null if it does not exist, is archived, or the
 * viewer may not edit it. updatePost enforces the same rules.
 */
export async function getEditablePost(postId: string, viewer: Viewer): Promise<EditablePost | null> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      title: true,
      content: true,
      category: true,
      visibility: true,
      imageUrl: true,
      status: true,
      organization: { select: { id: true, name: true } },
    },
  });
  if (!post || post.status === "ARCHIVED" || !canEditPost(post, viewer)) return null;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category ?? "Other",
    visibility: post.visibility,
    imageUrl: post.imageUrl ?? "",
    organization: post.organization,
  };
}
