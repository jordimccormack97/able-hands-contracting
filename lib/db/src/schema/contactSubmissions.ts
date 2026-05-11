import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const leadStatusEnum = [
  "new",
  "contacted",
  "consultation_scheduled",
  "estimate_sent",
  "won",
  "lost",
  "archived",
] as const;
export type LeadStatus = (typeof leadStatusEnum)[number];

export const submissionStatusEnum = leadStatusEnum;
export type SubmissionStatus = LeadStatus;

export const serviceTypeEnum = [
  "Fencing",
  "Decks",
  "Carpentry",
  "Punch List Items",
  "Home Repairs",
  "Other",
] as const;
export type ServiceType = (typeof serviceTypeEnum)[number];

export const sourceEnum = ["web", "qr", "direct"] as const;
export type LeadSource = (typeof sourceEnum)[number];

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  zipCode: text("zip_code").default(""),
  serviceType: text("service_type").default(""),
  projectSummary: text("project_summary").default(""),
  budgetRange: text("budget_range").default(""),
  desiredStart: text("desired_start").default(""),
  preferredContactMethod: text("preferred_contact_method").default(""),
  source: text("source").default("web"),
  serviceDetails: jsonb("service_details").$type<Record<string, unknown>>().default({}),
  uploads: jsonb("uploads").$type<Array<{ url: string; name: string; type: string; size: number }>>().default([]),
  projectDetails: text("project_details").default(""),
  description: text("description").default(""),
  status: text("status").notNull().default("new"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(254),
  phone: z.string().trim().max(30).min(1, "Phone is required"),
  zipCode: z.string().trim().min(5, "ZIP code is required").max(10),
  serviceType: z.enum(serviceTypeEnum, { message: "Please select a service" }),
  projectSummary: z.string().trim().min(20, "Please describe your project (at least 20 characters)").max(1000),
  budgetRange: z.string().trim().max(50).optional().default(""),
  desiredStart: z.string().trim().max(50).optional().default(""),
  preferredContactMethod: z.string().trim().max(20).optional().default(""),
  source: z.enum(sourceEnum).optional().default("web"),
  serviceDetails: z.any().optional().default({}),
  uploads: z.any().optional().default([]),
  projectDetails: z.string().trim().max(500).optional().default(""),
  description: z.string().trim().max(4000).optional().default(""),
});

export type InsertContactSubmission = z.infer<
  typeof insertContactSubmissionSchema
>;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
