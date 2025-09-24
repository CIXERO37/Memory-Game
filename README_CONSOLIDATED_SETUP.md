# Supabase Consolidated Quiz System Setup Guide

This guide will help you set up the simplified Supabase database for the quiz system with consolidated JSON storage in a single table.

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be ready

## 2. Database Setup

### Run SQL Scripts

Execute the following SQL scripts in your Supabase SQL Editor (in order):

1. **Create Tables** (`sql/01_create_tables.sql`)
2. **Seed Data** (`sql/02_seed_data.sql`)

## 3. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from:

- Supabase Dashboard → Your Project → Settings → API
- Copy the "Project URL" and "anon/public" key

## 4. Simplified Database Schema

### ⭐ Single Table Design - No Foreign Keys!

#### `quizzes` (Only table needed!)

```sql
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category JSONB NOT NULL,        -- ← Category data as JSON
  questions JSONB NOT NULL,       -- ← All questions as JSON array
  metadata JSONB DEFAULT '{}',    -- ← Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. Complete JSON Structure Examples

### Category JSON:

```json
{
  "name": "Mathematics",
  "description": "Mathematical concepts and problem solving",
  "icon": "📊",
  "color": "#3b82f6"
}
```

### Questions JSON Array:

```json
[
  {
    "id": "math_q1",
    "question": "What is 15 + 23?",
    "type": "multiple_choice",
    "options": ["35", "38", "40", "42"],
    "correct_answer": "38",
    "explanation": "15 + 23 = 38",
    "points": 10
  },
  {
    "id": "math_q2",
    "question": "What is the square root of 64?",
    "type": "multiple_choice",
    "options": ["6", "7", "8", "9"],
    "correct_answer": "8",
    "explanation": "√64 = 8 because 8 × 8 = 64",
    "points": 10
  }
]
```

### Metadata JSON:

```json
{
  "total_points": 30,
  "estimated_time": "5 minutes",
  "tags": ["basic", "arithmetic", "beginner"]
}
```

## 6. Benefits of Consolidated Design

### 🎯 Advantages:

- **Simplified Schema**: Only one table to manage
- **No Foreign Keys**: Easier relationships and queries
- **Atomic Operations**: All quiz data in one record
- **Flexible JSON**: Easy to add new fields without migrations
- **Better Performance**: Single table queries
- **Easier Backups**: Self-contained quiz records

### 📊 JSON Indexing:

```sql
-- Fast category searches
CREATE INDEX idx_quizzes_category_name ON quizzes USING gin((category->>'name'));

-- Full-text search on questions
CREATE INDEX idx_quizzes_questions ON quizzes USING gin(questions);

-- Metadata searching
CREATE INDEX idx_quizzes_metadata ON quizzes USING gin(metadata);
```

## 7. Powerful JSON Queries

### Search by Category:

```sql
SELECT * FROM quizzes
WHERE category->>'name' = 'Mathematics';
```

### Find Questions by Content:

```sql
SELECT * FROM quizzes
WHERE questions @> '[{"question": "What is 15 + 23?"}]';
```

### Filter by Points:

```sql
SELECT * FROM quizzes
WHERE (metadata->>'total_points')::int > 40;
```

### Search by Tags:

```sql
SELECT * FROM quizzes
WHERE metadata->'tags' ? 'beginner';
```

### Complex Question Search:

```sql
SELECT title, jsonb_array_elements(questions) as question
FROM quizzes
WHERE jsonb_array_elements(questions)->>'type' = 'multiple_choice';
```

## 8. API Usage

The system provides comprehensive hooks for data management:

```typescript
// Fetch all quizzes
const { quizzes, loading, error } = useQuizzes();

// Fetch specific quiz
const { quiz } = useQuiz(quizId);

// Search quizzes
const { quizzes } = useSearchQuizzes(searchTerm);

// Filter by difficulty
const { quizzes } = useQuizzesByDifficulty("Easy");

// Filter by category
const { quizzes } = useQuizzesByCategory("Mathematics");
```

## 9. Adding New Quizzes

### Example Insert:

```sql
INSERT INTO quizzes (title, description, difficulty, category, questions, metadata)
VALUES (
  'Advanced Calculus',
  'Test your calculus knowledge',
  'Hard',
  '{
    "name": "Mathematics",
    "description": "Advanced mathematical concepts",
    "icon": "∫",
    "color": "#3b82f6"
  }',
  '[
    {
      "id": "calc_q1",
      "question": "What is the derivative of x²?",
      "type": "multiple_choice",
      "options": ["x", "2x", "x²", "2"],
      "correct_answer": "2x",
      "explanation": "The derivative of x² is 2x using the power rule",
      "points": 25
    }
  ]',
  '{
    "total_points": 25,
    "estimated_time": "15 minutes",
    "tags": ["calculus", "derivatives", "advanced"]
  }'
);
```

## 10. Migration from Old Schema

If migrating from the previous multi-table design:

```sql
-- Migrate existing data
INSERT INTO quizzes (title, description, difficulty, category, questions, metadata)
SELECT
  q.title,
  q.description,
  q.difficulty,
  jsonb_build_object('name', c.name, 'description', c.description),
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', questions.id,
        'question', questions.question_data->>'question',
        'type', questions.question_data->>'type',
        'options', questions.question_data->'options',
        'correct_answer', questions.question_data->>'correct_answer',
        'explanation', questions.question_data->>'explanation',
        'points', (questions.question_data->>'points')::int
      )
    ), '[]'::jsonb
  ),
  '{}'::jsonb
FROM quizzes q
JOIN quiz_categories c ON q.category_id = c.id
LEFT JOIN questions ON questions.quiz_id = q.id
GROUP BY q.id, q.title, q.description, q.difficulty, c.name, c.description;
```

This consolidated design provides maximum flexibility while maintaining simplicity and performance!
