-- review_directory_profile returns a column named profile_id and also queries
-- directory_profile_versions.profile_id. Patch the existing authoritative
-- definition to qualify that single ambiguous update predicate.
do $migration$
declare
    function_definition text;
    old_fragment text := E'update public.directory_profile_versions\n        set is_published = false\n        where profile_id = target_profile.id';
    new_fragment text := E'update public.directory_profile_versions as versions\n        set is_published = false\n        where versions.profile_id = target_profile.id';
begin
    select pg_get_functiondef(
        'public.review_directory_profile(uuid,uuid,text,text)'::regprocedure
    ) into function_definition;

    if strpos(function_definition, old_fragment) = 0 then
        raise exception 'Expected directory review function fragment was not found.';
    end if;

    execute replace(function_definition, old_fragment, new_fragment);
end;
$migration$;
