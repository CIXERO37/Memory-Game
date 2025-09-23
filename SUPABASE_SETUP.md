# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `memory-quiz-game`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Project Credentials

1. Go to your project dashboard
2. Click on "Settings" → "API"
3. Copy the following values:
   - Project URL
   - Anon public key

## 3. Setup Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Setup Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor"
3. Run the following scripts in order:

### Step 1: Create Tables
```sql
-- Run scripts/01_create_tables.sql
```

### Step 2: Enable RLS
```sql
-- Run scripts/02_enable_rls.sql
```

### Step 3: Create Functions
```sql
-- Run scripts/03_create_functions.sql
```

### Step 4: Create Triggers
```sql
-- Run scripts/04_create_triggers.sql
```

### Step 5: Seed Data (Optional)
```sql
-- Run scripts/05_seed_data.sql
```

## 5. Enable Realtime

1. Go to "Database" → "Replication"
2. Make sure "supabase_realtime" publication is enabled
3. All tables should be included in the publication

## 6. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a room and join with multiple players
3. Check the Supabase dashboard to see data being created
4. Verify realtime updates work across different browser tabs

## 7. Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Deploy your application

### Other Platforms
Make sure to set the environment variables in your deployment platform.

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env.local` file exists
   - Verify the variable names are correct
   - Restart your development server

2. **"Room not found"**
   - Check if the database tables were created
   - Verify RLS policies are set up correctly
   - Check browser console for errors

3. **Realtime not working**
   - Verify realtime is enabled in Supabase dashboard
   - Check if the publication includes all tables
   - Look for WebSocket connection errors in browser console

4. **Database connection issues**
   - Verify your Supabase URL and key are correct
   - Check if your project is paused (free tier limitation)
   - Ensure your IP is not blocked

### Debug Mode

Add this to your `.env.local` for more detailed logging:
```env
NEXT_PUBLIC_DEBUG=true
```

## Features Enabled

With Supabase integration, you now have:

✅ **Persistent Data**: Rooms and players persist across browser sessions
✅ **Cross-Device Support**: Join from any device with the room code
✅ **Real-time Updates**: Live synchronization across all connected clients
✅ **Scalable Architecture**: Can handle multiple concurrent games
✅ **Data Analytics**: Track game statistics and player performance
✅ **Backup & Recovery**: Automatic data backup and recovery
✅ **Security**: Row Level Security (RLS) for data protection

## Next Steps

1. **Authentication**: Add user authentication for better player management
2. **Analytics**: Implement game statistics and leaderboards
3. **Customization**: Add more quiz types and game modes
4. **Mobile App**: Create mobile apps using the same Supabase backend
5. **Admin Panel**: Build an admin dashboard for managing games
