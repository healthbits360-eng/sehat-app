import { Router, type IRouter, type Request, type Response } from "express";
import { SetRoleBody } from "@workspace/api-zod";
import { db, patientProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUserProfile, setUserRole, setUserTier } from "../lib/profile";

const router: IRouter = Router();

router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth!.userId;
    const profile = await ensureUserProfile(userId);

    const [patient] = await db
      .select({ id: patientProfilesTable.id })
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, userId));

    res.json({
      user: req.user,
      role: profile.role,
      onboardingComplete: !!patient,
      subscriptionTier: profile.subscriptionTier,
    });
  },
);

router.put(
  "/me/role",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SetRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const current = await ensureUserProfile(req.auth!.userId);
    if (current.role) {
      res.status(409).json({ error: "Role already set" });
      return;
    }
    const updated = await setUserRole(req.auth!.userId, parsed.data.role);
    const [patient] = await db
      .select({ id: patientProfilesTable.id })
      .from(patientProfilesTable)
      .where(eq(patientProfilesTable.userId, req.auth!.userId));
    res.json({
      user: req.user,
      role: updated.role,
      onboardingComplete: !!patient,
      subscriptionTier: updated.subscriptionTier,
    });
  },
);

router.get(
  "/me/subscription",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const tier = req.auth!.subscriptionTier;
    res.json(buildSubscription(tier));
  },
);

router.put(
  "/me/subscription",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const tier = req.body?.tier;
    if (tier !== "free" && tier !== "paid") {
      res.status(400).json({ error: "tier must be 'free' or 'paid'" });
      return;
    }
    const updated = await setUserTier(req.auth!.userId, tier);
    res.json(buildSubscription(updated.subscriptionTier));
  },
);

function buildSubscription(tier: "free" | "paid") {
  if (tier === "paid") {
    return {
      tier,
      planRegenerationsRemaining: 999,
      chatMessagesRemaining: 999,
      features: [
        "Unlimited AI chat",
        "Unlimited plan regeneration",
        "Detailed weekly insights",
        "Priority clinician review",
      ],
    };
  }
  return {
    tier,
    planRegenerationsRemaining: 1,
    chatMessagesRemaining: 10,
    features: [
      "Personalized recovery plan",
      "Daily check-ins and tracking",
      "10 AI chat messages per period",
    ],
  };
}

export default router;
