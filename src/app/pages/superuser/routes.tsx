import { route } from "rwsdk/router";
import Dashboard from "./Dashboard";
import { AppContext } from "@/worker";

// Interrupter to require SUPERUSER role
const isSuperUser = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/home" },
    });
  }
  
  if (ctx.user.role !== "SUPERUSER") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/home" },
    });
  }
};

export const routes = [
  route("/dashboard", [isSuperUser, Dashboard]),
];
