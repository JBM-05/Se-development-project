export function duplicateConflictFields(duplicate: { phone: boolean; email: boolean }): string[] {
  return [...(duplicate.phone ? ["phone"] : []), ...(duplicate.email ? ["email"] : [])];
}

