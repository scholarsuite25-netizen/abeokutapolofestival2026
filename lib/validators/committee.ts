import { z } from "zod";

export const taskStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "awaiting_approval",
  "completed",
  "blocked",
  "cancelled",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const createTaskSchema = z.object({
  slug: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(4000).optional(),
  priority: taskPrioritySchema.default("medium"),
  due_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export const updateTaskStatusInput = z.object({
  slug: z.string().min(1),
  taskId: z.string().uuid(),
  status: taskStatusSchema,
});

export const scheduleMeetingSchema = z.object({
  slug: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  agenda: z.string().trim().max(4000).optional(),
  starts_at: z.string().min(1), // datetime-local value
  location: z.string().trim().max(200).optional(),
});

export const recordMinutesSchema = z.object({
  slug: z.string().min(1),
  meetingId: z.string().uuid(),
  body: z.string().trim().min(10).max(20000),
});

export const recordDecisionSchema = z.object({
  slug: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(8000).optional(),
  decision_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  status: z.enum(["proposed", "approved", "rejected"]).default("proposed"),
});

export const rosterRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  position: z.string().trim().max(200).optional().or(z.literal("")),
  role: z.enum(["committee_member", "committee_officer"]).default("committee_member"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;
export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>;
export type RosterRow = z.infer<typeof rosterRowSchema>;
