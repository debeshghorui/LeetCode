-- Difficulty enum (idempotent)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'difficulty' and typnamespace = 'public'::regnamespace) then
    create type public.difficulty as enum ('EASY', 'MEDIUM', 'HARD');
  end if;
end
$$;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Problems
create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty public.difficulty not null,
  tags text[] not null default '{}',
  examples jsonb not null default '[]'::jsonb,
  constraints text not null,
  hints text,
  editorial text,
  test_cases jsonb not null default '[]'::jsonb,
  code_snippets jsonb not null default '{}'::jsonb,
  reference_solutions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists problems_difficulty_idx on public.problems (difficulty);
create index if not exists problems_tags_idx on public.problems using gin (tags);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'problems_set_updated_at') then
    create trigger problems_set_updated_at
      before update on public.problems
      for each row
      execute function public.set_updated_at();
  end if;
end
$$;

-- Profiles (id matches auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_set_updated_at') then
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row
      execute function public.set_updated_at();
  end if;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end
$$;

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Submissions (user_id -> profiles, which maps to auth.users)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  source_code jsonb not null,
  language text not null,
  stdin text,
  stdout text,
  stderr text,
  compile_output text,
  status text not null,
  memory text,
  time text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_user_id_idx on public.submissions (user_id);
create index if not exists submissions_problem_id_idx on public.submissions (problem_id);
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_user_problem_idx on public.submissions (user_id, problem_id);

-- Per-test-case results for a submission
create table if not exists public.test_case_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  test_case integer not null,
  passed boolean not null,
  stdout text,
  expected text not null,
  stderr text,
  compile_output text,
  status text not null,
  memory text,
  time text,
  created_at timestamptz not null default now()
);

create index if not exists test_case_results_submission_id_idx
  on public.test_case_results (submission_id);

-- Solved marker (one row per user/problem)
create table if not exists public.problem_solved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, problem_id)
);

create index if not exists problem_solved_user_id_idx on public.problem_solved (user_id);
create index if not exists problem_solved_problem_id_idx on public.problem_solved (problem_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.problems enable row level security;
alter table public.submissions enable row level security;
alter table public.test_case_results enable row level security;
alter table public.problem_solved enable row level security;

-- Profiles: users read only their own row.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'profiles_select_own' and tablename = 'profiles') then
    create policy "profiles_select_own"
      on public.profiles
      for select
      to authenticated
      using ((select auth.uid()) = id);
  end if;
end
$$;

-- Problems: authenticated users can read public fields only.
-- test_cases + reference_solutions stay service_role-only (column grants below).
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'problems_select_authenticated' and tablename = 'problems') then
    create policy "problems_select_authenticated"
      on public.problems
      for select
      to authenticated
      using (true);
  end if;
end
$$;

-- Submissions: users read only their own rows.
-- Writes go through the judging backend (service_role).
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_select_own' and tablename = 'submissions') then
    create policy "submissions_select_own"
      on public.submissions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

-- Test case results: visible when the parent submission belongs to the user.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'test_case_results_select_own' and tablename = 'test_case_results') then
    create policy "test_case_results_select_own"
      on public.test_case_results
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.submissions s
          where s.id = submission_id
            and s.user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

-- Problem solved: users read only their own progress.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'problem_solved_select_own' and tablename = 'problem_solved') then
    create policy "problem_solved_select_own"
      on public.problem_solved
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

-- Privileges: least privilege for client roles.
-- service_role bypasses RLS and retains full access for the judging API.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.problems from anon, authenticated;
revoke all on table public.submissions from anon, authenticated;
revoke all on table public.test_case_results from anon, authenticated;
revoke all on table public.problem_solved from anon, authenticated;

-- Public problem columns only (hide hidden tests + reference solutions).
grant select (
  id,
  title,
  description,
  difficulty,
  tags,
  examples,
  constraints,
  hints,
  editorial,
  code_snippets,
  created_at,
  updated_at
) on table public.problems to authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.submissions to authenticated;
grant select on table public.test_case_results to authenticated;
grant select on table public.problem_solved to authenticated;