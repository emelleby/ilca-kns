import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { FrontPage } from "@/app/pages/FrontPage";
import { Test } from "@/app/pages/Test";
import AuthSettings from "@/app/pages/user/settings/AuthSettings";
import { TasksPage } from "@/app/pages/TasksPage";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { routes as superuserRoutes } from "@/app/pages/superuser/routes";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { type User, setupDb, db } from "./db";
import { env } from "cloudflare:workers";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

// Middleware to require authentication
const isAuthenticated = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
};

export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
        include: {
          credentials: true,
        },
      });
    }
  },
  render(Document, [
    route("/", FrontPage),
    route("/test", [isAuthenticated, Test]),
    route("/pingo", function () {
      return <h1>Pongo!</h1>;
    }),
    route("/tasks", TasksPage),
    route("/home", [isAuthenticated, Home]),
    route("/homey", () => new Response("Home works!", { status: 200 })),

    route("/protected", [
      ({ ctx }) => {
        if (!ctx.user) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      },
      Home,
    ]),
    prefix("/user", userRoutes),
    prefix("/superuser", superuserRoutes),
  ]),
]);
