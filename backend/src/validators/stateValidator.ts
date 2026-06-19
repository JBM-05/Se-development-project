import { z } from "zod";

export const createStateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Slug must be lowercase snake_case."),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex color."),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateStateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const deleteStateSchema = z.object({
  transferToStateId: z.string().uuid().optional()
});

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
export type DeleteStateInput = z.infer<typeof deleteStateSchema>;

