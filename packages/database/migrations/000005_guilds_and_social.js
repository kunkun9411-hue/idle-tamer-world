/* eslint-disable camelcase */

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE player_social_state (
      player_id uuid PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
      revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
      guild_join_available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE guilds (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 32),
      name_normalized text NOT NULL UNIQUE,
      tag text NOT NULL CHECK (char_length(tag) BETWEEN 2 AND 5),
      tag_normalized text NOT NULL UNIQUE,
      description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 240),
      join_policy text NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open', 'invite')),
      member_limit integer NOT NULL DEFAULT 30 CHECK (member_limit BETWEEN 2 AND 100),
      dna_balance numeric(78,0) NOT NULL DEFAULT 0 CHECK (dna_balance >= 0),
      revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disbanded')),
      created_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      disbanded_at timestamptz
    );

    CREATE TABLE guild_members (
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      player_id uuid NOT NULL UNIQUE REFERENCES player_profiles(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
      contribution numeric(78,0) NOT NULL DEFAULT 0 CHECK (contribution >= 0),
      joined_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (guild_id, player_id)
    );
    CREATE UNIQUE INDEX guild_members_one_leader_idx ON guild_members (guild_id) WHERE role = 'leader';
    CREATE INDEX guild_members_guild_role_idx ON guild_members (guild_id, role, joined_at);

    CREATE TABLE guild_membership_history (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE RESTRICT,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      action text NOT NULL CHECK (action IN ('create', 'join', 'leave', 'kick', 'role_change')),
      actor_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE INDEX guild_membership_history_player_idx ON guild_membership_history (player_id, created_at DESC);

    CREATE TABLE guild_invites (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      invited_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      responded_at timestamptz
    );
    CREATE UNIQUE INDEX guild_invites_one_pending_idx ON guild_invites (guild_id, player_id) WHERE status = 'pending';

    CREATE TABLE guild_dna_nodes (
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      gene_id text NOT NULL,
      level integer NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 1000),
      updated_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (guild_id, gene_id)
    );

    CREATE TABLE guild_ledger (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE RESTRICT,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      command_id uuid NOT NULL,
      delta numeric(78,0) NOT NULL CHECK (delta <> 0),
      balance_before numeric(78,0) NOT NULL CHECK (balance_before >= 0),
      balance_after numeric(78,0) NOT NULL CHECK (balance_after >= 0),
      reason text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      FOREIGN KEY (player_id, command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK (balance_before + delta = balance_after)
    );
    CREATE INDEX guild_ledger_guild_created_idx ON guild_ledger (guild_id, created_at DESC, id);
    REVOKE UPDATE, DELETE ON guild_ledger FROM PUBLIC;

    CREATE TABLE guild_tasks (
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      period_key text NOT NULL,
      definition_id text NOT NULL,
      progress numeric(78,0) NOT NULL DEFAULT 0 CHECK (progress >= 0),
      target numeric(78,0) NOT NULL CHECK (target > 0),
      reward_dna numeric(78,0) NOT NULL CHECK (reward_dna > 0),
      claimed_at timestamptz,
      claimed_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      claimed_by_command_id uuid,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (guild_id, period_key, definition_id),
      FOREIGN KEY (claimed_by_player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK ((claimed_at IS NULL) = (claimed_by_command_id IS NULL))
    );

    CREATE TABLE guild_bosses (
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      period_key text NOT NULL,
      definition_id text NOT NULL,
      hp numeric(78,0) NOT NULL CHECK (hp >= 0),
      max_hp numeric(78,0) NOT NULL CHECK (max_hp > 0),
      defeated_at timestamptz,
      rewarded_by_command_id uuid,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (guild_id, period_key),
      CHECK (hp <= max_hp),
      CHECK ((hp = 0) = (defeated_at IS NOT NULL))
    );

    CREATE TABLE guild_boss_attacks (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL,
      period_key text NOT NULL,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      command_id uuid NOT NULL,
      damage numeric(78,0) NOT NULL CHECK (damage > 0),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      UNIQUE (player_id, command_id),
      FOREIGN KEY (guild_id, period_key) REFERENCES guild_bosses(guild_id, period_key) ON DELETE RESTRICT,
      FOREIGN KEY (player_id, command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT
    );
    CREATE INDEX guild_boss_attacks_cooldown_idx ON guild_boss_attacks (guild_id, player_id, created_at DESC);

    CREATE TABLE guild_votes (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      kind text NOT NULL CHECK (kind IN ('gene_upgrade', 'policy_change')),
      payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
      status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'passed', 'rejected', 'expired')),
      created_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      closes_at timestamptz NOT NULL,
      resolved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE INDEX guild_votes_open_idx ON guild_votes (guild_id, closes_at) WHERE status = 'open';

    CREATE TABLE guild_vote_ballots (
      vote_id uuid NOT NULL REFERENCES guild_votes(id) ON DELETE CASCADE,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      choice text NOT NULL CHECK (choice IN ('yes', 'no')),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (vote_id, player_id)
    );

    CREATE TABLE guild_expeditions (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      definition_id text NOT NULL,
      started_by_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      started_by_command_id uuid NOT NULL,
      started_at timestamptz NOT NULL,
      completes_at timestamptz NOT NULL,
      reward_dna numeric(78,0) NOT NULL CHECK (reward_dna > 0),
      claimed_at timestamptz,
      claimed_by_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      claimed_by_command_id uuid,
      FOREIGN KEY (started_by_player_id, started_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      FOREIGN KEY (claimed_by_player_id, claimed_by_command_id) REFERENCES game_commands(player_id, command_id) ON DELETE RESTRICT,
      CHECK (completes_at > started_at),
      CHECK ((claimed_at IS NULL) = (claimed_by_command_id IS NULL))
    );
    CREATE UNIQUE INDEX guild_expeditions_one_open_idx ON guild_expeditions (guild_id) WHERE claimed_at IS NULL;

    CREATE TABLE guild_chat_messages (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 280),
      moderation_status text NOT NULL DEFAULT 'visible' CHECK (moderation_status IN ('visible', 'blocked', 'removed')),
      moderation_reason text,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      removed_at timestamptz
    );
    CREATE INDEX guild_chat_messages_visible_idx ON guild_chat_messages (guild_id, created_at DESC) WHERE moderation_status = 'visible';

    CREATE TABLE player_friendships (
      player_low_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      player_high_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      requested_by_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      accepted_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (player_low_id, player_high_id),
      CHECK (player_low_id < player_high_id),
      CHECK (requested_by_player_id IN (player_low_id, player_high_id)),
      CHECK ((status = 'accepted') = (accepted_at IS NOT NULL))
    );

    CREATE TABLE player_blocks (
      blocker_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      blocked_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (blocker_player_id, blocked_player_id),
      CHECK (blocker_player_id <> blocked_player_id)
    );

    CREATE TABLE player_reports (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      reporter_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      reported_player_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE RESTRICT,
      guild_id uuid REFERENCES guilds(id) ON DELETE SET NULL,
      message_id uuid REFERENCES guild_chat_messages(id) ON DELETE SET NULL,
      reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'cheating', 'name', 'other')),
      details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
      status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      resolved_at timestamptz,
      CHECK (reporter_player_id <> reported_player_id)
    );
    CREATE INDEX player_reports_open_idx ON player_reports (status, created_at) WHERE status IN ('open', 'reviewing');

    CREATE TABLE moderation_actions (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      moderator_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      target_player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
      report_id uuid REFERENCES player_reports(id) ON DELETE SET NULL,
      action text NOT NULL CHECK (action IN ('warn', 'mute', 'remove_message', 'lock_account', 'dismiss')),
      reason text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    INSERT INTO player_social_state (player_id)
      SELECT id FROM player_profiles ON CONFLICT DO NOTHING;

    INSERT INTO wallet_balances (player_id, definition_id, amount)
      SELECT id, 'guild_dna', 100 FROM player_profiles ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE moderation_actions;
    DROP TABLE player_reports;
    DROP TABLE player_blocks;
    DROP TABLE player_friendships;
    DROP TABLE guild_chat_messages;
    DROP TABLE guild_expeditions;
    DROP TABLE guild_vote_ballots;
    DROP TABLE guild_votes;
    DROP TABLE guild_boss_attacks;
    DROP TABLE guild_bosses;
    DROP TABLE guild_tasks;
    DROP TABLE guild_ledger;
    DROP TABLE guild_dna_nodes;
    DROP TABLE guild_invites;
    DROP TABLE guild_membership_history;
    DROP TABLE guild_members;
    DROP TABLE guilds;
    DROP TABLE player_social_state;
    DELETE FROM wallet_balances WHERE definition_id = 'guild_dna';
  `);
};
