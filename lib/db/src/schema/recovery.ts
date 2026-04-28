import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userProfilesTable = pgTable("user_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }),
  subscriptionTier: varchar("subscription_tier", { length: 16 })
    .notNull()
    .default("free"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientProfilesTable = pgTable(
  "patient_profiles",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    age: integer("age").notNull(),
    gender: varchar("gender", { length: 32 }).notNull(),
    conditionId: varchar("condition_id", { length: 64 }).notNull(),
    symptoms: text("symptoms").notNull(),
    painLevel: integer("pain_level").notNull(),
    medicalHistory: text("medical_history").notNull(),
    reportFileName: text("report_file_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("patient_profiles_condition_idx").on(t.conditionId)],
);

export const recoveryPlansTable = pgTable("recovery_plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id")
    .notNull()
    .unique()
    .references(() => patientProfilesTable.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  generatedBy: varchar("generated_by", { length: 16 })
    .notNull()
    .default("ai"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const trackingEntriesTable = pgTable(
  "tracking_entries",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    patientId: varchar("patient_id")
      .notNull()
      .references(() => patientProfilesTable.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    painScore: integer("pain_score").notNull(),
    completedExercises: integer("completed_exercises").notNull(),
    totalExercises: integer("total_exercises").notNull(),
    adherencePercent: integer("adherence_percent").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tracking_entries_patient_date_unique").on(t.patientId, t.date),
    index("tracking_entries_patient_idx").on(t.patientId),
  ],
);

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("chat_messages_user_idx").on(t.userId, t.createdAt)],
);

export const clinicianNotesTable = pgTable(
  "clinician_notes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    patientId: varchar("patient_id")
      .notNull()
      .references(() => patientProfilesTable.id, { onDelete: "cascade" }),
    authorId: varchar("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("clinician_notes_patient_idx").on(t.patientId, t.createdAt)],
);

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type PatientProfile = typeof patientProfilesTable.$inferSelect;
export type RecoveryPlanRow = typeof recoveryPlansTable.$inferSelect;
export type TrackingEntryRow = typeof trackingEntriesTable.$inferSelect;
export type ChatMessageRow = typeof chatMessagesTable.$inferSelect;
export type ClinicianNoteRow = typeof clinicianNotesTable.$inferSelect;
