export type NotificationResourceContext = {
    displayName?: string | undefined;
    organizationName?: string | undefined;
    recordType?: string | undefined;
    reason?: string | undefined;
    slug?: string | undefined;
};

export type NotificationPresentation = {
    title: string;
    body: string;
    context: NotificationResourceContext | null;
    action: { label: string; href: string } | null;
    available: boolean;
};

type NotificationInput = { type: string; title: string; body: string; resourceType: string | null; resourceId: string | null };
const possessive = (name: string) => name.endsWith("s") ? `${name}'` : `${name}’s`;

export function presentNotification(notification: NotificationInput, context: NotificationResourceContext | null): NotificationPresentation {
    const id = notification.resourceId;
    if (!id || !context?.displayName) return { title: notification.title, body: "This record is no longer available", context: null, action: null, available: false };
    const name = context.displayName, reason = context.reason?.trim(), reasonText = reason ? ` Reason: ${reason}` : "";
    const adminProfile = `/admin/directory-profiles?profileId=${encodeURIComponent(id)}#profile-${encodeURIComponent(id)}`;
    const editor = `/my-profile?profileId=${encodeURIComponent(id)}`;
    switch (notification.type) {
        case "profile_submitted": return { title: "Directory profile submitted", body: `${name} submitted its Directory profile for review.`, context, action: { label: "Review profile", href: adminProfile }, available: true };
        case "profile_resubmitted": return { title: "Directory profile resubmitted", body: `${name} resubmitted its corrected Directory profile.${reasonText}`, context, action: { label: "Review changes", href: adminProfile }, available: true };
        case "profile_correction_requested": return { title: "Directory profile corrections requested", body: `An administrator requested corrections for ${name}.${reasonText}`, context, action: { label: "Edit profile", href: editor }, available: true };
        case "profile_approved": return { title: "Directory profile approved", body: `${possessive(name)} Directory profile was approved.`, context, action: { label: "View public profile", href: context.slug ? `/profile/${encodeURIComponent(context.slug)}` : editor }, available: true };
        case "profile_rejected": return { title: "Directory profile rejected", body: `${possessive(name)} Directory profile was rejected.${reasonText}`, context, action: { label: "View profile", href: editor }, available: true };
        case "profile_suspended": return { title: "Directory profile suspended", body: `${possessive(name)} Directory profile was suspended.${reasonText}`, context, action: { label: "View profile", href: editor }, available: true };
        case "contact_request_received": return { title: "New contact request", body: `${name} sent a contact request regarding ${context.organizationName ?? "your organization"}.`, context, action: { label: "Open request", href: `/requests?requestId=${encodeURIComponent(id)}#request-${encodeURIComponent(id)}` }, available: true };
        case "contact_request_responded":
        case "contact_request_closed": return { title: notification.title, body: `${context.organizationName ?? name} ${notification.type.endsWith("responded") ? "responded to" : "closed"} your contact request.`, context, action: { label: "Open request", href: `/requests/sent?requestId=${encodeURIComponent(id)}#request-${encodeURIComponent(id)}` }, available: true };
        case "membership_added": return { title: "Organization membership updated", body: `${name} was added to ${context.organizationName ?? "the organization"} as ${context.recordType ?? "a member"}.`, context, action: { label: "Manage members", href: `/my-profile?organizationId=${encodeURIComponent(id)}` }, available: true };
        case "ein_verified": return { title: "EIN verified", body: `${possessive(name)} EIN verification was approved.`, context, action: { label: "View profile", href: editor }, available: true };
        case "ein_failed": return { title: "EIN verification rejected", body: `${possessive(name)} EIN verification was rejected.${reasonText}`, context, action: { label: "View profile", href: editor }, available: true };
        case "ein_correction_required": return { title: "EIN corrections requested", body: `An administrator requested EIN corrections for ${name}.${reasonText}`, context, action: { label: "View profile", href: editor }, available: true };
        default:
            if (notification.resourceType === "verification_item") return { title: "Verification review", body: `${possessive(name)} ${context.recordType ?? "verification"} is ready for review.`, context, action: { label: "Review verification", href: `/admin/verification?verificationId=${encodeURIComponent(id)}#verification-${encodeURIComponent(id)}` }, available: true };
            return { title: notification.title, body: notification.body, context, action: null, available: true };
    }
}
