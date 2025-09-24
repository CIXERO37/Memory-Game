-- Insert consolidated quiz data with JSON structure
INSERT INTO quizzes (title, description, difficulty, questions) VALUES

-- Basic Math Quiz
('Basic Math Quiz', 'Test your basic mathematical skills', 'Easy', '[
  {
    "id": "math_q1",
    "question": "What is 15 + 23?",
    "type": "multiple_choice",
    "options": ["35", "38", "40", "42"],
    "correct_answer": "38",
    "points": 10
  },
  {
    "id": "math_q2",
    "question": "What is the square root of 64?",
    "type": "multiple_choice",
    "options": ["6", "7", "8", "9"],
    "correct_answer": "8",
    "points": 10
  },
  {
    "id": "math_q3",
    "question": "What is 12 × 7?",
    "type": "multiple_choice",
    "options": ["82", "84", "86", "88"],
    "correct_answer": "84",
    "points": 10
  },
  {
    "id": "math_q4",
    "question": "What is 45 ÷ 9?",
    "type": "multiple_choice",
    "options": ["4", "5", "6", "7"],
    "correct_answer": "5",
    "points": 10
  },
  {
    "id": "math_q5",
    "question": "What is 8² (8 squared)?",
    "type": "multiple_choice",
    "options": ["64", "16", "32", "48"],
    "correct_answer": "64",
    "points": 10
  },
  {
    "id": "math_q6",
    "question": "What is 3/4 of 20?",
    "type": "multiple_choice",
    "options": ["12", "15", "16", "18"],
    "correct_answer": "15",
    "points": 10
  },
  {
    "id": "math_q7",
    "question": "What is 25% of 80?",
    "type": "multiple_choice",
    "options": ["15", "20", "25", "30"],
    "correct_answer": "20",
    "points": 10
  },
  {
    "id": "math_q8",
    "question": "What is 7 + 8 × 2?",
    "type": "multiple_choice",
    "options": ["22", "30", "23", "15"],
    "correct_answer": "23",
    "points": 10
  },
  {
    "id": "math_q9",
    "question": "What is the area of a rectangle with length 6 and width 4?",
    "type": "multiple_choice",
    "options": ["20", "24", "28", "32"],
    "correct_answer": "24",
    "points": 10
  },
  {
    "id": "math_q10",
    "question": "What is 144 ÷ 12?",
    "type": "multiple_choice",
    "options": ["10", "11", "12", "13"],
    "correct_answer": "12",
    "points": 10
  },
  {
    "id": "math_q11",
    "question": "What is 5! (5 factorial)?",
    "type": "multiple_choice",
    "options": ["100", "120", "150", "200"],
    "correct_answer": "120",
    "points": 10
  },
  {
    "id": "math_q12",
    "question": "What is 2³ + 3²?",
    "type": "multiple_choice",
    "options": ["15", "17", "19", "21"],
    "correct_answer": "17",
    "points": 10
  },
  {
    "id": "math_q13",
    "question": "What is the perimeter of a square with side length 5?",
    "type": "multiple_choice",
    "options": ["15", "20", "25", "30"],
    "correct_answer": "20",
    "points": 10
  },
  {
    "id": "math_q14",
    "question": "What is 0.5 × 8?",
    "type": "multiple_choice",
    "options": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "points": 10
  },
  {
    "id": "math_q15",
    "question": "What is 1/2 + 1/4?",
    "type": "multiple_choice",
    "options": ["1/6", "2/6", "3/4", "1/3"],
    "correct_answer": "3/4",
    "points": 10
  },
  {
    "id": "math_q16",
    "question": "What is 9 × 6?",
    "type": "multiple_choice",
    "options": ["54", "56", "58", "60"],
    "correct_answer": "54",
    "points": 10
  },
  {
    "id": "math_q17",
    "question": "What is 100 ÷ 4?",
    "type": "multiple_choice",
    "options": ["20", "25", "30", "35"],
    "correct_answer": "25",
    "points": 10
  },
  {
    "id": "math_q18",
    "question": "What is 3³ (3 cubed)?",
    "type": "multiple_choice",
    "options": ["9", "18", "27", "36"],
    "correct_answer": "27",
    "points": 10
  },
  {
    "id": "math_q19",
    "question": "What is 2/3 of 18?",
    "type": "multiple_choice",
    "options": ["10", "12", "14", "16"],
    "correct_answer": "12",
    "points": 10
  },
  {
    "id": "math_q20",
    "question": "What is 15% of 200?",
    "type": "multiple_choice",
    "options": ["25", "30", "35", "40"],
    "correct_answer": "30",
    "points": 10
  },
  {
    "id": "math_q21",
    "question": "What is 4 + 5 × 3?",
    "type": "multiple_choice",
    "options": ["19", "27", "17", "21"],
    "correct_answer": "19",
    "points": 10
  },
  {
    "id": "math_q22",
    "question": "What is the circumference of a circle with radius 7? (Use π ≈ 3.14)",
    "type": "multiple_choice",
    "options": ["21.98", "43.96", "153.86", "307.72"],
    "correct_answer": "43.96",
    "points": 10
  },
  {
    "id": "math_q23",
    "question": "What is 6! (6 factorial)?",
    "type": "multiple_choice",
    "options": ["600", "720", "840", "960"],
    "correct_answer": "720",
    "points": 10
  },
  {
    "id": "math_q24",
    "question": "What is 3⁴ - 2³?",
    "type": "multiple_choice",
    "options": ["73", "79", "81", "85"],
    "correct_answer": "73",
    "points": 10
  },
  {
    "id": "math_q25",
    "question": "What is the area of a triangle with base 8 and height 6?",
    "type": "multiple_choice",
    "options": ["20", "24", "28", "32"],
    "correct_answer": "24",
    "points": 10
  },
  {
    "id": "math_q26",
    "question": "What is 0.25 × 16?",
    "type": "multiple_choice",
    "options": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "points": 10
  },
  {
    "id": "math_q27",
    "question": "What is 1/3 + 2/3?",
    "type": "multiple_choice",
    "options": ["1/6", "2/6", "1", "2"],
    "correct_answer": "1",
    "points": 10
  },
  {
    "id": "math_q28",
    "question": "What is 11 × 11?",
    "type": "multiple_choice",
    "options": ["111", "121", "131", "141"],
    "correct_answer": "121",
    "points": 10
  },
  {
    "id": "math_q29",
    "question": "What is 144 ÷ 9?",
    "type": "multiple_choice",
    "options": ["14", "15", "16", "17"],
    "correct_answer": "16",
    "points": 10
  },
  {
    "id": "math_q30",
    "question": "What is 5² + 4²?",
    "type": "multiple_choice",
    "options": ["39", "41", "43", "45"],
    "correct_answer": "41",
    "points": 10
  },
  {
    "id": "math_q31",
    "question": "What is 20% of 150?",
    "type": "multiple_choice",
    "options": ["25", "30", "35", "40"],
    "correct_answer": "30",
    "points": 10
  },
  {
    "id": "math_q32",
    "question": "What is 7 + 8 - 3 × 2?",
    "type": "multiple_choice",
    "options": ["9", "12", "15", "18"],
    "correct_answer": "9",
    "points": 10
  },
  {
    "id": "math_q33",
    "question": "What is the volume of a cube with side length 3?",
    "type": "multiple_choice",
    "options": ["9", "18", "27", "36"],
    "correct_answer": "27",
    "points": 10
  },
  {
    "id": "math_q34",
    "question": "What is 1/5 of 100?",
    "type": "multiple_choice",
    "options": ["15", "20", "25", "30"],
    "correct_answer": "20",
    "points": 10
  },
  {
    "id": "math_q35",
    "question": "What is 13 × 7?",
    "type": "multiple_choice",
    "options": ["81", "91", "101", "111"],
    "correct_answer": "91",
    "points": 10
  },
  {
    "id": "math_q36",
    "question": "What is 200 ÷ 8?",
    "type": "multiple_choice",
    "options": ["20", "25", "30", "35"],
    "correct_answer": "25",
    "points": 10
  },
  {
    "id": "math_q37",
    "question": "What is 4⁰ (4 to the power of 0)?",
    "type": "multiple_choice",
    "options": ["0", "1", "4", "16"],
    "correct_answer": "1",
    "points": 10
  },
  {
    "id": "math_q38",
    "question": "What is 3/5 as a percentage?",
    "type": "multiple_choice",
    "options": ["50%", "60%", "70%", "80%"],
    "correct_answer": "60%",
    "points": 10
  },
  {
    "id": "math_q39",
    "question": "What is 6 + 7 × 2 - 3?",
    "type": "multiple_choice",
    "options": ["15", "17", "19", "21"],
    "correct_answer": "17",
    "points": 10
  },
  {
    "id": "math_q40",
    "question": "What is the perimeter of a rectangle with length 10 and width 5?",
    "type": "multiple_choice",
    "options": ["25", "30", "35", "40"],
    "correct_answer": "30",
    "points": 10
  },
  {
    "id": "math_q41",
    "question": "What is 0.75 × 12?",
    "type": "multiple_choice",
    "options": ["8", "9", "10", "11"],
    "correct_answer": "9",
    "points": 10
  },
  {
    "id": "math_q42",
    "question": "What is 1/4 + 3/8?",
    "type": "multiple_choice",
    "options": ["4/12", "5/8", "6/12", "7/8"],
    "correct_answer": "5/8",
    "points": 10
  },
  {
    "id": "math_q43",
    "question": "What is 15 × 4?",
    "type": "multiple_choice",
    "options": ["50", "60", "70", "80"],
    "correct_answer": "60",
    "points": 10
  },
  {
    "id": "math_q44",
    "question": "What is 180 ÷ 6?",
    "type": "multiple_choice",
    "options": ["25", "30", "35", "40"],
    "correct_answer": "30",
    "points": 10
  },
  {
    "id": "math_q45",
    "question": "What is 2⁵ (2 to the 5th power)?",
    "type": "multiple_choice",
    "options": ["16", "24", "32", "40"],
    "correct_answer": "32",
    "points": 10
  },
  {
    "id": "math_q46",
    "question": "What is 50% of 80?",
    "type": "multiple_choice",
    "options": ["30", "40", "50", "60"],
    "correct_answer": "40",
    "points": 10
  },
  {
    "id": "math_q47",
    "question": "What is 9 + 6 ÷ 2?",
    "type": "multiple_choice",
    "options": ["6", "9", "12", "15"],
    "correct_answer": "12",
    "points": 10
  },
  {
    "id": "math_q48",
    "question": "What is the area of a square with side length 7?",
    "type": "multiple_choice",
    "options": ["42", "49", "56", "63"],
    "correct_answer": "49",
    "points": 10
  },
  {
    "id": "math_q49",
    "question": "What is 1.5 × 8?",
    "type": "multiple_choice",
    "options": ["10", "12", "14", "16"],
    "correct_answer": "12",
    "points": 10
  },
  {
    "id": "math_q50",
    "question": "What is 2/3 - 1/6?",
    "type": "multiple_choice",
    "options": ["1/6", "1/3", "1/2", "2/3"],
    "correct_answer": "1/2",
    "points": 10
  }
]'),

-- Science Fundamentals
('Science Fundamentals', 'General science knowledge test', 'Medium', '[
  {
    "id": "sci_q1",
    "question": "What is the chemical symbol for water?",
    "type": "multiple_choice",
    "options": ["H2O", "HO2", "H3O", "OH2"],
    "correct_answer": "H2O",
    "points": 15
  },
  {
    "id": "sci_q2",
    "question": "How many planets are in our solar system?",
    "type": "multiple_choice",
    "options": ["7", "8", "9", "10"],
    "correct_answer": "8",
    "points": 15
  },
  {
    "id": "sci_q3",
    "question": "What gas do plants absorb from the atmosphere?",
    "type": "multiple_choice",
    "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    "correct_answer": "Carbon Dioxide",
    "points": 15
  },
  {
    "id": "sci_q4",
    "question": "What is the speed of light in vacuum?",
    "type": "multiple_choice",
    "options": ["300,000 km/s", "299,792,458 m/s", "186,000 miles/s", "All of the above"],
    "correct_answer": "All of the above",
    "points": 15
  },
  {
    "id": "sci_q5",
    "question": "What is the chemical symbol for gold?",
    "type": "multiple_choice",
    "options": ["Go", "Gd", "Au", "Ag"],
    "correct_answer": "Au",
    "points": 15
  },
  {
    "id": "sci_q6",
    "question": "What is the largest planet in our solar system?",
    "type": "multiple_choice",
    "options": ["Earth", "Saturn", "Jupiter", "Neptune"],
    "correct_answer": "Jupiter",
    "points": 15
  },
  {
    "id": "sci_q7",
    "question": "What is the process by which plants make their own food?",
    "type": "multiple_choice",
    "options": ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
    "correct_answer": "Photosynthesis",
    "points": 15
  },
  {
    "id": "sci_q8",
    "question": "What is the hardest natural substance on Earth?",
    "type": "multiple_choice",
    "options": ["Gold", "Iron", "Diamond", "Quartz"],
    "correct_answer": "Diamond",
    "points": 15
  },
  {
    "id": "sci_q9",
    "question": "What is the unit of electric current?",
    "type": "multiple_choice",
    "options": ["Volt", "Ampere", "Watt", "Ohm"],
    "correct_answer": "Ampere",
    "points": 15
  },
  {
    "id": "sci_q10",
    "question": "What is the most abundant gas in Earth''s atmosphere?",
    "type": "multiple_choice",
    "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    "correct_answer": "Nitrogen",
    "points": 15
  },
  {
    "id": "sci_q11",
    "question": "What is the center of an atom called?",
    "type": "multiple_choice",
    "options": ["Nucleus", "Core", "Center", "Hub"],
    "correct_answer": "Nucleus",
    "points": 15
  },
  {
    "id": "sci_q12",
    "question": "What is the process of liquid turning into gas?",
    "type": "multiple_choice",
    "options": ["Condensation", "Evaporation", "Sublimation", "Freezing"],
    "correct_answer": "Evaporation",
    "points": 15
  },
  {
    "id": "sci_q13",
    "question": "What is the chemical formula for table salt?",
    "type": "multiple_choice",
    "options": ["NaCl", "KCl", "CaCl", "MgCl"],
    "correct_answer": "NaCl",
    "points": 15
  },
  {
    "id": "sci_q14",
    "question": "What is the force that pulls objects toward Earth?",
    "type": "multiple_choice",
    "options": ["Magnetism", "Gravity", "Friction", "Tension"],
    "correct_answer": "Gravity",
    "points": 15
  },
  {
    "id": "sci_q15",
    "question": "What is the smallest unit of matter?",
    "type": "multiple_choice",
    "options": ["Molecule", "Atom", "Cell", "Particle"],
    "correct_answer": "Atom",
    "points": 15
  },
  {
    "id": "sci_q16",
    "question": "What is the chemical symbol for iron?",
    "type": "multiple_choice",
    "options": ["Ir", "Fe", "In", "I"],
    "correct_answer": "Fe",
    "points": 15
  },
  {
    "id": "sci_q17",
    "question": "What is the process of solid turning directly into gas?",
    "type": "multiple_choice",
    "options": ["Sublimation", "Evaporation", "Condensation", "Melting"],
    "correct_answer": "Sublimation",
    "points": 15
  },
  {
    "id": "sci_q18",
    "question": "What is the unit of force?",
    "type": "multiple_choice",
    "options": ["Joule", "Newton", "Watt", "Pascal"],
    "correct_answer": "Newton",
    "points": 15
  },
  {
    "id": "sci_q19",
    "question": "What is the closest star to Earth?",
    "type": "multiple_choice",
    "options": ["Alpha Centauri", "The Sun", "Proxima Centauri", "Sirius"],
    "correct_answer": "The Sun",
    "points": 15
  },
  {
    "id": "sci_q20",
    "question": "What is the chemical formula for carbon dioxide?",
    "type": "multiple_choice",
    "options": ["CO", "CO2", "C2O", "CO3"],
    "correct_answer": "CO2",
    "points": 15
  },
  {
    "id": "sci_q21",
    "question": "What is the process by which plants release water vapor?",
    "type": "multiple_choice",
    "options": ["Transpiration", "Respiration", "Photosynthesis", "Evaporation"],
    "correct_answer": "Transpiration",
    "points": 15
  },
  {
    "id": "sci_q22",
    "question": "What is the speed of sound in air at room temperature?",
    "type": "multiple_choice",
    "options": ["300 m/s", "330 m/s", "340 m/s", "350 m/s"],
    "correct_answer": "340 m/s",
    "points": 15
  },
  {
    "id": "sci_q23",
    "question": "What is the chemical symbol for silver?",
    "type": "multiple_choice",
    "options": ["Si", "Ag", "Au", "Al"],
    "correct_answer": "Ag",
    "points": 15
  },
  {
    "id": "sci_q24",
    "question": "What is the largest organ in the human body?",
    "type": "multiple_choice",
    "options": ["Liver", "Brain", "Skin", "Lungs"],
    "correct_answer": "Skin",
    "points": 15
  },
  {
    "id": "sci_q25",
    "question": "What is the unit of electric resistance?",
    "type": "multiple_choice",
    "options": ["Volt", "Ampere", "Ohm", "Watt"],
    "correct_answer": "Ohm",
    "points": 15
  },
  {
    "id": "sci_q26",
    "question": "What is the chemical symbol for copper?",
    "type": "multiple_choice",
    "options": ["Co", "Cu", "Cr", "Ca"],
    "correct_answer": "Cu",
    "points": 15
  },
  {
    "id": "sci_q27",
    "question": "What is the process of liquid turning into solid?",
    "type": "multiple_choice",
    "options": ["Melting", "Freezing", "Boiling", "Condensation"],
    "correct_answer": "Freezing",
    "points": 15
  },
  {
    "id": "sci_q28",
    "question": "What is the chemical formula for methane?",
    "type": "multiple_choice",
    "options": ["CH3", "CH4", "C2H4", "C2H6"],
    "correct_answer": "CH4",
    "points": 15
  },
  {
    "id": "sci_q29",
    "question": "What is the unit of energy?",
    "type": "multiple_choice",
    "options": ["Newton", "Joule", "Watt", "Pascal"],
    "correct_answer": "Joule",
    "points": 15
  },
  {
    "id": "sci_q30",
    "question": "What is the chemical symbol for sodium?",
    "type": "multiple_choice",
    "options": ["So", "Na", "No", "Sa"],
    "correct_answer": "Na",
    "points": 15
  },
  {
    "id": "sci_q31",
    "question": "What is the process of gas turning into liquid?",
    "type": "multiple_choice",
    "options": ["Evaporation", "Condensation", "Sublimation", "Deposition"],
    "correct_answer": "Condensation",
    "points": 15
  },
  {
    "id": "sci_q32",
    "question": "What is the chemical formula for ammonia?",
    "type": "multiple_choice",
    "options": ["NH2", "NH3", "NH4", "N2H4"],
    "correct_answer": "NH3",
    "points": 15
  },
  {
    "id": "sci_q33",
    "question": "What is the unit of pressure?",
    "type": "multiple_choice",
    "options": ["Newton", "Joule", "Pascal", "Watt"],
    "correct_answer": "Pascal",
    "points": 15
  },
  {
    "id": "sci_q34",
    "question": "What is the chemical symbol for potassium?",
    "type": "multiple_choice",
    "options": ["P", "K", "Po", "Pt"],
    "correct_answer": "K",
    "points": 15
  },
  {
    "id": "sci_q35",
    "question": "What is the process of solid turning into liquid?",
    "type": "multiple_choice",
    "options": ["Freezing", "Melting", "Boiling", "Sublimation"],
    "correct_answer": "Melting",
    "points": 15
  },
  {
    "id": "sci_q36",
    "question": "What is the chemical formula for glucose?",
    "type": "multiple_choice",
    "options": ["C6H12O6", "C6H10O6", "C5H10O5", "C6H14O6"],
    "correct_answer": "C6H12O6",
    "points": 15
  },
  {
    "id": "sci_q37",
    "question": "What is the unit of power?",
    "type": "multiple_choice",
    "options": ["Joule", "Watt", "Newton", "Pascal"],
    "correct_answer": "Watt",
    "points": 15
  },
  {
    "id": "sci_q38",
    "question": "What is the chemical symbol for calcium?",
    "type": "multiple_choice",
    "options": ["Ca", "Cl", "Co", "Cu"],
    "correct_answer": "Ca",
    "points": 15
  },
  {
    "id": "sci_q39",
    "question": "What is the process of gas turning into solid?",
    "type": "multiple_choice",
    "options": ["Sublimation", "Deposition", "Condensation", "Evaporation"],
    "correct_answer": "Deposition",
    "points": 15
  },
  {
    "id": "sci_q40",
    "question": "What is the chemical formula for sulfuric acid?",
    "type": "multiple_choice",
    "options": ["H2SO3", "H2SO4", "H3SO4", "H2S2O4"],
    "correct_answer": "H2SO4",
    "points": 15
  },
  {
    "id": "sci_q41",
    "question": "What is the unit of frequency?",
    "type": "multiple_choice",
    "options": ["Hertz", "Watt", "Joule", "Newton"],
    "correct_answer": "Hertz",
    "points": 15
  },
  {
    "id": "sci_q42",
    "question": "What is the chemical symbol for zinc?",
    "type": "multiple_choice",
    "options": ["Zn", "Zi", "Z", "Zc"],
    "correct_answer": "Zn",
    "points": 15
  },
  {
    "id": "sci_q43",
    "question": "What is the process of liquid turning into gas at the surface?",
    "type": "multiple_choice",
    "options": ["Boiling", "Evaporation", "Sublimation", "Condensation"],
    "correct_answer": "Evaporation",
    "points": 15
  },
  {
    "id": "sci_q44",
    "question": "What is the chemical formula for nitric acid?",
    "type": "multiple_choice",
    "options": ["HNO2", "HNO3", "H2NO3", "H3NO3"],
    "correct_answer": "HNO3",
    "points": 15
  },
  {
    "id": "sci_q45",
    "question": "What is the unit of electric charge?",
    "type": "multiple_choice",
    "options": ["Ampere", "Volt", "Coulomb", "Ohm"],
    "correct_answer": "Coulomb",
    "points": 15
  },
  {
    "id": "sci_q46",
    "question": "What is the chemical symbol for lead?",
    "type": "multiple_choice",
    "options": ["Ld", "Pb", "Le", "Pl"],
    "correct_answer": "Pb",
    "points": 15
  },
  {
    "id": "sci_q47",
    "question": "What is the process of liquid turning into gas throughout the liquid?",
    "type": "multiple_choice",
    "options": ["Evaporation", "Boiling", "Sublimation", "Condensation"],
    "correct_answer": "Boiling",
    "points": 15
  },
  {
    "id": "sci_q48",
    "question": "What is the chemical formula for hydrogen peroxide?",
    "type": "multiple_choice",
    "options": ["H2O", "H2O2", "H3O", "HO2"],
    "correct_answer": "H2O2",
    "points": 15
  },
  {
    "id": "sci_q49",
    "question": "What is the unit of magnetic field strength?",
    "type": "multiple_choice",
    "options": ["Tesla", "Gauss", "Weber", "Henry"],
    "correct_answer": "Tesla",
    "points": 15
  },
  {
    "id": "sci_q50",
    "question": "What is the chemical symbol for mercury?",
    "type": "multiple_choice",
    "options": ["Me", "Hg", "Mr", "My"],
    "correct_answer": "Hg",
    "points": 15
  }
]'),

-- Programming Basics
('Programming Basics', 'Test your programming knowledge', 'Hard', '[
  {
    "id": "prog_q1",
    "question": "Which of the following is NOT a programming language?",
    "type": "multiple_choice",
    "options": ["Python", "JavaScript", "HTML", "Java"],
    "correct_answer": "HTML",
    "points": 20
  },
  {
    "id": "prog_q2",
    "question": "What does SQL stand for?",
    "type": "multiple_choice",
    "options": ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
    "correct_answer": "Structured Query Language",
    "points": 20
  },
  {
    "id": "prog_q3",
    "question": "In programming, what is a variable?",
    "type": "multiple_choice",
    "options": ["A constant value", "A container for storing data", "A type of loop", "A function"],
    "correct_answer": "A container for storing data",
    "points": 20
  },
  {
    "id": "prog_q4",
    "question": "What does CSS stand for?",
    "type": "multiple_choice",
    "options": ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
    "correct_answer": "Cascading Style Sheets",
    "points": 20
  },
  {
    "id": "prog_q5",
    "question": "Which programming language is known for its use in data science?",
    "type": "multiple_choice",
    "options": ["Java", "Python", "C++", "Ruby"],
    "correct_answer": "Python",
    "points": 20
  },
  {
    "id": "prog_q6",
    "question": "What is a function in programming?",
    "type": "multiple_choice",
    "options": ["A variable", "A block of code that performs a specific task", "A data type", "A loop"],
    "correct_answer": "A block of code that performs a specific task",
    "points": 20
  },
  {
    "id": "prog_q7",
    "question": "What does API stand for?",
    "type": "multiple_choice",
    "options": ["Application Programming Interface", "Advanced Programming Interface", "Automated Programming Interface", "Application Process Interface"],
    "correct_answer": "Application Programming Interface",
    "points": 20
  },
  {
    "id": "prog_q8",
    "question": "Which of the following is a version control system?",
    "type": "multiple_choice",
    "options": ["Git", "Java", "Python", "HTML"],
    "correct_answer": "Git",
    "points": 20
  },
  {
    "id": "prog_q9",
    "question": "What is the purpose of a loop in programming?",
    "type": "multiple_choice",
    "options": ["To store data", "To repeat code multiple times", "To create functions", "To handle errors"],
    "correct_answer": "To repeat code multiple times",
    "points": 20
  },
  {
    "id": "prog_q10",
    "question": "What does IDE stand for?",
    "type": "multiple_choice",
    "options": ["Integrated Development Environment", "Internet Development Environment", "Interactive Development Environment", "Intelligent Development Environment"],
    "correct_answer": "Integrated Development Environment",
    "points": 20
  },
  {
    "id": "prog_q11",
    "question": "Which data structure follows LIFO (Last In, First Out) principle?",
    "type": "multiple_choice",
    "options": ["Queue", "Stack", "Array", "List"],
    "correct_answer": "Stack",
    "points": 20
  },
  {
    "id": "prog_q12",
    "question": "What is debugging in programming?",
    "type": "multiple_choice",
    "options": ["Writing code", "Finding and fixing errors", "Compiling code", "Testing code"],
    "correct_answer": "Finding and fixing errors",
    "points": 20
  },
  {
    "id": "prog_q13",
    "question": "Which programming paradigm focuses on objects and classes?",
    "type": "multiple_choice",
    "options": ["Functional Programming", "Object-Oriented Programming", "Procedural Programming", "Logical Programming"],
    "correct_answer": "Object-Oriented Programming",
    "points": 20
  },
  {
    "id": "prog_q14",
    "question": "What is the purpose of comments in code?",
    "type": "multiple_choice",
    "options": ["To execute code", "To explain code to other developers", "To store data", "To create functions"],
    "correct_answer": "To explain code to other developers",
    "points": 20
  },
  {
    "id": "prog_q15",
    "question": "Which of the following is NOT a programming language?",
    "type": "multiple_choice",
    "options": ["JavaScript", "Python", "CSS", "Java"],
    "correct_answer": "CSS",
    "points": 20
  },
  {
    "id": "prog_q16",
    "question": "What is the purpose of a database?",
    "type": "multiple_choice",
    "options": ["To display web pages", "To store and organize data", "To create graphics", "To send emails"],
    "correct_answer": "To store and organize data",
    "points": 20
  },
  {
    "id": "prog_q17",
    "question": "What does HTTP stand for?",
    "type": "multiple_choice",
    "options": ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transport Protocol", "HyperText Transmission Protocol"],
    "correct_answer": "HyperText Transfer Protocol",
    "points": 20
  },
  {
    "id": "prog_q18",
    "question": "Which of the following is a markup language?",
    "type": "multiple_choice",
    "options": ["JavaScript", "Python", "HTML", "Java"],
    "correct_answer": "HTML",
    "points": 20
  },
  {
    "id": "prog_q19",
    "question": "What is the purpose of a compiler?",
    "type": "multiple_choice",
    "options": ["To run programs", "To translate source code to machine code", "To debug programs", "To design programs"],
    "correct_answer": "To translate source code to machine code",
    "points": 20
  },
  {
    "id": "prog_q20",
    "question": "What does URL stand for?",
    "type": "multiple_choice",
    "options": ["Uniform Resource Locator", "Universal Resource Locator", "Uniform Resource Link", "Universal Resource Link"],
    "correct_answer": "Uniform Resource Locator",
    "points": 20
  },
  {
    "id": "prog_q21",
    "question": "Which data structure follows FIFO (First In, First Out) principle?",
    "type": "multiple_choice",
    "options": ["Stack", "Queue", "Array", "Tree"],
    "correct_answer": "Queue",
    "points": 20
  },
  {
    "id": "prog_q22",
    "question": "What is the purpose of an algorithm?",
    "type": "multiple_choice",
    "options": ["To store data", "To solve problems step by step", "To create graphics", "To send emails"],
    "correct_answer": "To solve problems step by step",
    "points": 20
  },
  {
    "id": "prog_q23",
    "question": "What does JSON stand for?",
    "type": "multiple_choice",
    "options": ["JavaScript Object Notation", "Java Standard Object Notation", "JavaScript Oriented Notation", "Java Script Object Notation"],
    "correct_answer": "JavaScript Object Notation",
    "points": 20
  },
  {
    "id": "prog_q24",
    "question": "Which of the following is a server-side programming language?",
    "type": "multiple_choice",
    "options": ["HTML", "CSS", "PHP", "JavaScript (client-side)"],
    "correct_answer": "PHP",
    "points": 20
  },
  {
    "id": "prog_q25",
    "question": "What is the purpose of a framework in programming?",
    "type": "multiple_choice",
    "options": ["To store data", "To provide a foundation for building applications", "To create graphics", "To send emails"],
    "correct_answer": "To provide a foundation for building applications",
    "points": 20
  },
  {
    "id": "prog_q26",
    "question": "What does CSS stand for?",
    "type": "multiple_choice",
    "options": ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
    "correct_answer": "Cascading Style Sheets",
    "points": 20
  },
  {
    "id": "prog_q27",
    "question": "Which of the following is a NoSQL database?",
    "type": "multiple_choice",
    "options": ["MySQL", "PostgreSQL", "MongoDB", "SQLite"],
    "correct_answer": "MongoDB",
    "points": 20
  },
  {
    "id": "prog_q28",
    "question": "What is the purpose of version control?",
    "type": "multiple_choice",
    "options": ["To run programs", "To track changes in code", "To debug programs", "To design programs"],
    "correct_answer": "To track changes in code",
    "points": 20
  },
  {
    "id": "prog_q29",
    "question": "What does REST stand for?",
    "type": "multiple_choice",
    "options": ["Representational State Transfer", "Remote State Transfer", "Representational Service Transfer", "Remote Service Transfer"],
    "correct_answer": "Representational State Transfer",
    "points": 20
  },
  {
    "id": "prog_q30",
    "question": "Which of the following is a frontend framework?",
    "type": "multiple_choice",
    "options": ["Node.js", "Express.js", "React", "Django"],
    "correct_answer": "React",
    "points": 20
  },
  {
    "id": "prog_q31",
    "question": "What is the purpose of a virtual machine?",
    "type": "multiple_choice",
    "options": ["To store data", "To run programs in isolated environments", "To create graphics", "To send emails"],
    "correct_answer": "To run programs in isolated environments",
    "points": 20
  },
  {
    "id": "prog_q32",
    "question": "What does XML stand for?",
    "type": "multiple_choice",
    "options": ["eXtensible Markup Language", "eXtended Markup Language", "eXtensible Markup Library", "eXtended Markup Library"],
    "correct_answer": "eXtensible Markup Language",
    "points": 20
  },
  {
    "id": "prog_q33",
    "question": "Which of the following is a backend framework?",
    "type": "multiple_choice",
    "options": ["React", "Angular", "Vue.js", "Django"],
    "correct_answer": "Django",
    "points": 20
  },
  {
    "id": "prog_q34",
    "question": "What is the purpose of caching in programming?",
    "type": "multiple_choice",
    "options": ["To store data permanently", "To improve performance by storing frequently used data", "To create graphics", "To send emails"],
    "correct_answer": "To improve performance by storing frequently used data",
    "points": 20
  },
  {
    "id": "prog_q35",
    "question": "What does AJAX stand for?",
    "type": "multiple_choice",
    "options": ["Asynchronous JavaScript and XML", "Advanced JavaScript and XML", "Asynchronous Java and XML", "Advanced Java and XML"],
    "correct_answer": "Asynchronous JavaScript and XML",
    "points": 20
  },
  {
    "id": "prog_q36",
    "question": "Which of the following is a cloud computing service?",
    "type": "multiple_choice",
    "options": ["AWS", "HTML", "CSS", "JavaScript"],
    "correct_answer": "AWS",
    "points": 20
  },
  {
    "id": "prog_q37",
    "question": "What is the purpose of middleware in web development?",
    "type": "multiple_choice",
    "options": ["To store data", "To handle requests between client and server", "To create graphics", "To send emails"],
    "correct_answer": "To handle requests between client and server",
    "points": 20
  },
  {
    "id": "prog_q38",
    "question": "What does MVC stand for?",
    "type": "multiple_choice",
    "options": ["Model View Controller", "Model View Component", "Model View Container", "Model View Configuration"],
    "correct_answer": "Model View Controller",
    "points": 20
  },
  {
    "id": "prog_q39",
    "question": "Which of the following is a mobile app development framework?",
    "type": "multiple_choice",
    "options": ["React Native", "Django", "Express.js", "Laravel"],
    "correct_answer": "React Native",
    "points": 20
  },
  {
    "id": "prog_q40",
    "question": "What is the purpose of unit testing?",
    "type": "multiple_choice",
    "options": ["To run programs", "To test individual components of code", "To debug programs", "To design programs"],
    "correct_answer": "To test individual components of code",
    "points": 20
  },
  {
    "id": "prog_q41",
    "question": "What does CRUD stand for?",
    "type": "multiple_choice",
    "options": ["Create Read Update Delete", "Create Retrieve Update Delete", "Create Read Update Destroy", "Create Retrieve Update Destroy"],
    "correct_answer": "Create Read Update Delete",
    "points": 20
  },
  {
    "id": "prog_q42",
    "question": "Which of the following is a containerization technology?",
    "type": "multiple_choice",
    "options": ["Docker", "HTML", "CSS", "JavaScript"],
    "correct_answer": "Docker",
    "points": 20
  },
  {
    "id": "prog_q43",
    "question": "What is the purpose of a design pattern?",
    "type": "multiple_choice",
    "options": ["To store data", "To provide reusable solutions to common problems", "To create graphics", "To send emails"],
    "correct_answer": "To provide reusable solutions to common problems",
    "points": 20
  },
  {
    "id": "prog_q44",
    "question": "What does SDK stand for?",
    "type": "multiple_choice",
    "options": ["Software Development Kit", "System Development Kit", "Software Design Kit", "System Design Kit"],
    "correct_answer": "Software Development Kit",
    "points": 20
  },
  {
    "id": "prog_q45",
    "question": "Which of the following is a microservices architecture pattern?",
    "type": "multiple_choice",
    "options": ["Monolithic", "Microservices", "Both A and B", "None of the above"],
    "correct_answer": "Microservices",
    "points": 20
  },
  {
    "id": "prog_q46",
    "question": "What is the purpose of load balancing?",
    "type": "multiple_choice",
    "options": ["To store data", "To distribute traffic across multiple servers", "To create graphics", "To send emails"],
    "correct_answer": "To distribute traffic across multiple servers",
    "points": 20
  },
  {
    "id": "prog_q47",
    "question": "What does CI/CD stand for?",
    "type": "multiple_choice",
    "options": ["Continuous Integration/Continuous Deployment", "Continuous Integration/Continuous Development", "Continuous Implementation/Continuous Deployment", "Continuous Implementation/Continuous Development"],
    "correct_answer": "Continuous Integration/Continuous Deployment",
    "points": 20
  },
  {
    "id": "prog_q48",
    "question": "Which of the following is a web server?",
    "type": "multiple_choice",
    "options": ["Apache", "HTML", "CSS", "JavaScript"],
    "correct_answer": "Apache",
    "points": 20
  },
  {
    "id": "prog_q49",
    "question": "What is the purpose of a CDN?",
    "type": "multiple_choice",
    "options": ["To store data", "To deliver content faster to users", "To create graphics", "To send emails"],
    "correct_answer": "To deliver content faster to users",
    "points": 20
  },
  {
    "id": "prog_q50",
    "question": "What does OOP stand for?",
    "type": "multiple_choice",
    "options": ["Object-Oriented Programming", "Object-Oriented Protocol", "Object-Oriented Process", "Object-Oriented Platform"],
    "correct_answer": "Object-Oriented Programming",
    "points": 20
  }
]'),

-- World History
('World History', 'Test your knowledge of world history', 'Medium', '[
  {
    "id": "hist_q1",
    "question": "In which year did World War II end?",
    "type": "multiple_choice",
    "options": ["1944", "1945", "1946", "1947"],
    "correct_answer": "1945",
    "points": 15
  },
  {
    "id": "hist_q2",
    "question": "Who was the first person to walk on the moon?",
    "type": "multiple_choice",
    "options": ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Alan Shepard"],
    "correct_answer": "Neil Armstrong",
    "points": 15
  },
  {
    "id": "hist_q3",
    "question": "Which ancient wonder of the world was located in Egypt?",
    "type": "multiple_choice",
    "options": ["Hanging Gardens", "Colossus of Rhodes", "Great Pyramid of Giza", "Lighthouse of Alexandria"],
    "correct_answer": "Great Pyramid of Giza",
    "points": 15
  },
  {
    "id": "hist_q4",
    "question": "Who was the first President of the United States?",
    "type": "multiple_choice",
    "options": ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
    "correct_answer": "George Washington",
    "points": 15
  },
  {
    "id": "hist_q5",
    "question": "In which year did the Berlin Wall fall?",
    "type": "multiple_choice",
    "options": ["1987", "1989", "1991", "1993"],
    "correct_answer": "1989",
    "points": 15
  },
  {
    "id": "hist_q6",
    "question": "Which empire was ruled by Julius Caesar?",
    "type": "multiple_choice",
    "options": ["Greek Empire", "Roman Empire", "Byzantine Empire", "Ottoman Empire"],
    "correct_answer": "Roman Empire",
    "points": 15
  },
  {
    "id": "hist_q7",
    "question": "Who painted the Mona Lisa?",
    "type": "multiple_choice",
    "options": ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
    "correct_answer": "Leonardo da Vinci",
    "points": 15
  },
  {
    "id": "hist_q8",
    "question": "Which war was fought between 1914-1918?",
    "type": "multiple_choice",
    "options": ["World War I", "World War II", "Vietnam War", "Korean War"],
    "correct_answer": "World War I",
    "points": 15
  },
  {
    "id": "hist_q9",
    "question": "Who was the leader of the Soviet Union during World War II?",
    "type": "multiple_choice",
    "options": ["Vladimir Lenin", "Joseph Stalin", "Nikita Khrushchev", "Leonid Brezhnev"],
    "correct_answer": "Joseph Stalin",
    "points": 15
  },
  {
    "id": "hist_q10",
    "question": "Which ancient city was destroyed by the eruption of Mount Vesuvius?",
    "type": "multiple_choice",
    "options": ["Athens", "Rome", "Pompeii", "Sparta"],
    "correct_answer": "Pompeii",
    "points": 15
  },
  {
    "id": "hist_q11",
    "question": "Who was the first woman to fly solo across the Atlantic?",
    "type": "multiple_choice",
    "options": ["Bessie Coleman", "Amelia Earhart", "Harriet Quimby", "Jacqueline Cochran"],
    "correct_answer": "Amelia Earhart",
    "points": 15
  },
  {
    "id": "hist_q12",
    "question": "Which civilization built Machu Picchu?",
    "type": "multiple_choice",
    "options": ["Aztec", "Maya", "Inca", "Olmec"],
    "correct_answer": "Inca",
    "points": 15
  },
  {
    "id": "hist_q13",
    "question": "In which year did Christopher Columbus reach the Americas?",
    "type": "multiple_choice",
    "options": ["1490", "1492", "1494", "1496"],
    "correct_answer": "1492",
    "points": 15
  },
  {
    "id": "hist_q14",
    "question": "Who wrote ''The Communist Manifesto''?",
    "type": "multiple_choice",
    "options": ["Vladimir Lenin", "Karl Marx", "Friedrich Engels", "Both Karl Marx and Friedrich Engels"],
    "correct_answer": "Both Karl Marx and Friedrich Engels",
    "points": 15
  },
  {
    "id": "hist_q15",
    "question": "Which ancient wonder was located in Babylon?",
    "type": "multiple_choice",
    "options": ["Hanging Gardens of Babylon", "Colossus of Rhodes", "Lighthouse of Alexandria", "Temple of Artemis"],
    "correct_answer": "Hanging Gardens of Babylon",
    "points": 15
  },
  {
    "id": "hist_q16",
    "question": "Who was the last Emperor of China?",
    "type": "multiple_choice",
    "options": ["Puyi", "Kangxi", "Qianlong", "Guangxu"],
    "correct_answer": "Puyi",
    "points": 15
  },
  {
    "id": "hist_q17",
    "question": "In which year did the Titanic sink?",
    "type": "multiple_choice",
    "options": ["1910", "1912", "1914", "1916"],
    "correct_answer": "1912",
    "points": 15
  },
  {
    "id": "hist_q18",
    "question": "Who was the first woman to win a Nobel Prize?",
    "type": "multiple_choice",
    "options": ["Marie Curie", "Rosalind Franklin", "Dorothy Hodgkin", "Barbara McClintock"],
    "correct_answer": "Marie Curie",
    "points": 15
  },
  {
    "id": "hist_q19",
    "question": "Which empire was ruled by Alexander the Great?",
    "type": "multiple_choice",
    "options": ["Roman Empire", "Greek Empire", "Macedonian Empire", "Byzantine Empire"],
    "correct_answer": "Macedonian Empire",
    "points": 15
  },
  {
    "id": "hist_q20",
    "question": "In which year did the American Civil War end?",
    "type": "multiple_choice",
    "options": ["1863", "1864", "1865", "1866"],
    "correct_answer": "1865",
    "points": 15
  },
  {
    "id": "hist_q21",
    "question": "Who wrote ''The Art of War''?",
    "type": "multiple_choice",
    "options": ["Confucius", "Sun Tzu", "Lao Tzu", "Mencius"],
    "correct_answer": "Sun Tzu",
    "points": 15
  },
  {
    "id": "hist_q22",
    "question": "Which ancient wonder was located in Greece?",
    "type": "multiple_choice",
    "options": ["Colossus of Rhodes", "Hanging Gardens", "Great Pyramid", "Lighthouse of Alexandria"],
    "correct_answer": "Colossus of Rhodes",
    "points": 15
  },
  {
    "id": "hist_q23",
    "question": "Who was the first person to circumnavigate the globe?",
    "type": "multiple_choice",
    "options": ["Christopher Columbus", "Ferdinand Magellan", "Vasco da Gama", "Marco Polo"],
    "correct_answer": "Ferdinand Magellan",
    "points": 15
  },
  {
    "id": "hist_q24",
    "question": "In which year did the French Revolution begin?",
    "type": "multiple_choice",
    "options": ["1787", "1788", "1789", "1790"],
    "correct_answer": "1789",
    "points": 15
  },
  {
    "id": "hist_q25",
    "question": "Who was the first person to reach the South Pole?",
    "type": "multiple_choice",
    "options": ["Robert Falcon Scott", "Roald Amundsen", "Ernest Shackleton", "Edmund Hillary"],
    "correct_answer": "Roald Amundsen",
    "points": 15
  },
  {
    "id": "hist_q26",
    "question": "Which civilization built the Colosseum?",
    "type": "multiple_choice",
    "options": ["Greek", "Roman", "Byzantine", "Etruscan"],
    "correct_answer": "Roman",
    "points": 15
  },
  {
    "id": "hist_q27",
    "question": "In which year did the Berlin Wall fall?",
    "type": "multiple_choice",
    "options": ["1987", "1989", "1991", "1993"],
    "correct_answer": "1989",
    "points": 15
  },
  {
    "id": "hist_q28",
    "question": "Who was the first person to fly solo across the Atlantic?",
    "type": "multiple_choice",
    "options": ["Charles Lindbergh", "Amelia Earhart", "Wiley Post", "Howard Hughes"],
    "correct_answer": "Charles Lindbergh",
    "points": 15
  },
  {
    "id": "hist_q29",
    "question": "Which ancient wonder was located in Turkey?",
    "type": "multiple_choice",
    "options": ["Temple of Artemis", "Hanging Gardens", "Great Pyramid", "Lighthouse of Alexandria"],
    "correct_answer": "Temple of Artemis",
    "points": 15
  },
  {
    "id": "hist_q30",
    "question": "In which year did the Russian Revolution occur?",
    "type": "multiple_choice",
    "options": ["1915", "1916", "1917", "1918"],
    "correct_answer": "1917",
    "points": 15
  },
  {
    "id": "hist_q31",
    "question": "Who was the first person to reach the North Pole?",
    "type": "multiple_choice",
    "options": ["Robert Peary", "Roald Amundsen", "Ernest Shackleton", "Edmund Hillary"],
    "correct_answer": "Robert Peary",
    "points": 15
  },
  {
    "id": "hist_q32",
    "question": "Which civilization built the Great Wall of China?",
    "type": "multiple_choice",
    "options": ["Ming Dynasty", "Qin Dynasty", "Han Dynasty", "All of the above"],
    "correct_answer": "All of the above",
    "points": 15
  },
  {
    "id": "hist_q33",
    "question": "In which year did the Renaissance begin?",
    "type": "multiple_choice",
    "options": ["1300s", "1400s", "1500s", "1600s"],
    "correct_answer": "1400s",
    "points": 15
  },
  {
    "id": "hist_q34",
    "question": "Who was the first person to win two Nobel Prizes?",
    "type": "multiple_choice",
    "options": ["Albert Einstein", "Marie Curie", "Linus Pauling", "John Bardeen"],
    "correct_answer": "Marie Curie",
    "points": 15
  },
  {
    "id": "hist_q35",
    "question": "Which ancient wonder was located in Egypt?",
    "type": "multiple_choice",
    "options": ["Lighthouse of Alexandria", "Great Pyramid of Giza", "Both A and B", "None of the above"],
    "correct_answer": "Both A and B",
    "points": 15
  },
  {
    "id": "hist_q36",
    "question": "In which year did the Industrial Revolution begin?",
    "type": "multiple_choice",
    "options": ["1700s", "1800s", "1900s", "1600s"],
    "correct_answer": "1700s",
    "points": 15
  },
  {
    "id": "hist_q37",
    "question": "Who was the first person to win a Nobel Prize in Physics?",
    "type": "multiple_choice",
    "options": ["Albert Einstein", "Wilhelm Röntgen", "Marie Curie", "Max Planck"],
    "correct_answer": "Wilhelm Röntgen",
    "points": 15
  },
  {
    "id": "hist_q38",
    "question": "Which civilization built the Taj Mahal?",
    "type": "multiple_choice",
    "options": ["Mughal Empire", "Ottoman Empire", "Safavid Empire", "Delhi Sultanate"],
    "correct_answer": "Mughal Empire",
    "points": 15
  },
  {
    "id": "hist_q39",
    "question": "In which year did the Cold War end?",
    "type": "multiple_choice",
    "options": ["1987", "1989", "1991", "1993"],
    "correct_answer": "1991",
    "points": 15
  },
  {
    "id": "hist_q40",
    "question": "Who was the first person to win a Nobel Prize in Chemistry?",
    "type": "multiple_choice",
    "options": ["Marie Curie", "Jacobus Henricus van ''t Hoff", "Emil Fischer", "Svante Arrhenius"],
    "correct_answer": "Jacobus Henricus van ''t Hoff",
    "points": 15
  },
  {
    "id": "hist_q41",
    "question": "Which civilization built the Parthenon?",
    "type": "multiple_choice",
    "options": ["Roman", "Greek", "Byzantine", "Ottoman"],
    "correct_answer": "Greek",
    "points": 15
  },
  {
    "id": "hist_q42",
    "question": "In which year did the Space Age begin?",
    "type": "multiple_choice",
    "options": ["1955", "1956", "1957", "1958"],
    "correct_answer": "1957",
    "points": 15
  },
  {
    "id": "hist_q43",
    "question": "Who was the first person to win a Nobel Prize in Literature?",
    "type": "multiple_choice",
    "options": ["Rudyard Kipling", "Sully Prudhomme", "Bjørnstjerne Bjørnson", "Frédéric Mistral"],
    "correct_answer": "Sully Prudhomme",
    "points": 15
  },
  {
    "id": "hist_q44",
    "question": "Which civilization built the Machu Picchu?",
    "type": "multiple_choice",
    "options": ["Aztec", "Maya", "Inca", "Olmec"],
    "correct_answer": "Inca",
    "points": 15
  },
  {
    "id": "hist_q45",
    "question": "In which year did the Information Age begin?",
    "type": "multiple_choice",
    "options": ["1970s", "1980s", "1990s", "2000s"],
    "correct_answer": "1970s",
    "points": 15
  },
  {
    "id": "hist_q46",
    "question": "Who was the first person to win a Nobel Prize in Medicine?",
    "type": "multiple_choice",
    "options": ["Emil von Behring", "Ronald Ross", "Niels Ryberg Finsen", "Ivan Pavlov"],
    "correct_answer": "Emil von Behring",
    "points": 15
  },
  {
    "id": "hist_q47",
    "question": "Which civilization built the Stonehenge?",
    "type": "multiple_choice",
    "options": ["Celtic", "Anglo-Saxon", "Neolithic", "Bronze Age"],
    "correct_answer": "Neolithic",
    "points": 15
  },
  {
    "id": "hist_q48",
    "question": "In which year did the Digital Age begin?",
    "type": "multiple_choice",
    "options": ["1980s", "1990s", "2000s", "2010s"],
    "correct_answer": "1990s",
    "points": 15
  },
  {
    "id": "hist_q49",
    "question": "Who was the first person to win a Nobel Peace Prize?",
    "type": "multiple_choice",
    "options": ["Henry Dunant", "Frédéric Passy", "Both A and B", "None of the above"],
    "correct_answer": "Both A and B",
    "points": 15
  },
  {
    "id": "hist_q50",
    "question": "Which civilization built the Angkor Wat?",
    "type": "multiple_choice",
    "options": ["Khmer Empire", "Thai Empire", "Vietnamese Empire", "Burmese Empire"],
    "correct_answer": "Khmer Empire",
    "points": 15
  }
]');
