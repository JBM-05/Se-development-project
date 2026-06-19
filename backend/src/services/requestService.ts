import { stringify } from "csv-stringify/sync";
import {
  addRequestNote,
  changeRequestState,
  getRequestDetail,
  listRequests,
  listRequestsForExport,
  setRequestArchived
} from "../repositories/requestRepository";
import { createActionLog } from "../repositories/actionLogRepository";
import {
  AddNoteInput,
  ArchiveInput,
  ChangeStateInput,
  ListRequestsQuery
} from "../validators/requestValidator";

export async function getRequests(filters: ListRequestsQuery) {
  return listRequests(filters);
}

export async function getRequest(id: string) {
  return getRequestDetail(id);
}

export async function updateRequestState(requestId: string, adminId: string, input: ChangeStateInput) {
  const updated = await changeRequestState(requestId, input.stateId, adminId);
  return {
    requestNumber: updated.request_number,
    state: updated.state_slug,
    message: "Request state updated successfully."
  };
}

export async function createNote(requestId: string, adminId: string, input: AddNoteInput) {
  await addRequestNote(requestId, adminId, input.body);
  return {
    message: "Note created successfully."
  };
}

export async function archiveRequest(requestId: string, adminId: string, input: ArchiveInput) {
  const updated = await setRequestArchived(requestId, input.archived, adminId);
  return {
    requestNumber: updated.request_number,
    archived: updated.archived_at !== null,
    message: input.archived ? "Request archived successfully." : "Request unarchived successfully."
  };
}

export async function exportRequests(filters: ListRequestsQuery, adminId: string): Promise<string> {
  const rows = await listRequestsForExport(filters);
  await createActionLog({
    actorAdminId: adminId,
    actorType: "admin",
    action: "requests_exported",
    metadata: { filters }
  });

  return stringify(
    rows.map((row) => ({
      requestNumber: row.request_number,
      fullName: row.full_name,
      age: row.age,
      major: row.major,
      phone: row.phone,
      email: row.email,
      city: row.city,
      state: row.state_slug,
      archived: row.archived_at ? "yes" : "no",
      createdAt: row.created_at.toISOString()
    })),
    { header: true }
  );
}

