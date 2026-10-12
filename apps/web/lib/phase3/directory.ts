import { HttpPhase3Client } from "./http-client.ts";
import { Phase3Error } from "./types.ts";
import { validateOrganizationId } from "./organizations.ts";

export const directoryRoles = { brand: "Brand", retailer: "Retailer", dispensary: "Dispensary", sales_rep: "Sales rep" } as const;
export type DirectoryProfile = {
  id: string; slug: string; role: keyof typeof directoryRoles; name: string; companyName: string;
  description: string; location: string; state: string; serviceTerritories: string[];
  products: string[]; categories: string[]; logoUrl: string | null; visibility: "private" | "public";
  verified: boolean; verificationStatus: "verified" | "pending"; createdAt: string; updatedAt: string;
};
export type DirectoryInput = Pick<DirectoryProfile, "slug" | "name" | "companyName" | "description" | "location" | "state" | "serviceTerritories" | "products" | "categories" | "logoUrl" | "visibility">;
export type DirectoryPage = { profiles: DirectoryProfile[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export type DirectoryFilters = { query?: string; role?: keyof typeof directoryRoles; state?: string; verified?: boolean; category?: string; product?: string; territory?: string; page?: number; pageSize?: number };
const strings = ["id", "slug", "name", "companyName", "description", "location", "state", "createdAt", "updatedAt"] as const;
const lists = ["serviceTerritories", "products", "categories"] as const;
function invalid(): never { throw new Phase3Error("unavailable", "The directory response could not be read. Please try again."); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
export function safeLogoUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function parseDirectoryProfile(value: unknown): DirectoryProfile {
  const p = object(value);
  if (strings.some((key) => typeof p[key] !== "string") || lists.some((key) => !Array.isArray(p[key]) || !(p[key] as unknown[]).every((item) => typeof item === "string")) || !Object.hasOwn(directoryRoles, String(p.role)) || !["private", "public"].includes(String(p.visibility)) || typeof p.verified !== "boolean" || !["verified", "pending"].includes(String(p.verificationStatus)) || (p.logoUrl !== null && !safeLogoUrl(p.logoUrl))) return invalid();
  try { validateOrganizationId(p.id as string); } catch { return invalid(); }
  if (p.verified !== (p.verificationStatus === "verified") || !Number.isFinite(Date.parse(p.createdAt as string)) || !Number.isFinite(Date.parse(p.updatedAt as string))) return invalid();
  return p as DirectoryProfile;
}
export function parseDirectoryMine(value: unknown): { profiles: DirectoryProfile[] } {
  const result = object(value);
  if (!Array.isArray(result.profiles)) return invalid();
  return { profiles: result.profiles.map(parseDirectoryProfile) };
}
export function parseDirectoryPage(value: unknown): DirectoryPage {
  const { profiles } = parseDirectoryMine(value); const pagination = object(object(value).pagination);
  if (["page", "pageSize", "total", "totalPages"].some((key) => !Number.isSafeInteger(pagination[key]) || (pagination[key] as number) < (key === "page" || key === "pageSize" ? 1 : 0))) return invalid();
  return { profiles, pagination: pagination as DirectoryPage["pagination"] };
}
export function validateDirectoryInput(value: Partial<DirectoryInput> & { organizationId?: string }, partial = false) {
  const allowed = ["slug", "name", "companyName", "description", "location", "state", ...lists, "logoUrl", "visibility", ...(partial ? [] : ["organizationId"])];
  if (Object.keys(value).some((key) => !allowed.includes(key)) || !Object.keys(value).length) throw new Phase3Error("validation", "Only editable profile fields can be saved.");
  if ((!partial || value.slug !== undefined) && (typeof value.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || value.slug.length < 3 || value.slug.length > 80 || value.slug === "mine" || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value.slug))) throw new Phase3Error("validation", "Use a profile URL of lowercase letters, numbers and single hyphens (3 to 80 characters).");
  if ((!partial || value.name !== undefined) && (typeof value.name !== "string" || !value.name.trim() || value.name.length > 200)) throw new Phase3Error("validation", "Enter a name between 1 and 200 characters.");
  for (const key of ["companyName", "description", "location", "state"] as const) if (value[key] !== undefined && typeof value[key] !== "string") throw new Phase3Error("validation", "Profile text must be a string.");
  for (const key of lists) if (value[key] !== undefined && (!Array.isArray(value[key]) || !value[key]!.every((item) => typeof item === "string" && !!item.trim()))) throw new Phase3Error("validation", "Enter non-empty items separated by commas.");
  for (const key of ["companyName", "location", "description"] as const) if (value[key] !== undefined && value[key]!.length > (key === "description" ? 5000 : 200)) throw new Phase3Error("validation", "Profile text exceeds the field limit.");
  if (value.state && !/^[A-Z]{2}$/.test(value.state)) throw new Phase3Error("validation", "Use a two-letter uppercase state code.");
  for (const key of lists) if (value[key] && (value[key]!.length > (key === "serviceTerritories" ? 60 : 30) || value[key]!.some((item) => key === "serviceTerritories" ? !/^[A-Z]{2}$/.test(item) : item.length > 100))) throw new Phase3Error("validation", "Use at most 60 two-letter service states or 30 product/category items of up to 100 characters.");
  if (value.visibility !== undefined && !["private", "public"].includes(value.visibility)) throw new Phase3Error("validation", "Choose private or public visibility.");
  if (value.logoUrl !== undefined && value.logoUrl !== null && !safeLogoUrl(value.logoUrl)) throw new Phase3Error("validation", "Use an HTTPS logo URL without credentials.");
  if (value.organizationId !== undefined) validateOrganizationId(value.organizationId);
  return value;
}
export function directoryQuery(filters: DirectoryFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") query.set(key, String(value));
  return query.toString();
}
export class DirectoryClient extends HttpPhase3Client {
  list(filters: DirectoryFilters = {}) { return this.request<unknown>(`/api/v1/directory?${directoryQuery(filters)}`).then(parseDirectoryPage); }
  mine() { return this.request<unknown>("/api/v1/directory/mine").then(parseDirectoryMine); }
  get(identifier: string) { return this.request<unknown>(`/api/v1/directory/${encodeURIComponent(identifier)}`).then((value) => ({ profile: parseDirectoryProfile(object(value).profile) })); }
  save(id: string | null, input: Partial<DirectoryInput> & { organizationId?: string }) {
    if (id) validateOrganizationId(id);
    return this.request<unknown>(`/api/v1/directory${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: JSON.stringify(validateDirectoryInput(input, !!id)) }).then((value) => ({ profile: parseDirectoryProfile(object(value).profile) }));
  }
}
