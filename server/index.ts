import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { getDashboardPayload, getWorkoutSummary } from "./dashboard";
import { getCodingSummary } from "./wakatime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "portfolio-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/dashboard", async (_req, res) => {
    const payload = await getDashboardPayload();

    // The dashboard is allowed to be slightly stale if an upstream provider is slow.
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.json(payload);
  });

  app.get("/api/coding", async (_req, res) => {
    const coding = await getCodingSummary();

    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.json(coding);
  });

  app.get("/api/workouts", async (_req, res) => {
    const workouts = await getWorkoutSummary();

    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.json(workouts);
  });

  // Serve static files from dist/public in production.
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing after API routes.
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
