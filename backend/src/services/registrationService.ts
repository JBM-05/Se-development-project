import { env } from "../config/env";
import {
  createRegistrationRecord,
  findDuplicateRegistration
} from "../repositories/requestRepository";
import { getAgeSettings } from "../repositories/settingsRepository";
import { getStateBySlug } from "../repositories/stateRepository";
import { conflict, validationError } from "../utils/errors";
import { duplicateConflictFields } from "../utils/duplicates";
import { normalizeEmail, normalizePhone, validateAge } from "../utils/normalization";
import { RegistrationInput } from "../validators/registrationValidator";

export async function createRegistration(input: RegistrationInput): Promise<{
  requestNumber: string;
  state: string;
  message: string;
}> {
  const { minAge, maxAge } = await getAgeSettings();
  if (!validateAge(input.age, minAge, maxAge)) {
    throw validationError("Registration data is invalid.", {
      age: [`Age must be between ${minAge} and ${maxAge}.`]
    });
  }

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone, env.DEFAULT_PHONE_COUNTRY);

  const duplicate = await findDuplicateRegistration(normalizedPhone, normalizedEmail);
  const conflicts = duplicateConflictFields(duplicate);
  if (conflicts.length > 0) {
    throw conflict(
      "DUPLICATE_REGISTRATION",
      "A registration already exists for this phone number or email.",
      { conflicts }
    );
  }

  const underReview = await getStateBySlug("under_review");
  if (!underReview) {
    throw new Error("Required state under_review is missing. Run migrations and seed.");
  }

  const row = await createRegistrationRecord({
    fullName: input.fullName,
    age: input.age,
    major: input.major,
    phone: input.phone,
    normalizedPhone,
    email: input.email,
    normalizedEmail,
    city: input.city,
    stateId: underReview.id
  });

  return {
    requestNumber: row.request_number,
    state: underReview.slug,
    message: "Registration request submitted successfully."
  };
}
