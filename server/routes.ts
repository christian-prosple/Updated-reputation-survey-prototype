import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { seedIfEmpty } from "./seed";
import { registerPublicRoutes } from "./routes/public";
import { registerAdminRoutes } from "./routes/admin";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Sessions (admin auth).
  setupAuth(app);

  // Seed default data on first boot.
  await seedIfEmpty();

  // Simple health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  registerPublicRoutes(app);
  registerAdminRoutes(app);

  return httpServer;
}
