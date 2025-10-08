-- Migrate quiz data from local quiz-data.ts to Supabase quizzes table
-- This script inserts all the quiz data from the TypeScript file

-- Insert Basic Mathematics quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'math-basic',
    'Basic Mathematics',
    'Addition, subtraction, multiplication, and division',
    'Easy',
    '[
        {"id": 1, "question": "What is 5 + 3?", "type": "multiple_choice", "options": ["6", "7", "8", "9"], "correct_answer": "8", "points": 10},
        {"id": 2, "question": "What is 12 - 7?", "type": "multiple_choice", "options": ["4", "5", "6", "7"], "correct_answer": "5", "points": 10},
        {"id": 3, "question": "What is 4 × 6?", "type": "multiple_choice", "options": ["20", "22", "24", "26"], "correct_answer": "24", "points": 10},
        {"id": 4, "question": "What is 15 ÷ 3?", "type": "multiple_choice", "options": ["3", "4", "5", "6"], "correct_answer": "5", "points": 10},
        {"id": 5, "question": "What is 9 + 6?", "type": "multiple_choice", "options": ["14", "15", "16", "17"], "correct_answer": "15", "points": 10},
        {"id": 6, "question": "What is 20 - 8?", "type": "multiple_choice", "options": ["10", "11", "12", "13"], "correct_answer": "12", "points": 10},
        {"id": 7, "question": "What is 7 × 3?", "type": "multiple_choice", "options": ["19", "20", "21", "22"], "correct_answer": "21", "points": 10},
        {"id": 8, "question": "What is 24 ÷ 4?", "type": "multiple_choice", "options": ["5", "6", "7", "8"], "correct_answer": "6", "points": 10},
        {"id": 9, "question": "What is 8 + 7?", "type": "multiple_choice", "options": ["14", "15", "16", "17"], "correct_answer": "15", "points": 10},
        {"id": 10, "question": "What is 16 - 9?", "type": "multiple_choice", "options": ["6", "7", "8", "9"], "correct_answer": "7", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "10 minutes", "tags": ["math", "basic", "arithmetic"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert Science & Nature quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'science-nature',
    'Science & Nature',
    'Animals, plants, and natural phenomena',
    'Medium',
    '[
        {"id": 1, "question": "Which planet is closest to the Sun?", "type": "multiple_choice", "options": ["Venus", "Mercury", "Earth", "Mars"], "correct_answer": "Mercury", "points": 10},
        {"id": 2, "question": "What do bees make?", "type": "multiple_choice", "options": ["Milk", "Honey", "Butter", "Cheese"], "correct_answer": "Honey", "points": 10},
        {"id": 3, "question": "How many legs does a spider have?", "type": "multiple_choice", "options": ["6", "8", "10", "12"], "correct_answer": "8", "points": 10},
        {"id": 4, "question": "What gas do plants absorb from the air?", "type": "multiple_choice", "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], "correct_answer": "Carbon Dioxide", "points": 10},
        {"id": 5, "question": "Which animal is known as the King of the Jungle?", "type": "multiple_choice", "options": ["Tiger", "Lion", "Elephant", "Bear"], "correct_answer": "Lion", "points": 10},
        {"id": 6, "question": "What is the largest mammal in the world?", "type": "multiple_choice", "options": ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], "correct_answer": "Blue Whale", "points": 10},
        {"id": 7, "question": "How many chambers does a human heart have?", "type": "multiple_choice", "options": ["2", "3", "4", "5"], "correct_answer": "4", "points": 10},
        {"id": 8, "question": "What is the hardest natural substance?", "type": "multiple_choice", "options": ["Gold", "Iron", "Diamond", "Silver"], "correct_answer": "Diamond", "points": 10},
        {"id": 9, "question": "Which bird cannot fly?", "type": "multiple_choice", "options": ["Eagle", "Penguin", "Sparrow", "Robin"], "correct_answer": "Penguin", "points": 10},
        {"id": 10, "question": "What is the main source of energy for Earth?", "type": "multiple_choice", "options": ["Moon", "Sun", "Stars", "Wind"], "correct_answer": "Sun", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "15 minutes", "tags": ["science", "nature", "animals", "plants"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert World Geography quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'geography-world',
    'World Geography',
    'Countries, capitals, and landmarks',
    'Medium',
    '[
        {"id": 1, "question": "What is the capital of France?", "type": "multiple_choice", "options": ["London", "Berlin", "Paris", "Madrid"], "correct_answer": "Paris", "points": 10},
        {"id": 2, "question": "Which is the largest continent?", "type": "multiple_choice", "options": ["Africa", "Asia", "Europe", "North America"], "correct_answer": "Asia", "points": 10},
        {"id": 3, "question": "What is the longest river in the world?", "type": "multiple_choice", "options": ["Amazon", "Nile", "Mississippi", "Yangtze"], "correct_answer": "Nile", "points": 10},
        {"id": 4, "question": "Which country has the most time zones?", "type": "multiple_choice", "options": ["USA", "Russia", "China", "Canada"], "correct_answer": "Russia", "points": 10},
        {"id": 5, "question": "What is the smallest country in the world?", "type": "multiple_choice", "options": ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], "correct_answer": "Vatican City", "points": 10},
        {"id": 6, "question": "Which mountain range contains Mount Everest?", "type": "multiple_choice", "options": ["Andes", "Rockies", "Alps", "Himalayas"], "correct_answer": "Himalayas", "points": 10},
        {"id": 7, "question": "What is the capital of Australia?", "type": "multiple_choice", "options": ["Sydney", "Melbourne", "Canberra", "Perth"], "correct_answer": "Canberra", "points": 10},
        {"id": 8, "question": "Which desert is the largest in the world?", "type": "multiple_choice", "options": ["Sahara", "Gobi", "Kalahari", "Antarctic"], "correct_answer": "Antarctic", "points": 10},
        {"id": 9, "question": "What is the deepest ocean?", "type": "multiple_choice", "options": ["Atlantic", "Pacific", "Indian", "Arctic"], "correct_answer": "Pacific", "points": 10},
        {"id": 10, "question": "Which country is known as the Land of the Rising Sun?", "type": "multiple_choice", "options": ["China", "Japan", "Korea", "Thailand"], "correct_answer": "Japan", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "15 minutes", "tags": ["geography", "countries", "capitals", "landmarks"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert English Vocabulary quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'english-vocab',
    'English Vocabulary',
    'Words, meanings, and grammar',
    'Easy',
    '[
        {"id": 1, "question": "What does ''enormous'' mean?", "type": "multiple_choice", "options": ["Very small", "Very large", "Very fast", "Very slow"], "correct_answer": "Very large", "points": 10},
        {"id": 2, "question": "Which word is a synonym for ''happy''?", "type": "multiple_choice", "options": ["Sad", "Angry", "Joyful", "Tired"], "correct_answer": "Joyful", "points": 10},
        {"id": 3, "question": "What is the plural of ''child''?", "type": "multiple_choice", "options": ["Childs", "Children", "Childes", "Childrens"], "correct_answer": "Children", "points": 10},
        {"id": 4, "question": "What does ''ancient'' mean?", "type": "multiple_choice", "options": ["New", "Very old", "Broken", "Colorful"], "correct_answer": "Very old", "points": 10},
        {"id": 5, "question": "Which word rhymes with ''cat''?", "type": "multiple_choice", "options": ["Dog", "Hat", "Bird", "Fish"], "correct_answer": "Hat", "points": 10},
        {"id": 6, "question": "What is the opposite of ''hot''?", "type": "multiple_choice", "options": ["Warm", "Cool", "Cold", "Freezing"], "correct_answer": "Cold", "points": 10},
        {"id": 7, "question": "Which word means ''very tired''?", "type": "multiple_choice", "options": ["Exhausted", "Excited", "Happy", "Hungry"], "correct_answer": "Exhausted", "points": 10},
        {"id": 8, "question": "What is the past tense of ''run''?", "type": "multiple_choice", "options": ["Runned", "Ran", "Running", "Runs"], "correct_answer": "Ran", "points": 10},
        {"id": 9, "question": "Which word is an adjective?", "type": "multiple_choice", "options": ["Quickly", "Beautiful", "Running", "Yesterday"], "correct_answer": "Beautiful", "points": 10},
        {"id": 10, "question": "What does ''gigantic'' mean?", "type": "multiple_choice", "options": ["Tiny", "Huge", "Fast", "Slow"], "correct_answer": "Huge", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "12 minutes", "tags": ["english", "vocabulary", "grammar", "words"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert World History quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'history-world',
    'World History',
    'Important events and historical figures',
    'Hard',
    '[
        {"id": 1, "question": "Who was the first President of the United States?", "type": "multiple_choice", "options": ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], "correct_answer": "George Washington", "points": 10},
        {"id": 2, "question": "In which year did World War II end?", "type": "multiple_choice", "options": ["1944", "1945", "1946", "1947"], "correct_answer": "1945", "points": 10},
        {"id": 3, "question": "Who built the first pyramid in Egypt?", "type": "multiple_choice", "options": ["Khufu", "Imhotep", "Djoser", "Khafre"], "correct_answer": "Djoser", "points": 10},
        {"id": 4, "question": "Which empire was ruled by Julius Caesar?", "type": "multiple_choice", "options": ["Greek", "Roman", "Persian", "Egyptian"], "correct_answer": "Roman", "points": 10},
        {"id": 5, "question": "When did the Berlin Wall fall?", "type": "multiple_choice", "options": ["1987", "1988", "1989", "1990"], "correct_answer": "1989", "points": 10},
        {"id": 6, "question": "Who discovered America in 1492?", "type": "multiple_choice", "options": ["Vasco da Gama", "Christopher Columbus", "Ferdinand Magellan", "Marco Polo"], "correct_answer": "Christopher Columbus", "points": 10},
        {"id": 7, "question": "Which ancient wonder was in Alexandria?", "type": "multiple_choice", "options": ["Hanging Gardens", "Lighthouse", "Colossus", "Mausoleum"], "correct_answer": "Lighthouse", "points": 10},
        {"id": 8, "question": "Who was known as the Iron Lady?", "type": "multiple_choice", "options": ["Queen Elizabeth", "Margaret Thatcher", "Indira Gandhi", "Golda Meir"], "correct_answer": "Margaret Thatcher", "points": 10},
        {"id": 9, "question": "In which year did the Titanic sink?", "type": "multiple_choice", "options": ["1910", "1911", "1912", "1913"], "correct_answer": "1912", "points": 10},
        {"id": 10, "question": "Who painted the ceiling of the Sistine Chapel?", "type": "multiple_choice", "options": ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], "correct_answer": "Michelangelo", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "20 minutes", "tags": ["history", "world", "events", "figures"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert Art & Culture quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'art-culture',
    'Art & Culture',
    'Famous artists, paintings, and cultural facts',
    'Medium',
    '[
        {"id": 1, "question": "Who painted ''Starry Night''?", "type": "multiple_choice", "options": ["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Leonardo da Vinci"], "correct_answer": "Vincent van Gogh", "points": 10},
        {"id": 2, "question": "Which instrument has 88 keys?", "type": "multiple_choice", "options": ["Guitar", "Violin", "Piano", "Flute"], "correct_answer": "Piano", "points": 10},
        {"id": 3, "question": "What is the most famous painting in the Louvre?", "type": "multiple_choice", "options": ["The Scream", "Mona Lisa", "Starry Night", "Girl with a Pearl Earring"], "correct_answer": "Mona Lisa", "points": 10},
        {"id": 4, "question": "Who composed ''The Four Seasons''?", "type": "multiple_choice", "options": ["Mozart", "Beethoven", "Vivaldi", "Bach"], "correct_answer": "Vivaldi", "points": 10},
        {"id": 5, "question": "Which art movement did Picasso help create?", "type": "multiple_choice", "options": ["Impressionism", "Cubism", "Surrealism", "Expressionism"], "correct_answer": "Cubism", "points": 10},
        {"id": 6, "question": "What does ''Renaissance'' mean?", "type": "multiple_choice", "options": ["Rebirth", "Revolution", "Reform", "Renewal"], "correct_answer": "Rebirth", "points": 10},
        {"id": 7, "question": "Who sculpted ''David''?", "type": "multiple_choice", "options": ["Donatello", "Michelangelo", "Bernini", "Rodin"], "correct_answer": "Michelangelo", "points": 10},
        {"id": 8, "question": "Which dance originated in Argentina?", "type": "multiple_choice", "options": ["Salsa", "Tango", "Flamenco", "Waltz"], "correct_answer": "Tango", "points": 10},
        {"id": 9, "question": "What is the highest male singing voice?", "type": "multiple_choice", "options": ["Bass", "Baritone", "Tenor", "Countertenor"], "correct_answer": "Countertenor", "points": 10},
        {"id": 10, "question": "Who painted ''The Persistence of Memory''?", "type": "multiple_choice", "options": ["Salvador Dalí", "René Magritte", "Max Ernst", "Joan Miró"], "correct_answer": "Salvador Dalí", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "18 minutes", "tags": ["art", "culture", "paintings", "music"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert Music Basics quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'music-basics',
    'Music Basics',
    'Instruments, composers, and music theory',
    'Easy',
    '[
        {"id": 1, "question": "How many strings does a guitar typically have?", "type": "multiple_choice", "options": ["4", "5", "6", "7"], "correct_answer": "6", "points": 10},
        {"id": 2, "question": "What is the highest voice part in a choir?", "type": "multiple_choice", "options": ["Alto", "Soprano", "Tenor", "Bass"], "correct_answer": "Soprano", "points": 10},
        {"id": 3, "question": "Which composer wrote ''Ode to Joy''?", "type": "multiple_choice", "options": ["Mozart", "Beethoven", "Bach", "Chopin"], "correct_answer": "Beethoven", "points": 10},
        {"id": 4, "question": "How many keys are on a standard piano?", "type": "multiple_choice", "options": ["76", "88", "96", "104"], "correct_answer": "88", "points": 10},
        {"id": 5, "question": "What does ''forte'' mean in music?", "type": "multiple_choice", "options": ["Soft", "Loud", "Fast", "Slow"], "correct_answer": "Loud", "points": 10},
        {"id": 6, "question": "Which instrument is known as the ''king of instruments''?", "type": "multiple_choice", "options": ["Piano", "Violin", "Organ", "Trumpet"], "correct_answer": "Organ", "points": 10},
        {"id": 7, "question": "What are the lines that music is written on called?", "type": "multiple_choice", "options": ["Staff", "Scale", "Clef", "Measure"], "correct_answer": "Staff", "points": 10},
        {"id": 8, "question": "How many beats are in a whole note?", "type": "multiple_choice", "options": ["1", "2", "3", "4"], "correct_answer": "4", "points": 10},
        {"id": 9, "question": "Which family does the trumpet belong to?", "type": "multiple_choice", "options": ["String", "Woodwind", "Brass", "Percussion"], "correct_answer": "Brass", "points": 10},
        {"id": 10, "question": "What is the lowest male voice part?", "type": "multiple_choice", "options": ["Tenor", "Baritone", "Bass", "Alto"], "correct_answer": "Bass", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "12 minutes", "tags": ["music", "instruments", "composers", "theory"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert Fun Physics quiz
INSERT INTO quizzes (id, title, description, difficulty, questions, metadata) VALUES (
    'physics-fun',
    'Fun Physics',
    'Simple physics concepts and experiments',
    'Hard',
    '[
        {"id": 1, "question": "What is the speed of light?", "type": "multiple_choice", "options": ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"], "correct_answer": "300,000 km/s", "points": 10},
        {"id": 2, "question": "What force keeps us on the ground?", "type": "multiple_choice", "options": ["Magnetism", "Gravity", "Friction", "Pressure"], "correct_answer": "Gravity", "points": 10},
        {"id": 3, "question": "What happens to water at 100°C?", "type": "multiple_choice", "options": ["Freezes", "Boils", "Melts", "Evaporates"], "correct_answer": "Boils", "points": 10},
        {"id": 4, "question": "What is the unit of electric current?", "type": "multiple_choice", "options": ["Volt", "Watt", "Ampere", "Ohm"], "correct_answer": "Ampere", "points": 10},
        {"id": 5, "question": "Which color has the longest wavelength?", "type": "multiple_choice", "options": ["Red", "Blue", "Green", "Violet"], "correct_answer": "Red", "points": 10},
        {"id": 6, "question": "What is the formula for force?", "type": "multiple_choice", "options": ["F = ma", "F = mv", "F = mc²", "F = mgh"], "correct_answer": "F = ma", "points": 10},
        {"id": 7, "question": "What type of energy does a moving object have?", "type": "multiple_choice", "options": ["Potential", "Kinetic", "Thermal", "Chemical"], "correct_answer": "Kinetic", "points": 10},
        {"id": 8, "question": "What is the unit of frequency?", "type": "multiple_choice", "options": ["Meter", "Second", "Hertz", "Newton"], "correct_answer": "Hertz", "points": 10},
        {"id": 9, "question": "What happens to sound in a vacuum?", "type": "multiple_choice", "options": ["Gets louder", "Gets softer", "Cannot travel", "Changes pitch"], "correct_answer": "Cannot travel", "points": 10},
        {"id": 10, "question": "What is the acceleration due to gravity on Earth?", "type": "multiple_choice", "options": ["9.8 m/s²", "10 m/s²", "8.9 m/s²", "11 m/s²"], "correct_answer": "9.8 m/s²", "points": 10}
    ]'::jsonb,
    '{"total_points": 100, "estimated_time": "20 minutes", "tags": ["physics", "science", "experiments", "concepts"]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    questions = EXCLUDED.questions,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Verify the data was inserted correctly
SELECT 
    id,
    title,
    difficulty,
    jsonb_array_length(questions) as question_count,
    metadata->>'total_points' as total_points
FROM quizzes 
ORDER BY created_at;
