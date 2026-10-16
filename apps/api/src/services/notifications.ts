import { z } from "zod";
import { createAdminSupabaseClient, createUserScopedSupabaseClient } from "../lib/supabase.js";
import type { NotificationListQuery, NotificationPreferencesInput } from "../schemas/notifications.js";
import { presentNotification, type NotificationResourceContext } from "./notification-content.js";

const notificationRow = z.object({ id:z.uuid(),type:z.string(),category:z.string(),title:z.string(),body:z.string(),resource_type:z.string().nullable(),resource_id:z.uuid().nullable(),source_event_id:z.uuid(),created_at:z.string(),read_at:z.string().nullable() });
const preferenceRow = z.object({ profile_in_app:z.boolean(),profile_email:z.boolean(),contact_in_app:z.boolean(),contact_email:z.boolean(),verification_in_app:z.boolean(),verification_email:z.boolean() });
export class NotificationServiceError extends Error { constructor(public readonly code:"NOTIFICATION_NOT_FOUND"|"NOTIFICATION_FAILED"){super(code);this.name="NotificationServiceError";} }
export const defaultPreferences = { profile:{inApp:true,email:true},contact:{inApp:true,email:true},verification:{inApp:true,email:true} };

type Row = z.infer<typeof notificationRow>;
const relation = (value: unknown): Record<string, unknown> => Array.isArray(value) ? (value[0] as Record<string, unknown> | undefined) ?? {} : value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;

async function resolveContexts(rows: Row[]) {
    const admin = createAdminSupabaseClient();
    const resourceIds = (kind: string) => rows.filter((row) => row.resource_type === kind && row.resource_id).map((row) => row.resource_id as string);
    const profileIds = resourceIds("directory_profile"), contactIds = resourceIds("contact_request"), verificationIds = resourceIds("verification_item");
    const historyIds = rows.filter((row) => row.resource_type === "directory_profile").map((row) => row.source_event_id);
    const [profiles, contacts, verifications, histories] = await Promise.all([
        profileIds.length ? admin.from("directory_profiles").select("id,display_name,slug,organization_id,organizations(name)").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
        contactIds.length ? admin.from("contact_requests").select("id,first_name,target_display_name,target_organization_id").in("id", contactIds) : Promise.resolve({ data: [], error: null }),
        verificationIds.length ? admin.from("verification_items").select("id,item_type,verification_cases(organization_id,organizations(name),businesses(legal_name,dba_name))").in("id", verificationIds) : Promise.resolve({ data: [], error: null }),
        historyIds.length ? admin.from("directory_profile_history").select("id,reason").in("id", historyIds) : Promise.resolve({ data: [], error: null })
    ]);
    if (profiles.error || contacts.error || verifications.error || histories.error) throw new NotificationServiceError("NOTIFICATION_FAILED");
    const reasons = new Map((histories.data ?? []).map((row) => [String(row.id), text(row.reason)]));
    const contexts = new Map<string, NotificationResourceContext>();
    for (const row of profiles.data ?? []) { const organization=relation(row.organizations); contexts.set(String(row.id),{displayName:text(row.display_name),organizationName:text(organization.name),recordType:"Directory profile",slug:text(row.slug)}); }
    for (const row of contacts.data ?? []) contexts.set(String(row.id),{displayName:text(row.first_name),organizationName:text(row.target_display_name),recordType:"Contact request"});
    for (const row of verifications.data ?? []) { const verificationCase=relation(row.verification_cases),organization=relation(verificationCase.organizations),business=relation(verificationCase.businesses); contexts.set(String(row.id),{displayName:text(business.dba_name)??text(business.legal_name)??text(organization.name),organizationName:text(organization.name),recordType:text(row.item_type)?.toUpperCase()}); }
    return { contexts, reasons };
}

export const listNotifications=async(token:string,q:NotificationListQuery)=>{let query=createUserScopedSupabaseClient(token).from("notifications").select("id,type,category,title,body,resource_type,resource_id,source_event_id,created_at,read_at").order("created_at",{ascending:false}).order("id",{ascending:false}).range(q.offset,q.offset+q.limit);if(q.unreadOnly)query=query.is("read_at",null);const{data,error}=await query;if(error)throw new NotificationServiceError("NOTIFICATION_FAILED");const p=z.array(notificationRow).safeParse(data??[]);if(!p.success)throw new NotificationServiceError("NOTIFICATION_FAILED");const visible=p.data.slice(0,q.limit),{contexts,reasons}=await resolveContexts(visible);const hasMore=p.data.length>q.limit;return{notifications:visible.map(n=>{const base={id:n.id,type:n.type,category:n.category,title:n.title,body:n.body,resourceType:n.resource_type,resourceId:n.resource_id,createdAt:n.created_at,readAt:n.read_at};const context=n.resource_id?contexts.get(n.resource_id)??null:null;if(context)context.reason=reasons.get(n.source_event_id);return{...base,...presentNotification(base,context)};}),pageInfo:{limit:q.limit,offset:q.offset,hasMore}};};
export const markNotificationRead=async(token:string,id:string)=>{const{error}=await createUserScopedSupabaseClient(token).rpc("mark_notification_read",{p_notification_id:id});if(error){if(error.code==="P0002")throw new NotificationServiceError("NOTIFICATION_NOT_FOUND");throw new NotificationServiceError("NOTIFICATION_FAILED");}return{success:true};};
export const markAllNotificationsRead=async(token:string)=>{const{data,error}=await createUserScopedSupabaseClient(token).rpc("mark_all_notifications_read");if(error)throw new NotificationServiceError("NOTIFICATION_FAILED");return{updatedCount:typeof data==="number"?data:0};};
export const getNotificationPreferences=async(token:string)=>{const{data,error}=await createUserScopedSupabaseClient(token).from("notification_preferences").select("profile_in_app,profile_email,contact_in_app,contact_email,verification_in_app,verification_email").maybeSingle();if(error)throw new NotificationServiceError("NOTIFICATION_FAILED");if(!data)return defaultPreferences;const p=preferenceRow.safeParse(data);if(!p.success)throw new NotificationServiceError("NOTIFICATION_FAILED");return{profile:{inApp:p.data.profile_in_app,email:p.data.profile_email},contact:{inApp:p.data.contact_in_app,email:p.data.contact_email},verification:{inApp:p.data.verification_in_app,email:p.data.verification_email}};};
export const putNotificationPreferences=async(token:string,p:NotificationPreferencesInput)=>{const{error}=await createUserScopedSupabaseClient(token).rpc("upsert_notification_preferences",{p_profile_in_app:p.profile.inApp,p_profile_email:p.profile.email,p_contact_in_app:p.contact.inApp,p_contact_email:p.contact.email,p_verification_in_app:p.verification.inApp,p_verification_email:p.verification.email});if(error)throw new NotificationServiceError("NOTIFICATION_FAILED");return p;};
