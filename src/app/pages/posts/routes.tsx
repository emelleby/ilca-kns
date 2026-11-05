import { route } from "rwsdk/router";
import { isAuthenticated } from "@/app/interceptors";
import { CreatePostPage, EditPostPage } from "./PostFormPage";

export const postRoutes = [
  route("/create", [isAuthenticated, CreatePostPage]),
  route("/:id/edit", [isAuthenticated, EditPostPage]),
];
