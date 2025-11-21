-- ============================================================================
-- SEED DATA: Development and Testing
-- Description: Sample data for development and testing purposes
-- Author: System Architect
-- Date: 2024-01-01
-- NOTE: Do NOT run this in production - for development only
-- ============================================================================

-- ============================================================================
-- SAMPLE USERS
-- Note: In production, users should be created via Supabase Auth
-- These are placeholder records for the users table
-- ============================================================================

-- Admin User (UUID should match Supabase Auth user ID)
INSERT INTO users (id, email, name, role, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- Teacher User 1
INSERT INTO users (id, email, name, role, status) VALUES
  ('00000000-0000-0000-0000-000000000002', 'teacher1@example.com', 'Maria Rossi', 'docente', 'active')
ON CONFLICT (id) DO NOTHING;

-- Teacher User 2
INSERT INTO users (id, email, name, role, status) VALUES
  ('00000000-0000-0000-0000-000000000003', 'teacher2@example.com', 'Giovanni Bianchi', 'docente', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE THEMES
-- ============================================================================

INSERT INTO themes (id, title_it, title_en, description_it, description_en, slug, status, display_order, created_by) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Arte e Tecnologia',
    'Art and Technology',
    'Una collezione di progetti che esplorano l''intersezione tra arte tradizionale e tecnologie digitali moderne, includendo installazioni interattive, arte generativa e media digitali.',
    'A collection of projects exploring the intersection of traditional art and modern digital technologies, including interactive installations, generative art, and digital media.',
    'arte-e-tecnologia',
    'published',
    1,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Sostenibilità Ambientale',
    'Environmental Sustainability',
    'Progetti innovativi dedicati alla sostenibilità ambientale, includendo soluzioni per il riciclo, energie rinnovabili, e sensibilizzazione sul cambiamento climatico.',
    'Innovative projects dedicated to environmental sustainability, including recycling solutions, renewable energy, and climate change awareness.',
    'sostenibilita-ambientale',
    'published',
    2,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Matematica Applicata',
    'Applied Mathematics',
    'Esplorazione pratica di concetti matematici attraverso progetti concreti, includendo modellazione 3D, algoritmi, e applicazioni della geometria nel mondo reale.',
    'Practical exploration of mathematical concepts through concrete projects, including 3D modeling, algorithms, and real-world geometry applications.',
    'matematica-applicata',
    'published',
    3,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE WORKS
-- ============================================================================

INSERT INTO works (
  id,
  title_it,
  title_en,
  description_it,
  description_en,
  class_name,
  teacher_name,
  school_year,
  status,
  license,
  tags,
  created_by
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Installazione Interattiva: Eco-Sensori',
    'Interactive Installation: Eco-Sensors',
    'Un''installazione artistica interattiva che utilizza sensori Arduino per visualizzare in tempo reale la qualità dell''aria attraverso proiezioni luminose dinamiche. Gli studenti hanno programmato i sensori e progettato le animazioni visive che cambiano colore in base ai livelli di CO2 e particolato.',
    'An interactive art installation using Arduino sensors to visualize air quality in real-time through dynamic light projections. Students programmed the sensors and designed visual animations that change color based on CO2 and particulate levels.',
    '4A Scienze',
    'Maria Rossi',
    '2023-24',
    'published',
    'CC BY-NC-SA',
    ARRAY['arduino', 'sensori', 'arte-interattiva', 'ambiente'],
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'App per il Riciclo Creativo',
    'Creative Recycling App',
    'Applicazione mobile sviluppata con React Native che suggerisce progetti di riciclo creativo basati su foto di oggetti da buttare. Utilizza machine learning per riconoscere materiali e proporre idee creative.',
    'Mobile app developed with React Native that suggests creative recycling projects based on photos of items to throw away. Uses machine learning to recognize materials and propose creative ideas.',
    '5B Informatica',
    'Giovanni Bianchi',
    '2023-24',
    'published',
    'CC BY',
    ARRAY['mobile-app', 'riciclo', 'ai', 'react-native'],
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Geometria Frattale in Processing',
    'Fractal Geometry in Processing',
    'Serie di sketch in Processing che esplorano la geometria frattale attraverso l''algoritmo di Mandelbrot e il triangolo di Sierpinski. Include varianti interattive dove gli utenti possono modificare parametri in tempo reale.',
    'Series of Processing sketches exploring fractal geometry through the Mandelbrot algorithm and Sierpinski triangle. Includes interactive variants where users can modify parameters in real-time.',
    '3C Matematica',
    'Maria Rossi',
    '2023-24',
    'published',
    'CC BY-SA',
    ARRAY['matematica', 'frattali', 'processing', 'arte-generativa'],
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Documentario: Plastica Zero',
    'Documentary: Zero Plastic',
    'Cortometraggio documentario che segue il percorso di riduzione della plastica nella nostra scuola. Include interviste agli studenti, analisi dei dati di consumo, e proposte concrete per un futuro sostenibile.',
    'Short documentary following the journey of plastic reduction in our school. Includes student interviews, consumption data analysis, and concrete proposals for a sustainable future.',
    '4D Comunicazione',
    'Giovanni Bianchi',
    '2024-25',
    'published',
    'CC BY-NC',
    ARRAY['documentario', 'sostenibilità', 'video', 'ambiente'],
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Robot Pittore Automatico',
    'Automatic Painting Robot',
    'Robot costruito con LEGO Mindstorms programmato per creare dipinti astratti. Il progetto integra meccanica, programmazione e arte, esplorando il concetto di creatività artificiale.',
    'Robot built with LEGO Mindstorms programmed to create abstract paintings. The project integrates mechanics, programming and art, exploring the concept of artificial creativity.',
    '2A Tecnologia',
    'Maria Rossi',
    '2024-25',
    'pending_review',
    'CC BY',
    ARRAY['robotica', 'lego', 'arte', 'programmazione'],
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ASSOCIATE WORKS WITH THEMES
-- ============================================================================

INSERT INTO work_themes (work_id, theme_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'), -- Eco-Sensori -> Arte e Tecnologia
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'), -- Eco-Sensori -> Sostenibilità
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'), -- App Riciclo -> Sostenibilità
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'), -- Frattali -> Matematica
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'), -- Frattali -> Arte e Tecnologia
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002'), -- Documentario -> Sostenibilità
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001')  -- Robot -> Arte e Tecnologia
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE QR CODES
-- ============================================================================

INSERT INTO qr_codes (id, theme_id, short_code, is_active) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ART001', true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'ECO001', true),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'MATH01', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE EXTERNAL LINKS
-- ============================================================================

INSERT INTO work_links (work_id, url, link_type, custom_label) VALUES
  (
    '20000000-0000-0000-0000-000000000002',
    'https://github.com/example/recycling-app',
    'other',
    'Codice sorgente su GitHub'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'https://youtube.com/watch?v=example',
    'youtube',
    'Video dimostrazione'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'https://vimeo.com/example',
    'vimeo',
    'Cortometraggio completo'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE WORK REVIEWS
-- ============================================================================

INSERT INTO work_reviews (work_id, reviewer_id, action, comments) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'approved',
    'Ottimo lavoro! Il progetto è ben documentato e presenta un''applicazione innovativa dei sensori.'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'approved',
    'Progetto eccellente con grande potenziale pratico. L''integrazione del ML è particolarmente interessante.'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'approved',
    'Bellissima esplorazione della geometria frattale. Le visualizzazioni interattive sono molto efficaci.'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE ANALYTICS DATA
-- Note: Only for testing analytics views - would normally be generated by real usage
-- ============================================================================

-- Generate some QR scans
INSERT INTO qr_scans (qr_code_id, theme_id, scanned_at, hashed_ip, device_type)
SELECT
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  NOW() - (random() * INTERVAL '30 days'),
  md5(random()::text),
  (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)]
FROM generate_series(1, 50)
ON CONFLICT DO NOTHING;

-- Generate some work views
INSERT INTO work_views (work_id, viewed_at, hashed_ip, referrer)
SELECT
  '20000000-0000-0000-0000-000000000001',
  NOW() - (random() * INTERVAL '30 days'),
  md5(random()::text),
  (ARRAY['theme_page', 'search', 'direct'])[floor(random() * 3 + 1)]::TEXT
FROM generate_series(1, 100)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE COUNTERS
-- Note: Triggers would normally handle this, but we update manually for seed data
-- ============================================================================

UPDATE qr_codes SET scan_count = (
  SELECT COUNT(*) FROM qr_scans WHERE qr_code_id = qr_codes.id
);

UPDATE works SET view_count = (
  SELECT COUNT(*) FROM work_views WHERE work_id = works.id
);
