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
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      marginBottom: 32,
      overflow: "hidden",
      maxWidth: 600,
      marginLeft: "auto",
      marginRight: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: 16, borderBottom: "1px solid #eee" }}>
        <img src={user.avatarUrl} alt={user.name} style={{ width: 44, height: 44, borderRadius: "50%", marginRight: 14 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "#888" }}>{new Date(publishedAt).toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span title="Kudos" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span role="img" aria-label="kudos">👍</span> {kudos}
          </span>
          <span title="Comments" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span role="img" aria-label="comments">💬</span> {comments}
          </span>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 28, lineHeight: 1.1 }}>{title}</h2>
        <div style={{ color: "#444", fontSize: 17, marginBottom: 18, whiteSpace: "pre-line" }}>{content}</div>
        {imageUrl && (
          <img src={imageUrl} alt={title} style={{ width: "100%", borderRadius: 10, marginTop: 18, marginBottom: 6 }} />
        )}
        {category && (
          <span style={{
            fontSize: 13,
            background: "#e3e8f0",
            color: "#4b5563",
            borderRadius: 6,
            padding: "2px 10px",
            marginTop: 10,
            display: "inline-block",
          }}>{category}</span>
        )}
      </div>
    </div>
  );
}
