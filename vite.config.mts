import { defineConfig } from "vite";
import path from "path";
import { redwood } from "rwsdk/vite";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  environments: {
    ssr: {},
  },
  plugins: [cloudflare({
    viteEnvironment: { name: "worker" },
  }), redwood(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  resolve: {
    alias: {
      "@prisma/client": path.resolve(
        __dirname,
        "node_modules",
        "@prisma",
        "client"
      ),
    },
  },
});
