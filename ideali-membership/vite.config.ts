import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4001,
    open: true,
    host: "localhost",
    proxy: {
      "/api": {
        target: "http://localhost:5098",
        changeOrigin: true,
        secure: false,
      },
    },
    https: {
      key: fs.readFileSync("./ssl/key.pem"),
      cert: fs.readFileSync("./ssl/cert.pem"),
    },
  },
});
