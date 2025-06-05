import React from "react";

export type PostCardProps = {
  user: {
    name: string;
    avatarUrl: string;
  };
  title: string;
  content: string;
  publishedAt: string;
  imageUrl?: string;
  category?: string;
  kudos?: number;
  comments?: number;
};

export function PostCard({
  user,
  title,
  content,
  publishedAt,
  imageUrl,
  category,
  kudos = 0,
  comments = 0,
}: PostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <article className="bg-bg rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{formatDate(publishedAt)}</div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <span>👍</span>
            <span>{kudos}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <span>💬</span>
            <span>{comments}</span>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{title}</h2>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">{content}</div>

        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-full rounded-lg object-cover max-h-96"
            />
          </div>
        )}

        {category && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-6 pb-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <span>👍</span>
            <span>Like</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <span>💬</span>
            <span>Comment</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          <span>⋯</span>
        </button>
      </div>
    </article>
  );
}
