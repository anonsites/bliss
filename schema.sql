-- BLISS V2 DATABASE SCHEMA
-- PostgreSQL / Supabase-compatible

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- USERS (PRIVATE AUTH DATA)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  email_alias text not null unique,
  is_verified boolean not null default false,
  phone_verified_at timestamptz,
  role text not null default 'user' check (role in ('user', 'admin', 'moderator')),
  profile_completed_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (phone_number is null or phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- AUTH SESSIONS (HTTP-ONLY COOKIE BACKING STORE)
create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_token text not null unique,
  ip_address text,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_sessions_user_id_idx
  on public.auth_sessions (user_id);

create index if not exists auth_sessions_expires_at_idx
  on public.auth_sessions (expires_at);

-- PROFILES (PUBLIC USER DATA)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  username text not null,
  gender text not null check (gender in ('male', 'female')),
  birthdate date not null,
  bio text,
  avatar_url text not null,
  is_active boolean not null default true,
  is_profile_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop index if exists profiles_username_lower_key;

create index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create index if not exists profiles_is_active_gender_idx
  on public.profiles (is_active, gender, user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- USER LOCATION (CURRENT GPS POSITION)
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_meters integer,
  ip_city text,
  updated_at timestamptz not null default timezone('utc', now())
);


create index if not exists user_locations_latitude_longitude_idx
  on public.user_locations (latitude, longitude);

create index if not exists user_locations_ip_city_idx
  on public.user_locations (lower(ip_city))
  where ip_city is not null;

drop trigger if exists user_locations_set_updated_at on public.user_locations;
create trigger user_locations_set_updated_at
before update on public.user_locations
for each row
execute function public.set_updated_at();

-- USER MEDIA (PROFILE GALLERY IMAGES ONLY)
create table if not exists public.user_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image' check (media_type = 'image'),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, sort_order)
);

create index if not exists user_media_user_id_idx
  on public.user_media (user_id, sort_order);

-- DROPS (24H STORIES)
create table if not exists public.drops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image',
  caption text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours')
);

alter table if exists public.drops
  add column if not exists media_type text not null default 'image';

alter table if exists public.drops
  drop constraint if exists drops_media_type_check;

alter table if exists public.drops
  add constraint drops_media_type_check
  check (media_type in ('image', 'video'));

create index if not exists drops_user_id_expires_at_idx
  on public.drops (user_id, expires_at desc);

create index if not exists drops_expires_at_idx
  on public.drops (expires_at);

-- WISHLIST (LIKED/SAVED USERS FOR FUTURE INTERACTION)
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, target_user_id)
);

-- CHAT THREADS
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz,
  last_message_content text,
  last_message_sender_id uuid references public.users(id) on delete set null
);

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row
execute function public.set_updated_at();

-- CHAT PARTICIPANTS
create table if not exists public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (chat_id, user_id)
);

create index if not exists chat_participants_user_id_idx
  on public.chat_participants (user_id);

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text,
  media_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  delivered_at timestamptz,
  read_at timestamptz
);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at desc);

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

create or replace function public.update_chat_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set
    last_message_at = new.created_at,
    last_message_content = coalesce(new.content, '📷 Photo'),
    last_message_sender_id = new.sender_id,
    updated_at = timezone('utc', now())
  where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
after insert on public.messages
for each row
execute function public.update_chat_last_message();

-- PROFILE VIEWS
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.users(id) on delete cascade,
  viewed_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

-- DROP VIEWS
create table if not exists public.drop_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  drop_id uuid not null references public.drops(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, drop_id)
);

create index if not exists drop_views_created_at_idx
  on public.drop_views (created_at);

-- BLOCKED USERS
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, blocked_user_id)
);

-- HIDDEN CONTACTS
create table if not exists public.hidden_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_phone_number text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, target_phone_number),
  check (target_phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

create index if not exists hidden_contacts_user_id_target_phone_number_idx
  on public.hidden_contacts (user_id, target_phone_number);

-- SUBSCRIPTION PLANS
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chat_open_limit integer,
  is_unlimited boolean not null default false,
  price numeric,
  duration_days integer
);

-- USER SUBSCRIPTIONS
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean not null default true
);

create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id, is_active);

-- USER SETTINGS
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  hide_from_contacts boolean not null default false,
  ghost_mode boolean not null default false,
  push_notifications boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_settings_user_id_idx
  on public.user_settings (user_id);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

-- FEATURES USAGE TRACKING (FOR SUBSCRIPTION LIMITS)
create table if not exists public.features_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  chats_opened integer not null default 0 check (chats_opened >= 0),
  messages_count integer not null default 0 check (messages_count >= 0),
  period_start date not null
);

create unique index if not exists features_usage_user_id_period_start_key
  on public.features_usage (user_id, period_start);

-- REPORTS
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id),
  reported_user_id uuid not null references public.users(id),
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  chat_id uuid,
  target_user_id uuid,
  target_username text,
  target_avatar_url text,
  count integer,
  is_read boolean not null default false,
  metadata jsonb,
  reference_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_type on public.notifications(type);

-- Optimization for orphaned notification cleanup
create index if not exists notifications_reference_id_drop_view_idx
  on public.notifications (reference_id)
  where (type = 'drop_view');

-- RADAR (10KM / DIFFERENT-GENDER DISCOVERY)
create or replace function public.get_radar_profiles(
  p_user_id uuid,
  p_radius_km double precision default 10
)
returns table (
  profile_id uuid,
  user_id uuid,
  username text,
  birthdate date,
  avatar_url text,
  is_profile_verified boolean,
  profile_updated_at timestamptz,
  location_updated_at timestamptz,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with requester as (
    select
      profile.gender,
      location.latitude,
      location.longitude
    from public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id = p_user_id
      and profile.is_active = true
    limit 1
  ),
  candidates as (
    select
      profile.id as profile_id,
      profile.user_id,
      profile.username,
      profile.birthdate,
      profile.avatar_url,
      profile.is_profile_verified,
      profile.updated_at as profile_updated_at,
      location.updated_at as location_updated_at,
      2 * 6371 * asin(
        least(
          1::double precision,
          sqrt(
            power(sin(radians((location.latitude - requester.latitude) / 2)), 2) +
            cos(radians(requester.latitude)) *
            cos(radians(location.latitude)) *
            power(sin(radians((location.longitude - requester.longitude) / 2)), 2)
          )
        )
      ) as distance_km
    from requester
    cross join public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id <> p_user_id
      and profile.is_active = true
      and profile.gender <> requester.gender
      and location.latitude between requester.latitude - (p_radius_km / 111.045)
        and requester.latitude + (p_radius_km / 111.045)
      and location.longitude between requester.longitude - (
        p_radius_km / greatest(111.045 * abs(cos(radians(requester.latitude))), 1)
      )
        and requester.longitude + (
          p_radius_km / greatest(111.045 * abs(cos(radians(requester.latitude))), 1)
        )
      and not exists (
        select 1
        from public.blocks as block_pair
        where (block_pair.user_id = p_user_id and block_pair.blocked_user_id = profile.user_id)
          or (block_pair.user_id = profile.user_id and block_pair.blocked_user_id = p_user_id)
      )
  )
  select
    candidates.profile_id,
    candidates.user_id,
    candidates.username,
    candidates.birthdate,
    candidates.avatar_url,
    candidates.is_profile_verified,
    candidates.profile_updated_at,
    candidates.location_updated_at,
    candidates.distance_km
  from candidates
  where candidates.distance_km <= greatest(p_radius_km, 0)
  order by
    candidates.distance_km asc,
    candidates.location_updated_at desc nulls last,
    candidates.profile_updated_at desc nulls last;
$$;

-- DROPS FEED (NEARBY FIRST)
create or replace function public.get_drops_feed_profiles(
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  profile_id uuid,
  user_id uuid,
  username text,
  birthdate date,
  avatar_url text,
  is_profile_verified boolean,
  profile_updated_at timestamptz,
  location_updated_at timestamptz,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with requester as (
    select
      profile.gender,
      location.latitude,
      location.longitude
    from public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id = p_user_id
      and profile.is_active = true
    limit 1
  ),
  candidates as (
    select
      profile.id as profile_id,
      profile.user_id,
      profile.username,
      profile.birthdate,
      profile.avatar_url,
      profile.is_profile_verified,
      profile.updated_at as profile_updated_at,
      location.updated_at as location_updated_at,
      2 * 6371 * asin(
        least(
          1::double precision,
          sqrt(
            power(sin(radians((location.latitude - requester.latitude) / 2)), 2) +
            cos(radians(requester.latitude)) *
            cos(radians(location.latitude)) *
            power(sin(radians((location.longitude - requester.longitude) / 2)), 2)
          )
        )
      ) as distance_km
    from requester
    cross join public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id <> p_user_id
      and profile.is_active = true
      and profile.gender <> requester.gender
      and exists (
        select 1
        from public.drops d
        where d.user_id = profile.user_id and d.expires_at > timezone('utc', now())
      )
      and not exists (
        select 1
        from public.blocks as block_pair
        where (block_pair.user_id = p_user_id and block_pair.blocked_user_id = profile.user_id)
          or (block_pair.user_id = profile.user_id and block_pair.blocked_user_id = p_user_id)
      )
  )
  select
    candidates.profile_id,
    candidates.user_id,
    candidates.username,
    candidates.birthdate,
    candidates.avatar_url,
    candidates.is_profile_verified,
    candidates.profile_updated_at,
    candidates.location_updated_at,
    candidates.distance_km
  from candidates
  order by
    candidates.distance_km asc,
    candidates.location_updated_at desc nulls last,
    candidates.profile_updated_at desc nulls last
  limit p_limit;
$$;

-- EXPLORE (CITY-BASED DISCOVERY)
create or replace function public.get_explore_profiles(
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  profile_id uuid,
  user_id uuid,
  username text,
  birthdate date,
  avatar_url text,
  is_profile_verified boolean,
  profile_updated_at timestamptz,
  location_updated_at timestamptz,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with requester as (
    select
      profile.gender,
      location.ip_city,
      location.latitude,
      location.longitude
    from public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id = p_user_id
      and profile.is_active = true
    limit 1
  ),
  candidates as (
    select
      profile.id as profile_id,
      profile.user_id,
      profile.username,
      profile.birthdate,
      profile.avatar_url,
      profile.is_profile_verified,
      profile.updated_at as profile_updated_at,
      location.updated_at as location_updated_at,
      case
        when requester.latitude is not null and requester.longitude is not null and location.latitude is not null and location.longitude is not null then
          2 * 6371 * asin(least(1::double precision, sqrt(power(sin(radians((location.latitude - requester.latitude) / 2)), 2) + cos(radians(requester.latitude)) * cos(radians(location.latitude)) * power(sin(radians((location.longitude - requester.longitude) / 2)), 2))))
        else null
      end as distance_km
    from requester
    cross join public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id <> p_user_id
      and profile.is_active = true
      and profile.gender <> requester.gender
      and lower(location.ip_city) = lower(requester.ip_city)
      and not exists (
        select 1
        from public.blocks as block_pair
        where (block_pair.user_id = p_user_id and block_pair.blocked_user_id = profile.user_id)
          or (block_pair.user_id = profile.user_id and block_pair.blocked_user_id = p_user_id)
      )
  )
  select
    candidates.profile_id,
    candidates.user_id,
    candidates.username,
    candidates.birthdate,
    candidates.avatar_url,
    candidates.is_profile_verified,
    candidates.profile_updated_at,
    candidates.location_updated_at,
    candidates.distance_km
  from candidates
  order by
    candidates.location_updated_at desc nulls last,
    candidates.profile_updated_at desc nulls last
  limit p_limit;
$$;

-- SEARCH PROFILES BY CITY (MANUAL TEXT SEARCH)
create or replace function public.search_profiles_by_city(
  p_city text,
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  profile_id uuid,
  user_id uuid,
  username text,
  birthdate date,
  avatar_url text,
  is_profile_verified boolean,
  profile_updated_at timestamptz,
  location_updated_at timestamptz,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with requester as (
    select
      profile.gender,
      location.latitude,
      location.longitude
    from public.profiles as profile
    join public.user_locations as location
      on location.user_id = profile.user_id
    where profile.user_id = p_user_id
      and profile.is_active = true
    limit 1
  )
  select
    profile.id as profile_id,
    profile.user_id,
    profile.username,
    profile.birthdate,
    profile.avatar_url,
    profile.is_profile_verified,
    profile.updated_at as profile_updated_at,
    location.updated_at as location_updated_at,
    case
      when requester.latitude is not null and requester.longitude is not null and location.latitude is not null and location.longitude is not null then
        2 * 6371 * asin(least(1::double precision, sqrt(power(sin(radians((location.latitude - requester.latitude) / 2)), 2) + cos(radians(requester.latitude)) * cos(radians(location.latitude)) * power(sin(radians((location.longitude - requester.longitude) / 2)), 2))))
      else null
    end as distance_km
  from requester
  cross join public.profiles as profile
  join public.user_locations as location
    on location.user_id = profile.user_id
  where profile.user_id <> p_user_id
    and profile.is_active = true
    and profile.gender <> requester.gender
    and lower(location.ip_city) like ('%' || lower(p_city) || '%')
    and not exists (
      select 1
      from public.blocks as block_pair
      where (block_pair.user_id = p_user_id and block_pair.blocked_user_id = profile.user_id)
        or (block_pair.user_id = profile.user_id and block_pair.blocked_user_id = p_user_id)
    )
  order by
    location.updated_at desc nulls last,
    profile.updated_at desc nulls last
  limit p_limit;
$$;

-- HOME FEED CANDIDATES (UNAUTHENTICATED)
create or replace function public.get_home_feed_candidates(
  p_latitude double precision,
  p_longitude double precision,
  p_limit integer default 48,
  p_radius_km double precision default 250 -- Start with a wider radius for previews
)
returns table (
  id uuid,
  user_id uuid,
  username text,
  birthdate date,
  avatar_url text,
  is_profile_verified boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    p.username,
    p.birthdate,
    p.avatar_url,
    p.is_profile_verified,
    p.created_at,
    p.updated_at
  from public.profiles as p
  join public.user_locations as loc
    on loc.user_id = p.user_id
  where p.is_active = true
    -- Bounding box check for performance
    and loc.latitude between p_latitude - (p_radius_km / 111.045)
      and p_latitude + (p_radius_km / 111.045)
    and loc.longitude between p_longitude - (
      p_radius_km / greatest(111.045 * abs(cos(radians(p_latitude))), 1)
    )
      and p_longitude + (
        p_radius_km / greatest(111.045 * abs(cos(radians(p_latitude))), 1)
      )
    -- More precise distance check
    and (
      2 * 6371 * asin(least(1::double precision, sqrt(power(sin(radians((loc.latitude - p_latitude) / 2)), 2) + cos(radians(p_latitude)) * cos(radians(loc.latitude)) * power(sin(radians((loc.longitude - p_longitude) / 2)), 2))))
    ) <= p_radius_km
  order by
    -- Prioritize most recently active users within the radius
    loc.updated_at desc nulls last,
    p.updated_at desc nulls last
  limit p_limit;
$$;

-- CHAT ELIGIBILITY (10KM ONLY)
create or replace function public.can_open_chat_between_users(
  p_user_id uuid,
  p_target_user_id uuid,
  p_radius_km double precision default 10
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with pair as (
    select
      requester_profile.is_active as requester_active,
      target_profile.is_active as target_active,
      2 * 6371 * asin(
        least(
          1::double precision,
          sqrt(
            power(sin(radians((target_location.latitude - requester_location.latitude) / 2)), 2) +
            cos(radians(requester_location.latitude)) *
            cos(radians(target_location.latitude)) *
            power(sin(radians((target_location.longitude - requester_location.longitude) / 2)), 2)
          )
        )
      ) as distance_km
    from public.profiles as requester_profile
    join public.user_locations as requester_location
      on requester_location.user_id = requester_profile.user_id
    join public.profiles as target_profile
      on target_profile.user_id = p_target_user_id
    join public.user_locations as target_location
      on target_location.user_id = target_profile.user_id
    where requester_profile.user_id = p_user_id
  )
  select exists (
    select 1
    from pair
    where p_user_id <> p_target_user_id
      and requester_active = true
      and target_active = true
      and distance_km <= greatest(p_radius_km, 0)
      and not exists (
        select 1
        from public.blocks as block_pair
        where (block_pair.user_id = p_user_id and block_pair.blocked_user_id = p_target_user_id)
          or (block_pair.user_id = p_target_user_id and block_pair.blocked_user_id = p_user_id)
      )
  );
$$;

-- SYNC SUPABASE AUTH TO PUBLIC USERS
-- Handle New User (Insert into public tables)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email_alias, phone_number, is_verified)
  values (
    new.id,
    coalesce(new.email, 'user-' || new.id || '@placeholder.com'),
    new.phone,
    new.email_confirmed_at is not null or new.phone_confirmed_at is not null
  )
  on conflict (id) do update
  set
    email_alias = excluded.email_alias,
    phone_number = excluded.phone_number,
    is_verified = excluded.is_verified;

  -- Create a basic profile if one doesn't exist
  insert into public.profiles (user_id, username, gender, birthdate, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'gender', 'male'),
    coalesce((new.raw_user_meta_data->>'birthdate')::date, '2000-01-01'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Handle Deleted User (Remove from public tables)
create or replace function public.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

-- Create Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();

-- AUTOMATIC NOTIFICATIONS FOR VIEWS
create or replace function public.notify_on_view()
returns trigger
language plpgsql
security definer
as $$
declare
  target_uid uuid;
  viewer_uid uuid;
  notify_type text;
  v_username text;
  v_avatar text;
begin
  if tg_table_name = 'profile_views' then
    target_uid := new.viewed_user_id;
    viewer_uid := new.viewer_id;
    notify_type := 'profile_view';
  elsif tg_table_name = 'drop_views' then
    -- For drops, we need to find the owner of the drop
    select user_id into target_uid from public.drops where id = new.drop_id;
    viewer_uid := new.user_id;
    notify_type := 'drop_view';
  elsif tg_table_name = 'wishlist' then
    target_uid := new.target_user_id;
    viewer_uid := new.user_id;
    notify_type := 'wishlist_add';
  end if;

  -- Fetch profile details of the person who triggered the view
  select username, avatar_url into v_username, v_avatar
  from public.profiles where user_id = viewer_uid;

  -- Avoid self-notifications
  if target_uid is not null and target_uid != viewer_uid then
    insert into public.notifications (
      user_id, 
      type, 
      reference_id, 
      title, 
      content,
      target_user_id,
      target_username,
      target_avatar_url
    )
    values (
      target_uid,
      notify_type,
      new.id,
      case 
        when notify_type = 'profile_view' then 'Profile Viewed' 
        when notify_type = 'drop_view' then 'Drop Viewed'
        else 'Added to Wishlist'
      end,
      case 
        when notify_type = 'profile_view' then coalesce(v_username, 'Someone') || ' viewed your profile' 
        when notify_type = 'drop_view' then coalesce(v_username, 'Someone') || ' viewed your drop' 
        else coalesce(v_username, 'Someone') || ' added you to their wishlist'
      end,
      viewer_uid,
      v_username,
      v_avatar
    );
  end if;

  return new;
end;
$$;

-- Triggers for Notifications
drop trigger if exists on_profile_view_created on public.profile_views;
create trigger on_profile_view_created
  after insert on public.profile_views
  for each row execute function public.notify_on_view();

drop trigger if exists on_drop_view_created on public.drop_views;
create trigger on_drop_view_created
  after insert on public.drop_views
  for each row execute function public.notify_on_view();

drop trigger if exists on_wishlist_created on public.wishlist;
create trigger on_wishlist_created
  after insert on public.wishlist
  for each row execute function public.notify_on_view();

-- AUTOMATIC NOTIFICATIONS FOR CHAT STARTED
create or replace function public.notify_on_chat_created()
returns trigger
language plpgsql
security definer
as $$
declare
  initiator_uid uuid;
  recipient_uid uuid;
  initiator_username text;
  initiator_avatar text;
begin
  -- Find the two participants of the newly created chat.
  -- We assume the first participant inserted (based on joined_at) is the initiator.
  select user_id into initiator_uid
  from public.chat_participants
  where chat_id = new.id
  order by joined_at asc
  limit 1;

  select user_id into recipient_uid
  from public.chat_participants
  where chat_id = new.id
    and user_id != initiator_uid
  limit 1;

  -- Fetch initiator's profile details
  select username, avatar_url into initiator_username, initiator_avatar
  from public.profiles where user_id = initiator_uid;

  -- Send notification to the recipient (the user who did NOT initiate the chat)
  if recipient_uid is not null and initiator_uid is not null then
    insert into public.notifications (user_id, type, reference_id, title, content, target_user_id, target_username, target_avatar_url)
    values (recipient_uid, 'chat_started', new.id, 'Chat Started', coalesce(initiator_username, 'Someone') || ' started a chat with you', initiator_uid, initiator_username, initiator_avatar);
  end if;

  return new;
end;
$$;

drop trigger if exists on_chat_created on public.chats;
create trigger on_chat_created
  after insert on public.chats
  for each row execute function public.notify_on_chat_created();

-- AUTOMATIC CLEANUP POLICY
-- This function handles the periodic removal of expired content and view history.
create or replace function public.execute_maintenance_cleanup()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Remove drops that have passed their expiration time.
  -- Because drop_views has 'on delete cascade', this automatically cleans up views for expired drops.
  delete from public.drops 
  where expires_at < timezone('utc', now());

  -- 2. Explicitly remove any remaining drop_views older than 24 hours.
  -- This ensures that even if a drop has a custom longer expiration, the view record is pruned.
  delete from public.drop_views 
  where created_at < (timezone('utc', now()) - interval '24 hours');

  -- 3. Cleanup orphaned notifications.
  -- Since reference_id is polymorphic, we handle the "cascade" manually here.
  delete from public.notifications
  where type = 'drop_view'
  and not exists (select 1 from public.drop_views where id = reference_id);
end;
$$;


-- SCHEDULING THE CLEANUP:
-- To run this automatically every hour, (requires the pg_cron extension):
  create extension if not exists pg_cron;
  select cron.schedule('hourly-cleanup-job', '0 * * * *', 'select public.execute_maintenance_cleanup()');
