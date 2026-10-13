begin;

do $$
declare definition text;
begin
    select pg_get_functiondef(
        'public.create_contact_request(text, uuid, text, text, text, integer, text, text, text)'::regprocedure
    ) into definition;
    definition := regexp_replace(
        definition,
        'select\s+\*\s+into\s+existing\s+from\s+public\.contact_requests\s+where\s+sender_user_id\s*=\s*actor_id\s+and\s+idempotency_key\s*=\s*p_idempotency_key\s*;',
        'select cr.* into existing from public.contact_requests cr where cr.sender_user_id = actor_id and cr.idempotency_key = p_idempotency_key;',
        'i'
    );
    definition := regexp_replace(
        definition,
        'select\s+count\(\*\)\s+from\s+public\.contact_requests\s+where\s+sender_user_id\s*=\s*actor_id\s+and\s+created_at\s*>\s*event_time\s*-\s*interval\s+''10 minutes''',
        'select count(*) from public.contact_requests cr where cr.sender_user_id = actor_id and cr.created_at > event_time - interval ''10 minutes''',
        'i'
    );
    if lower(definition) not like '%cr.sender_user_id = actor_id and cr.idempotency_key = p_idempotency_key%'
       or lower(definition) not like '%cr.created_at > event_time - interval ''10 minutes''%' then
        raise exception 'Could not qualify contact request output-column references';
    end if;
    execute definition;
end;
$$;

commit;
