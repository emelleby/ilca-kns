import { defineLinks } from "rwsdk/router";

export const link = defineLinks([
  "/",
  "/home",
  "/user/login",
  "/user/signup",
  "/user/logout",
  "/user/:id/settings",
  "/legal/privacy",
  "/legal/terms",
  "/legal/tasks",
]);
