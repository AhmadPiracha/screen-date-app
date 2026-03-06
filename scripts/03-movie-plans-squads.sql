-- ScreenDate - Movie Plans & Squads Schema
-- This script adds tables for Tonight's Movie Plans, Group Watch, and Invite System

-- ============================================================================
-- TABLE: movie_plans (Users planning to watch a movie tonight/soon)
-- ============================================================================
CREATE TABLE IF NOT EXISTS movie_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  planned_time TIME,
  cinema_name VARCHAR(255),
  city VARCHAR(100),
  looking_for_company BOOLEAN DEFAULT TRUE,
  max_companions INTEGER DEFAULT 1,
  note TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id, planned_date)
);

-- ============================================================================
-- TABLE: movie_squads (Group watch events - 3-5 people)
-- ============================================================================
CREATE TABLE IF NOT EXISTS movie_squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  planned_date DATE NOT NULL,
  planned_time TIME,
  cinema_name VARCHAR(255),
  city VARCHAR(100),
  max_members INTEGER DEFAULT 5 CHECK (max_members >= 2 AND max_members <= 10),
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'full', 'watching', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: squad_members (Members of a movie squad)
-- ============================================================================
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id UUID NOT NULL REFERENCES movie_squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(squad_id, user_id)
);

-- ============================================================================
-- TABLE: invites (Referral/invite system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE: match_shares (Track shared match images)
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_code VARCHAR(20) UNIQUE NOT NULL,
  platform VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_movie_plans_user_id ON movie_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_plans_movie_id ON movie_plans(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_plans_date ON movie_plans(planned_date);
CREATE INDEX IF NOT EXISTS idx_movie_plans_city ON movie_plans(city);
CREATE INDEX IF NOT EXISTS idx_movie_plans_status ON movie_plans(status);

CREATE INDEX IF NOT EXISTS idx_movie_squads_creator ON movie_squads(creator_id);
CREATE INDEX IF NOT EXISTS idx_movie_squads_movie ON movie_squads(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_squads_date ON movie_squads(planned_date);
CREATE INDEX IF NOT EXISTS idx_movie_squads_city ON movie_squads(city);
CREATE INDEX IF NOT EXISTS idx_movie_squads_status ON movie_squads(status);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);

CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(invite_code);

CREATE INDEX IF NOT EXISTS idx_match_shares_match ON match_shares(match_id);
CREATE INDEX IF NOT EXISTS idx_match_shares_code ON match_shares(share_code);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE movie_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_shares ENABLE ROW LEVEL SECURITY;

-- Movie Plans policies
CREATE POLICY "Users can view active movie plans" ON movie_plans
  FOR SELECT USING (status = 'active' AND looking_for_company = TRUE);

CREATE POLICY "Users can manage own movie plans" ON movie_plans
  FOR ALL USING (auth.uid() = user_id);

-- Movie Squads policies
CREATE POLICY "Users can view public squads" ON movie_squads
  FOR SELECT USING (is_public = TRUE AND status IN ('open', 'full'));

CREATE POLICY "Users can manage own squads" ON movie_squads
  FOR ALL USING (auth.uid() = creator_id);

-- Squad Members policies
CREATE POLICY "Squad members can view squad members" ON squad_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM movie_squads ms WHERE ms.id = squad_members.squad_id AND ms.is_public = TRUE)
  );

CREATE POLICY "Users can join public squads" ON squad_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM movie_squads ms WHERE ms.id = squad_id AND ms.is_public = TRUE AND ms.status = 'open')
  );

CREATE POLICY "Users can leave squads" ON squad_members
  FOR DELETE USING (auth.uid() = user_id);

-- Invites policies
CREATE POLICY "Users can view own invites" ON invites
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invites" ON invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Match Shares policies
CREATE POLICY "Match participants can share" ON match_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_shares.match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );
