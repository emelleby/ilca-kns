"use client";

import { useState } from "react";
import { archivePost } from "@/app/pages/posts/functions";
import { link } from "@/app/shared/links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

/** Edit / archive menu for a post. Shown only when canEditPost; archivePost re-checks on the server. */
export function PostActions({ postId, title }: { postId: string; title: string }) {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (!window.confirm(`Archive "${title}"? It will be removed from the feed.`)) return;
    setIsArchiving(true);
    try {
      await archivePost(postId);
      window.location.reload();
    } catch (error) {
      console.error("Archiving the post failed:", error);
      window.alert("The post could not be archived.");
      setIsArchiving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Post actions"
        disabled={isArchiving}
        className="text-sm text-gray-500 hover:text-gray-700 px-2"
      >
        ⋯
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={link("/posts/:id/edit", { id: postId })}>Edit</a>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleArchive}>
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
