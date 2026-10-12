import { HttpPhase3Client } from "./http-client.ts";
import { Phase3Error } from "./types.ts";
import { validateOrganizationId } from "./organizations.ts";

export const requestKinds = { contact: "Contact request", claim: "Claim this listing", correction: "Suggest a correction" } as const;
export const emailDeliveryStatuses = ["not_configured", "not_applicable", "queued", "sent", "partial", "failed"] as const;
export type DirectoryRequest = {
  id: string; profileId: string; kind: keyof typeof requestKinds; message: string; replyEmail: string | null;
  status: "pending" | "resolved" | "rejected"; createdAt: string; updatedAt: string; canReview: boolean; emailDelivery: typeof emailDeliveryStatuses[number];
};
export type RequestInput = { profileId: string; kind: DirectoryRequest["kind"]; message: string; shareEmail: boolean; idempotencyKey: string };
export type RequestPage = { requests: DirectoryRequest[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
function invalid(): never { throw new Phase3Error("unavailable", "The request response could not be read. Please retry."); }
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) return invalid(); return value as Record<string, unknown>; }
export function parseDirectoryRequest(value: unknown): DirectoryRequest {
  const r = object(value);
  if (typeof r.id !== "string" || typeof r.profileId !== "string" || !Object.hasOwn(requestKinds, String(r.kind)) || typeof r.message !== "string" || (r.replyEmail !== null && typeof r.replyEmail !== "string") || !["pending", "resolved", "rejected"].includes(String(r.status)) || typeof r.canReview !== "boolean" || !emailDeliveryStatuses.includes(r.emailDelivery as never) || typeof r.createdAt !== "string" || typeof r.updatedAt !== "string" || !Number.isFinite(Date.parse(r.createdAt)) || !Number.isFinite(Date.parse(r.updatedAt))) return invalid();
  try { validateOrganizationId(r.id); validateOrganizationId(r.profileId); } catch { return invalid(); }
  return { id: r.id, profileId: r.profileId, kind: r.kind as DirectoryRequest["kind"], message: r.message, replyEmail: r.replyEmail, status: r.status as DirectoryRequest["status"], createdAt: r.createdAt, updatedAt: r.updatedAt, canReview: r.canReview, emailDelivery: r.emailDelivery as DirectoryRequest["emailDelivery"] };
}
export function parseRequestPage(value: unknown): RequestPage {
  const result = object(value), p = object(result.pagination);
  if (!Array.isArray(result.requests) || ["page", "pageSize", "total", "totalPages"].some(k => !Number.isSafeInteger(p[k]) || (p[k] as number) < (k === "page" || k === "pageSize" ? 1 : 0))) return invalid();
  return { requests: result.requests.map(parseDirectoryRequest), pagination: p as RequestPage["pagination"] };
}
export function validateRequestInput(input: RequestInput): RequestInput {
  validateOrganizationId(input.profileId); validateOrganizationId(input.idempotencyKey);
  if (Object.keys(input).some(key => !["profileId", "kind", "message", "shareEmail", "idempotencyKey"].includes(key)) || !Object.hasOwn(requestKinds, input.kind) || typeof input.message !== "string" || !input.message.trim() || input.message.trim().length > 5000 || typeof input.shareEmail !== "boolean") throw new Phase3Error("validation", "Choose a request type and enter a message of 1 to 5,000 characters.");
  return { ...input, message: input.message.trim() };
}
export class DirectoryRequestsClient extends HttpPhase3Client {
  list(page = 1) { return this.request<unknown>(`/api/v1/directory-requests?page=${page}&pageSize=20`).then(parseRequestPage); }
  create(input: RequestInput) { return this.request<unknown>("/api/v1/directory-requests", { method: "POST", body: JSON.stringify(validateRequestInput(input)) }).then(value => ({ request: parseDirectoryRequest(object(value).request) })); }
  review(id: string, status: "resolved" | "rejected") { validateOrganizationId(id); return this.request<unknown>(`/api/v1/directory-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }).then(value => ({ request: parseDirectoryRequest(object(value).request) })); }
}
