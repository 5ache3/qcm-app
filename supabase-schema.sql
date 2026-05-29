-- QCM Revision — Full Schema Migration
-- Run this in the Supabase SQL Editor (New Query → paste all → Run)

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  icon        text,
  due_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references subjects(id) on delete cascade,
  question_text text not null,
  explanation   text,
  difficulty    text check (difficulty in ('easy', 'medium', 'hard')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists questions_subject_id_idx on questions(subject_id);

create table if not exists answer_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct  boolean not null default false,
  position    int not null default 0
);

create index if not exists answer_options_question_id_idx on answer_options(question_id);

create table if not exists practice_answers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  subject_id          uuid not null references subjects(id) on delete cascade,
  question_id         uuid not null references questions(id) on delete cascade,
  selected_option_ids uuid[] not null default '{}',
  score               numeric(5,2) not null default 0,
  status              text not null check (status in ('correct', 'partial', 'wrong')),
  answered_at         timestamptz not null default now(),
  constraint practice_answers_user_question_unique unique (user_id, question_id)
);

create index if not exists practice_answers_user_subject_idx on practice_answers(user_id, subject_id);

create table if not exists tests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  subject_id       uuid not null references subjects(id) on delete cascade,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  duration_seconds int,
  score            numeric(5,2),
  percentage       numeric(5,2),
  status           text not null default 'in_progress'
                   check (status in ('in_progress', 'completed', 'expired'))
);

create index if not exists tests_user_id_idx on tests(user_id);
create index if not exists tests_user_subject_idx on tests(user_id, subject_id);

create table if not exists test_questions (
  id          uuid primary key default gen_random_uuid(),
  test_id     uuid not null references tests(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position    int not null,
  score       numeric(5,2)
);

create index if not exists test_questions_test_id_idx on test_questions(test_id);

create table if not exists test_answers (
  id                  uuid primary key default gen_random_uuid(),
  test_id             uuid not null references tests(id) on delete cascade,
  question_id         uuid not null references questions(id) on delete cascade,
  selected_option_ids uuid[] not null default '{}',
  score               numeric(5,2),
  status              text not null default 'unanswered'
                      check (status in ('correct', 'partial', 'wrong', 'unanswered')),
  answered_at         timestamptz
);

create index if not exists test_answers_test_id_idx on test_answers(test_id);

-- ─── Auto-create profile on signup ───────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ──────────────────────────────────────

alter table profiles         enable row level security;
alter table subjects         enable row level security;
alter table questions        enable row level security;
alter table answer_options   enable row level security;
alter table practice_answers enable row level security;
alter table tests            enable row level security;
alter table test_questions   enable row level security;
alter table test_answers     enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
drop policy if exists "profiles_select_own"   on profiles;
drop policy if exists "profiles_update_own"   on profiles;
drop policy if exists "profiles_select_admin" on profiles;
drop policy if exists "profiles_all_admin"    on profiles;

create policy "profiles_select_own"
  on profiles for select using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

-- Admins can select/update/delete any profile (approve users, change roles, etc.)
create policy "profiles_all_admin"
  on profiles for all using (public.is_admin());

-- subjects
drop policy if exists "subjects_select_auth"    on subjects;
drop policy if exists "subjects_all_admin"      on subjects;

create policy "subjects_select_auth"
  on subjects for select using (auth.role() = 'authenticated');

create policy "subjects_all_admin"
  on subjects for all using (public.is_admin());

-- questions
drop policy if exists "questions_select_auth"   on questions;
drop policy if exists "questions_all_admin"     on questions;

create policy "questions_select_auth"
  on questions for select using (auth.role() = 'authenticated');

create policy "questions_all_admin"
  on questions for all using (public.is_admin());

-- answer_options
drop policy if exists "options_select_auth"     on answer_options;
drop policy if exists "options_all_admin"       on answer_options;

create policy "options_select_auth"
  on answer_options for select using (auth.role() = 'authenticated');

create policy "options_all_admin"
  on answer_options for all using (public.is_admin());

-- practice_answers
drop policy if exists "pa_all_own"              on practice_answers;
drop policy if exists "pa_select_admin"         on practice_answers;

create policy "pa_all_own"
  on practice_answers for all using (auth.uid() = user_id);

create policy "pa_select_admin"
  on practice_answers for select using (public.is_admin());

-- tests
drop policy if exists "tests_all_own"           on tests;
drop policy if exists "tests_select_admin"      on tests;

create policy "tests_all_own"
  on tests for all using (auth.uid() = user_id);

create policy "tests_select_admin"
  on tests for select using (public.is_admin());

-- test_questions
drop policy if exists "tq_select_own"           on test_questions;
drop policy if exists "tq_insert_own"           on test_questions;
drop policy if exists "tq_select_admin"         on test_questions;

create policy "tq_select_own"
  on test_questions for select
  using (exists (select 1 from tests where id = test_id and user_id = auth.uid()));

create policy "tq_insert_own"
  on test_questions for insert
  with check (exists (select 1 from tests where id = test_id and user_id = auth.uid()));

create policy "tq_select_admin"
  on test_questions for select using (public.is_admin());

-- test_answers
drop policy if exists "ta_all_own"              on test_answers;
drop policy if exists "ta_select_admin"         on test_answers;

create policy "ta_all_own"
  on test_answers for all
  using (exists (select 1 from tests where id = test_id and user_id = auth.uid()));

create policy "ta_select_admin"
  on test_answers for select using (public.is_admin());

-- ─── Tutor Role Migration ─────────────────────────────────────
-- Run this section after the base schema is in place.

-- 1. Allow 'tutor' role in profiles
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('student', 'admin', 'tutor'));

-- 2. classes table
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  tutor_id    uuid not null references profiles(id) on delete cascade,
  invite_code text unique not null default substr(md5(random()::text || gen_random_uuid()::text), 1, 8),
  created_at  timestamptz not null default now()
);

create index if not exists classes_tutor_id_idx    on classes(tutor_id);
create index if not exists classes_invite_code_idx on classes(invite_code);

-- 3. class_memberships table
create table if not exists class_memberships (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'approved')),
  joined_at  timestamptz not null default now(),
  unique(class_id, student_id)
);

create index if not exists class_memberships_class_id_idx   on class_memberships(class_id);
create index if not exists class_memberships_student_id_idx on class_memberships(student_id);

-- 4. Add class_id to subjects (null = global, visible to all)
alter table subjects add column if not exists class_id uuid references classes(id) on delete set null;
create index if not exists subjects_class_id_idx on subjects(class_id);

-- ─── Helper functions ─────────────────────────────────────────

create or replace function public.is_tutor()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor');
$$;

create or replace function public.is_approved_class_member(p_class_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.class_memberships
    where class_id = p_class_id and student_id = auth.uid() and status = 'approved'
  );
$$;

-- ─── RLS: classes ─────────────────────────────────────────────

alter table classes enable row level security;

drop policy if exists "classes_select_tutor"  on classes;
drop policy if exists "classes_insert_tutor"  on classes;
drop policy if exists "classes_update_tutor"  on classes;
drop policy if exists "classes_delete_tutor"  on classes;
drop policy if exists "classes_select_member" on classes;
drop policy if exists "classes_all_admin"     on classes;

create policy "classes_select_tutor"  on classes for select using (tutor_id = auth.uid());
create policy "classes_insert_tutor"  on classes for insert with check (tutor_id = auth.uid() and public.is_tutor());
create policy "classes_update_tutor"  on classes for update using (tutor_id = auth.uid());
create policy "classes_delete_tutor"  on classes for delete using (tutor_id = auth.uid());
create policy "classes_select_member" on classes for select using (public.is_approved_class_member(id));
create policy "classes_all_admin"     on classes for all   using (public.is_admin());

-- ─── RLS: class_memberships ───────────────────────────────────

alter table class_memberships enable row level security;

drop policy if exists "cm_select_tutor"  on class_memberships;
drop policy if exists "cm_update_tutor"  on class_memberships;
drop policy if exists "cm_delete_tutor"  on class_memberships;
drop policy if exists "cm_insert_student" on class_memberships;
drop policy if exists "cm_select_student" on class_memberships;
drop policy if exists "cm_all_admin"     on class_memberships;

create policy "cm_select_tutor"
  on class_memberships for select
  using (exists (select 1 from classes where id = class_id and tutor_id = auth.uid()));

create policy "cm_update_tutor"
  on class_memberships for update
  using (exists (select 1 from classes where id = class_id and tutor_id = auth.uid()));

create policy "cm_delete_tutor"
  on class_memberships for delete
  using (exists (select 1 from classes where id = class_id and tutor_id = auth.uid()));

create policy "cm_insert_student"
  on class_memberships for insert
  with check (student_id = auth.uid() and auth.role() = 'authenticated');

create policy "cm_select_student"
  on class_memberships for select using (student_id = auth.uid());

create policy "cm_all_admin"
  on class_memberships for all using (public.is_admin());

-- ─── RLS: subjects (replace old policies) ────────────────────

drop policy if exists "subjects_select_auth" on subjects;
drop policy if exists "subjects_all_admin"   on subjects;
drop policy if exists "subjects_all_tutor"   on subjects;

-- Global subjects visible to all authenticated users
create policy "subjects_select_global"
  on subjects for select using (class_id is null and auth.role() = 'authenticated');

-- Class subjects visible to approved members and the owning tutor
create policy "subjects_select_class"
  on subjects for select
  using (
    class_id is not null and (
      public.is_approved_class_member(class_id) or
      exists (select 1 from classes where id = class_id and tutor_id = auth.uid())
    )
  );

create policy "subjects_all_admin"
  on subjects for all using (public.is_admin());

-- Tutors can manage (insert/update/delete) subjects in their own classes
create policy "subjects_all_tutor"
  on subjects for all
  using (
    class_id is not null and
    exists (select 1 from classes where id = class_id and tutor_id = auth.uid())
  );

-- ─── RLS: questions – extend for tutors ──────────────────────

drop policy if exists "questions_all_tutor" on questions;

create policy "questions_all_tutor"
  on questions for all
  using (
    exists (
      select 1 from subjects s
      join classes c on c.id = s.class_id
      where s.id = questions.subject_id and c.tutor_id = auth.uid()
    )
  );

-- ─── RLS: answer_options – extend for tutors ─────────────────

drop policy if exists "options_all_tutor" on answer_options;

create policy "options_all_tutor"
  on answer_options for all
  using (
    exists (
      select 1 from questions q
      join subjects s on s.id = q.subject_id
      join classes c on c.id = s.class_id
      where q.id = answer_options.question_id and c.tutor_id = auth.uid()
    )
  );

-- ─── RLS: lessons – add tutor access ─────────────────────────
-- (Enable RLS on lessons if not already done)
alter table lessons enable row level security;

drop policy if exists "lessons_select_auth" on lessons;
drop policy if exists "lessons_all_admin"   on lessons;
drop policy if exists "lessons_all_tutor"   on lessons;

create policy "lessons_select_auth"
  on lessons for select using (auth.role() = 'authenticated');

create policy "lessons_all_admin"
  on lessons for all using (public.is_admin());

create policy "lessons_all_tutor"
  on lessons for all
  using (
    exists (
      select 1 from subjects s
      join classes c on c.id = s.class_id
      where s.id = lessons.subject_id and c.tutor_id = auth.uid()
    )
  );

-- ─── RLS: profiles – tutors can see their students ───────────

drop policy if exists "profiles_select_tutor" on profiles;

create policy "profiles_select_tutor"
  on profiles for select
  using (
    exists (
      select 1 from class_memberships cm
      join classes c on c.id = cm.class_id
      where cm.student_id = profiles.id and c.tutor_id = auth.uid()
    )
  );

-- ─── RLS: practice_answers – tutors can see class students ───

drop policy if exists "pa_select_tutor" on practice_answers;

create policy "pa_select_tutor"
  on practice_answers for select
  using (
    exists (
      select 1 from class_memberships cm
      join classes c on c.id = cm.class_id
      join subjects s on s.id = practice_answers.subject_id and s.class_id = c.id
      where cm.student_id = practice_answers.user_id and c.tutor_id = auth.uid()
    )
  );

-- ─── RLS: tests – tutors can see class students ──────────────

drop policy if exists "tests_select_tutor" on tests;

create policy "tests_select_tutor"
  on tests for select
  using (
    exists (
      select 1 from class_memberships cm
      join classes c on c.id = cm.class_id
      join subjects s on s.id = tests.subject_id and s.class_id = c.id
      where cm.student_id = tests.user_id and c.tutor_id = auth.uid()
    )
  );
