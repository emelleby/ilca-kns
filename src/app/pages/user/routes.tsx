import { route } from "rwsdk/router";
import { Login } from "./Login";
import { Signup } from "./Signup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { sessions } from "@/session/store";
import AuthSettings from "./settings/AuthSettings";
import ProfileSetup from "./profile/ProfileSetup";
import ProfileView from "./profile/ProfileView";
import ProfileEdit from "./profile/ProfileEdit";
import ProfilePage from "./profile/ProfilePage";
import { AppContext } from "@/worker";
import { hasUserProfile } from "./profile/functions";

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
  route("/forgot-password", ForgotPassword),
  route("/reset-password", ResetPassword),

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

  // Profile routes
  route("/:id/profile/setup", [isAuthenticated, (props) => {
    if (!props.ctx.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    return <ProfileSetup user={props.ctx.user} />;
  }]),

  route("/:id/profile/edit", [isAuthenticated, (props) => {
    if (!props.ctx.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Only allow users to edit their own profile
    if (props.ctx.user.id !== props.params.id) {
      return new Response("Forbidden", { status: 403 });
    }
    return <ProfileEdit user={props.ctx.user} />;
  }]),

  route("/:id/profile", [(props) => {
    const isOwnProfile = props.ctx.user?.id === props.params.id;
    return <ProfilePage profileUserId={props.params.id} isOwnProfile={isOwnProfile} {...props} />;
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
