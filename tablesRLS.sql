-- ROW LEVEL SECURITY (RLS) POLICIES

-- 1. USERS
alter table public.users enable row level security;

create policy "Users can view own private data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own private data"
  on public.users for update
  using (auth.uid() = id);

-- 2. PROFILES
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- 3. USER LOCATIONS
alter table public.user_locations enable row level security;

create policy "Users can view own location"
  on public.user_locations for select
  using (auth.uid() = user_id);

create policy "Users can insert own location"
  on public.user_locations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own location"
  on public.user_locations for update
  using (auth.uid() = user_id);

-- 4. USER MEDIA
alter table public.user_media enable row level security;

create policy "Media is viewable by everyone"
  on public.user_media for select
  using (true);

create policy "Users can manage own media"
  on public.user_media for all
  using (auth.uid() = user_id);

-- 5. DROPS
alter table public.drops enable row level security;

create policy "Drops are viewable by everyone"
  on public.drops for select
  using (true);

create policy "Users can manage own drops"
  on public.drops for all
  using (auth.uid() = user_id);

-- 6. WISHLIST
alter table public.wishlist enable row level security;

create policy "Users can manage own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id);

-- 7. CHATS & MESSAGES
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

-- Chat Participants: Users see chats they are in
create policy "Users can view their chat participations"
  on public.chat_participants for select
  using (auth.uid() = user_id);

create policy "Admins can view all chat participations"
  on public.chat_participants for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'moderator')
  ));

create policy "Users can join chats"
  on public.chat_participants for insert
  with check (auth.uid() = user_id);

-- Chats: Users see chats they are participants of
create policy "Users can view chats they belong to"
  on public.chats for select
  using (exists (
    select 1 from public.chat_participants
    where chat_id = id and user_id = auth.uid()
  ));

create policy "Admins can view all chats"
  on public.chats for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'moderator')
  ));

create policy "Users can create chats"
  on public.chats for insert
  with check (true);

create policy "Users can update chats they belong to"
  on public.chats for update
  using (exists (
    select 1 from public.chat_participants
    where chat_id = id and user_id = auth.uid()
  ));

-- Messages: Users see messages in their chats
create policy "Users can view messages in their chats"
  on public.messages for select
  using (exists (
    select 1 from public.chat_participants
    where chat_id = messages.chat_id and user_id = auth.uid()
  ));

create policy "Admins can view all messages"
  on public.messages for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'moderator')
  ));

create policy "Users can insert messages in their chats"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "Users can update status of messages in their chats"
  on public.messages for update
  using (exists (
    select 1 from public.chat_participants
    where chat_id = messages.chat_id and user_id = auth.uid()
  ));

-- 8. AUTH SESSIONS
alter table public.auth_sessions enable row level security;

create policy "Users can manage own sessions"
  on public.auth_sessions for all
  using (auth.uid() = user_id);

-- 9. USER SETTINGS
alter table public.user_settings enable row level security;

create policy "Users can manage own settings"
  on public.user_settings for all
  using (auth.uid() = user_id);

-- 10. DROP VIEWS
alter table public.drop_views enable row level security;

create policy "Users can record their own drop views"
  on public.drop_views for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own drop views or the owner of the drop"
  on public.drop_views for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.drops d
      where d.id = drop_views.drop_id
        and d.user_id = auth.uid()
    )
  );

-- 10b. PROMO DROPS (ADMIN-PUBLISHED CONTENT)
alter table public.promo_drops enable row level security;
alter table public.promo_drop_views enable row level security;

create policy "Published promo drops are viewable by everyone"
  on public.promo_drops for select
  using (is_published = true);

create policy "Admins can manage promo drops"
  on public.promo_drops for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'moderator')
    )
  );

create policy "Authenticated users can insert promo drop views"
  on public.promo_drop_views for insert
  with check (auth.uid() = user_id);

create policy "Users can view promo drop views they created or the owner/admin can inspect them"
  on public.promo_drop_views for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.promo_drops p
      where p.id = promo_drop_views.promo_drop_id
        and p.created_by = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'moderator')
    )
  );

-- PROMO PROFILES (ADMIN-PUBLISHED PROFILES)
alter table public.promo_profiles enable row level security;

create policy "Published promo profiles are viewable by everyone"
  on public.promo_profiles for select
  using (is_published = true);

create policy "Admins can manage promo profiles"
  on public.promo_profiles for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'moderator')
    )
  );

-- 11. BLOCKS & HIDDEN CONTACTS
alter table public.blocks enable row level security;
alter table public.hidden_contacts enable row level security;

create policy "Users can manage own blocks"
  on public.blocks for all
  using (auth.uid() = user_id);

create policy "Users can manage own hidden contacts"
  on public.hidden_contacts for all
  using (auth.uid() = user_id);

-- 12. NOTIFICATIONS
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- 13. REPORTS (Insert only for users)
alter table public.reports enable row level security;

create policy "Users can submit reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- 14. SUBSCRIPTIONS
alter table public.user_subscriptions enable row level security;
alter table public.subscription_plans enable row level security;

create policy "Users can view own subscriptions"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Everyone can view subscription plans"
  on public.subscription_plans for select
  using (true);

-- 15. FEATURES USAGE
alter table public.features_usage enable row level security;

create policy "Users can view own features usage"
  on public.features_usage for select
  using (auth.uid() = user_id);

-- ENABLE REALTIME FOR SPECIFIC TABLES
-- This is required for the "postgres_changes" subscriptions to work
-- in MessagesPageClient and NotificationListener.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;