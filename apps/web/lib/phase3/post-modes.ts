import type { ReachId } from "./audiences.ts";
import type { ContentType } from "./types.ts";

/*
 * Posting modes. Tori, 2026-09-03: a business posts a deal, a drop, a service
 * listing, a hiring call, or a plain update, and the mode decides which fields
 * it asks for.
 *
 * This layer sits ON TOP of audiences.ts, it does not replace it. reachCatalog
 * still answers "who do you want to see this?" and audienceCatalog still
 * carries the 21+ / verified-access gate. A mode can only pull a post back to
 * B2B - it can never add an audience or open a protected post to the public.
 */

export const postModeIds = ["update", "deal", "drop", "listing", "hiring"] as const;
export type PostModeId = (typeof postModeIds)[number];

type FieldBase = {
  name: string;
  label: string;
  required: boolean;
  hint?: string;
};

type WrittenField = FieldBase & { maxLength: number; placeholder?: string };

/* text and textarea are separate members so a narrowed-out branch really drops them. */
export type PostModeField =
  | (WrittenField & { type: "text" })
  | (WrittenField & { type: "textarea" })
  | (FieldBase & { type: "date"; notPast: boolean })
  | (FieldBase & { type: "select"; options: readonly string[] })
  | (FieldBase & { type: "toggle" });

export type PostMode = {
  id: PostModeId;
  label: string;
  blurb: string;
  /* Modes are a composer concern; the Phase 3 contract still takes a ContentType. */
  contentType: ContentType;
  defaultReach: ReachId;
  /* True when the mode is B2B by nature, so reach is not the author's to choose. */
  forcesB2B: boolean;
  fields: readonly PostModeField[];
};

/* Toggle fields hold a boolean, every other field holds the raw input string. */
export type PostModeValues = Record<string, string | boolean>;

export type PostModeIssue = { field: string; message: string };

export const postModeCatalog: readonly PostMode[] = [
  {
    id: "update",
    label: "Update",
    blurb: "News, an idea, anything that does not need a form.",
    contentType: "Update",
    defaultReach: "everyone",
    forcesB2B: false,
    fields: [],
  },
  {
    id: "deal",
    label: "Deal",
    blurb: "A holiday deal or price offer, with terms and an end date.",
    contentType: "Promotion",
    defaultReach: "public",
    forcesB2B: false,
    fields: [
      {
        name: "offer",
        label: "The offer",
        required: true,
        type: "text",
        maxLength: 80,
        placeholder: "30% off every pre-roll",
      },
      {
        name: "price",
        label: "Price",
        required: false,
        type: "text",
        maxLength: 40,
        placeholder: "$25 an eighth",
        hint: "Written the way you want it read. Bridge does not take the payment.",
      },
      {
        name: "terms",
        label: "Fine print",
        required: true,
        type: "textarea",
        maxLength: 240,
        placeholder: "One per customer, in store only, while supplies last.",
      },
      {
        name: "validUntil",
        label: "Valid until",
        required: true,
        type: "date",
        notPast: true,
      },
    ],
  },
  {
    id: "drop",
    label: "Drop",
    blurb: "A new product or launch. Public, or private to verified buyers.",
    contentType: "Promotion",
    defaultReach: "everyone",
    forcesB2B: false,
    fields: [
      {
        name: "productName",
        label: "Product",
        required: true,
        type: "text",
        maxLength: 80,
        placeholder: "Nightshift live rosin, 1g",
      },
      {
        name: "availableFrom",
        label: "Available from",
        required: true,
        type: "date",
        notPast: false,
      },
      {
        name: "b2bOnly",
        label: "Keep this drop private to verified buyers",
        required: false,
        type: "toggle",
        hint: "B2B reach only. Public 21+ readers do not see it.",
      },
    ],
  },
  {
    id: "listing",
    label: "Service listing",
    blurb: "A service you offer other businesses. Always B2B.",
    contentType: "Promotion",
    defaultReach: "b2b",
    forcesB2B: true,
    fields: [
      {
        name: "service",
        label: "Service",
        required: true,
        type: "text",
        maxLength: 80,
        placeholder: "Compliance packaging audits",
      },
      {
        name: "startingPrice",
        label: "Starting at",
        required: true,
        type: "text",
        maxLength: 40,
        placeholder: "$1,200 a site",
        hint: "A starting point for the conversation, not a checkout price.",
      },
      {
        name: "turnaround",
        label: "Turnaround",
        required: false,
        type: "text",
        maxLength: 40,
        placeholder: "About two weeks",
      },
    ],
  },
  {
    id: "hiring",
    label: "Hiring",
    blurb: "An open role at your business.",
    contentType: "Update",
    defaultReach: "state",
    forcesB2B: false,
    fields: [
      {
        name: "roleTitle",
        label: "Role",
        required: true,
        type: "text",
        maxLength: 80,
        placeholder: "Lead budtender",
      },
      {
        name: "employmentType",
        label: "Employment type",
        required: true,
        type: "select",
        options: ["Full-time", "Part-time", "Contract", "Seasonal"],
      },
      {
        name: "closes",
        label: "Applications close",
        required: false,
        type: "date",
        notPast: true,
      },
    ],
  },
];

export function isPostModeId(value: string): value is PostModeId {
  return (postModeIds as readonly string[]).includes(value);
}

export function getPostMode(id: PostModeId): PostMode {
  const mode = postModeCatalog.find((item) => item.id === id);
  /* postModeIds and postModeCatalog are written together, so a miss is a bug, not input. */
  if (!mode) throw new Error(`Unknown post mode: ${id}`);
  return mode;
}

export function postModeLabel(id: PostModeId): string {
  return getPostMode(id).label;
}

export function emptyPostModeValues(id: PostModeId): PostModeValues {
  const values: PostModeValues = {};
  for (const field of getPostMode(id).fields) {
    values[field.name] = field.type === "toggle" ? false : "";
  }
  return values;
}

export function postModeText(values: PostModeValues, name: string): string {
  const value = values[name];
  return typeof value === "string" ? value : "";
}

export function postModeFlag(values: PostModeValues, name: string): boolean {
  return values[name] === true;
}

/*
 * Local date, not toISOString(): UTC midnight would mark today as past for
 * anyone west of Greenwich. ISO date strings also compare correctly with <,
 * which is why every date check below is a plain string compare.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function validatePostModeField(
  field: PostModeField,
  value: string | boolean | undefined,
  today: string = todayIsoDate(),
): string | null {
  if (field.type === "toggle") return null;

  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return field.required ? `${field.label} is required.` : null;

  if (field.type === "text" || field.type === "textarea") {
    if (raw.length > field.maxLength) {
      return `${field.label} must be ${field.maxLength} characters or fewer.`;
    }
    return null;
  }

  if (field.type === "select") {
    return field.options.includes(raw) ? null : `Choose an option for ${field.label.toLowerCase()}.`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${field.label} needs a full date.`;
  if (field.notPast && raw < today) return `${field.label} cannot be in the past.`;
  return null;
}

export function validatePostMode(
  id: PostModeId,
  values: PostModeValues,
  today: string = todayIsoDate(),
): PostModeIssue[] {
  const issues: PostModeIssue[] = [];
  for (const field of getPostMode(id).fields) {
    const message = validatePostModeField(field, values[field.name], today);
    if (message) issues.push({ field: field.name, message });
  }
  return issues;
}

export function isPostModeValid(
  id: PostModeId,
  values: PostModeValues,
  today: string = todayIsoDate(),
): boolean {
  return validatePostMode(id, values, today).length === 0;
}

/* Business-only: a service listing, or a drop the author kept private. */
export function isPostModePrivate(id: PostModeId, values: PostModeValues): boolean {
  return getPostMode(id).forcesB2B || postModeFlag(values, "b2bOnly");
}

/*
 * The mode narrows reach, it never widens it: a private post is pinned to b2b,
 * and everything else keeps whatever the author picked from reachCatalog.
 */
export function resolvePostModeReach(
  id: PostModeId,
  values: PostModeValues,
  chosenReach: ReachId,
): ReachId {
  return isPostModePrivate(id, values) ? "b2b" : chosenReach;
}

/* Feeds protectedDetail, which audiences.ts then strips Adults 21+ from. */
export function postModeProtectedDetail(
  id: PostModeId,
  values: PostModeValues,
  authorProtectedDetail: boolean,
): boolean {
  return authorProtectedDetail || isPostModePrivate(id, values);
}

export function postModeSummary(
  id: PostModeId,
  values: PostModeValues,
): { label: string; value: string }[] {
  const summary: { label: string; value: string }[] = [];
  for (const field of getPostMode(id).fields) {
    if (field.type === "toggle") continue;
    const value = postModeText(values, field.name).trim();
    if (value) summary.push({ label: field.label, value });
  }
  return summary;
}

/*
 * CreatePostInput carries one message, so mode detail rides along inside it.
 * That keeps the Phase 3 contract unchanged until the API grows real per-mode
 * fields.
 */
export function composePostModeMessage(
  id: PostModeId,
  values: PostModeValues,
  message: string,
): string {
  const lines = postModeSummary(id, values).map((entry) => `${entry.label}: ${entry.value}`);
  const body = message.trim();
  if (lines.length === 0) return body;
  return body ? `${body}\n\n${lines.join("\n")}` : lines.join("\n");
}
