import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  // server: {
  //   port: Number(process.env.VITE_DEV_SERVER_PORT ?? 5173),
  //   open: true,
  //   host: process.env.VITE_DEV_SERVER_HOST ?? "127.0.0.1",
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:5098",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  //   https: {
  //     key: fs.readFileSync("./ssl/key.pem"),
  //     cert: fs.readFileSync("./ssl/cert.pem"),
  //   },
  // },
  server: {
    port: Number(process.env.VITE_DEV_SERVER_PORT ?? 3000),
    open: true,
    host: process.env.VITE_DEV_SERVER_HOST ?? "localhost",
    https: {
      key: fs.readFileSync("./ssl/key.pem"),
      cert: fs.readFileSync("./ssl/cert.pem"),
    },
  },
});
