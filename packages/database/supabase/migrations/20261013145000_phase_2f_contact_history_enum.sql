begin;

do $$
declare definition text;
begin
    select pg_get_functiondef(
        'public.create_contact_request(text, uuid, text, text, text, integer, text, text, text)'::regprocedure
    ) into definition;
    definition := regexp_replace(
        definition,
        'case\s+when\s+recipient_user_id\s+is\s+null\s+then\s+''manual_assignment_needed''\s+else\s+''routed''\s+end',
        '(case when recipient_user_id is null then ''manual_assignment_needed'' else ''routed'' end)::public.contact_request_history_action',
        'i'
    );
    if lower(definition) not like '%end)::public.contact_request_history_action%' then
        raise exception 'Could not type the contact history action';
    end if;
    execute definition;
end;
$$;

commit;
