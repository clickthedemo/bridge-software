import { audienceIds, type AudienceId, type PostRecord, type SessionClaims } from "./types.ts";

export const audienceCatalog: ReadonlyArray<{
  id: AudienceId;
  label: string;
  publicSafe: boolean;
}> = [
  { id: "adults", label: "Adults 21+", publicSafe: true },
  { id: "retailers", label: "Verified retailers", publicSafe: false },
  { id: "industry", label: "Industry professionals", publicSafe: false },
];

export type ReachId = "world" | "state" | "b2b" | "public" | "everyone";

/**
 * Reach is who the author wants to see a post. It is a separate axis from
 * audienceCatalog, which carries the 21+ / verified-access compliance gate.
 * Tori asked for this on 2026-09-03: "who do you want to see this?"
 */
export const reachCatalog: ReadonlyArray<{ id: ReachId; label: string; hint: string }> = [
  { id: "world", label: "The world", hint: "Every market Bridge covers" },
  { id: "state", label: "Your state", hint: "Your home market only" },
  { id: "b2b", label: "B2B", hint: "Verified businesses, not public users" },
  { id: "public", label: "Public users", hint: "Consumers browsing Bridge" },
  { id: "everyone", label: "Everyone", hint: "Public users and businesses together" },
];

export function reachLabel(id: ReachId | string): string {
  return reachCatalog.find((item) => item.id === id)?.label ?? id;
}

export const allowedUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const maxUploadBytes = 25 * 1024 * 1024;

export function isAudienceId(value: string): value is AudienceId {
  return (audienceIds as readonly string[]).includes(value);
}

export function resolveEffectiveAudiences(
  selected: readonly string[],
  protectedDetail: boolean,
): AudienceId[] {
  const unique = selected.filter(isAudienceId).filter((id, index, list) => list.indexOf(id) === index);
  if (!protectedDetail) return unique;
  return unique.filter((id) => id !== "adults");
}

export function canPublishPost(
  selected: readonly string[],
  protectedDetail: boolean,
  fileError: string | null,
): boolean {
  return resolveEffectiveAudiences(selected, protectedDetail).length > 0 && fileError === null;
}

export function validateUploadFile(file: File): string | null {
  if (!allowedUploadTypes.includes(file.type as (typeof allowedUploadTypes)[number])) {
    return "Unsupported type. Use PNG, JPEG, WebP, or PDF.";
  }
  if (file.size > maxUploadBytes) {
    return "File exceeds 25 MB.";
  }
  return null;
}

export function canCreatePromotion(claims: SessionClaims): boolean {
  if (!claims.ageEligible) return false;
  if (claims.membershipStatus !== "active") return false;
  if (claims.adminScope) return true;
  if (claims.organizationVerificationState !== "verified") return false;
  return claims.delegatedPermissions.includes("create_promotion");
}

export function canViewProtectedProfile(claims: SessionClaims): boolean {
  if (claims.adminScope) return true;
  if (claims.membershipStatus !== "active") return false;
  return claims.delegatedPermissions.includes("view_protected_profile");
}

export function canConfirmContacts(claims: SessionClaims): boolean {
  if (claims.adminScope) return true;
  if (claims.membershipStatus !== "active") return false;
  if (claims.organizationVerificationState !== "verified") return false;
  return claims.delegatedPermissions.includes("confirm_contacts");
}

export function audienceLabel(id: AudienceId): string {
  return audienceCatalog.find((item) => item.id === id)?.label ?? id;
}

export function visiblePostsForView(
  posts: readonly PostRecord[],
  view: "public" | "protected",
): PostRecord[] {
  if (view === "protected") return [...posts];
  return posts.filter((post) => !post.protectedDetail && post.audienceIds.includes("adults"));
}

export function validateContacts(contacts: readonly { kind: string; name: string; email: string; phone: string }[]): string | null {
  if (contacts.length !== 2) {
    return "B2B profiles keep one sales contact and one accounting contact.";
  }
  const kinds = contacts.map((contact) => contact.kind).sort().join(",");
  if (kinds !== "accounting,sales") {
    return "B2B profiles keep one sales contact and one accounting contact.";
  }
  for (const contact of contacts) {
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      return "Name, email, and phone are required for each responsible contact.";
    }
    if (!contact.email.includes("@")) {
      return "Use a valid email for each responsible contact.";
    }
  }
  return null;
}
