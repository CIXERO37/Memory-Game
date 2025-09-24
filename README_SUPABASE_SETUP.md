# Supabase Quiz System Setup Guide

This guide will help you set up the Supabase database for the quiz system with JSONB storage.

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be ready

## 2. Database Setup

### Run SQL Scripts

Execute the following SQL scripts in your Supabase SQL Editor (in order):

1. **Create Tables** (`sql/01_create_tables.sql`):

   ```sql
   -- Copy and paste the content from sql/01_create_tables.sql
   ```

2. **Seed Data** (`sql/02_seed_data.sql`):
   ```sql
   -- Copy and paste the content from sql/02_seed_data.sql
   ```

## 3. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from:

- Supabase Dashboard → Your Project → Settings → API
- Copy the "Project URL" and "anon/public" key

## 4. Database Schema

### Tables Structure:

#### `quiz_categories`

- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

#### `quizzes`

- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `description` (TEXT)
- `difficulty` (Easy/Medium/Hard)
- `category_id` (UUID, Foreign Key)
- `created_at`, `updated_at` (TIMESTAMP)

#### `questions`

- `id` (UUID, Primary Key)
- `quiz_id` (UUID, Foreign Key)
- `question_data` (JSONB) ← **Main feature!**
- `created_at`, `updated_at` (TIMESTAMP)

### JSONB Structure for Questions:

```json
{
  "question": "What is 2 + 2?",
  "type": "multiple_choice",
  "options": ["3", "4", "5", "6"],
  "correct_answer": "4",
  "explanation": "Basic addition: 2 + 2 = 4",
  "points": 10
}
```

## 5. Features

### JSONB Benefits:

- **Flexible schema**: Add new question types without schema changes
- **Performance**: Indexed JSON queries with GIN indexes
- **PostgreSQL native**: Full JSON query support
- **Type safety**: TypeScript interfaces for structure

### Query Examples:

```sql
-- Find questions with specific text
SELECT * FROM questions
WHERE question_data->>'question' ILIKE '%math%';

-- Get multiple choice questions only
SELECT * FROM questions
WHERE question_data->>'type' = 'multiple_choice';

-- Find questions worth more than 15 points
SELECT * FROM questions
WHERE (question_data->>'points')::int > 15;

-- Search within options
SELECT * FROM questions
WHERE question_data->'options' ? 'JavaScript';
```

## 6. API Usage

The system provides hooks for easy data fetching:

```typescript
// Fetch all quizzes
const { quizzes, loading, error } = useQuizzes();

// Fetch specific quiz with questions
const { quiz } = useQuiz(quizId);

// Fetch questions for a quiz
const { questions } = useQuizQuestions(quizId);
```

## 7. Row Level Security (Optional)

For production, consider adding RLS policies:

```sql
-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quiz_categories FOR SELECT USING (true);
```

## 8. Testing

1. Start your Next.js development server
2. Navigate to `/select-quiz`
3. You should see quizzes loaded from Supabase
4. Check browser console for any errors

## 9. Adding New Questions

Use the JSONB format to add questions with different structures:

```sql
-- True/False question
INSERT INTO questions (quiz_id, question_data) VALUES (
  'quiz-uuid-here',
  '{
    "question": "The Earth is flat.",
    "type": "true_false",
    "correct_answer": "false",
    "explanation": "The Earth is an oblate spheroid.",
    "points": 5
  }'
);

-- Text input question
INSERT INTO questions (quiz_id, question_data) VALUES (
  'quiz-uuid-here',
  '{
    "question": "What is the capital of France?",
    "type": "text",
    "correct_answer": "Paris",
    "explanation": "Paris is the capital and largest city of France.",
    "points": 10
  }'
);
```

This setup provides a flexible, scalable quiz system using Supabase with JSONB for dynamic question storage!
