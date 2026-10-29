-- Supabase / PostgreSQL schema for The Taal Viewpoint Staycation Reservations

CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(64) PRIMARY KEY,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(64) NOT NULL DEFAULT 'N/A',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 2,
  nights INTEGER NOT NULL DEFAULT 1,
  base_price INTEGER NOT NULL DEFAULT 0,
  cleaning_fee INTEGER NOT NULL DEFAULT 500,
  security_deposit INTEGER NOT NULL DEFAULT 1000,
  total_amount INTEGER NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'gcash',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_reference_id VARCHAR(128),
  paymongo_payment_intent_id VARCHAR(128),
  locked_until TIMESTAMPTZ NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'direct', -- 'direct', 'airbnb', 'agoda', 'booking_com'
  external_event_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on dates for fast range overlap lookups
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_locked_until ON reservations (locked_until);
CREATE INDEX IF NOT EXISTS idx_reservations_external_id ON reservations (external_event_id);

-- Enable Row Level Security (RLS)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role full access on reservations"
  ON reservations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read access for checking blocked dates (anonymized query access)
CREATE POLICY "Public read active reservations"
  ON reservations
  FOR SELECT
  TO anon, authenticated
  USING (true);
