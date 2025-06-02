import { route } from "rwsdk/router";
import { Login } from "./Login";
import { Signup } from "./Signup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { sessions } from "@/session/store";
import AuthSettings from "./settings/AuthSettings";
import ProfileSetup from "./profile/ProfileSetup";

import ProfilePage from "./profile/ProfilePage";
import ProfileEditPage from "./profile/ProfileEditPage";
import { AppContext } from "@/worker";
import { db } from "@/db";



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

  route("/:username/settings", [isAuthenticated, async ({ ctx }) => {
    // User is guaranteed to exist due to isAuthenticated interceptor
    // Fetch user with credentials for complete data
    const userWithCredentials = await db.user.findUnique({
      where: { id: ctx.user!.id },
      include: { credentials: true }
    });

    if (!userWithCredentials) {
      return new Response("User not found", { status: 404 });
    }

    // Pass user data as props to client component
    const userData = {
      id: userWithCredentials.id,
      username: userWithCredentials.username,
      email: userWithCredentials.email,
      role: userWithCredentials.role,
      createdAt: userWithCredentials.createdAt?.toISOString(),
      club: userWithCredentials.club,
      password: !!userWithCredentials.password, // Just boolean for security
      credentials: userWithCredentials.credentials || []
    };

    return <AuthSettings user={userData} />;
  }]),

  // Profile routes
  route("/:username/profile/setup", [isAuthenticated, ({ ctx }) => {
    // User is guaranteed to exist due to isAuthenticated interceptor
    const userData = {
      id: ctx.user!.id,
      username: ctx.user!.username,
      email: ctx.user!.email,
      role: ctx.user!.role,
      createdAt: ctx.user!.createdAt?.toISOString(),
      club: ctx.user!.club,
    };

    return <ProfileSetup user={userData} />;
  }]),

  route("/:username/profile/edit", async (props) => {
    const username = props.params.username;
    const isOwnProfile = props.ctx.user?.username === username;

    // Find the user by username to get their ID
    const targetUser = await db.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      return new Response("User not found", { status: 404 });
    }

    return <ProfileEditPage UserId={targetUser.id} isOwnProfile={isOwnProfile} {...props} />;
  }),

  route("/:username/profile", async (props) => {
    const username = props.params.username;
    const isOwnProfile = props.ctx.user?.username === username;

    // Find the user by username to get their ID
    const targetUser = await db.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      return new Response("User not found", { status: 404 });
    }

    return <ProfilePage UserId={targetUser.id} isOwnProfile={isOwnProfile} {...props} />;
  }),



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
