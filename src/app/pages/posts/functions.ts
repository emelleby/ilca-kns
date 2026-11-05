"use server";

import { db } from "@/db";
import { z } from "zod";
import { AuthorizationError, requireUser } from "@/app/auth/guards";
import { getViewer } from "@/app/lib/posts";
import { canCreatePostIn, canEditPost, POST_VISIBILITY } from "@/app/lib/postVisibility";
import { POST_CATEGORIES } from "@/app/shared/constants";

// Every export here is a browser-callable endpoint. Each one starts with a guard.
// Write rules: canCreatePostIn / canEditPost in src/app/lib/postVisibility.ts (task 28).

const idSchema = z.string().min(1).max(100);

const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value === "" ? undefined : value))
  .pipe(
    z
      .string()
      .url()
      .refine((value) => /^https?:\/\//i.test(value), "Must be an http(s) URL")
      .optional(),
  )
  .optional();

const postFieldsSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    content: z.string().trim().min(1).max(10000),
    category: z.enum(POST_CATEGORIES),
    visibility: z.nativeEnum(POST_VISIBILITY),
    imageUrl: imageUrlSchema,
  })
  .strict();

// The organization is chosen on create and cannot be changed afterwards.
const createPostSchema = postFieldsSchema.extend({ organizationId: idSchema }).strict();

export type PostInput = z.input<typeof postFieldsSchema>;
export type CreatePostInput = z.input<typeof createPostSchema>;

/** A post the signed-in user may edit, or throws "Forbidden" (also when it does not exist). */
async function loadEditablePost(postId: string, userId: string) {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, organizationId: true, status: true },
  });
  if (!post || !canEditPost(post, await getViewer(userId))) {
    throw new AuthorizationError("Forbidden");
  }
  return post;
}

export async function createPost(input: CreatePostInput) {
  const user = requireUser();
  const data = createPostSchema.parse(input);

  if (!canCreatePostIn(data.organizationId, await getViewer(user.id))) {
    throw new AuthorizationError("Forbidden");
  }

  const post = await db.post.create({
    data: {
      ...data,
      imageUrl: data.imageUrl ?? null,
      userId: user.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    select: { id: true },
  });
  return { id: post.id };
}

export async function updatePost(postId: string, input: PostInput) {
  const user = requireUser();
  idSchema.parse(postId);
  const data = postFieldsSchema.parse(input);

  const post = await loadEditablePost(postId, user.id);
  if (post.status === "ARCHIVED") throw new Error("Archived posts cannot be edited");

  await db.post.update({
    where: { id: post.id },
    data: { ...data, imageUrl: data.imageUrl ?? null },
  });
  return { id: post.id };
}

/** Soft delete: the post leaves the feed but stays in the database (can be restored). */
export async function archivePost(postId: string) {
  const user = requireUser();
  idSchema.parse(postId);

  const post = await loadEditablePost(postId, user.id);
  if (post.status !== "ARCHIVED") {
    await db.post.update({ where: { id: post.id }, data: { status: "ARCHIVED" } });
  }
  return { id: post.id };
}
