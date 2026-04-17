create table if not exists public.content_ideas (
  id text primary key,
  source_notes text not null default '',
  theme text not null,
  goal text not null,
  cta text not null,
  angle text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_ideas_created_at_idx
  on public.content_ideas (created_at desc);

create index if not exists content_ideas_goal_idx
  on public.content_ideas (goal);

create table if not exists public.content_drafts (
  id text primary key,
  idea_id text not null,
  platform text not null,
  hook text not null,
  body text not null,
  cta text not null,
  status text not null default 'generated',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_drafts_created_at_idx
  on public.content_drafts (created_at desc);

create index if not exists content_drafts_idea_id_idx
  on public.content_drafts (idea_id);

create table if not exists public.post_results (
  id text primary key,
  draft_id text,
  platform text not null,
  text text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  saves integer not null default 0,
  impressions integer not null default 0,
  notes text not null default '',
  posted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists post_results_created_at_idx
  on public.post_results (created_at desc);

create index if not exists post_results_platform_idx
  on public.post_results (platform);

create table if not exists public.memory_insights (
  id text primary key,
  insight_type text not null,
  content text not null,
  confidence numeric(4, 3),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists memory_insights_created_at_idx
  on public.memory_insights (created_at desc);

create index if not exists memory_insights_type_idx
  on public.memory_insights (insight_type);
