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
      publishedAt: "2025-01-15T12:51:00Z",
      imageUrl: "public/images/photo-1506527240747-720a3e17b910.jfif", // Multiple boats sailing - perfect for regatta
      kudos: 48,
      comments: 12,
      user: {
        name: "Oslo Dawn Patrol",
        avatarUrl: "/static/oslo-dawn-patrol-avatar.png", // Replace with real avatar path
      },
    },
    {
      id: "2",
      title: "Perfect sailing conditions this weekend! 🌊",
      content: "Just got back from an amazing session at Fornebu. Wind was steady at 12-15 knots from the southwest, perfect for some upwind practice.\n\nThe water was surprisingly warm for January, and visibility was excellent. Managed to get in 3 hours of solid sailing before the wind picked up too much.\n\nAnyone else planning to get out there this weekend? Weather forecast looks promising!",
      category: "Training",
      publishedAt: "2025-01-14T15:30:00Z",
      imageUrl: "public/images/Helene.jpg", // Test image to see if external images work
      kudos: 23,
      comments: 8,
      user: {
        name: "Erik Solberg",
        avatarUrl: "/static/erik-avatar.png",
      },
    },
    {
      id: "3",
      title: "New ILCA 7 rigging tips from the pros",
      content: "Just attended an amazing rigging workshop with some of the national team sailors. Here are the key takeaways:\n\n• Downhaul tension is crucial for upwind performance\n• Vang settings make a huge difference in waves\n• Don't forget to adjust your outhaul for different conditions\n\nWho wants to practice these techniques together next week?",
      category: "Training",
      publishedAt: "2025-01-13T09:15:00Z",
      imageUrl: "public/images/photo-1605387202149-47169c4ea58a.jfif", // Test image
      kudos: 34,
      comments: 15,
      user: {
        name: "Maria Hansen",
        avatarUrl: "/static/maria-avatar.png",
      },
    },
    {
      id: "4",
      title: "Club championship results are in! 🏆",
      content: "What an incredible season we've had! Congratulations to all participants in this year's club championship.\n\nSpecial shoutout to our top performers:\n🥇 Lars Andersen - Consistent performance all season\n🥈 Sofia Eriksson - Amazing improvement throughout the year\n🥉 Thomas Berg - Great comeback in the final races\n\nSee you all at the prize ceremony next Friday!",
      category: "News",
      publishedAt: "2025-01-12T18:00:00Z",
      imageUrl: "https://picsum.photos/800/400?random=3", // Test image
      kudos: 67,
      comments: 24,
      user: {
        name: "KNS Admin",
        avatarUrl: "/static/kns-admin-avatar.png",
      },
    },
  ];
}

export function PostList() {
  const posts = getLatestPosts();
  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
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
