alter type public.notification_type add value if not exists 'profile_submitted';
alter type public.notification_type add value if not exists 'profile_resubmitted';

create or replace function public.notify_directory_history()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
    r record;
    nt public.notification_type;
    ttl text;
    msg text;
    send_email boolean;
begin
    if new.action in ('submitted', 'resubmitted') then
        nt := case new.action
            when 'submitted' then 'profile_submitted'::public.notification_type
            else 'profile_resubmitted'::public.notification_type
        end;
        ttl := case new.action
            when 'submitted' then 'Profile submitted for review'
            else 'Profile resubmitted for review'
        end;
        msg := case new.action
            when 'submitted' then 'A Directory profile is ready for administrator review.'
            else 'A corrected Directory profile is ready for administrator review.'
        end;
        for r in
            select distinct upr.user_id
            from public.user_platform_roles upr
            where upr.role = 'admin'::public.platform_role
        loop
            perform public.enqueue_user_notification(
                r.user_id, nt, 'profile', ttl, msg, 'directory_profile',
                new.profile_id, 'directory_profile_history', new.id, true
            );
        end loop;
        return new;
    end if;

    if new.action not in ('correction_requested','approved','rejected','suspended') then
        return new;
    end if;
    nt := case new.action
        when 'correction_requested' then 'profile_correction_requested'
        when 'approved' then 'profile_approved'
        when 'rejected' then 'profile_rejected'
        else 'profile_suspended'
    end;
    ttl := case new.action
        when 'correction_requested' then 'Profile correction requested'
        when 'approved' then 'Profile approved'
        when 'rejected' then 'Profile rejected'
        else 'Profile suspended'
    end;
    msg := case new.action
        when 'correction_requested' then 'Your Directory profile needs corrections.'
        when 'approved' then 'Your Directory profile was approved.'
        when 'rejected' then 'Your Directory profile was rejected.'
        else 'Your Directory profile was suspended.'
    end;
    send_email := new.action in ('correction_requested','approved','rejected');
    for r in
        select distinct om.user_id
        from public.organization_members om
        where om.organization_id = new.organization_id
          and om.status = 'active'
          and om.role in ('owner','admin')
    loop
        perform public.enqueue_user_notification(
            r.user_id, nt, 'profile', ttl, msg, 'directory_profile',
            new.profile_id, 'directory_profile_history', new.id, send_email
        );
    end loop;
    return new;
end;
$$;
