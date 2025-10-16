# Quiz Category Migration Instructions

## Problem

The quiz cards are showing "GENERAL" for all quizzes because the database still has the old `difficulty` field instead of the new `category` field.

## Solution

I've implemented a fallback system that will:

1. **Try to fetch from Supabase database** (if available and has category data)
2. **Fall back to local quiz data** (which has correct categories) if Supabase fails or returns empty results
3. **Map quiz titles to categories** automatically if the database doesn't have category field yet

## Immediate Fix

The application will now automatically use the local quiz data with correct categories as a fallback, so you should see the proper categories immediately:

- **Science Fundamentals** → **SCIENCE** (green badge)
- **Programming Basics** → **TECHNOLOGY** (blue badge)
- **World History** → **HISTORY** (yellow badge)
- **Basic Math Quiz** → **MATHEMATICS** (red badge)

## Database Migration (Optional)

To update your Supabase database to use the new category system:

1. **Run the migration script** in your Supabase SQL editor:

   ```sql
   -- Copy and paste the contents of scripts/15_migrate_difficulty_to_category.sql
   ```

2. **Or manually update** your quizzes table:

   ```sql
   -- Add category column
   ALTER TABLE quizzes ADD COLUMN category VARCHAR(50);

   -- Update existing quizzes
   UPDATE quizzes SET category = 'Mathematics' WHERE title ILIKE '%math%';
   UPDATE quizzes SET category = 'Science' WHERE title ILIKE '%science%';
   UPDATE quizzes SET category = 'Technology' WHERE title ILIKE '%programming%';
   UPDATE quizzes SET category = 'History' WHERE title ILIKE '%history%';
   -- ... etc

   -- Make category NOT NULL
   ALTER TABLE quizzes ALTER COLUMN category SET NOT NULL;

   -- Drop old difficulty column
   ALTER TABLE quizzes DROP COLUMN difficulty;
   ```

## Testing

1. **Restart your development server**
2. **Navigate to the select-quiz page**
3. **You should now see the correct categories** on each quiz card

The fallback system ensures the application works correctly regardless of database state.
