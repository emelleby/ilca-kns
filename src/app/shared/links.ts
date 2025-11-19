import { defineLinks } from "rwsdk/router";

export const link = defineLinks([
  "/",
  "/home",
  "/tasks",
  "/test",
  "/test2",
  "/user/login",
  "/user/signup",
  "/user/logout",
  "/user/forgot-password",
  "/user/reset-password",
  "/user/:username/settings",
  "/user/:username/profile",
  "/legal/privacy",
  "/legal/terms",
  "/legal/tasks",
]);
