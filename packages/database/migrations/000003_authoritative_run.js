/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE player_runs (
      player_id uuid PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
      revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
      active_monster_definition_id text NOT NULL,
      current_zone_id text NOT NULL DEFAULT 'violet-rim',
      highest_zone_number integer NOT NULL DEFAULT 1 CHECK (highest_zone_number BETWEEN 1 AND 1000000),
      run_victories numeric(78,0) NOT NULL DEFAULT 0 CHECK (run_victories >= 0),
      total_victories numeric(78,0) NOT NULL DEFAULT 0 CHECK (total_victories >= 0),
      progression_status text NOT NULL DEFAULT 'fighting' CHECK (progression_status IN ('fighting', 'blocked', 'cache_full')),
      next_combat_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '7 seconds'),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE player_run_levels (
      player_id uuid NOT NULL REFERENCES player_runs(player_id) ON DELETE CASCADE,
      monster_definition_id text NOT NULL,
      level integer NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 1000000),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, monster_definition_id)
    );

    CREATE TABLE player_zone_progress (
      player_id uuid NOT NULL REFERENCES player_runs(player_id) ON DELETE CASCADE,
      zone_id text NOT NULL,
      stage integer NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 1000000),
      clears numeric(78,0) NOT NULL DEFAULT 0 CHECK (clears >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, zone_id)
    );

    CREATE TABLE pending_reward_batches (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_runs(player_id) ON DELETE CASCADE,
      source text NOT NULL CHECK (source IN ('combat')),
      gold numeric(78,0) NOT NULL CHECK (gold > 0),
      slot_count integer NOT NULL CHECK (slot_count BETWEEN 1 AND 90),
      victory_count integer NOT NULL CHECK (victory_count BETWEEN 1 AND 90),
      content_release_id text NOT NULL,
      balance_release_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      claimed_at timestamptz,
      claimed_by_command_id uuid,
      FOREIGN KEY (player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK ((claimed_at IS NULL) = (claimed_by_command_id IS NULL))
    );
    CREATE UNIQUE INDEX pending_reward_batches_one_open_idx ON pending_reward_batches (player_id) WHERE claimed_at IS NULL;
    CREATE INDEX pending_reward_batches_history_idx ON pending_reward_batches (player_id, created_at DESC, id);

    INSERT INTO player_runs (player_id, active_monster_definition_id)
      SELECT id, starter_definition_id
        FROM player_profiles
       WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO player_run_levels (player_id, monster_definition_id)
      SELECT id, starter_definition_id
        FROM player_profiles
       WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO player_zone_progress (player_id, zone_id)
      SELECT id, 'violet-rim'
        FROM player_profiles
       WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO wallet_balances (player_id, definition_id, amount)
      SELECT id, 'gold', 100
        FROM player_profiles
       WHERE starter_definition_id IS NOT NULL
      ON CONFLICT (player_id, definition_id) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE pending_reward_batches;
    DROP TABLE player_zone_progress;
    DROP TABLE player_run_levels;
    DROP TABLE player_runs;
  `);
};
