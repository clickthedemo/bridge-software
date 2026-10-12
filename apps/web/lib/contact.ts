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
  status: "preview";
  sent: false;
  stored: false;
};

export function validateContactRequest(input: ContactRequestInput): string | null {
  if (typeof input.profileSlug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.profileSlug)) return "Choose a valid member profile.";
  if (!contactReasons.includes(input.reason)) return "Choose a valid reason for contact.";
  if (typeof input.note !== "string" || !input.note.trim()) return "Add a short note so the member knows why you are reaching out.";
  if (input.note.length > 500) return "Keep your note to 500 characters or fewer.";
  return null;
}

export async function submitContactRequest(
  input: ContactRequestInput,
  options?: { simulateFailure?: boolean },
): Promise<ContactRequestReceipt> {
  const error = validateContactRequest(input);
  if (error) throw new Error(error);
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (options?.simulateFailure) {
    throw new Error("Simulated network failure");
  }
  return { status: "preview", sent: false, stored: false };
}
