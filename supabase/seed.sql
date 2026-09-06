-- NoteMart Seed Data Script
-- Populates default categories and sample realistic notes/users for immediate marketplace experience.

-- Categories
INSERT INTO public.categories (name, slug, description) VALUES
('Computer Science', 'computer-science', 'Data Structures, Algorithms, Web Dev, OS, DBMS, AI & ML handwritten notes'),
('Information Technology', 'information-technology', 'Cloud Computing, Cybersecurity, Software Engineering, DevOps notes'),
('Mechanical Engineering', 'mechanical-engineering', 'Thermodynamics, Fluid Mechanics, Theory of Machines, CAD notes'),
('Civil Engineering', 'civil-engineering', 'Structural Analysis, Surveying, Geotechnical, Environmental Engineering'),
('Electrical Engineering', 'electrical-engineering', 'Circuit Theory, Control Systems, Power Systems, Signals & Systems'),
('Electronics & Comm', 'electronics-comm', 'Digital Signal Processing, Embedded Systems, VLSI, Microprocessors'),
('Management & MBA', 'management-mba', 'Financial Accounting, Marketing Strategy, Human Resource Management'),
('Mathematics', 'mathematics', 'Calculus, Linear Algebra, Differential Equations, Discrete Mathematics'),
('Physics', 'physics', 'Quantum Mechanics, Electromagnetism, Optics, Classical Mechanics'),
('Chemistry', 'chemistry', 'Organic, Inorganic, Physical Chemistry & Spectroscopy notes'),
('Biology & Biotech', 'biology-biotech', 'Genetics, Biochemistry, Microbiology, Cell Biology notes'),
('Commerce & CA', 'commerce-ca', 'Corporate Accounting, Business Law, Taxation, Costing notes'),
('Arts & Humanities', 'arts-humanities', 'Psychology, Economics, History, Political Science notes'),
('Other Domains', 'other-domains', 'General aptitude, competitive exam prep, notes from other streams')
ON CONFLICT (slug) DO NOTHING;
