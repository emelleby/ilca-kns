import { link } from "@/app/shared/links";

export function AddContentButton() {
  return (
    <a
      href={link("/posts/create")}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm hover:shadow-md"
    >
      <span className="text-lg">+</span>
      New post
    </a>
  );
}
