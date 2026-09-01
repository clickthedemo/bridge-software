import {
  Phase3Error,
  type ConfirmContactsInput,
  type ConfirmContactsResult,
  type CreatePostInput,
  type Phase3Client,
  type Phase3ErrorCode,
  type ProfileProjection,
  type SessionClaims,
  type UpdateContactsInput,
  type UploadIntent,
  type PostRecord,
} from "./types.ts";

function mapStatus(status: number): Phase3ErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  return "unavailable";
}

function userMessageFor(code: Phase3ErrorCode): string {
  switch (code) {
    case "unauthenticated":
      return "Sign in to continue.";
    case "forbidden":
      return "This account does not have permission for that action.";
    case "validation":
      return "Check the highlighted fields and try again.";
    case "conflict":
      return "That record changed. Refresh and try again.";
    default:
      return "The request could not be completed. Your work is still here — try again.";
  }
}

export class HttpPhase3Client implements Phase3Client {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private endpoint(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.endpoint(path), {
        ...init,
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
    } catch (cause) {
      throw new Phase3Error("unavailable", userMessageFor("unavailable"), cause);
    }

    if (!response.ok) {
      const code = mapStatus(response.status);
      throw new Phase3Error(code, userMessageFor(code));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return (await response.json()) as T;
    } catch (cause) {
      throw new Phase3Error("unavailable", userMessageFor("unavailable"), cause);
    }
  }

  getSession() {
    return this.request<SessionClaims>(this.endpointPath.session);
  }

  createUploadIntent(file: File) {
    return this.request<UploadIntent>(this.endpointPath.uploads, {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
  }

  createPost(input: CreatePostInput) {
    return this.request<PostRecord>(this.endpointPath.posts, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listPosts() {
    return this.request<PostRecord[]>(this.endpointPath.posts);
  }

  getProfileProjection(view: "public" | "protected") {
    return this.request<ProfileProjection>(`${this.endpointPath.profile}?view=${view}`);
  }

  confirmContacts(input: ConfirmContactsInput) {
    return this.request<ConfirmContactsResult>(this.endpointPath.confirmContacts, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateContacts(input: UpdateContactsInput) {
    return this.request<ProfileProjection>(this.endpointPath.contacts, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  private readonly endpointPath = {
    session: "/api/v1/session",
    uploads: "/api/v1/uploads/intent",
    posts: "/api/v1/posts",
    profile: "/api/v1/profiles/current",
    confirmContacts: "/api/v1/contacts/confirm",
    contacts: "/api/v1/contacts",
  } as const;
}
