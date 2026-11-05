import { PostCard } from "./PostCard";
import { getFeedPosts, getViewer } from "@/app/lib/posts";

/**
 * Community feed. Async server component: render it inside a Suspense boundary
 * (HomeLayout already does). `userId` is the logged-in user, or nothing for
 * visitors, who only see public posts.
 */
export async function PostList({ userId }: { userId?: string | null }) {
  const viewer = await getViewer(userId);
  const posts = await getFeedPosts(viewer);
  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            canEdit={post.canEdit}
            user={post.user}
            title={post.title}
            content={post.content}
            publishedAt={post.publishedAt}
            imageUrl={post.imageUrl}
            category={post.category}
            kudos={post.kudos}
            comments={post.comments}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">Be the first to share something with the community!</p>
        </div>
      )}
    </div>
  );
}
