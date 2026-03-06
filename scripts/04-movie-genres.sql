-- ScreenDate - Movie Genres Schema
-- This script adds genre support to movies

-- ============================================================================
-- TABLE: genres (TMDB genres)
-- ============================================================================
CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY,  -- TMDB genre ID
  name VARCHAR(50) NOT NULL
);

-- Insert TMDB genres
INSERT INTO genres (id, name) VALUES
  (28, 'Action'),
  (12, 'Adventure'),
  (16, 'Animation'),
  (35, 'Comedy'),
  (80, 'Crime'),
  (99, 'Documentary'),
  (18, 'Drama'),
  (10751, 'Family'),
  (14, 'Fantasy'),
  (36, 'History'),
  (27, 'Horror'),
  (10402, 'Music'),
  (9648, 'Mystery'),
  (10749, 'Romance'),
  (878, 'Sci-Fi'),
  (10770, 'TV Movie'),
  (53, 'Thriller'),
  (10752, 'War'),
  (37, 'Western')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TABLE: movie_genres (Many-to-many relationship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- Add vote_average and vote_count to movies for filtering
ALTER TABLE movies ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3, 1) DEFAULT 0;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_movie_genres_movie ON movie_genres(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_genres ENABLE ROW LEVEL SECURITY;

-- Everyone can view genres
CREATE POLICY "Anyone can view genres" ON genres
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view movie genres" ON movie_genres
  FOR SELECT USING (true);

-- Only authenticated users can insert (for syncing)
CREATE POLICY "Authenticated users can insert movie genres" ON movie_genres
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
