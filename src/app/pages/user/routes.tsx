import { route } from "rwsdk/router";
import { Login } from "./Login";
import { Signup } from "./Signup";
import { sessions } from "@/session/store";
import AuthSettings from "./settings/AuthSettings";
import { AppContext } from "@/worker";

// Middleware to require authentication
const isAuthenticated = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
};

export const userRoutes = [
  route("/login", [Login]),
  route("/signup", [Signup]),
  route("/:id/settings", [isAuthenticated, ({ ctx }) => {
    // Check if user exists in ctx (guaranteed by isAuthenticated middleware)
    if (!ctx.user) {
      // This case should not be reached due to isAuthenticated, but good practice
       return new Response("Unauthorized", { status: 401 });
    }
    // Return the component with props for server rendering
    // return { Component: AuthSettings, props: { user: ctx.user } };
    return <AuthSettings user={ctx.user} />;
  }]),
  route("/logout", async function ({ request }) {
    const headers = new Headers();
    await sessions.remove(request, headers);
    headers.set("Location", "/home");

    return new Response(null, {
      status: 302,
      headers,
    });
  }),
];
