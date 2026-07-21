/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT users_status_check;
    ALTER TABLE users
      ALTER COLUMN email_original DROP NOT NULL,
      ALTER COLUMN email_normalized DROP NOT NULL,
      ALTER COLUMN status SET DEFAULT 'pending_verification',
      ADD COLUMN email_verified_at timestamptz,
      ADD COLUMN locked_at timestamptz,
      ADD COLUMN deletion_requested_at timestamptz,
      ADD COLUMN delete_after timestamptz,
      ADD COLUMN deleted_at timestamptz;

    UPDATE users
       SET email_verified_at = created_at
     WHERE status = 'active' AND email_verified_at IS NULL;

    ALTER TABLE users
      ADD CONSTRAINT users_status_check
        CHECK (status IN ('pending_verification', 'active', 'locked', 'deletion_pending', 'deleted')),
      ADD CONSTRAINT users_email_lifecycle_check
        CHECK (
          (status = 'deleted' AND email_original IS NULL AND email_normalized IS NULL AND deleted_at IS NOT NULL)
          OR
          (status <> 'deleted' AND email_original IS NOT NULL AND email_normalized IS NOT NULL AND deleted_at IS NULL)
        ),
      ADD CONSTRAINT users_verified_active_check
        CHECK (status <> 'active' OR email_verified_at IS NOT NULL),
      ADD CONSTRAINT users_deletion_window_check
        CHECK (
          (status = 'deletion_pending' AND deletion_requested_at IS NOT NULL AND delete_after > deletion_requested_at)
          OR
          (status <> 'deletion_pending' AND deletion_requested_at IS NULL AND delete_after IS NULL)
        );

    ALTER TABLE player_profiles
      ADD COLUMN starter_definition_id text,
      ADD COLUMN starter_chosen_at timestamptz,
      ADD COLUMN display_name_changed_at timestamptz,
      ADD COLUMN local_storage_namespace uuid NOT NULL DEFAULT uuidv7(),
      ADD CONSTRAINT player_profiles_starter_pair_check
        CHECK ((starter_definition_id IS NULL) = (starter_chosen_at IS NULL)),
      ADD CONSTRAINT player_profiles_local_storage_namespace_key UNIQUE (local_storage_namespace);

    UPDATE player_profiles SET avatar_id = 'wanderer' WHERE avatar_id = 'avatar-tamer';
    UPDATE player_profiles SET frame_id = 'silver' WHERE frame_id = 'frame-silver';
    ALTER TABLE player_profiles ALTER COLUMN avatar_id SET DEFAULT 'wanderer';
    ALTER TABLE player_profiles ALTER COLUMN frame_id SET DEFAULT 'silver';

    CREATE TABLE user_credentials (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      password_hash text NOT NULL,
      hash_version smallint NOT NULL DEFAULT 1 CHECK (hash_version >= 1),
      password_changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE user_sessions (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
      csrf_hash bytea NOT NULL CHECK (octet_length(csrf_hash) = 32),
      client_instance_id uuid NOT NULL,
      device_name text NOT NULL CHECK (char_length(device_name) BETWEEN 1 AND 80),
      user_agent_summary text NOT NULL CHECK (char_length(user_agent_summary) BETWEEN 1 AND 160),
      remember_me boolean NOT NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      idle_expires_at timestamptz NOT NULL,
      absolute_expires_at timestamptz NOT NULL,
      reauthenticated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      revoked_at timestamptz,
      revoke_reason text CHECK (revoke_reason IN ('manual', 'logout', 'expired', 'rotated', 'password_change', 'password_reset', 'account_status', 'session_limit')),
      rotated_from_session_id uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
      CHECK (idle_expires_at > created_at AND absolute_expires_at >= idle_expires_at),
      CHECK ((revoked_at IS NULL) = (revoke_reason IS NULL))
    );
    CREATE INDEX user_sessions_active_user_idx ON user_sessions (user_id, absolute_expires_at DESC) WHERE revoked_at IS NULL;
    CREATE INDEX user_sessions_user_seen_idx ON user_sessions (user_id, last_seen_at DESC);

    CREATE TABLE account_tokens (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind text NOT NULL CHECK (kind IN ('verify_email', 'reset_password', 'cancel_deletion')),
      token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      expires_at timestamptz NOT NULL,
      consumed_at timestamptz,
      superseded_at timestamptz,
      CHECK (expires_at > created_at),
      CHECK (consumed_at IS NULL OR superseded_at IS NULL)
    );
    CREATE INDEX account_tokens_open_idx ON account_tokens (user_id, kind, expires_at) WHERE consumed_at IS NULL AND superseded_at IS NULL;

    CREATE TABLE user_roles (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('player', 'support', 'moderator', 'admin')),
      granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
      PRIMARY KEY (user_id, role)
    );

    CREATE TABLE policy_acceptances (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      policy_kind text NOT NULL CHECK (policy_kind IN ('terms', 'privacy')),
      version text NOT NULL,
      accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      source text NOT NULL CHECK (source IN ('registration', 'update', 'migration')),
      PRIMARY KEY (user_id, policy_kind, version)
    );

    CREATE TABLE player_name_history (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      display_name text NOT NULL,
      display_name_normalized text NOT NULL,
      valid_from timestamptz NOT NULL,
      valid_until timestamptz,
      reserved_until timestamptz NOT NULL,
      CHECK (valid_until IS NULL OR valid_until >= valid_from),
      CHECK (reserved_until >= valid_from)
    );
    CREATE INDEX player_name_history_player_idx ON player_name_history (player_id, valid_from DESC);

    CREATE TABLE player_name_reservations (
      display_name_normalized text PRIMARY KEY,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      reserved_until timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE INDEX player_name_reservations_expiry_idx ON player_name_reservations (reserved_until);

    CREATE TABLE cosmetic_entitlements (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      cosmetic_kind text NOT NULL CHECK (cosmetic_kind IN ('avatar', 'frame')),
      definition_id text NOT NULL,
      source text NOT NULL,
      unlocked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, cosmetic_kind, definition_id)
    );

    CREATE TABLE auth_rate_limits (
      action text NOT NULL,
      key_hash bytea NOT NULL CHECK (octet_length(key_hash) = 32),
      window_started timestamptz NOT NULL,
      attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      blocked_until timestamptz,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (action, key_hash, window_started)
    );
    CREATE INDEX auth_rate_limits_cleanup_idx ON auth_rate_limits (updated_at);

    CREATE TABLE security_events (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      session_id uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
      event_type text NOT NULL,
      outcome text NOT NULL CHECK (outcome IN ('success', 'rejected', 'failed')),
      network_hash bytea CHECK (network_hash IS NULL OR octet_length(network_hash) = 32),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE INDEX security_events_user_idx ON security_events (user_id, created_at DESC);
    CREATE INDEX security_events_type_idx ON security_events (event_type, created_at DESC);

    CREATE TABLE account_export_jobs (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status text NOT NULL CHECK (status IN ('pending', 'ready', 'failed', 'expired')),
      requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      ready_at timestamptz,
      expires_at timestamptz,
      storage_key text,
      content_sha256 bytea CHECK (content_sha256 IS NULL OR octet_length(content_sha256) = 32),
      failure_code text
    );
    CREATE UNIQUE INDEX account_export_jobs_one_open_idx ON account_export_jobs (user_id) WHERE status IN ('pending', 'ready');

    INSERT INTO user_roles (user_id, role)
      SELECT id, 'player' FROM users
      ON CONFLICT DO NOTHING;

    INSERT INTO policy_acceptances (user_id, policy_kind, version, source)
      SELECT id, policy_kind, 'alpha-foundation-1', 'migration'
        FROM users CROSS JOIN (VALUES ('terms'), ('privacy')) AS policies(policy_kind)
      ON CONFLICT DO NOTHING;

    INSERT INTO player_name_history
      (player_id, display_name, display_name_normalized, valid_from, reserved_until)
      SELECT id, display_name, display_name_normalized, created_at, 'infinity'::timestamptz
        FROM player_profiles;

    INSERT INTO player_name_reservations (display_name_normalized, player_id, reserved_until)
      SELECT display_name_normalized, id, 'infinity'::timestamptz FROM player_profiles
      ON CONFLICT DO NOTHING;

    INSERT INTO cosmetic_entitlements (player_id, cosmetic_kind, definition_id, source)
      SELECT id, 'avatar', 'wanderer', 'migration' FROM player_profiles
      UNION ALL
      SELECT id, 'avatar', 'keeper', 'migration' FROM player_profiles
      UNION ALL
      SELECT id, 'frame', 'silver', 'migration' FROM player_profiles
      UNION ALL
      SELECT id, 'frame', 'violet', 'migration' FROM player_profiles
      ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE account_export_jobs;
    DROP TABLE security_events;
    DROP TABLE auth_rate_limits;
    DROP TABLE cosmetic_entitlements;
    DROP TABLE player_name_reservations;
    DROP TABLE player_name_history;
    DROP TABLE policy_acceptances;
    DROP TABLE user_roles;
    DROP TABLE account_tokens;
    DROP TABLE user_sessions;
    DROP TABLE user_credentials;

    ALTER TABLE player_profiles
      DROP CONSTRAINT player_profiles_local_storage_namespace_key,
      DROP CONSTRAINT player_profiles_starter_pair_check,
      DROP COLUMN local_storage_namespace,
      DROP COLUMN display_name_changed_at,
      DROP COLUMN starter_chosen_at,
      DROP COLUMN starter_definition_id;
    ALTER TABLE player_profiles ALTER COLUMN avatar_id SET DEFAULT 'avatar-tamer';
    ALTER TABLE player_profiles ALTER COLUMN frame_id SET DEFAULT 'frame-silver';

    ALTER TABLE users
      DROP CONSTRAINT users_deletion_window_check,
      DROP CONSTRAINT users_verified_active_check,
      DROP CONSTRAINT users_email_lifecycle_check,
      DROP CONSTRAINT users_status_check,
      DROP COLUMN deleted_at,
      DROP COLUMN delete_after,
      DROP COLUMN deletion_requested_at,
      DROP COLUMN locked_at,
      DROP COLUMN email_verified_at,
      ALTER COLUMN email_original SET NOT NULL,
      ALTER COLUMN email_normalized SET NOT NULL,
      ALTER COLUMN status SET DEFAULT 'active',
      ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'locked', 'deleted'));
  `);
};
