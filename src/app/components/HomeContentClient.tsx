"use client";

import { PostList } from "@/app/components/PostList";
import { AddContentButton } from "@/app/components/AddContentButton";
import { PostFilter } from "@/app/components/PostFilter";

export function HomeContentClient() {
  return (
    <div className="lg:col-span-3">
      {/* Content Header */}
      <div className="flex justify-between items-center mb-6">
        <PostFilter />
        <AddContentButton />
      </div>
      
      {/* Posts Feed */}
      <PostList />
    </div>
  );
}
