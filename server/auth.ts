import session from "express-session";
import createMemoryStore from "memorystore";
import type { Express, Request, Response, NextFunction } from "express";

const MemoryStore = createMemoryStore(session);

const isProduction = process.env.NODE_ENV === "production";

// Admin password comes from the ADMIN_PASSWORD env var. In development we fall
// back to "admin123" so the dashboard is usable out of the box; in production a
// real ADMIN_PASSWORD must be set or login is disabled.
export function getAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (isProduction) {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
  return "admin123";
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (isProduction) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "dev-survey-session-secret";
}

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

export function setupAuth(app: Express): void {
  app.set("trust proxy", 1);
  app.use(
    session({
      name: "survey.sid",
      secret: getSessionSecret(),
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
        sameSite: "lax",
        secure: isProduction,
      },
    }),
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
}
