import type { Request, Response, NextFunction } from "express";
import { ensureUserProfile, type Role } from "../lib/profile";

export interface AuthedContext {
  userId: string;
  role: Role | null;
  subscriptionTier: "free" | "paid";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthedContext;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const profile = await ensureUserProfile(req.user.id);
  req.auth = {
    userId: req.user.id,
    role: profile.role,
    subscriptionTier: profile.subscriptionTier,
  };
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.auth.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
