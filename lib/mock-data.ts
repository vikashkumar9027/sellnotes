import { Category, Note, Profile, Review, SystemSettings, Withdrawal, Report, Notification, Purchase } from '@/types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Computer Science', slug: 'computer-science', description: 'Data Structures, Algorithms, Web Dev, OS, DBMS, AI & ML handwritten notes', created_at: '2026-01-01T00:00:00Z', note_count: 42 },
  { id: 'cat-2', name: 'Information Technology', slug: 'information-technology', description: 'Cloud Computing, Cybersecurity, Software Engineering, DevOps notes', created_at: '2026-01-01T00:00:00Z', note_count: 28 },
  { id: 'cat-3', name: 'Mechanical Engineering', slug: 'mechanical-engineering', description: 'Thermodynamics, Fluid Mechanics, Theory of Machines, CAD notes', created_at: '2026-01-01T00:00:00Z', note_count: 19 },
  { id: 'cat-4', name: 'Civil Engineering', slug: 'civil-engineering', description: 'Structural Analysis, Surveying, Geotechnical, Environmental Engineering', created_at: '2026-01-01T00:00:00Z', note_count: 15 },
  { id: 'cat-5', name: 'Electrical Engineering', slug: 'electrical-engineering', description: 'Circuit Theory, Control Systems, Power Systems, Signals & Systems', created_at: '2026-01-01T00:00:00Z', note_count: 22 },
  { id: 'cat-6', name: 'Electronics & Comm', slug: 'electronics-comm', description: 'Digital Signal Processing, Embedded Systems, VLSI, Microprocessors', created_at: '2026-01-01T00:00:00Z', note_count: 31 },
  { id: 'cat-7', name: 'Management & MBA', slug: 'management-mba', description: 'Financial Accounting, Marketing Strategy, Human Resource Management', created_at: '2026-01-01T00:00:00Z', note_count: 14 },
  { id: 'cat-8', name: 'Mathematics', slug: 'mathematics', description: 'Calculus, Linear Algebra, Differential Equations, Discrete Mathematics', created_at: '2026-01-01T00:00:00Z', note_count: 38 },
  { id: 'cat-9', name: 'Physics', slug: 'physics', description: 'Quantum Mechanics, Electromagnetism, Optics, Classical Mechanics', created_at: '2026-01-01T00:00:00Z', note_count: 17 },
  { id: 'cat-10', name: 'Chemistry', slug: 'chemistry', description: 'Organic, Inorganic, Physical Chemistry & Spectroscopy notes', created_at: '2026-01-01T00:00:00Z', note_count: 16 },
  { id: 'cat-11', name: 'Biology & Biotech', slug: 'biology-biotech', description: 'Genetics, Biochemistry, Microbiology, Cell Biology notes', created_at: '2026-01-01T00:00:00Z', note_count: 11 },
  { id: 'cat-12', name: 'Commerce & CA', slug: 'commerce-ca', description: 'Corporate Accounting, Business Law, Taxation, Costing notes', created_at: '2026-01-01T00:00:00Z', note_count: 25 },
  { id: 'cat-13', name: 'Arts & Humanities', slug: 'arts-humanities', description: 'Psychology, Economics, History, Political Science notes', created_at: '2026-01-01T00:00:00Z', note_count: 9 },

  // GOVERNMENT & COMPETITIVE EXAM CATEGORIES
  { id: 'cat-gov-1', name: 'UPSC Civil Services (IAS/IPS)', slug: 'upsc-civil-services', description: 'UPSC CSE Prelims & Mains General Studies, History, Polity, Economy handwritten notes', created_at: '2026-01-01T00:00:00Z', note_count: 54 },
  { id: 'cat-gov-2', name: 'GATE Engineering Exam', slug: 'gate-exam', description: 'GATE CSE, ECE, EE, ME, CE branch-wise formulas, shortcuts & solved PYQs', created_at: '2026-01-01T00:00:00Z', note_count: 62 },
  { id: 'cat-gov-3', name: 'SSC CGL & CHSL Exams', slug: 'ssc-exams', description: 'Quantitative Aptitude, General Intelligence, Reasoning, English & GA notes', created_at: '2026-01-01T00:00:00Z', note_count: 48 },
  { id: 'cat-gov-4', name: 'Banking & Insurance (IBPS, SBI)', slug: 'banking-exams', description: 'Banking Awareness, Financial GK, Data Interpretation, Reasoning notes', created_at: '2026-01-01T00:00:00Z', note_count: 36 },
  { id: 'cat-gov-5', name: 'RRB Railway Exams (NTPC/JE)', slug: 'rrb-railway-exams', description: 'RRB NTPC, Group D, JE General Science, Mathematics & Technical notes', created_at: '2026-01-01T00:00:00Z', note_count: 29 },
  { id: 'cat-gov-6', name: 'JEE Main & Advanced', slug: 'jee-main-advanced', description: 'IIT JEE Physics, Chemistry, Mathematics mindmaps, formulas & trick notes', created_at: '2026-01-01T00:00:00Z', note_count: 75 },
  { id: 'cat-gov-7', name: 'NEET UG Medical Exam', slug: 'neet-ug-medical', description: 'NCERT Biology line-by-line notes, Chemistry mechanisms & Physics numericals', created_at: '2026-01-01T00:00:00Z', note_count: 68 },
  { id: 'cat-gov-8', name: 'CAT, XAT & MBA Entrances', slug: 'cat-mba-entrances', description: 'VARC, DILR, Quantitative Ability shortcuts & MBA entrance strategy notes', created_at: '2026-01-01T00:00:00Z', note_count: 24 },
  { id: 'cat-gov-9', name: 'State PSC & Govt Exams', slug: 'state-psc-exams', description: 'State Public Service Commission (MPSC, UPPSC, BPSC, KPSC, TNPSC) notes', created_at: '2026-01-01T00:00:00Z', note_count: 33 },
  { id: 'cat-gov-10', name: 'Defence Exams (NDA, CDS, AFCAT)', slug: 'defence-exams', description: 'NDA, CDS, AFCAT Mathematics, General Knowledge & SSB interview prep notes', created_at: '2026-01-01T00:00:00Z', note_count: 21 },
  { id: 'cat-gov-11', name: 'UGC NET & SET Exams', slug: 'ugc-net-set', description: 'Teaching & Research Aptitude (Paper 1) and Subject Paper 2 notes', created_at: '2026-01-01T00:00:00Z', note_count: 18 },

  { id: 'cat-14', name: 'Other / Custom Domains', slug: 'other-domains', description: 'General aptitude, competitive exam prep, notes from other custom categories', created_at: '2026-01-01T00:00:00Z', note_count: 8 }
];

export const MOCK_USERS: Profile[] = [
  {
    id: 'user-seller-1',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@iitb.ac.in',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    college: 'Department of Computer Science',
    university: 'IIT Bombay',
    course: 'B.Tech CS',
    semester: '6th Semester',
    role: 'seller',
    bio: 'CS student at IIT Bombay. Top 1% in GATE CSE & UPSC Prelims. Sharing neat handwritten notes with diagrammatic explanations and solved PYQs.',
    created_at: '2025-08-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'user-seller-2',
    full_name: 'Priya Patel',
    email: 'priya.p@dtu.ac.in',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    college: 'Delhi Technological University',
    university: 'DTU Delhi',
    course: 'B.Tech IT',
    semester: '4th Semester',
    role: 'seller',
    bio: 'Passionate note-maker & topper at DTU. Clear handwriting with colored callouts and step-by-step algorithms.',
    created_at: '2025-09-15T00:00:00Z',
    updated_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'user-student-1',
    full_name: 'Rohan Gupta',
    email: 'rohan.gupta@gmail.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    college: 'College of Engineering Pune',
    university: 'COEP Pune',
    course: 'B.Tech Mechanical',
    semester: '3rd Semester',
    role: 'student',
    bio: 'Eager learner looking for quality notes to ace university semester exams & government competitive exams.',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z'
  },
  {
    id: 'user-admin-1',
    full_name: 'NoteMart Platform Admin',
    email: 'admin@notemart.edu',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    university: 'NoteMart Central HQ',
    role: 'admin',
    bio: 'Official NoteMart System Administrator & Content Moderation Lead.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    seller_id: 'user-seller-1',
    category_id: 'cat-1',
    title: 'Data Structures & Algorithms Complete Master Class Notes',
    slug: 'data-structures-algorithms-complete-master-class-notes',
    description: 'Comprehensive 142-page handwritten notes covering Arrays, Linked Lists, Stacks, Queues, Trees (AVL, Red-Black), Graphs, Sorting Algorithms, Dynamic Programming, and Greedy Methods. Includes memory visualization diagrams, time/space complexity analysis table, and 50+ solved semester examination questions.',
    subject: 'Data Structures',
    university: 'IIT Bombay',
    college: 'Department of CS',
    course: 'B.Tech Computer Science',
    semester: '3rd Semester',
    year: '2025-2026',
    language: 'English',
    tags: ['DSA', 'Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'IIT Bombay', 'GATE'],
    pdf_path: '/sample-notes/dsa-notes.pdf',
    preview_path: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    file_size: 14200000,
    page_count: 142,
    price: 49,
    is_free: false,
    status: 'approved',
    downloads: 1420,
    views: 4850,
    average_rating: 4.9,
    rating_count: 128,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
    seller: MOCK_USERS[0],
    category: INITIAL_CATEGORIES[0]
  },
  {
    id: 'note-gov-1',
    seller_id: 'user-seller-1',
    category_id: 'cat-gov-1',
    title: 'UPSC CSE Indian Polity & Constitution Mind Maps & Article Cheatsheet',
    slug: 'upsc-cse-indian-polity-constitution-mind-maps',
    description: 'Complete 180-page handwritten notes for UPSC CSE Prelims & Mains General Studies Paper II. Covers Fundamental Rights, DPSP, Parliament, Judiciary, Constitutional Bodies, Landmark Supreme Court Judgments, and 10-year solved PYQ breakdowns.',
    subject: 'Indian Polity',
    university: 'UPSC Exam Prep',
    college: 'Vajiram Alumni Notes',
    course: 'UPSC Civil Services',
    semester: 'Competitive Exam',
    year: '2026',
    language: 'English',
    tags: ['UPSC', 'IAS', 'Polity', 'Laxmikanth', 'Constitution', 'General Studies'],
    pdf_path: '/sample-notes/upsc-polity.pdf',
    preview_path: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    file_size: 18500000,
    page_count: 180,
    price: 99,
    is_free: false,
    status: 'approved',
    downloads: 2840,
    views: 9200,
    average_rating: 4.95,
    rating_count: 215,
    created_at: '2026-01-12T08:00:00Z',
    updated_at: '2026-01-12T08:00:00Z',
    seller: MOCK_USERS[0],
    category: INITIAL_CATEGORIES[13]
  },
  {
    id: 'note-2',
    seller_id: 'user-seller-2',
    category_id: 'cat-1',
    title: 'Operating Systems & Process Synchronization Hand-Crafted Notes',
    slug: 'operating-systems-process-synchronization-notes',
    description: 'Neatly organized notes on Process Scheduling, Semaphore, Deadlocks, Virtual Memory Management, Paging, Segmentation, and File Systems. Includes step-by-step Bankers Algorithm examples and Peterson solution breakdown.',
    subject: 'Operating Systems',
    university: 'DTU Delhi',
    college: 'Department of IT',
    course: 'B.Tech IT',
    semester: '4th Semester',
    year: '2025-2026',
    language: 'English',
    tags: ['Operating Systems', 'Process', 'Deadlock', 'Paging', 'DTU', 'Semaphores'],
    pdf_path: '/sample-notes/os-notes.pdf',
    preview_path: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600',
    file_size: 9800000,
    page_count: 88,
    price: 0,
    is_free: true,
    status: 'approved',
    downloads: 2150,
    views: 6300,
    average_rating: 4.8,
    rating_count: 94,
    created_at: '2026-01-15T14:30:00Z',
    updated_at: '2026-01-15T14:30:00Z',
    seller: MOCK_USERS[1],
    category: INITIAL_CATEGORIES[0]
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    user_id: 'user-student-1',
    note_id: 'note-1',
    rating: 5,
    review: 'Hands down the best DSA notes I have read! The tree traversal diagrams and dynamic programming state transitions saved my semester exam. Worth every rupee.',
    created_at: '2026-01-12T14:22:00Z',
    user: MOCK_USERS[2]
  }
];

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    buyer_id: 'user-student-1',
    seller_id: 'user-seller-1',
    note_id: 'note-1',
    transaction_id: 'txn-101',
    base_amount: 49,
    gst_rate: 18,
    gst_amount: 8.82,
    buyer_total_amount: 57.82,
    platform_fee_rate: 10,
    platform_fee_amount: 4.9,
    seller_gross_amount: 49,
    seller_net_amount: 44.1,
    amount: 49,
    platform_fee: 4.9,
    seller_amount: 44.1,
    status: 'paid',
    payout_status: 'completed',
    refund_status: 'none',
    created_at: '2026-01-12T14:20:00Z',
    note: MOCK_NOTES[0],
    seller: MOCK_USERS[0],
    buyer: MOCK_USERS[2]
  },
  {
    id: 'pur-2',
    buyer_id: 'user-student-1',
    seller_id: 'user-seller-1',
    note_id: 'note-gov-1',
    transaction_id: 'txn-102',
    base_amount: 99,
    gst_rate: 18,
    gst_amount: 17.82,
    buyer_total_amount: 116.82,
    platform_fee_rate: 10,
    platform_fee_amount: 9.9,
    seller_gross_amount: 99,
    seller_net_amount: 89.1,
    amount: 99,
    platform_fee: 9.9,
    seller_amount: 89.1,
    status: 'paid',
    payout_status: 'completed',
    refund_status: 'none',
    created_at: '2026-01-14T09:15:00Z',
    note: MOCK_NOTES[1],
    seller: MOCK_USERS[0],
    buyer: MOCK_USERS[2]
  }
];

export const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'wth-1',
    seller_id: 'user-seller-1',
    amount: 1500,
    payment_method: 'upi',
    payment_details: 'aarav@okaxis',
    status: 'completed',
    admin_note: 'Payout processed via Razorpay Route transfer #TXN99281',
    created_at: '2026-02-01T10:00:00Z',
    processed_at: '2026-02-01T14:00:00Z',
    seller: MOCK_USERS[0]
  }
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-1',
    reporter_id: 'user-student-1',
    note_id: 'note-3',
    reason: 'wrong_description',
    description: 'Page 45 has a typo in Laplace inverse formula.',
    status: 'pending',
    created_at: '2026-02-10T16:00:00Z',
    reporter: MOCK_USERS[2],
    note: MOCK_NOTES[2]
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-seller-1',
    title: 'Note Approved 🎉',
    message: 'Your note "Data Structures & Algorithms Complete Master Class Notes" has been approved!',
    type: 'note_approved',
    is_read: false,
    created_at: '2026-01-10T10:05:00Z'
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  platform_commission: 10, // 10% PLATFORM COMMISSION (90% SELLER AMOUNT)
  gst_rate: 18,
  min_note_price: 0,
  max_note_price: 2000,
  min_withdrawal_amount: 100,
  max_pdf_size_mb: 2048,
  auto_approval: true,
  maintenance_mode: false,
  website_name: 'NoteMart',
  website_logo: '/logo.png',
  support_email: 'support@notemart.edu'
};
