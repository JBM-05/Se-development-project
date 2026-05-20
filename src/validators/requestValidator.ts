import { z } from "zod";

export const listRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  state: z.string().trim().optional(),
  major: z.string().trim().optional(),
  city: z.string().trim().optional(),
  archived: z.enum(["true", "false", "all"]).default("false"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "fullName", "age", "major", "city", "state", "requestNumber"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc")
});

export const changeStateSchema = z.object({
  stateId: z.string().uuid()
});

export const addNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000)
});

export const archiveSchema = z.object({
  archived: z.boolean()
});

export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
export type ChangeStateInput = z.infer<typeof changeStateSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type ArchiveInput = z.infer<typeof archiveSchema>;

