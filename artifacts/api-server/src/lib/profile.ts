import { db, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type Role = "patient" | "admin";
export type SubscriptionTier = "free" | "paid";

export interface ProfileRow {
  userId: string;
  role: Role | null;
  subscriptionTier: SubscriptionTier;
}

export async function ensureUserProfile(userId: string): Promise<ProfileRow> {
  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (existing) {
    return {
      userId: existing.userId,
      role: (existing.role as Role | null) ?? null,
      subscriptionTier:
        (existing.subscriptionTier as SubscriptionTier) ?? "free",
    };
  }

  await db.insert(userProfilesTable).values({
    userId,
    role: null,
    subscriptionTier: "free",
  });

  return { userId, role: null, subscriptionTier: "free" };
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<ProfileRow> {
  await ensureUserProfile(userId);

  const [updated] = await db
    .update(userProfilesTable)
    .set({ role })
    .where(eq(userProfilesTable.userId, userId))
    .returning();

  return {
    userId: updated.userId,
    role: updated.role as Role,
    subscriptionTier: updated.subscriptionTier as SubscriptionTier,
  };
}

export async function setUserTier(
  userId: string,
  tier: SubscriptionTier,
): Promise<ProfileRow> {
  await ensureUserProfile(userId);

  const [updated] = await db
    .update(userProfilesTable)
    .set({ subscriptionTier: tier })
    .where(eq(userProfilesTable.userId, userId))
    .returning();

  return {
    userId: updated.userId,
    role: updated.role as Role | null,
    subscriptionTier: updated.subscriptionTier as SubscriptionTier,
  };
}
