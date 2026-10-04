CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  phone_normalized text,
  email text,
  email_normalized text,
  location_label text,
  preferred_contact_method text NOT NULL DEFAULT 'phone'
    CHECK (preferred_contact_method IN ('phone','sms','email')),
  consent_to_contact boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_normalized_unique
  ON contacts(email_normalized) WHERE email_normalized IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_phone_normalized_unique
  ON contacts(phone_normalized) WHERE phone_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  contact_id uuid NOT NULL REFERENCES contacts(id),
  issue_category text NOT NULL,
  request_type text NOT NULL DEFAULT 'website_request',
  device_type text,
  service_mode text NOT NULL DEFAULT 'undecided'
    CHECK (service_mode IN ('onsite','remote','undecided')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','triaged','scheduled','in_progress','waiting_client','resolved','closed','cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  location_label text,
  requested_window text,
  public_description text NOT NULL,
  source_page text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  asset_type text NOT NULL,
  make text,
  model text,
  serial_or_service_id text,
  installed_at date,
  location_label text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  operational_notes text,
  credential_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  event_type text NOT NULL CHECK (event_type IN ('note','status_change','visit','call','remote_session','work_log','intake')),
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','client_shareable')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_submissions (
  idempotency_key text PRIMARY KEY,
  ticket_id uuid REFERENCES service_tickets(id),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_status_priority_created ON service_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_contact_created ON service_tickets(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assets_contact ON client_assets(contact_id);
CREATE INDEX IF NOT EXISTS events_ticket_created ON service_events(ticket_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS contacts_touch_updated_at ON contacts;
CREATE TRIGGER contacts_touch_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS tickets_touch_updated_at ON service_tickets;
CREATE TRIGGER tickets_touch_updated_at BEFORE UPDATE ON service_tickets
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS assets_touch_updated_at ON client_assets;
CREATE TRIGGER assets_touch_updated_at BEFORE UPDATE ON client_assets
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION create_public_intake(
  p_idempotency_key text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_phone_normalized text,
  p_email_normalized text,
  p_location text,
  p_preferred_contact text,
  p_issue_category text,
  p_device_type text,
  p_service_mode text,
  p_requested_window text,
  p_description text,
  p_request_type text,
  p_source_page text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contact_id uuid;
  v_ticket_id uuid;
  v_inserted_key text;
BEGIN
  INSERT INTO intake_submissions(idempotency_key)
    VALUES (p_idempotency_key)
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING idempotency_key INTO v_inserted_key;

  IF v_inserted_key IS NULL THEN
    SELECT ticket_id INTO v_ticket_id FROM intake_submissions WHERE idempotency_key = p_idempotency_key;
    RETURN v_ticket_id;
  END IF;

  IF p_email_normalized IS NOT NULL THEN
    INSERT INTO contacts(full_name, phone, phone_normalized, email, email_normalized, location_label,
                         preferred_contact_method, consent_to_contact, source)
      VALUES (p_full_name, NULLIF(p_phone, ''), p_phone_normalized, NULLIF(p_email, ''), p_email_normalized,
              NULLIF(p_location, ''), p_preferred_contact, true, 'website')
      ON CONFLICT (email_normalized) WHERE email_normalized IS NOT NULL
      DO UPDATE SET updated_at = now()
      RETURNING id INTO v_contact_id;
  ELSIF p_phone_normalized IS NOT NULL THEN
    INSERT INTO contacts(full_name, phone, phone_normalized, email, email_normalized, location_label,
                         preferred_contact_method, consent_to_contact, source)
      VALUES (p_full_name, NULLIF(p_phone, ''), p_phone_normalized, NULLIF(p_email, ''), NULL,
              NULLIF(p_location, ''), p_preferred_contact, true, 'website')
      ON CONFLICT (phone_normalized) WHERE phone_normalized IS NOT NULL
      DO UPDATE SET updated_at = now()
      RETURNING id INTO v_contact_id;
  ELSE
    RAISE EXCEPTION 'contact method required';
  END IF;

  INSERT INTO service_tickets(contact_id, issue_category, request_type, device_type, service_mode, location_label,
                              requested_window, public_description, source_page)
    VALUES (v_contact_id, p_issue_category, p_request_type, NULLIF(p_device_type, ''), p_service_mode,
            NULLIF(p_location, ''), NULLIF(p_requested_window, ''), p_description, NULLIF(p_source_page, ''))
    RETURNING id INTO v_ticket_id;

  INSERT INTO service_events(ticket_id, contact_id, event_type, body, visibility, created_by)
    VALUES (v_ticket_id, v_contact_id, 'intake', 'Public website service request received.', 'internal', 'website-intake');

  UPDATE intake_submissions SET ticket_id = v_ticket_id WHERE idempotency_key = p_idempotency_key;
  RETURN v_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION create_public_intake(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC;
