-- ============================================================================
-- Fix RLS policies for likes and matches
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- LIKES TABLE - Add missing policy to check if someone liked you
-- ============================================================================

-- Allow users to see likes where they are the recipient
CREATE POLICY "Users can view received likes"
  ON likes FOR SELECT
  USING (auth.uid() = to_user_id);

-- ============================================================================
-- MATCHES TABLE - Add missing INSERT policy
-- ============================================================================

-- Allow users to create matches (when mutual like occurs)
CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- ============================================================================
-- Verification queries (run these to confirm policies exist)
-- ============================================================================
-- SELECT * FROM pg_policies WHERE tablename IN ('likes', 'matches');
