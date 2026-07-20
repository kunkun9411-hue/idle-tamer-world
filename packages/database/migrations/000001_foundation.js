/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      email_original text NOT NULL,
      email_normalized text NOT NULL UNIQUE,
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'deleted')),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE player_profiles (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
      display_name text NOT NULL,
      display_name_normalized text NOT NULL UNIQUE,
      rank integer NOT NULL DEFAULT 1 CHECK (rank BETWEEN 1 AND 1000000),
      avatar_id text NOT NULL DEFAULT 'avatar-tamer',
      frame_id text NOT NULL DEFAULT 'frame-silver',
      revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
      content_release_id text NOT NULL,
      balance_release_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE content_releases (
      content_release_id text PRIMARY KEY,
      balance_release_id text NOT NULL,
      published_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      is_active boolean NOT NULL DEFAULT false,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    );
    CREATE UNIQUE INDEX content_releases_one_active_idx ON content_releases (is_active) WHERE is_active;

    CREATE TABLE wallet_balances (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      amount numeric(78,0) NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE item_balances (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      amount numeric(78,0) NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE game_commands (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      command_id uuid NOT NULL,
      client_instance_id uuid NOT NULL,
      request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
      command_type text NOT NULL,
      expected_revision bigint NOT NULL CHECK (expected_revision >= 0),
      resulting_revision bigint CHECK (resulting_revision >= 0),
      status text NOT NULL CHECK (status IN ('processing', 'accepted', 'rejected')),
      error_code text,
      response_snapshot jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      completed_at timestamptz,
      UNIQUE (player_id, command_id),
      CHECK ((status = 'processing' AND completed_at IS NULL) OR status <> 'processing')
    );
    CREATE INDEX game_commands_player_created_idx ON game_commands (player_id, created_at DESC);

    CREATE TABLE economy_ledger (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      command_id uuid NOT NULL,
      asset_kind text NOT NULL CHECK (asset_kind IN ('wallet', 'item')),
      definition_id text NOT NULL,
      delta numeric(78,0) NOT NULL CHECK (delta <> 0),
      balance_before numeric(78,0) NOT NULL CHECK (balance_before >= 0),
      balance_after numeric(78,0) NOT NULL CHECK (balance_after >= 0),
      reason text NOT NULL,
      content_release_id text NOT NULL,
      balance_release_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      FOREIGN KEY (player_id, command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK (balance_before + delta = balance_after)
    );
    CREATE INDEX economy_ledger_player_created_idx ON economy_ledger (player_id, created_at DESC, id);
    CREATE INDEX economy_ledger_player_command_idx ON economy_ledger (player_id, command_id);

    REVOKE UPDATE, DELETE ON economy_ledger FROM PUBLIC;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE economy_ledger;
    DROP TABLE game_commands;
    DROP TABLE item_balances;
    DROP TABLE wallet_balances;
    DROP TABLE content_releases;
    DROP TABLE player_profiles;
    DROP TABLE users;
  `);
};
