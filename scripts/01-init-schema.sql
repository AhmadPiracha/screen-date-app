-- ScreenDate - Initial Database Schema
-- This script creates all tables, indexes, and RLS policies for the MVP

-- ============================================================================
-- EXTENSION: Enable UUID support
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users (Core user accounts - links to Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: profiles (User profile information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  looking_for_gender VARCHAR(50),
  age INTEGER,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: movies (Movie database, synced from TMDB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_url TEXT,
  release_date DATE,
  overview TEXT,
  popularity DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: user_movies (Movies selected by each user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- ============================================================================
-- TABLE: likes (Like/dislike interactions between users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT TRUE,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================================================
-- TABLE: matches (When two users both like each other)
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user1_id != user2_id),
  UNIQUE(user1_id, user2_id)
);

-- ============================================================================
-- TABLE: messages (Chat messages between matched users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: reports (User reports for moderation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (reporter_id != reported_user_id)
);

-- ============================================================================
-- TABLE: blocked_users (Users blocked by others)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (blocker_id != blocked_user_id),
  UNIQUE(blocker_id, blocked_user_id)
);

-- ============================================================================
-- INDEXES: Query optimization
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

-- Movies indexes
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity);

-- User movies indexes
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_movie_id ON user_movies(movie_id);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_from_user ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_from_to ON likes(from_user_id, to_user_id);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);

-- Blocked users indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE - RLS Policies
-- ============================================================================

-- Users can view their own full profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can view limited public profile data
CREATE POLICY "Users can view public user data"
  ON users FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() = id THEN TRUE
      WHEN NOT EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE (blocker_id = id AND blocked_user_id = auth.uid()) 
           OR (blocker_id = auth.uid() AND blocked_user_id = id)
      ) THEN TRUE
      ELSE FALSE
    END
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- New user signup
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROFILES TABLE - RLS Policies
-- ============================================================================

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view other profiles (if not blocked)
CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = user_id AND blocked_user_id = auth.uid()) 
         OR (blocker_id = auth.uid() AND blocked_user_id = user_id)
    )
  );

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MOVIES TABLE - RLS Policies (Public read-only)
-- ============================================================================

-- Everyone can view movies
CREATE POLICY "Movies are public"
  ON movies FOR SELECT
  USING (TRUE);

-- Only authenticated users can insert movies (admin/service role)
CREATE POLICY "Service role can insert movies"
  ON movies FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- USER_MOVIES TABLE - RLS Policies
-- ============================================================================

-- Users can view their own movie selections
CREATE POLICY "Users can view own movies"
  ON user_movies FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public movie selections (if not blocked)
CREATE POLICY "Users can view other user movies"
  ON user_movies FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = user_id AND blocked_user_id = auth.uid()) 
         OR (blocker_id = auth.uid() AND blocked_user_id = user_id)
    )
  );

-- Users can add movies to their selection
CREATE POLICY "Users can add movies to own selection"
  ON user_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their movie selections
CREATE POLICY "Users can delete own movie selection"
  ON user_movies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- LIKES TABLE - RLS Policies
-- ============================================================================

-- Users can view their own likes
CREATE POLICY "Users can view own likes"
  ON likes FOR SELECT
  USING (auth.uid() = from_user_id);

-- Users can view likes received (to check for mutual likes)
CREATE POLICY "Users can view received likes"
  ON likes FOR SELECT
  USING (auth.uid() = to_user_id);

-- Users can insert likes
CREATE POLICY "Users can like profiles"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update their likes (change from like to dislike)
CREATE POLICY "Users can update own likes"
  ON likes FOR UPDATE
  USING (auth.uid() = from_user_id);

-- Users can delete their likes
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = from_user_id);

-- ============================================================================
-- MATCHES TABLE - RLS Policies
-- ============================================================================

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can create matches (when mutual like occurs)
CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================================
-- MESSAGES TABLE - RLS Policies
-- ============================================================================

-- Users can view messages from their matches
CREATE POLICY "Users can view match messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE messages.match_id = matches.id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Users can send messages in their matches
CREATE POLICY "Users can send messages in matches"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE messages.match_id = matches.id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- REPORTS TABLE - RLS Policies
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- BLOCKED_USERS TABLE - RLS Policies
-- ============================================================================

-- Users can view their own blocked list
CREATE POLICY "Users can view own blocked list"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block other users
CREATE POLICY "Users can block users"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock users
CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================================================
-- END OF SCHEMA MIGRATION
-- ============================================================================
