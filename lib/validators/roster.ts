import { z } from "zod";

export const rosterRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  position: z.string().trim().max(200).optional().or(z.literal("")),
  role: z.enum(["member", "officer"]).default("member"),
});

export type RosterRow = z.infer<typeof rosterRowSchema>;
