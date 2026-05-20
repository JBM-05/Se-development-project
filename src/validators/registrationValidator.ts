import { z } from "zod";
import { isValidFullName } from "../utils/normalization";

export const registrationSchema = z.object({
  fullName: z.string().trim().min(1).refine(isValidFullName, {
    message: "Full name must contain at least three words."
  }),
  age: z.number().int(),
  major: z.string().trim().min(1, "Major is required.").max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email("Email format is invalid."),
  city: z.string().trim().min(1, "City is required.").max(120)
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

