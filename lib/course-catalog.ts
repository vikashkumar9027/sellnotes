export interface EducationLevel {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export interface CourseItem {
  id: string;
  name: string;
  level: string;
  categorySlug: string;
  subjects: string[];
}

export const EDUCATION_LEVELS: EducationLevel[] = [
  {
    id: 'school-10',
    name: 'Class 10th (Secondary School)',
    badge: '10th Board',
    description: 'CBSE, ICSE & State Boards Class 10th handwritten notes, formula sheets and chapter summaries.',
  },
  {
    id: 'school-11',
    name: 'Class 11th (Senior Secondary)',
    badge: '11th Class',
    description: 'Class 11 Science (PCM/PCB), Commerce, Arts & Humanities core handwritten notes.',
  },
  {
    id: 'school-12',
    name: 'Class 12th (Board Exams)',
    badge: '12th Board',
    description: 'Class 12 Board Exam toppers notes, NCERT line-by-line summaries, formulas & PYQ notes.',
  },
  {
    id: 'ug',
    name: 'Graduation / Undergraduate (UG)',
    badge: 'UG Degree',
    description: 'B.A., B.Sc., B.Com, B.Tech, BCA, BBA, LL.B., B.Ed., B.Pharma university handwritten notes.',
  },
  {
    id: 'pg',
    name: 'Post Graduation (PG / Masters)',
    badge: 'PG Masters',
    description: 'M.A., M.Sc., M.Com, MBA, MCA, M.Tech, LL.M., M.Ed. university master level notes & research guides.',
  },
  {
    id: 'competitive',
    name: 'Competitive & Govt Exams',
    badge: 'Govt & Entrances',
    description: 'UPSC CSE, GATE, SSC CGL, Banking (IBPS/SBI), JEE, NEET, CAT, UGC NET & State PSC exam notes.',
  },
];

export const COURSES_CATALOG: CourseItem[] = [
  // ===========================================================================
  // 1. CLASS 10TH COURSES & SUBJECTS
  // ===========================================================================
  {
    id: 'class-10-cbse',
    name: 'Class 10th (CBSE / NCERT)',
    level: 'school-10',
    categorySlug: 'class-10th-boards',
    subjects: [
      'English Complete (First Flight & Footprints)',
      'English Language, Grammar & Creative Writing',
      'Mathematics (Standard & Basic)',
      'Science - Physics (Light & Electricity)',
      'Science - Chemistry (Chemical Reactions & Carbon Compounds)',
      'Science - Biology (Life Processes & Heredity)',
      'Social Science - History (India and Contemporary World)',
      'Social Science - Geography (Contemporary India)',
      'Social Science - Political Science (Democratic Politics)',
      'Social Science - Economics (Understanding Economic Dev)',
      'Hindi - Kshitij & Kritika (Course A)',
      'Hindi - Sparsh & Sanchayan (Course B)',
      'Information Technology (Code 402)',
      'Complete Board Exam PYQs & Formula Cheatsheet',
    ],
  },
  {
    id: 'class-10-icse',
    name: 'Class 10th (ICSE Board)',
    level: 'school-10',
    categorySlug: 'class-10th-boards',
    subjects: [
      'English Language & Literature (Julius Caesar)',
      'Mathematics (Commercial Arithmetic, Algebra, Geometry)',
      'Physics (Force, Work, Light, Sound, Electricity)',
      'Chemistry (Periodic Properties, Chemical Bonding, Mole Concept)',
      'Biology (Basic Biology, Plant & Human Physiology)',
      'History & Civics (Indian National Movement, Contemporary World)',
      'Geography (Climate, Soils, Mineral Resources)',
      'Computer Applications (Java Programming & OOPs)',
    ],
  },
  {
    id: 'class-10-state',
    name: 'Class 10th (State Boards / Matric)',
    level: 'school-10',
    categorySlug: 'class-10th-boards',
    subjects: [
      'General English & Grammar',
      'Mathematics / Ganit',
      'General Science / Vigyan',
      'Social Studies / Samajik Vigyan',
      'Hindi / Regional Language',
    ],
  },

  // ===========================================================================
  // 2. CLASS 11TH COURSES & SUBJECTS
  // ===========================================================================
  {
    id: 'class-11-science',
    name: 'Class 11th Science (PCM / PCB)',
    level: 'school-11',
    categorySlug: 'class-11th-12th-science',
    subjects: [
      'English Core (Hornbill, Snapshots & Reading Skills)',
      'Physics (Kinematics, Laws of Motion, Thermodynamics, Oscillations)',
      'Chemistry (Atomic Structure, Bonding, Thermodynamics, Organic Basics)',
      'Mathematics (Sets, Functions, Trigonometry, Calculus, Permutations)',
      'Biology (Cell Biology, Plant Physiology, Human Physiology)',
      'Computer Science (Python Programming, Data Structures)',
      'Physical Education & Health',
    ],
  },
  {
    id: 'class-11-commerce',
    name: 'Class 11th Commerce',
    level: 'school-11',
    categorySlug: 'class-11th-12th-commerce',
    subjects: [
      'English Core (Literature & Business Writing Skills)',
      'Accountancy (Journal, Ledger, Trial Balance, Financial Statements)',
      'Business Studies (Forms of Business, Business Services, Trade)',
      'Economics - Statistics for Economics',
      'Economics - Introductory Microeconomics',
      'Applied Mathematics',
      'Informatics Practices (IP)',
    ],
  },
  {
    id: 'class-11-arts',
    name: 'Class 11th Arts & Humanities',
    level: 'school-11',
    categorySlug: 'class-11th-12th-arts',
    subjects: [
      'English Core (Literature, Critical Reading & Essays)',
      'History (Themes in World History)',
      'Political Science (Indian Constitution at Work & Political Theory)',
      'Geography (Physical Geography & India Physical Environment)',
      'Sociology (Introducing Society & Understanding Society)',
      'Psychology (Human Behaviour & Cognitive Processes)',
      'Economics (Microeconomics & Statistics)',
    ],
  },

  // ===========================================================================
  // 3. CLASS 12TH COURSES & SUBJECTS
  // ===========================================================================
  {
    id: 'class-12-science',
    name: 'Class 12th Science (PCM / PCB Board Prep)',
    level: 'school-12',
    categorySlug: 'class-11th-12th-science',
    subjects: [
      'English Core Complete (Flamingo, Vistas & Writing Skills)',
      'Physics (Electrostatics, Magnetism, Optics, Modern Physics)',
      'Chemistry (Solutions, Electrochemistry, Kinetics, Organic Reactions)',
      'Mathematics (Calculus, Integrals, Vectors, 3D Geometry, Probability)',
      'Biology (Genetics, Evolution, Reproduction, Biotechnology, Ecology)',
      'Computer Science with Python & SQL',
      'Physical Education Notes & Mindmaps',
    ],
  },
  {
    id: 'class-12-commerce',
    name: 'Class 12th Commerce',
    level: 'school-12',
    categorySlug: 'class-11th-12th-commerce',
    subjects: [
      'English Core Complete Guide & Writing Formats',
      'Accountancy (Partnership Accounts, Company Shares, Cash Flow)',
      'Business Studies (Principles of Management, Marketing, Finance)',
      'Macroeconomics (National Income, Money & Banking, Gov Budget)',
      'Indian Economic Development (Reforms, Employment, Rural Dev)',
      'Applied Mathematics (Class 12)',
    ],
  },
  {
    id: 'class-12-arts',
    name: 'Class 12th Arts & Humanities',
    level: 'school-12',
    categorySlug: 'class-11th-12th-arts',
    subjects: [
      'English Core & Elective Literature Guide',
      'History (Ancient, Medieval & Modern Indian History Themes)',
      'Political Science (Contemporary World Politics & Politics in India)',
      'Geography (Human Geography & India People and Economy)',
      'Sociology (Indian Society & Social Change)',
      'Psychology (Psychological Attributes & Disorders)',
    ],
  },

  // ===========================================================================
  // 4. GRADUATION / UNDERGRADUATE (UG) COURSES & SUBJECTS
  // ===========================================================================
  {
    id: 'ba-english-hons',
    name: 'B.A. (Hons) English Literature',
    level: 'ug',
    categorySlug: 'english-complete',
    subjects: [
      'English Literature: British Poetry & Drama (14th to 17th Century)',
      'English Literature: British Poetry & Drama (17th & 18th Century)',
      'English Literature: British Romantic & Victorian Literature',
      'English Literature: 20th Century British Literature',
      'Indian Classical Literature & Indian Writing in English',
      'Literary Criticism & Theory (Classical to New Criticism)',
      'American Literature & Postcolonial Literature',
      'English Linguistics, Phonetics & Academic Writing',
      'Modern European Drama & World Literature in Translation',
    ],
  },
  {
    id: 'ba-general',
    name: 'B.A. (Bachelor of Arts - General)',
    level: 'ug',
    categorySlug: 'ba-arts-humanities',
    subjects: [
      'B.A. General English & Communication',
      'Political Science: Western & Indian Political Thought',
      'Political Science: Comparative Politics & International Relations',
      'History: Ancient & Medieval Indian History',
      'History: Modern India & Freedom Struggle',
      'Economics: Microeconomics & Macroeconomics',
      'Sociology: Sociological Thinkers & Social Research',
      'Psychology: General & Developmental Psychology',
      'Hindi Literature / Sahitya (Kavya & Gadya)',
      'Public Administration & Governance',
      'Geography: Geomorphology & Climatology',
      'Philosophy: Indian & Western Philosophy',
    ],
  },
  {
    id: 'bsc-general',
    name: 'B.Sc. (Bachelor of Science)',
    level: 'ug',
    categorySlug: 'bsc-science-biotech',
    subjects: [
      'B.Sc. Mathematics: Differential Calculus & Integral Calculus',
      'B.Sc. Mathematics: Real Analysis, Abstract Algebra & Group Theory',
      'B.Sc. Mathematics: Linear Algebra & Differential Equations',
      'B.Sc. Physics: Mechanics, Waves & Optics',
      'B.Sc. Physics: Electricity, Magnetism & Thermal Physics',
      'B.Sc. Physics: Quantum Mechanics & Atomic Physics',
      'B.Sc. Chemistry: Inorganic Chemistry & Coordination Compounds',
      'B.Sc. Chemistry: Organic Reaction Mechanisms & Spectroscopy',
      'B.Sc. Chemistry: Physical Chemistry (Thermodynamics & Kinetics)',
      'B.Sc. Botany: Plant Diversity, Anatomy & Physiology',
      'B.Sc. Zoology: Animal Diversity, Genetics & Evolution',
      'B.Sc. Biotechnology: Recombinant DNA Tech & Molecular Biology',
      'B.Sc. Computer Science / IT (DSA, DBMS, C++, Web Tech)',
      'B.Sc. Statistics & Probability Distributions',
    ],
  },
  {
    id: 'bcom-general',
    name: 'B.Com (Bachelor of Commerce / B.Com Hons)',
    level: 'ug',
    categorySlug: 'bcom-commerce-finance',
    subjects: [
      'Financial Accounting & Accounting Standards',
      'Business Law & Indian Contract Act',
      'Corporate Accounting & Company Accounts',
      'Business Mathematics & Statistics',
      'Cost Accounting & Material Costing',
      'Income Tax Law and Practice',
      'Auditing and Corporate Governance',
      'Management Accounting & Marginal Costing',
      'Goods and Services Tax (GST) & Customs Law',
      'Financial Management & Capital Budgeting',
      'Banking Operations & Insurance Law',
    ],
  },
  {
    id: 'btech-engineering',
    name: 'B.Tech / B.E. (Engineering)',
    level: 'ug',
    categorySlug: 'computer-science',
    subjects: [
      'Data Structures & Algorithms (DSA)',
      'Operating Systems & Kernel Architecture',
      'Database Management Systems (DBMS & SQL)',
      'Computer Networks & Protocols',
      'Software Engineering & System Design',
      'Theory of Computation (TOC) & Compiler Design',
      'Artificial Intelligence & Machine Learning',
      'Engineering Mathematics (Calculus, Linear Algebra, Diff Eq)',
      'Thermodynamics & Heat Transfer (Mechanical)',
      'Fluid Mechanics & Hydraulic Machines (Mechanical/Civil)',
      'Structural Analysis & Design of Concrete (Civil)',
      'Circuit Theory & Network Analysis (Electrical)',
      'Digital Electronics, Microprocessors & VLSI (ECE)',
    ],
  },
  {
    id: 'bca',
    name: 'BCA (Bachelor of Computer Applications)',
    level: 'ug',
    categorySlug: 'bca-computer-applications',
    subjects: [
      'Programming in C & C++',
      'Data Structures using C/C++',
      'Object Oriented Programming with Java',
      'Python Programming & Data Analytics',
      'Web Technologies (HTML, CSS, JavaScript, React, Node)',
      'Database Management Systems (DBMS & MySQL)',
      'Operating Systems & Linux Shell Scripting',
      'Computer System Architecture & Microprocessor',
      'Software Engineering & Agile Methodologies',
      'Computer Networks & Network Security',
    ],
  },
  {
    id: 'bba',
    name: 'BBA / BMS (Business Administration)',
    level: 'ug',
    categorySlug: 'bba-business-management',
    subjects: [
      'Principles of Management & Organizational Behaviour',
      'Business Communication & Personality Development',
      'Marketing Management & Consumer Behaviour',
      'Financial Management & Corporate Finance',
      'Human Resource Management (HRM)',
      'Business Economics (Micro & Macro)',
      'Business Law, Company Law & Ethics',
      'Production and Operations Management',
      'Entrepreneurship Development & Startup Management',
    ],
  },
  {
    id: 'llb-law',
    name: 'LL.B. / B.A. LL.B. (Law Degree)',
    level: 'ug',
    categorySlug: 'law-llb-llm',
    subjects: [
      'Constitutional Law of India (Parts I & II)',
      'Jurisprudence & Legal Theories',
      'Law of Contracts & Specific Relief Act',
      'Law of Torts & Consumer Protection Act',
      'Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)',
      'Code of Criminal Procedure (CrPC) / BNSS',
      'Code of Civil Procedure (CPC) & Limitation Act',
      'Law of Evidence / Bharatiya Sakshya Adhiniyam',
      'Family Law (Hindu Law & Muslim Law)',
      'Company Law & Corporate Insolvency',
      'Property Law & Transfer of Property Act',
      'Public International Law & Human Rights',
    ],
  },
  {
    id: 'bed-education',
    name: 'B.Ed. (Bachelor of Education)',
    level: 'ug',
    categorySlug: 'education-bed-med',
    subjects: [
      'Childhood and Growing Up (Child Psychology)',
      'Contemporary India and Education',
      'Learning and Teaching Process',
      'Pedagogy of English / Social Sciences / Mathematics / Science',
      'Gender, School and Society',
      'Assessment for Learning & Evaluation',
      'Creating an Inclusive School',
    ],
  },
  {
    id: 'bpharma',
    name: 'B.Pharma (Bachelor of Pharmacy)',
    level: 'ug',
    categorySlug: 'biology-biotech',
    subjects: [
      'Human Anatomy and Physiology (HAP)',
      'Pharmaceutics & Pharmaceutical Dosage Forms',
      'Pharmaceutical Organic Chemistry',
      'Pharmaceutical Inorganic Chemistry & Analysis',
      'Pharmacology & Toxicology',
      'Pharmacognosy & Phytochemistry',
      'Medicinal Chemistry',
      'Biopharmaceutics & Pharmacokinetics',
    ],
  },

  // ===========================================================================
  // 5. POST GRADUATION (PG / MASTERS) COURSES & SUBJECTS
  // ===========================================================================
  {
    id: 'ma-english',
    name: 'M.A. English Literature & Linguistics',
    level: 'pg',
    categorySlug: 'english-complete',
    subjects: [
      'M.A. English: Chaucer to Shakespeare & Jacobean Drama',
      'M.A. English: Restoration, Augustan & 18th Century Literature',
      'M.A. English: Romantic Poetry & Victorian Novel',
      'M.A. English: 20th Century Modernist & Postmodernist Literature',
      'M.A. English: Literary Theory, Structuralism & Deconstruction',
      'M.A. English: Postcolonialism, Gender Studies & Cultural Theory',
      'M.A. English: Indian Writing in English & Translation Studies',
      'M.A. English: American & Diasporic Literature',
      'M.A. English: Linguistics, Syntax, Semantics & ELT',
    ],
  },
  {
    id: 'ma-general',
    name: 'M.A. (Master of Arts - Polity, History, Eco, Soc)',
    level: 'pg',
    categorySlug: 'ma-masters-arts',
    subjects: [
      'M.A. Political Science: Advanced Political Theory & Global Security',
      'M.A. Political Science: International Relations & Foreign Policy',
      'M.A. History: Historiography & Historical Methodology',
      'M.A. History: Agrarian, Socio-Cultural & Colonial History of India',
      'M.A. Economics: Advanced Microeconomics & Macroeconomic Dynamics',
      'M.A. Economics: Econometric Methods & Game Theory',
      'M.A. Sociology: Classical & Contemporary Sociological Theories',
      'M.A. Psychology: Cognitive Psychology, Psychopathology & Neuropsychology',
      'M.A. Hindi Sahitya: Prachin, Madhyakalin evam Aadhunik Sahitya',
      'M.A. Public Policy & Governance',
    ],
  },
  {
    id: 'msc-general',
    name: 'M.Sc. (Master of Science - Physics, Chem, Maths, Bio)',
    level: 'pg',
    categorySlug: 'msc-masters-science',
    subjects: [
      'M.Sc. Physics: Classical Mechanics & Electrodynamics',
      'M.Sc. Physics: Advanced Quantum Mechanics & Statistical Physics',
      'M.Sc. Physics: Condensed Matter Physics & Nuclear Particle Physics',
      'M.Sc. Chemistry: Advanced Coordination & Organometallic Chemistry',
      'M.Sc. Chemistry: Advanced Organic Synthesis, Reagents & Spectroscopy',
      'M.Sc. Chemistry: Quantum Chemistry & Chemical Thermodynamics',
      'M.Sc. Mathematics: Topology, Functional Analysis & Measure Theory',
      'M.Sc. Mathematics: Advanced Abstract Algebra & Field Theory',
      'M.Sc. Mathematics: Partial Differential Equations & Complex Analysis',
      'M.Sc. Computer Science / Data Science: Deep Learning, NLP & Big Data',
      'M.Sc. Biotechnology: Genetic Engineering, Immunology & Bioinformatics',
      'M.Sc. Botany & Zoology Masters Notes',
    ],
  },
  {
    id: 'mcom-general',
    name: 'M.Com (Master of Commerce)',
    level: 'pg',
    categorySlug: 'mcom-masters-commerce',
    subjects: [
      'Advanced Corporate Financial Accounting & Reporting',
      'Financial Management, Policy & International Finance',
      'Strategic Management & Business Policy',
      'Corporate Tax Planning and Management',
      'Security Analysis and Portfolio Management (SAPM)',
      'Business Research Methodology & Statistical Analysis',
      'International Business Environment & Trade Policies',
    ],
  },
  {
    id: 'mba-management',
    name: 'MBA / PGDM (Master of Business Administration)',
    level: 'pg',
    categorySlug: 'mba-management',
    subjects: [
      'Marketing Management & Brand Strategy',
      'Corporate Finance, Investment Banking & Valuation',
      'Human Resource Management, Talent Acquisition & Labour Laws',
      'Operations Management, Logistics & Supply Chain (SCM)',
      'Business Analytics, Big Data & Decision Science',
      'Strategic Management & Mergers and Acquisitions (M&A)',
      'Business Economics, Managerial Accounting & Cost Control',
      'Consumer Behaviour & Digital Marketing',
      'Entrepreneurship, Startup Incubation & Venture Capital',
    ],
  },
  {
    id: 'mca-masters',
    name: 'MCA (Master of Computer Applications)',
    level: 'pg',
    categorySlug: 'bca-computer-applications',
    subjects: [
      'Design and Analysis of Advanced Algorithms',
      'Cloud Computing & Distributed Systems',
      'Machine Learning, Neural Networks & Deep Learning',
      'Advanced Web Development (Full Stack MERN/Next.js)',
      'Information Security, Cyber Law & Cryptography',
      'Big Data Analytics using Hadoop & Spark',
      'Mobile Application Development (Android/Flutter)',
    ],
  },
  {
    id: 'mtech-masters',
    name: 'M.Tech / M.E. (Master of Technology)',
    level: 'pg',
    categorySlug: 'computer-science',
    subjects: [
      'Advanced VLSI Design & Embedded Architecture',
      'Advanced Computer Architecture & Parallel Computing',
      'Structural Dynamics, Earthquake Engineering & Finite Element Method (FEM)',
      'Thermal Power, Computational Fluid Dynamics (CFD)',
      'Digital Signal Processing (DSP) & Wireless Communication',
      'Power Electronics, Renewable Energy & Smart Grids',
    ],
  },
  {
    id: 'llm-law',
    name: 'LL.M. (Master of Laws)',
    level: 'pg',
    categorySlug: 'law-llb-llm',
    subjects: [
      'Comparative Constitutional Law & Federalism',
      'Corporate Governance, Securities & Capital Markets',
      'Intellectual Property Rights (IPR & Patent Law)',
      'International Commercial Arbitration & Dispute Resolution',
      'Advanced Criminal Law & Criminology',
      'International Trade Law (WTO & Global Commerce)',
      'Cyber Law & Artificial Intelligence Jurisprudence',
    ],
  },
  {
    id: 'med-masters',
    name: 'M.Ed. (Master of Education)',
    level: 'pg',
    categorySlug: 'education-bed-med',
    subjects: [
      'Philosophical Perspectives of Education',
      'Sociological Perspectives of Education',
      'Psychological Foundations of Learning',
      'Curriculum Development and Evaluation',
      'Educational Research Methodology and Statistics',
      'Teacher Education and Professional Development',
      'Educational Management, Leadership and Administration',
    ],
  },

  // ===========================================================================
  // 6. COMPETITIVE & GOVT EXAMS
  // ===========================================================================
  {
    id: 'comp-upsc',
    name: 'UPSC Civil Services (IAS / IPS / IFS)',
    level: 'competitive',
    categorySlug: 'upsc-civil-services',
    subjects: [
      'Indian Polity & Constitution (M. Laxmikanth Highlights)',
      'Modern Indian History & National Movement (Spectrum)',
      'Ancient & Medieval History of India (NCERT & Poonam Dalal)',
      'Indian & World Geography (Physical, Human & Economic)',
      'Indian Economy & Budget Analysis (Ramesh Singh / Sanjiv Verma)',
      'General Science, Science & Technology and Defence',
      'Environment, Ecology, Biodiversity & Climate Change (Shankar IAS)',
      'Ethics, Integrity & Aptitude (General Studies Paper IV)',
      'Current Affairs Monthly Compilation & Editorial Mindmaps',
      'CSAT Aptitude, Logical Reasoning & Reading Comprehension',
    ],
  },
  {
    id: 'comp-gate',
    name: 'GATE Engineering Exam',
    level: 'competitive',
    categorySlug: 'gate-exam',
    subjects: [
      'GATE CSE: Engineering Maths, Discrete Maths & Aptitude',
      'GATE CSE: DSA, Algorithms, OS, DBMS, TOC, Networks, Compilers',
      'GATE ECE: Signals, Networks, Electronic Devices, Communications',
      'GATE ME: Thermo, Fluid Mechanics, Strength of Materials, SOM',
      'GATE EE: Power Systems, Electrical Machines, Control Systems',
      'GATE CE: Structural Analysis, Soil Mechanics, Fluid, Transportation',
      'Last 15 Years Solved GATE PYQ Formula Booklets',
    ],
  },
  {
    id: 'comp-ssc-banking',
    name: 'SSC CGL, CHSL, Banking (IBPS / SBI PO & Clerk)',
    level: 'competitive',
    categorySlug: 'ssc-exams',
    subjects: [
      'Quantitative Aptitude (Shortcuts, Vedic Maths, Formulas)',
      'General Intelligence & Logical Reasoning (Verbal & Non-Verbal)',
      'English Language & Comprehension (Grammar, Vocab, Cloze Test)',
      'General Awareness, Static GK & Science Capsule',
      'Banking Awareness, RBI Guidelines & Financial GK',
      'Computer Knowledge & Keyboard Shortcuts Capsule',
    ],
  },
  {
    id: 'comp-ugc-net',
    name: 'UGC NET / JRF & SET Exam',
    level: 'competitive',
    categorySlug: 'ugc-net-set',
    subjects: [
      'Paper 1: Teaching Aptitude, Research Methodology & Data Interpretation',
      'Paper 1: ICT, Higher Education System & People, Dev & Environment',
      'Paper 2 English: Complete History of English Literature & Literary Theory',
      'Paper 2 Commerce: Accounting, Finance, Marketing, Law & Statistics',
      'Paper 2 Computer Science: Algorithms, OS, DBMS, AI & Architecture',
      'Paper 2 Political Science / History / Economics',
    ],
  },
  {
    id: 'comp-jee-neet',
    name: 'IIT JEE & NEET UG Medical Entrances',
    level: 'competitive',
    categorySlug: 'jee-main-advanced',
    subjects: [
      'NEET Biology: NCERT Line-by-Line Diagrams, Mindmaps & Solved PYQs',
      'NEET/JEE Chemistry: Organic Chemistry Reaction Mechanisms & Tricks',
      'NEET/JEE Chemistry: Inorganic Trends & Physical Chemistry Formulas',
      'JEE Physics: Mechanics, Electromagnetism, Optics & Modern Physics',
      'JEE Mathematics: Calculus, Algebra, Coordinate Geometry, Trigonometry',
    ],
  },
];

// Helper functions for easy consumption across components
export function getCoursesByLevel(levelId?: string): CourseItem[] {
  if (!levelId || levelId === 'all') {
    return COURSES_CATALOG;
  }
  return COURSES_CATALOG.filter((c) => c.level === levelId);
}

export function getCourseByName(courseName: string): CourseItem | undefined {
  if (!courseName) return undefined;
  const clean = courseName.trim().toLowerCase();
  return COURSES_CATALOG.find(
    (c) => c.name.toLowerCase() === clean || c.name.toLowerCase().includes(clean)
  );
}

export function getSubjectsForCourse(courseName: string): string[] {
  const match = getCourseByName(courseName);
  if (match) {
    return match.subjects;
  }

  // Generic comprehensive subject fallback
  return [
    'English Complete (Grammar, Writing & Literature)',
    'Mathematics & Numerical Methods',
    'Physics / General Science',
    'Chemistry / Chemical Sciences',
    'Biology / Life Sciences',
    'Computer Science & Programming',
    'History & Civilization',
    'Political Science & Governance',
    'Economics & Financial Systems',
    'Business Studies & Management',
    'Accountancy & Taxation',
    'Law, Constitution & Jurisprudence',
  ];
}

export function getSemestersForLevel(levelId?: string): string[] {
  if (levelId === 'school-10') {
    return [
      'Full Syllabus (Board Exam)',
      'Term 1 / Mid-Term Exams',
      'Term 2 / Pre-Board Exams',
      'Formulas & Quick Revision Capsule',
    ];
  }

  if (levelId === 'school-11' || levelId === 'school-12') {
    return [
      'Full Syllabus (Annual / Board Exam)',
      'Term 1 / Mid-Term Exams',
      'Term 2 / Pre-Board Exams',
      'Class 11 Foundation / Class 12 Boards',
      'Formulas, Derivations & Diagram Notes',
    ];
  }

  if (levelId === 'ug') {
    return [
      '1st Semester',
      '2nd Semester',
      '3rd Semester',
      '4th Semester',
      '5th Semester',
      '6th Semester',
      '7th Semester (Engineering/Pharma)',
      '8th Semester (Engineering/Pharma)',
      '1st Year (Annual System - BA/BSc/BCom)',
      '2nd Year (Annual System - BA/BSc/BCom)',
      '3rd Year (Annual System - BA/BSc/BCom)',
    ];
  }

  if (levelId === 'pg') {
    return [
      '1st Semester (PG / Masters)',
      '2nd Semester (PG / Masters)',
      '3rd Semester (PG / Masters)',
      '4th Semester (PG / Masters)',
      '1st Year (PG Annual)',
      '2nd Year (PG Final Year)',
      'Dissertation / Thesis Research Phase',
    ];
  }

  if (levelId === 'competitive') {
    return [
      'Full Exam Syllabus',
      'Prelims Examination Phase',
      'Mains Examination Phase',
      'Interview & Personality Test Notes',
      'Mock Test PYQs & Revision Capsule',
    ];
  }

  // Default universal semester list
  return [
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester',
    '1st Year',
    '2nd Year',
    '3rd Year',
    'Board Exam (Full Syllabus)',
    'Competitive Exam Phase',
  ];
}
