export const contentTypes = ["Promotion", "Update", "Event"] as const;
export type ContentType = (typeof contentTypes)[number];

export const audienceIds = ["adults", "retailers", "industry"] as const;
export type AudienceId = (typeof audienceIds)[number];

export type MembershipStatus = "none" | "pending" | "active" | "suspended";
export type OrganizationVerificationState =
  | "unverified"
  | "pending"
  | "verified"
  | "changes_requested"
  | "rejected";
export type BridgeRole = "brand" | "dispensary" | "retailer" | "sales_rep" | "admin";
export type DelegatedPermission =
  | "create_promotion"
  | "create_update"
  | "view_protected_profile"
  | "confirm_contacts";

export type SessionClaims = {
  userId: string;
  ageEligible: boolean;
  membershipStatus: MembershipStatus;
  organizationId: string | null;
  organizationVerificationState: OrganizationVerificationState;
  role: BridgeRole | null;
  delegatedPermissions: DelegatedPermission[];
  stateLicenseEligibility: string[];
  adminScope: boolean;
};

export type UploadIntent = {
  uploadId: string;
  status: "accepted" | "processing" | "rejected";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type PostRecord = {
  postId: string;
  contentType: ContentType;
  message: string;
  uploadId: string | null;
  audienceIds: AudienceId[];
  protectedDetail: boolean;
  moderationState: "draft" | "published";
  createdAt: string;
};

export type ResponsibleContact = {
  kind: "sales" | "accounting";
  name: string;
  email: string;
  phone: string;
};

export type ProfileProjection = {
  view: "public" | "protected";
  organizationId: string;
  displayName: string;
  roleLabel: string;
  location: string;
  publicDescription: string;
  tags: string[];
  verificationState: OrganizationVerificationState;
  contacts: ResponsibleContact[];
  confirmation: {
    status: "needed" | "confirmed";
    confirmedAt: string | null;
    nextDue: string;
    actorUserId: string | null;
  };
};

export type ConfirmContactsInput = {
  organizationId: string;
};

export type ConfirmContactsResult = {
  confirmedAt: string;
  nextDue: string;
  actorUserId: string;
};

export type UpdateContactsInput = {
  organizationId: string;
  contacts: ResponsibleContact[];
};

export type CreatePostInput = {
  contentType: ContentType;
  message: string;
  uploadId: string | null;
  audienceIds: AudienceId[];
  protectedDetail: boolean;
};

export type Phase3ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "validation"
  | "conflict"
  | "unavailable";

export class Phase3Error extends Error {
  readonly code: Phase3ErrorCode;
  readonly userMessage: string;

  constructor(code: Phase3ErrorCode, userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "Phase3Error";
    this.code = code;
    this.userMessage = userMessage;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export type Phase3Client = {
  getSession(): Promise<SessionClaims>;
  createUploadIntent(file: File): Promise<UploadIntent>;
  createPost(input: CreatePostInput): Promise<PostRecord>;
  listPosts(): Promise<PostRecord[]>;
  getProfileProjection(view: "public" | "protected"): Promise<ProfileProjection>;
  confirmContacts(input: ConfirmContactsInput): Promise<ConfirmContactsResult>;
  updateContacts(input: UpdateContactsInput): Promise<ProfileProjection>;
};
