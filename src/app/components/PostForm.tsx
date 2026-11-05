"use client";

import { useState } from "react";
import { createPost, updatePost } from "@/app/pages/posts/functions";
import { POST_CATEGORIES } from "@/app/shared/constants";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// Field limits mirror the zod schema in pages/posts/functions.ts. The server is
// the authority; these only help the user before submitting.
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const CONTENT_MAX = 10000;

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Everyone", hint: "Also visitors who are not signed in" },
  { value: "ORGANIZATION", label: "Club only", hint: "Members of the club" },
  { value: "COACH", label: "Me and coaches", hint: "You, and coaches and admins in the club" },
] as const;

type Visibility = (typeof VISIBILITY_OPTIONS)[number]["value"];
type Organization = { id: string; name: string };

export type PostFormValues = {
  title: string;
  content: string;
  category: string;
  visibility: Visibility;
  imageUrl: string;
};

type PostFormProps =
  | { mode: "create"; organizations: Organization[] }
  | { mode: "edit"; postId: string; organization: Organization | null; initial: PostFormValues };

const EMPTY: PostFormValues = {
  title: "",
  content: "",
  category: "News",
  visibility: "ORGANIZATION",
  imageUrl: "",
};

export function PostForm(props: PostFormProps) {
  const [values, setValues] = useState<PostFormValues>(props.mode === "edit" ? props.initial : EMPTY);
  const [organizationId, setOrganizationId] = useState(
    props.mode === "create" && props.organizations.length === 1 ? props.organizations[0].id : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const title = values.title.trim();
    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      setError(`The title must be ${TITLE_MIN}–${TITLE_MAX} characters.`);
      return;
    }
    if (!values.content.trim()) {
      setError("Write some content.");
      return;
    }
    if (props.mode === "create" && !organizationId) {
      setError("Choose a club.");
      return;
    }

    const fields = {
      title,
      content: values.content,
      category: values.category as (typeof POST_CATEGORIES)[number],
      visibility: values.visibility,
      imageUrl: values.imageUrl,
    };

    setIsSubmitting(true);
    try {
      if (props.mode === "create") {
        await createPost({ ...fields, organizationId });
      } else {
        await updatePost(props.postId, fields);
      }
      window.location.href = "/home";
    } catch (err) {
      // Validation and permission errors are thrown by the server function.
      console.error("Saving the post failed:", err);
      setError("The post could not be saved. Check the fields and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="post-organization">Club</Label>
        {props.mode === "create" ? (
          props.organizations.length === 1 ? (
            <p id="post-organization" className="text-sm text-gray-700">
              {props.organizations[0].name}
            </p>
          ) : (
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger id="post-organization" className="w-full">
                <SelectValue placeholder="Choose a club" />
              </SelectTrigger>
              <SelectContent>
                {props.organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ) : (
          <p id="post-organization" className="text-sm text-gray-700">
            {props.organization?.name ?? "No club"}{" "}
            <span className="text-gray-500">(cannot be changed)</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="post-title">Title</Label>
        <Input
          id="post-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          minLength={TITLE_MIN}
          maxLength={TITLE_MAX}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="post-content">Content</Label>
        <Textarea
          id="post-content"
          value={values.content}
          onChange={(e) => set("content", e.target.value)}
          maxLength={CONTENT_MAX}
          rows={10}
          required
        />
        <p className="text-xs text-gray-500">
          {values.content.length} / {CONTENT_MAX}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="post-category">Category</Label>
        <Select value={values.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger id="post-category" className="w-full sm:w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Who can see this post?</legend>
        {VISIBILITY_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={values.visibility === option.value}
              onChange={() => set("visibility", option.value)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-gray-500">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="post-image">Image URL (optional)</Label>
        <Input
          id="post-image"
          type="url"
          placeholder="https://…"
          value={values.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : props.mode === "create" ? "Publish" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => (window.location.href = "/home")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
