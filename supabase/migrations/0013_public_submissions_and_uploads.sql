-- ============================================================
-- Public submission uploads: bucket + bite_reports table +
-- attachments columns on existing form-backed tables.
--
-- The public forms on /report/bite, /report, /volunteer,
-- /adopt/apply were previously fire-and-forget writes to a
-- Google Sheet only — with file inputs recording just the
-- filename and dropping the bytes on the reporter's device.
-- This migration lays the storage + database groundwork for a
-- real upload path where every submission has:
--   1. Its file bytes in Supabase Storage (submissions bucket)
--   2. A row in the corresponding Supabase table with an
--      `attachments` jsonb array describing each file
--   3. Metadata forwarded to Google Sheets by the app server
--
-- User decision: the bucket is public. Filenames use UUIDs so
-- URLs aren't guessable, but a leaked URL is viewable by anyone.
-- Sensitive documents (bite wound photos, medical reports) are
-- accepted under that constraint.
-- ============================================================

-- ---------- storage bucket ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  true,
  10 * 1024 * 1024,  -- 10 MB per file
  array[
    'image/jpeg','image/png','image/webp','image/avif','image/gif','image/heic','image/heif',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Public read policy on the bucket. Writes go through signed upload
-- URLs minted by the server (service role bypasses RLS), so no
-- public insert/update/delete policies are needed.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'submissions_public_read'
  ) then
    create policy submissions_public_read on storage.objects
      for select using (bucket_id = 'submissions');
  end if;
end $$;

-- ---------- bite_reports table ----------

create table if not exists bite_reports (
  id             uuid primary key default gen_random_uuid(),
  report_code    text not null unique,             -- BITE-2026-0001
  reporter_name  text not null,
  reporter_phone text not null,                    -- coordinators only (RLS)
  location_text  text not null,
  incident_date  date not null,
  incident_time  text not null,                    -- HH:MM
  maps_link      text not null,
  description    text not null,
  -- Array of file metadata objects:
  --   { slot, path, url, filename, contentType, size }
  attachments    jsonb not null default '[]'::jsonb,
  status         text not null default 'received', -- received|reviewing|contacted|resolved
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_bite_reports_created on bite_reports(created_at desc);
create index if not exists idx_bite_reports_status  on bite_reports(status) where status <> 'resolved';

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_bite_reports_updated'
  ) then
    create trigger trg_bite_reports_updated before update on bite_reports
      for each row execute function set_updated_at();
  end if;
end $$;

-- Row-level security: anonymous inserts are done by the app server
-- via the service role (which bypasses RLS), so no anon policy here.
-- Only coordinators/admins may read — they contain PII (phone) and
-- potentially graphic wound photos.
alter table bite_reports enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bite_reports'
      and policyname = 'bite_reports_admin_read'
  ) then
    create policy bite_reports_admin_read on bite_reports
      for select to authenticated
      using (has_role(array['admin','super_admin']::user_role[]));
  end if;
end $$;

-- ---------- attachments columns on existing tables ----------
-- Same jsonb array shape as bite_reports.attachments. Optional on
-- rescue_reports (photo_path stays for the single-photo legacy
-- flow), and empty by default on the other two.

alter table rescue_reports         add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table adoption_applications  add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table volunteers             add column if not exists attachments jsonb not null default '[]'::jsonb;
