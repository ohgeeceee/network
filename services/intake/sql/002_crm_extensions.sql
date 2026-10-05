BEGIN;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_lead_status_check'
      AND conrelid = 'contacts'::regclass
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_lead_status_check
      CHECK (lead_status IN ('new','contacted','qualified','converted','inactive'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  contact_id uuid NOT NULL REFERENCES contacts(id),
  name text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','scheduled','in_progress','blocked','completed','cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  start_date date,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS project_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_tickets_project_id_fkey'
      AND conrelid = 'service_tickets'::regclass
  ) THEN
    ALTER TABLE service_tickets ADD CONSTRAINT service_tickets_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END;
$$;

ALTER TABLE service_events ADD COLUMN IF NOT EXISTS project_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_events_project_id_fkey'
      AND conrelid = 'service_events'::regclass
  ) THEN
    ALTER TABLE service_events ADD CONSTRAINT service_events_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS contacts_lead_follow_up ON contacts(lead_status, next_follow_up_at);
CREATE INDEX IF NOT EXISTS tickets_project_created ON service_tickets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_status_target ON projects(status, target_date);
CREATE INDEX IF NOT EXISTS projects_contact ON projects(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_project_created ON service_events(project_id, created_at DESC);

DROP TRIGGER IF EXISTS projects_touch_updated_at ON projects;
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
