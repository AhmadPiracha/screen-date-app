# ScreenDate

A dating app that matches people based on their movie preferences. Swipe through movies, find someone with similar taste, and start a conversation!

## Features

- **Phone Authentication** - Secure login with phone number verification
- **Movie Discovery** - Browse and like movies from TMDB database
- **Smart Matching** - Get matched with users who share your movie preferences
- **Location-Based** - Find matches in your city
- **Real-time Chat** - Message your matches instantly
- **Profile Customization** - Upload photos and personalize your profile
- **Block & Report** - Safety features to protect users

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (profile images)
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion
- **Movie API**: TMDB (The Movie Database)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- TMDB API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/screendate.git
cd screendate
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_API_KEY=your_tmdb_api_key
TMDB_API_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ScreenDate
```

5. Set up the database:
   - Go to Supabase Dashboard → SQL Editor
   - Run the scripts in order:
     - `scripts/01-init-schema.sql` - Creates tables
     - `scripts/02-auth-trigger.sql` - Sets up auth triggers
     - `scripts/03-fix-rls-policies.sql` - Configures RLS policies
     - `scripts/04-storage-bucket.sql` - Creates avatar storage bucket

6. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User accounts with phone and location |
| `profiles` | User profile info (name, bio, avatar) |
| `movies` | Cached movie data from TMDB |
| `user_movies` | Movies each user has liked |
| `likes` | User-to-user likes |
| `matches` | Confirmed matches (mutual likes + shared movie) |
| `messages` | Chat messages between matched users |
| `blocked_users` | Block list |
| `reports` | User reports |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/signin` | POST | Login with email |
| `/api/auth/logout` | POST | Logout |
| `/api/users/me` | GET | Get current user |
| `/api/users/profile` | GET/PUT | Get/update profile |
| `/api/users/avatar` | POST | Upload profile image |
| `/api/users/movies` | GET/POST | Get/save liked movies |
| `/api/matches/discover` | GET | Find potential matches |
| `/api/matches` | GET/POST | Get matches / create match |
| `/api/conversations` | GET | Get all conversations |
| `/api/messages` | GET/POST | Get/send messages |
| `/api/users/block` | POST | Block a user |
| `/api/users/report` | POST | Report a user |

## Deployment

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and import the repository

3. Add environment variables in Vercel project settings

4. Deploy!

5. Update Supabase settings:
   - Add your Vercel URL to Authentication → URL Configuration
   - Add to both Site URL and Redirect URLs

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `TMDB_API_KEY` | Yes | TMDB API key |
| `TMDB_API_BASE_URL` | Yes | TMDB API base URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL |
| `NEXT_PUBLIC_APP_NAME` | Yes | App display name |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | For reverse geocoding |
| `TWILIO_ACCOUNT_SID` | No | For SMS OTP |
| `TWILIO_AUTH_TOKEN` | No | For SMS OTP |
| `TWILIO_VERIFY_SERVICE_SID` | No | For SMS OTP |

## License

MIT
