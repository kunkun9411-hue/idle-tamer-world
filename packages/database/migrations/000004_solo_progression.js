/* eslint-disable camelcase */

const activities = [
  "victory", "boss_victory", "cache_claim", "hatch", "monster_discovery",
  "level_up", "hyper_up", "evolution", "gem_equip", "prestige",
  "expedition_start", "expedition_complete",
];

const research = ["power", "vitality", "extraction", "incubation"];

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE economy_ledger DROP CONSTRAINT economy_ledger_asset_kind_check;
    ALTER TABLE economy_ledger ADD CONSTRAINT economy_ledger_asset_kind_check
      CHECK (asset_kind IN ('wallet', 'item', 'egg', 'fragment', 'gem'));

    ALTER TABLE player_runs
      ADD COLUMN support_monster_definition_id text,
      ADD COLUMN prestige_count integer NOT NULL DEFAULT 0 CHECK (prestige_count BETWEEN 0 AND 1000000),
      ADD COLUMN egg_pity integer NOT NULL DEFAULT 0 CHECK (egg_pity BETWEEN 0 AND 1000000);

    ALTER TABLE pending_reward_batches
      DROP CONSTRAINT pending_reward_batches_slot_count_check,
      DROP CONSTRAINT pending_reward_batches_victory_count_check,
      ADD COLUMN egg_drops jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN item_drops jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN gem_drops jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD CONSTRAINT pending_reward_batches_egg_drops_object CHECK (jsonb_typeof(egg_drops) = 'object'),
      ADD CONSTRAINT pending_reward_batches_item_drops_object CHECK (jsonb_typeof(item_drops) = 'object'),
      ADD CONSTRAINT pending_reward_batches_gem_drops_object CHECK (jsonb_typeof(gem_drops) = 'object'),
      ADD CONSTRAINT pending_reward_batches_slot_count_check CHECK (slot_count BETWEEN 1 AND 1000),
      ADD CONSTRAINT pending_reward_batches_victory_count_check CHECK (victory_count BETWEEN 1 AND 1000);

    CREATE TABLE monster_instances (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      hyper_level integer NOT NULL DEFAULT 0 CHECK (hyper_level BETWEEN 0 AND 1000000),
      evolution text NOT NULL DEFAULT 'rookie' CHECK (evolution IN ('rookie', 'evolved')),
      generation integer NOT NULL DEFAULT 1 CHECK (generation BETWEEN 1 AND 1000000),
      discovered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      UNIQUE (player_id, definition_id),
      UNIQUE (player_id, id)
    );

    CREATE TABLE egg_balances (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      amount numeric(78,0) NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE monster_fragments (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      amount numeric(78,0) NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE gem_balances (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      amount numeric(78,0) NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE monster_gem_slots (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      monster_instance_id uuid NOT NULL,
      shape text NOT NULL CHECK (shape IN ('triangle', 'square', 'diamond')),
      gem_definition_id text NOT NULL,
      equipped_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (monster_instance_id, shape),
      FOREIGN KEY (player_id, monster_instance_id) REFERENCES monster_instances(player_id, id) ON DELETE CASCADE
    );
    CREATE INDEX monster_gem_slots_player_idx ON monster_gem_slots (player_id, monster_instance_id);

    CREATE TABLE incubation_jobs (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'hatched')),
      started_at timestamptz NOT NULL,
      completes_at timestamptz NOT NULL,
      completed_at timestamptz,
      completed_by_command_id uuid,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      FOREIGN KEY (player_id, completed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK (completes_at > started_at),
      CHECK ((status = 'running' AND completed_at IS NULL AND completed_by_command_id IS NULL) OR (status = 'hatched' AND completed_at IS NOT NULL AND completed_by_command_id IS NOT NULL))
    );
    CREATE UNIQUE INDEX incubation_jobs_one_running_idx ON incubation_jobs (player_id) WHERE status = 'running';
    CREATE INDEX incubation_jobs_history_idx ON incubation_jobs (player_id, created_at DESC);

    CREATE TABLE research_levels (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      definition_id text NOT NULL CHECK (definition_id IN ('power', 'vitality', 'extraction', 'incubation')),
      level integer NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 1000000),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, definition_id)
    );

    CREATE TABLE timed_expeditions (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      slot integer NOT NULL CHECK (slot BETWEEN 1 AND 16),
      definition_id text NOT NULL,
      monster_instance_id uuid NOT NULL,
      reward_multiplier numeric(8,4) NOT NULL CHECK (reward_multiplier BETWEEN 1 AND 10),
      status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'claimed')),
      started_at timestamptz NOT NULL,
      completes_at timestamptz NOT NULL,
      claimed_at timestamptz,
      claimed_by_command_id uuid,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      FOREIGN KEY (player_id, monster_instance_id) REFERENCES monster_instances(player_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK (completes_at > started_at),
      CHECK ((status = 'running' AND claimed_at IS NULL AND claimed_by_command_id IS NULL) OR (status = 'claimed' AND claimed_at IS NOT NULL AND claimed_by_command_id IS NOT NULL))
    );
    CREATE UNIQUE INDEX timed_expeditions_running_slot_idx ON timed_expeditions (player_id, slot) WHERE status = 'running';
    CREATE UNIQUE INDEX timed_expeditions_running_monster_idx ON timed_expeditions (player_id, monster_instance_id) WHERE status = 'running';
    CREATE INDEX timed_expeditions_history_idx ON timed_expeditions (player_id, created_at DESC);

    CREATE TABLE player_activity_counters (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      activity_id text NOT NULL,
      amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, activity_id)
    );

    CREATE TABLE player_objective_periods (
      player_id uuid PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
      daily_key text NOT NULL,
      weekly_key text NOT NULL,
      daily_baseline jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(daily_baseline) = 'object'),
      weekly_baseline jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(weekly_baseline) = 'object'),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE player_objective_claims (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      claim_key text NOT NULL,
      definition_id text NOT NULL,
      claimed_by_command_id uuid NOT NULL,
      claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, claim_key),
      FOREIGN KEY (player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT
    );

    CREATE TABLE player_milestone_claims (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      target integer NOT NULL CHECK (target > 0),
      claimed_by_command_id uuid NOT NULL,
      claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, target),
      FOREIGN KEY (player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT
    );

    CREATE TABLE player_settings (
      player_id uuid PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
      sound_enabled boolean NOT NULL DEFAULT true,
      combat_effects boolean NOT NULL DEFAULT true,
      reduced_motion boolean NOT NULL DEFAULT false,
      number_format text NOT NULL DEFAULT 'compact' CHECK (number_format IN ('compact', 'full')),
      tutorial_step integer NOT NULL DEFAULT 0 CHECK (tutorial_step BETWEEN 0 AND 1000),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE player_message_claims (
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      message_id text NOT NULL,
      claimed_by_command_id uuid NOT NULL,
      claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_id, message_id),
      FOREIGN KEY (player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT
    );

    CREATE TABLE content_release_audit (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      content_release_id text NOT NULL REFERENCES content_releases(content_release_id) ON DELETE RESTRICT,
      action text NOT NULL CHECK (action IN ('preview', 'activate', 'rollback')),
      actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      previous_content_release_id text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE INDEX content_release_audit_created_idx ON content_release_audit (created_at DESC);
  `);

  pgm.sql(`
    INSERT INTO monster_instances (player_id, definition_id)
      SELECT id, starter_definition_id FROM player_profiles WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO item_balances (player_id, definition_id, amount)
      SELECT p.id, seed.definition_id, seed.amount
        FROM player_profiles p
        CROSS JOIN (VALUES ('training_data', 2), ('incubator_charge', 1), ('evolution_core', 0), ('ether_dust', 0)) AS seed(definition_id, amount)
       WHERE p.starter_definition_id IS NOT NULL
      ON CONFLICT (player_id, definition_id) DO NOTHING;

    INSERT INTO egg_balances (player_id, definition_id, amount)
      SELECT id, 'mossbit', 1 FROM player_profiles WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO gem_balances (player_id, definition_id, amount)
      SELECT p.id, seed.definition_id, 1
        FROM player_profiles p
        CROSS JOIN (VALUES ('common-crimson-triangle'), ('common-azure-square'), ('common-violet-diamond')) AS seed(definition_id)
       WHERE p.starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO wallet_balances (player_id, definition_id, amount)
      SELECT id, 'ether_core', 0 FROM player_profiles WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO research_levels (player_id, definition_id, level)
      SELECT p.id, seed.definition_id, 0
        FROM player_profiles p CROSS JOIN (VALUES ${research.map((id) => `('${id}')`).join(", ")}) AS seed(definition_id)
       WHERE p.starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO player_activity_counters (player_id, activity_id, amount)
      SELECT p.id, seed.activity_id, 0
        FROM player_profiles p CROSS JOIN (VALUES ${activities.map((id) => `('${id}')`).join(", ")}) AS seed(activity_id)
       WHERE p.starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO player_objective_periods (player_id, daily_key, weekly_key)
      SELECT id, to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), to_char(clock_timestamp() AT TIME ZONE 'UTC', 'IYYY-"W"IW')
        FROM player_profiles WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;

    INSERT INTO player_settings (player_id)
      SELECT id FROM player_profiles WHERE starter_definition_id IS NOT NULL
      ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE content_release_audit;
    DROP TABLE player_message_claims;
    DROP TABLE player_settings;
    DROP TABLE player_milestone_claims;
    DROP TABLE player_objective_claims;
    DROP TABLE player_objective_periods;
    DROP TABLE player_activity_counters;
    DROP TABLE timed_expeditions;
    DROP TABLE research_levels;
    DROP TABLE incubation_jobs;
    DROP TABLE monster_gem_slots;
    DROP TABLE gem_balances;
    DROP TABLE monster_fragments;
    DROP TABLE egg_balances;
    DROP TABLE monster_instances;

    ALTER TABLE pending_reward_batches
      DROP CONSTRAINT pending_reward_batches_victory_count_check,
      DROP CONSTRAINT pending_reward_batches_slot_count_check,
      DROP CONSTRAINT pending_reward_batches_gem_drops_object,
      DROP CONSTRAINT pending_reward_batches_item_drops_object,
      DROP CONSTRAINT pending_reward_batches_egg_drops_object,
      DROP COLUMN gem_drops,
      DROP COLUMN item_drops,
      DROP COLUMN egg_drops,
      ADD CONSTRAINT pending_reward_batches_slot_count_check CHECK (slot_count BETWEEN 1 AND 90),
      ADD CONSTRAINT pending_reward_batches_victory_count_check CHECK (victory_count BETWEEN 1 AND 90);

    ALTER TABLE player_runs
      DROP COLUMN egg_pity,
      DROP COLUMN prestige_count,
      DROP COLUMN support_monster_definition_id;

    ALTER TABLE economy_ledger DROP CONSTRAINT economy_ledger_asset_kind_check;
    ALTER TABLE economy_ledger ADD CONSTRAINT economy_ledger_asset_kind_check CHECK (asset_kind IN ('wallet', 'item'));
  `);
};
