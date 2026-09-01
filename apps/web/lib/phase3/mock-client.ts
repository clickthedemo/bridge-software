import {
  canConfirmContacts,
  canCreatePromotion,
  canViewProtectedProfile,
  resolveEffectiveAudiences,
  validateContacts,
  validateUploadFile,
} from "./audiences.ts";
import {
  Phase3Error,
  type ConfirmContactsInput,
  type ConfirmContactsResult,
  type CreatePostInput,
  type Phase3Client,
  type ProfileProjection,
  type ResponsibleContact,
  type SessionClaims,
  type UpdateContactsInput,
  type UploadIntent,
  type PostRecord,
} from "./types.ts";

export const mockHarborClaims: SessionClaims = {
  userId: "user-harbor-owner",
  ageEligible: true,
  membershipStatus: "active",
  organizationId: "org-harbor",
  organizationVerificationState: "verified",
  role: "dispensary",
  delegatedPermissions: ["create_promotion", "view_protected_profile", "confirm_contacts"],
  stateLicenseEligibility: ["MD"],
  adminScope: false,
};

const harborPublicDescription =
  "Community-first dispensary seeking premium regional partners. Public-safe description stays visible in both modes.";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function iso(date: Date): string {
  return date.toISOString();
}

function defaultHarborContacts(): ResponsibleContact[] {
  return [
    {
      kind: "sales",
      name: "Jordan Lee",
      email: "jordan.lee@example-harbor.invalid",
      phone: "(410) 555-0142",
    },
    {
      kind: "accounting",
      name: "Sam Rivera",
      email: "sam.rivera@example-harbor.invalid",
      phone: "(410) 555-0198",
    },
  ];
}

export class MockPhase3Client implements Phase3Client {
  private claims: SessionClaims;
  private confirmation: ProfileProjection["confirmation"];
  private contacts: ResponsibleContact[];
  private posts: PostRecord[];
  private failNext: boolean;
  private readonly now: () => Date;
  private uploadCount = 0;
  private postCount = 0;

  constructor(options?: {
    claims?: SessionClaims;
    failNext?: boolean;
    now?: () => Date;
  }) {
    this.claims = options?.claims ?? { ...mockHarborClaims, delegatedPermissions: [...mockHarborClaims.delegatedPermissions] };
    this.failNext = options?.failNext ?? false;
    this.now = options?.now ?? (() => new Date());
    this.contacts = defaultHarborContacts();
    this.posts = [];
    this.confirmation = {
      status: "needed",
      confirmedAt: null,
      nextDue: iso(addDays(this.now(), 30)),
      actorUserId: null,
    };
  }

  setFailNext(value: boolean) {
    this.failNext = value;
  }

  setClaims(patch: Partial<SessionClaims>) {
    this.claims = {
      ...this.claims,
      ...patch,
      delegatedPermissions: patch.delegatedPermissions
        ? [...patch.delegatedPermissions]
        : [...this.claims.delegatedPermissions],
    };
  }

  private maybeFail() {
    if (!this.failNext) return;
    this.failNext = false;
    throw new Phase3Error("unavailable", "The request could not be completed. Your work is still here — try again.");
  }

  async getSession(): Promise<SessionClaims> {
    this.maybeFail();
    return structuredClone(this.claims);
  }

  async createUploadIntent(file: File): Promise<UploadIntent> {
    this.maybeFail();
    if (!canCreatePromotion(this.claims)) {
      throw new Phase3Error("forbidden", "This account cannot upload promotion assets.");
    }
    const fileError = validateUploadFile(file);
    if (fileError) {
      throw new Phase3Error("validation", fileError);
    }
    this.uploadCount += 1;
    return {
      uploadId: `upload-${this.uploadCount}`,
      status: "accepted",
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  async createPost(input: CreatePostInput): Promise<PostRecord> {
    this.maybeFail();
    if (!canCreatePromotion(this.claims)) {
      throw new Phase3Error("forbidden", "This account cannot publish promotions.");
    }
    if (input.contentType !== "Promotion") {
      throw new Phase3Error("validation", "This Phase 3 slice supports Promotion publishing only.");
    }
    if (!input.message.trim()) {
      throw new Phase3Error("validation", "Add a message before publishing.");
    }
    const audienceIds = resolveEffectiveAudiences(input.audienceIds, input.protectedDetail);
    if (audienceIds.length === 0) {
      throw new Phase3Error("validation", "Publish requires at least one eligible audience.");
    }
    if (input.protectedDetail && input.audienceIds.includes("adults")) {
      throw new Phase3Error("validation", "Protected detail cannot target Adults 21+.");
    }
    this.postCount += 1;
    const record: PostRecord = {
      postId: `post-${this.postCount}`,
      contentType: input.contentType,
      message: input.message.trim(),
      uploadId: input.uploadId,
      audienceIds,
      protectedDetail: input.protectedDetail,
      moderationState: "published",
      createdAt: iso(this.now()),
    };
    this.posts.unshift(record);
    return structuredClone(record);
  }

  async listPosts(): Promise<PostRecord[]> {
    this.maybeFail();
    if (!this.claims.organizationId) {
      throw new Phase3Error("unauthenticated", "Sign in to view published promotions.");
    }
    return structuredClone(this.posts);
  }

  async getProfileProjection(view: "public" | "protected"): Promise<ProfileProjection> {
    this.maybeFail();
    if (!this.claims.organizationId) {
      throw new Phase3Error("unauthenticated", "Sign in to view this business profile.");
    }
    if (view === "protected" && !canViewProtectedProfile(this.claims)) {
      throw new Phase3Error("forbidden", "Protected business fields are hidden for this account.");
    }

    const contacts = view === "protected" ? structuredClone(this.contacts) : [];

    return {
      view,
      organizationId: this.claims.organizationId,
      displayName: "Harbor Dispensary",
      roleLabel: "Dispensary",
      location: "Baltimore, Maryland",
      publicDescription: harborPublicDescription,
      tags: ["Retail", "Education", "Maryland"],
      verificationState: this.claims.organizationVerificationState,
      contacts,
      confirmation: structuredClone(this.confirmation),
    };
  }

  async confirmContacts(input: ConfirmContactsInput): Promise<ConfirmContactsResult> {
    this.maybeFail();
    if (!canConfirmContacts(this.claims)) {
      throw new Phase3Error("forbidden", "This account cannot confirm responsible contacts.");
    }
    if (input.organizationId !== this.claims.organizationId) {
      throw new Phase3Error("forbidden", "Contact confirmation is limited to your organization.");
    }
    const now = this.now();
    const confirmedAt = iso(now);
    const nextDue = iso(addDays(now, 30));
    this.confirmation = {
      status: "confirmed",
      confirmedAt,
      nextDue,
      actorUserId: this.claims.userId,
    };
    return {
      confirmedAt,
      nextDue,
      actorUserId: this.claims.userId,
    };
  }

  async updateContacts(input: UpdateContactsInput): Promise<ProfileProjection> {
    this.maybeFail();
    if (!canConfirmContacts(this.claims)) {
      throw new Phase3Error("forbidden", "This account cannot update responsible contacts.");
    }
    if (input.organizationId !== this.claims.organizationId) {
      throw new Phase3Error("forbidden", "Contact updates are limited to your organization.");
    }
    const problem = validateContacts(input.contacts);
    if (problem) {
      throw new Phase3Error("validation", problem);
    }
    this.contacts = structuredClone(input.contacts);
    return this.getProfileProjection("protected");
  }
}

let sharedMock: MockPhase3Client | null = null;

export function getSharedMockPhase3Client(): MockPhase3Client {
  if (!sharedMock) sharedMock = new MockPhase3Client();
  return sharedMock;
}

export function applySimulatedFailure(client: Phase3Client, enabled: boolean) {
  if (client instanceof MockPhase3Client) client.setFailNext(enabled);
}

export function applyUnverifiedOrganization(client: Phase3Client, enabled: boolean) {
  if (client instanceof MockPhase3Client) {
    client.setClaims({
      organizationVerificationState: enabled ? "unverified" : "verified",
    });
  }
}
