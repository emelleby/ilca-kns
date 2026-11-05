import { RequestInfo } from "rwsdk/worker";
import { HomeLayout } from "@/app/layouts/HomeLayout";
import { PostForm } from "@/app/components/PostForm";
import { getEditablePost, getPostableOrganizations, getViewer } from "@/app/lib/posts";

// Both routes require a signed-in user (see routes.tsx). The server functions
// re-check every permission; these pages only decide what to show.

function Page({ title, children, ...props }: RequestInfo & { title: string; children: React.ReactNode }) {
  return (
    <HomeLayout {...props}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        {children}
      </div>
    </HomeLayout>
  );
}

export async function CreatePostPage(props: RequestInfo) {
  const organizations = await getPostableOrganizations(props.ctx.user!.id);

  return (
    <Page {...props} title="New post">
      {organizations.length > 0 ? (
        <PostForm mode="create" organizations={organizations} />
      ) : (
        <p className="text-gray-600">
          You need to be a member of a club to post. Ask a club admin for an invitation.
        </p>
      )}
    </Page>
  );
}

export async function EditPostPage(props: RequestInfo) {
  const viewer = await getViewer(props.ctx.user!.id);
  const post = await getEditablePost(props.params.id, viewer);

  if (!post) {
    // Same answer for "does not exist", "archived" and "not yours".
    return new Response("Post not found", { status: 404 });
  }

  return (
    <Page {...props} title="Edit post">
      <PostForm
        mode="edit"
        postId={post.id}
        organization={post.organization}
        initial={{
          title: post.title,
          content: post.content,
          category: post.category,
          visibility: post.visibility,
          imageUrl: post.imageUrl,
        }}
      />
    </Page>
  );
}
