import { defineLinks } from "rwsdk/router";

export const link = defineLinks([
  "/",
  "/home",
  "/user/login",
  "/user/signup",
  "/user/logout",
  "/user/forgot-password",
  "/user/reset-password",
  "/user/:id/settings",
  "/legal/privacy",
  "/legal/terms",
  "/legal/tasks",
]);
