// Mock contact-request adapter for the discovery prototype.
// This simulates the shape of a future backend call so the UI states are
// testable. It is a proposal for Miraj's contract review — not an approved
// API, and nothing is sent or stored anywhere.

export const contactReasons = [
  "Retail partnership",
  "Distribution",
  "Sales representation",
  "Other",
] as const;

export type ContactReason = (typeof contactReasons)[number];

export type ContactRequestInput = {
  profileSlug: string;
  reason: ContactReason;
  note: string;
};

export type ContactRequestReceipt = {
  status: "pending";
  requestId: string;
};

export async function submitContactRequest(
  input: ContactRequestInput,
  options?: { simulateFailure?: boolean },
): Promise<ContactRequestReceipt> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (options?.simulateFailure) {
    throw new Error("Simulated network failure");
  }
  return { status: "pending", requestId: `mock-request-${input.profileSlug}` };
}
