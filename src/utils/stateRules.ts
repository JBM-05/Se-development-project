import { conflict } from "./errors";

export function assertStateCanBeDeleted(input: {
  isSystem: boolean;
  linkedCount: number;
  stateId: string;
  transferToStateId?: string;
}): void {
  if (input.isSystem) {
    throw conflict("SYSTEM_STATE_DELETE_REJECTED", "System states cannot be deleted.");
  }
  if (input.linkedCount > 0 && !input.transferToStateId) {
    throw conflict("STATE_HAS_LINKED_REQUESTS", "Linked states require transferToStateId before deletion.");
  }
  if (input.linkedCount > 0 && input.transferToStateId === input.stateId) {
    throw conflict("INVALID_STATE_TRANSFER", "transferToStateId must be a different state.");
  }
}

