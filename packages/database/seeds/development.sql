BEGIN;

INSERT INTO content_releases (content_release_id, balance_release_id, is_active, metadata)
VALUES (
  'foundation-1.0.0',
  'low-numbers-1.0.0',
  true,
  '{"description":"Backend foundation seed"}'::jsonb
)
ON CONFLICT (content_release_id) DO UPDATE
SET balance_release_id = EXCLUDED.balance_release_id,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata;

INSERT INTO users (id, email_original, email_normalized)
VALUES ('01900000-0000-7000-8000-000000000001', 'dev@idle-tamer.local', 'dev@idle-tamer.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO player_profiles (
  id,
  user_id,
  display_name,
  display_name_normalized,
  content_release_id,
  balance_release_id
)
VALUES (
  '01900000-0000-7000-8000-000000000002',
  '01900000-0000-7000-8000-000000000001',
  'Dev Tamer',
  'dev tamer',
  'foundation-1.0.0',
  'low-numbers-1.0.0'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallet_balances (player_id, definition_id, amount)
VALUES
  ('01900000-0000-7000-8000-000000000002', 'gold', 0),
  ('01900000-0000-7000-8000-000000000002', 'prestige_core', 0)
ON CONFLICT (player_id, definition_id) DO NOTHING;

COMMIT;
