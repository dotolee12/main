-- Run in the existing Supabase project's SQL editor as the database owner.
-- No email address or legacy device-only ID is used as a public identity.
begin;

create table if not exists public.gpx_share_identities (
    user_id uuid primary key references auth.users(id) on delete cascade,
    handle text not null unique check (handle ~ '^[a-z0-9_-]{3,32}$'),
    created_at timestamptz not null default now()
);
create table if not exists public.gpx_transfers (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null,
    sender_id uuid not null references auth.users(id) on delete cascade,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    sender_handle text not null,
    route_name text not null check (char_length(route_name) between 1 and 120),
    gpx_content text not null check (octet_length(gpx_content) <= 1048576),
    point_count integer not null check (point_count between 2 and 100000),
    created_at timestamptz not null default now(),
    unique (sender_id, request_id),
    check (sender_id <> recipient_id)
);
create index if not exists gpx_transfers_inbox on public.gpx_transfers(recipient_id, created_at desc, id desc);
create index if not exists gpx_transfers_daily on public.gpx_transfers(sender_id, created_at);

alter table public.gpx_share_identities enable row level security;
alter table public.gpx_transfers enable row level security;
revoke all on public.gpx_share_identities, public.gpx_transfers from anon, authenticated;
grant select on public.gpx_transfers to authenticated;
drop policy if exists gpx_read_received on public.gpx_transfers;
create policy gpx_read_received on public.gpx_transfers for select to authenticated
    using (recipient_id = (select auth.uid()));
-- Identities have no direct access policy. All registration/lookup stays in RPC.

create or replace function public.gpx_my_identity() returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if auth.uid() is null then raise exception 'GPX_SIGN_IN_REQUIRED'; end if;
    return (select handle from public.gpx_share_identities where user_id = auth.uid());
end; $$;

create or replace function public.gpx_register_identity(p_handle text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := auth.uid();
    v_handle text := lower(btrim(p_handle));
    v_existing text;
begin
    if v_uid is null then raise exception 'GPX_SIGN_IN_REQUIRED'; end if;
    if v_handle is null or v_handle !~ '^[a-z0-9_-]{3,32}$' then raise exception 'GPX_INVALID_HANDLE'; end if;
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
    select handle into v_existing from public.gpx_share_identities where user_id = v_uid;
    if v_existing = v_handle then return v_existing; end if;
    if v_existing is not null then raise exception 'GPX_ALREADY_REGISTERED'; end if;
    begin
        insert into public.gpx_share_identities(user_id, handle) values(v_uid, v_handle);
    exception when unique_violation then raise exception 'GPX_HANDLE_TAKEN';
    end;
    return v_handle;
end; $$;

create or replace function public.gpx_send_route(
    p_request_id uuid, p_recipient_handle text, p_route_name text,
    p_gpx_content text, p_point_count integer
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := auth.uid();
    v_sender text;
    v_recipient uuid;
    v_previous public.gpx_transfers%rowtype;
    v_id uuid;
begin
    if v_uid is null then raise exception 'GPX_SIGN_IN_REQUIRED'; end if;
    if p_recipient_handle is null or p_recipient_handle !~ '^[a-z0-9_-]{3,32}$' then raise exception 'GPX_INVALID_HANDLE'; end if;
    if p_request_id is null or p_route_name is null or char_length(btrim(p_route_name)) not between 1 and 120
        or p_gpx_content is null or octet_length(p_gpx_content) not between 1 and 1048576
        or p_gpx_content ~* '<!(DOCTYPE|ENTITY)' or p_point_count is null or p_point_count not between 2 and 100000
    then raise exception 'GPX_INVALID'; end if;
    -- XML is never expanded on the server. The recipient validates GPX and
    -- coordinate ranges before displaying or downloading the document.
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
    select handle into v_sender from public.gpx_share_identities where user_id = v_uid;
    if v_sender is null then raise exception 'GPX_ID_REQUIRED'; end if;
    select user_id into v_recipient from public.gpx_share_identities where handle = p_recipient_handle;
    if v_recipient is null then raise exception 'GPX_RECIPIENT_NOT_FOUND'; end if;
    if v_recipient = v_uid then raise exception 'GPX_SELF'; end if;
    select * into v_previous from public.gpx_transfers where sender_id = v_uid and request_id = p_request_id;
    if found then
        if v_previous.recipient_id <> v_recipient or v_previous.gpx_content <> p_gpx_content
            or v_previous.route_name <> btrim(p_route_name) or v_previous.point_count <> p_point_count
        then raise exception 'GPX_INVALID'; end if;
        return v_previous.id;
    end if;
    if (select count(*) from public.gpx_transfers where sender_id = v_uid
        and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') >= 20
    then raise exception 'GPX_LIMIT'; end if;
    insert into public.gpx_transfers(request_id, sender_id, recipient_id, sender_handle, route_name, gpx_content, point_count)
    values(p_request_id, v_uid, v_recipient, v_sender, btrim(p_route_name), p_gpx_content, p_point_count)
    returning id into v_id;
    return v_id;
end; $$;

revoke all on function public.gpx_my_identity() from public, anon;
revoke all on function public.gpx_register_identity(text) from public, anon;
revoke all on function public.gpx_send_route(uuid,text,text,text,integer) from public, anon;
grant execute on function public.gpx_my_identity() to authenticated;
grant execute on function public.gpx_register_identity(text) to authenticated;
grant execute on function public.gpx_send_route(uuid,text,text,text,integer) to authenticated;
notify pgrst, 'reload schema';
commit;
