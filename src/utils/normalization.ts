import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { AppError } from "./errors";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string, defaultCountry: string): string {
  const parsed = parsePhoneNumberFromString(phone.trim(), defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) {
    throw new AppError(400, "VALIDATION_ERROR", "Registration data is invalid.", {
      fields: {
        phone: ["Phone number is invalid."]
      }
    });
  }
  return parsed.number;
}

export function isValidFullName(fullName: string): boolean {
  return fullName.trim().split(/\s+/).filter(Boolean).length >= 3;
}

export function validateAge(age: number, minAge: number, maxAge: number): boolean {
  return Number.isInteger(age) && age >= minAge && age <= maxAge;
}

