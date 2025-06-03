import { PostCard } from "./PostCard";

// Type for Post, adjust fields if needed
export type PostListItem = {
  id: string;
  title: string;
  content: string;
  category?: string;
  publishedAt?: string;
  imageUrl?: string;
  kudos?: number;
  comments?: number;
  user?: {
    name: string;
    avatarUrl: string;
  };
};

// Fetch latest posts (static for now, replace with db query later)
function getLatestPosts(): PostListItem[] {
  // Example static data with mock user and image
  // Note: Made synchronous to avoid Promise resolution issues in Cloudflare Workers
  return [
    {
      id: "1",
      title: "Midsummer Patrol 2025 - registration open",
      content:
        "When: June 20 @ 16.45\nDetails and how to join: Scan the QR code. (No - Strava will not allow us to post a link here).\n\nRegistration is open for the annual Midsummer Patrol. There will be three different groups and distances. For practical and safety reasons we have a limit of 180 participants.\n\nRegistration required.\n\nThis is a highlight of the year. Don't miss it!",
      category: "Event",
      publishedAt: "2025-05-22T12:51:00Z",
      imageUrl: "/static/midsummer-patrol.jpg", // Replace with real image path
      kudos: 48,
      comments: 0,
      user: {
        name: "Oslo Dawn Patrol",
        avatarUrl: "/static/oslo-dawn-patrol-avatar.png", // Replace with real avatar path
      },
    },
    {
      id: "2",
      title: "Another Update",
      content: "Here is another update.",
      category: "News",
      publishedAt: "2025-06-02T12:00:00Z",
      imageUrl: "/static/another-update.jpg",
      kudos: 12,
      comments: 2,
      user: {
        name: "Jane Doe",
        avatarUrl: "/static/jane-avatar.png",
      },
    },
  ];
}

export function PostList() {
  const posts = getLatestPosts();
  return (
    <div style={{ marginTop: 32 }}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          user={post.user!}
          title={post.title}
          content={post.content}
          publishedAt={post.publishedAt!}
          imageUrl={post.imageUrl}
          category={post.category}
          kudos={post.kudos}
          comments={post.comments}
        />
      ))}
    </div>
  );
}
