import express, { type RequestHandler } from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GET as getCoding } from "../api/coding.ts";
import { GET as getHealth } from "../api/health.ts";
import { GET as getWorkouts } from "../api/workouts.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ApiHandler = (request: Request) => Response | Promise<Response>;

function apiRoute(handler: ApiHandler): RequestHandler {
  return async (_req, res, next) => {
    try {
      const response = await handler(new Request("http://127.0.0.1/"));

      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      res.send(await response.text());
    } catch (error) {
      next(error);
    }
  };
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", apiRoute(getHealth));
  app.get("/api/coding", apiRoute(getCoding));
  app.get("/api/workouts", apiRoute(getWorkouts));

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const defaultPort = process.env.NODE_ENV === "production" ? 3000 : 3001;
  const port = Number(process.env.PORT) || defaultPort;

  server.listen(port, () => {
    console.log(`Portfolio server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start portfolio server", error);
  process.exitCode = 1;
});
