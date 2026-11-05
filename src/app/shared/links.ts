import { defineLinks } from "rwsdk/router";

export const link = defineLinks([
  "/",
  "/home",
  "/tasks",
  "/test",
  "/user/login",
  "/user/signup",
  "/user/logout",
  "/user/forgot-password",
  "/user/reset-password",
  "/user/:username/settings",
  "/user/:username/profile",
  "/posts/create",
  "/posts/:id/edit",
  "/legal/privacy",
  "/legal/terms",
  "/legal/tasks",
]);
