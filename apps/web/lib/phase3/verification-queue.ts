export type VerificationQueueRow = {
  id: string;
  caseId: string;
  organization: string;
  itemType: string;
  status: string;
  submittedAt: string | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function normalizeVerificationQueue(payload: unknown): VerificationQueueRow[] {
  const entries = record(payload)?.entries;
  const invalid = () => new Error("The verification queue response was invalid. Please try again.");
  if (!Array.isArray(entries)) throw invalid();
  const ids = new Set<string>();
  return entries.map((value) => {
    const item = record(value);
    if (!item) throw invalid();
    const { verificationItemId, verificationCaseId, organizationName, itemType, status, caseSubmittedAt } = item;
    if (![verificationItemId, verificationCaseId, organizationName, itemType, status].every((field) => typeof field === "string" && field.trim())) throw invalid();
    if (caseSubmittedAt !== null && (typeof caseSubmittedAt !== "string" || !Number.isFinite(Date.parse(caseSubmittedAt)))) throw invalid();
    const id = verificationItemId as string;
    if (ids.has(id)) throw invalid();
    ids.add(id);
    return { id, caseId: verificationCaseId as string, organization: organizationName as string, itemType: itemType as string, status: status as string, submittedAt: caseSubmittedAt as string | null };
  });
}
