-- Sample JSON Queries for Consolidated Quiz System
-- These demonstrate the power of storing everything as JSON in a single table

-- 1. Get all quizzes with basic information
SELECT 
  id, 
  title, 
  difficulty,
  jsonb_array_length(questions) as question_count
FROM quizzes 
ORDER BY created_at DESC;

-- 2. Find quizzes by difficulty
SELECT * FROM quizzes 
WHERE difficulty = 'Easy';

-- 3. Search questions by content (case-insensitive)
SELECT 
  title,
  difficulty,
  jsonb_array_elements(questions) as question
FROM quizzes 
WHERE questions::text ILIKE '%square root%';

-- 4. Get all multiple choice questions across all quizzes
SELECT 
  title as quiz_title,
  elem->>'question' as question,
  elem->'options' as options,
  elem->>'correct_answer' as correct_answer
FROM quizzes,
jsonb_array_elements(questions) as elem
WHERE elem->>'type' = 'multiple_choice';

-- 5. Find quizzes with questions worth more than 15 points
SELECT DISTINCT title, difficulty
FROM quizzes,
jsonb_array_elements(questions) as q
WHERE (q->>'points')::int > 15;

-- 6. Get quiz statistics
SELECT 
  title,
  difficulty,
  jsonb_array_length(questions) as question_count
FROM quizzes;

-- 7. Find quizzes by difficulty
SELECT title, difficulty
FROM quizzes 
WHERE difficulty = 'Easy';

-- 8. Get questions by difficulty and points
SELECT 
  title,
  difficulty,
  elem->>'question' as question,
  (elem->>'points')::int as points
FROM quizzes,
jsonb_array_elements(questions) as elem
WHERE difficulty = 'Hard' 
  AND (elem->>'points')::int >= 20
ORDER BY (elem->>'points')::int DESC;

-- 9. Count questions by type across all quizzes
SELECT 
  elem->>'type' as question_type,
  COUNT(*) as count
FROM quizzes,
jsonb_array_elements(questions) as elem
GROUP BY elem->>'type';

-- 10. Find quizzes with specific options in their questions
SELECT title, elem->>'question' as question
FROM quizzes,
jsonb_array_elements(questions) as elem
WHERE elem->'options' ? 'JavaScript';

-- 11. Get quiz count by difficulty
SELECT 
  difficulty,
  COUNT(*) as quiz_count
FROM quizzes 
GROUP BY difficulty
ORDER BY quiz_count DESC;

-- 12. Find incomplete quizzes (less than 3 questions)
SELECT title, jsonb_array_length(questions) as question_count
FROM quizzes 
WHERE jsonb_array_length(questions) < 3;

-- 13. Search across all text content
SELECT 
  title,
  difficulty,
  description
FROM quizzes 
WHERE 
  title ILIKE '%math%' 
  OR description ILIKE '%math%'
  OR questions::text ILIKE '%math%';

-- 14. Get quiz complexity score (based on difficulty and question count)
SELECT 
  title,
  difficulty,
  jsonb_array_length(questions) as question_count,
  CASE 
    WHEN difficulty = 'Easy' THEN jsonb_array_length(questions) * 1
    WHEN difficulty = 'Medium' THEN jsonb_array_length(questions) * 1.5
    WHEN difficulty = 'Hard' THEN jsonb_array_length(questions) * 2
  END as complexity_score
FROM quizzes 
ORDER BY complexity_score DESC;

-- 15. Update a quiz to add a new question
UPDATE quizzes 
SET 
  questions = questions || '[{
    "id": "new_q1",
    "question": "What is 10 × 10?",
    "type": "multiple_choice",
    "options": ["90", "100", "110", "120"],
    "correct_answer": "100",
    "points": 5
  }]'::jsonb
WHERE title = 'Basic Math Quiz';

-- 16. Remove a specific question by ID
UPDATE quizzes 
SET 
  questions = (
    SELECT jsonb_agg(q)
    FROM jsonb_array_elements(questions) AS q
    WHERE q->>'id' != 'math_q1'
  )
WHERE title = 'Basic Math Quiz';

-- 17. Update quiz description
UPDATE quizzes 
SET description = description || ' (Updated)'
WHERE difficulty = 'Easy';

-- 18. Full-text search with ranking
SELECT 
  title,
  difficulty,
  ts_rank(
    to_tsvector('english', title || ' ' || description || ' ' || questions::text),
    plainto_tsquery('english', 'mathematics calculation')
  ) as rank
FROM quizzes 
WHERE to_tsvector('english', title || ' ' || description || ' ' || questions::text) 
      @@ plainto_tsquery('english', 'mathematics calculation')
ORDER BY rank DESC;

-- 19. Difficulty statistics with JSON aggregation
SELECT 
  difficulty,
  COUNT(*) as quiz_count,
  AVG(jsonb_array_length(questions)) as avg_questions,
  jsonb_agg(DISTINCT title) as quiz_titles
FROM quizzes 
GROUP BY difficulty
ORDER BY quiz_count DESC;

-- 20. Export quiz data as formatted JSON
SELECT jsonb_pretty(
  jsonb_build_object(
    'quiz_id', id,
    'title', title,
    'description', description,
    'difficulty', difficulty,
    'question_count', jsonb_array_length(questions),
    'questions', questions
  )
) as formatted_quiz
FROM quizzes 
WHERE title = 'Basic Math Quiz';
