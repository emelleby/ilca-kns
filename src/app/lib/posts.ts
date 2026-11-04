import { db } from "@/db";
import { visiblePostsWhere, type Viewer } from "./postVisibility";

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
  }));
}
