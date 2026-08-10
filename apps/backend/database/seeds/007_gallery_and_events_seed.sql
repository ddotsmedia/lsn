-- Manual seed for gallery & events. Re-runnable: ON CONFLICT DO NOTHING on the
-- unique slug/title indexes added in 007.
--
-- Image URLs are picsum placeholders so the grid renders before real photos are
-- uploaded. Replace them from Admin > Gallery.

INSERT INTO gallery_categories (name, description, slug, sort_order) VALUES
  ('Classrooms',   'Our learning spaces across every age group',        'classrooms',   1),
  ('Outdoor Play', 'The garden, climbing frames and sand and water play','outdoor-play', 2),
  ('Activities',   'Art, music, science and everything in between',      'activities',   3),
  ('Celebrations', 'Parties, performances and special days',             'celebrations', 4),
  ('Facilities',   'Kitchen, library, hall and the rooms behind the scenes','facilities',5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO gallery_images (category_id, image_url, title, description, alt_text, sort_order, is_featured)
SELECT c.id, v.image_url, v.title, v.description, v.alt_text, v.sort_order, v.is_featured
FROM (VALUES
  ('classrooms',   'https://picsum.photos/seed/lsn-class-1/900/700',  'Toddler room',        'Low shelves and open floor space in the Precious Pandas room.', 'Toddler classroom with low shelving and floor mats', 1, TRUE),
  ('classrooms',   'https://picsum.photos/seed/lsn-class-2/900/700',  'Reading corner',      'A quiet corner with cushions and picture books.',               'Reading corner with cushions and books',            2, FALSE),
  ('classrooms',   'https://picsum.photos/seed/lsn-class-3/900/700',  'Preschool room',      'Tables set up for small group work.',                           'Preschool room with small group tables',            3, FALSE),
  ('outdoor-play', 'https://picsum.photos/seed/lsn-out-1/900/700',    'Climbing frame',      'Soft-fall surfacing under every climbing structure.',           'Children climbing frame with soft surfacing',       1, TRUE),
  ('outdoor-play', 'https://picsum.photos/seed/lsn-out-2/900/700',    'Sand and water',      'Messy play station in the shaded part of the garden.',          'Sand and water play table in the shade',            2, FALSE),
  ('outdoor-play', 'https://picsum.photos/seed/lsn-out-3/900/700',    'Growing beds',        'The planting beds the children sow and tend themselves.',       'Raised garden beds with young plants',              3, FALSE),
  ('activities',   'https://picsum.photos/seed/lsn-act-1/900/700',    'Painting session',    'Easels set up for a morning of painting.',                      'Child painting at an easel',                        1, TRUE),
  ('activities',   'https://picsum.photos/seed/lsn-act-2/900/700',    'Music and movement', 'Percussion instruments in the music room.',                      'Children playing percussion instruments',           2, FALSE),
  ('activities',   'https://picsum.photos/seed/lsn-act-3/900/700',    'Science discovery',   'Magnifying glasses and specimens on the discovery shelves.',    'Science discovery table with magnifying glasses',    3, FALSE),
  ('celebrations', 'https://picsum.photos/seed/lsn-cel-1/900/700',    'Graduation day',      'Certificates for our oldest groups before they move on.',       'Children in graduation caps holding certificates',  1, TRUE),
  ('celebrations', 'https://picsum.photos/seed/lsn-cel-2/900/700',    'World food day',      'Families brought a dish from home to share.',                   'Table of dishes brought by families',               2, FALSE),
  ('facilities',   'https://picsum.photos/seed/lsn-fac-1/900/700',    'Our kitchen',         'Meals are cooked on site every day.',                           'Commercial kitchen preparing fresh food',           1, FALSE),
  ('facilities',   'https://picsum.photos/seed/lsn-fac-2/900/700',    'Multi-purpose hall',  'Where assemblies and performances happen.',                     'Large hall with a stage area',                      2, FALSE)
) AS v(cat_slug, image_url, title, description, alt_text, sort_order, is_featured)
JOIN gallery_categories c ON c.slug = v.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM gallery_images g WHERE g.image_url = v.image_url);

INSERT INTO news_events (title, description, event_date, event_time, end_time, location, image_url, event_type, age_groups, is_published) VALUES
  ('Monthly Celebration Day','A fun-filled morning of games, music and special activities for every age group. Parents are welcome to join.','2027-01-15','10:00','12:00','Main Hall','https://picsum.photos/seed/lsn-ev-1/1200/800','Celebration','All age groups',TRUE),
  ('Science Discovery Workshop','Hands-on experiments and nature exploration, from colour mixing to magnetism.','2027-01-22','09:30','11:30','Science Exploration Center','https://picsum.photos/seed/lsn-ev-2/1200/800','Workshop','Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes',TRUE),
  ('Children''s Art Exhibition','A year of artwork on display, with guided tours and a chance to meet the young artists.','2027-02-05','14:00','16:00','Gallery Space','https://picsum.photos/seed/lsn-ev-3/1200/800','Exhibition','All age groups',TRUE),
  ('Little Smarties Sports Day','Races, obstacle courses and cooperative games for every group, with parents cheering.','2027-02-12','09:00','11:30','Outdoor Play Area','https://picsum.photos/seed/lsn-ev-4/1200/800','Sports','Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes',TRUE),
  ('Spring Music Recital','Solo and group performances from our young musicians.','2027-03-05','15:00','16:30','Multi-Purpose Hall','https://picsum.photos/seed/lsn-ev-5/1200/800','Performance','All age groups',TRUE),
  ('Parent-Teacher Conferences','One-to-one conversations about your child''s progress, interests and next steps.','2027-03-12','09:00','13:00','Conference Room','https://picsum.photos/seed/lsn-ev-6/1200/800','Meeting','All age groups',TRUE),
  ('Nature Center Field Trip','A morning of wildlife observation and habitat exploration off site.','2027-03-24','08:30','12:30','Local Nature Center','https://picsum.photos/seed/lsn-ev-7/1200/800','Learning','Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes',TRUE),
  ('End of Year Celebration','Performances, games, a shared meal and a photo slideshow of the year.','2027-04-09','14:00','17:00','Little Smarties Nursery','https://picsum.photos/seed/lsn-ev-8/1200/800','Celebration','All age groups',TRUE),
  ('Graduation Day','Certificates and songs as our oldest groups moved on to school.','2026-06-12','09:00','12:00','Multi-Purpose Hall','https://picsum.photos/seed/lsn-ev-9/1200/800','Celebration','Fuzzy Foxes, Cuddly Camels',TRUE),
  ('World Food Day','Families brought a dish from home and the children tasted their way around the world.','2026-05-20','10:00','11:30','Cafeteria','https://picsum.photos/seed/lsn-ev-10/1200/800','Celebration','All age groups',TRUE),
  ('Spring Planting Morning','Every group planted something in the garden beds and took a seedling home.','2026-04-16','09:30','11:00','Outdoor Play Area','https://picsum.photos/seed/lsn-ev-11/1200/800','Learning','All age groups',TRUE),
  ('Community Helpers Day','Visitors from the fire service and a paediatric nurse spent the morning with us.','2026-02-11','09:00','11:00','Outdoor Play Area','https://picsum.photos/seed/lsn-ev-12/1200/800','Learning','All age groups',TRUE)
ON CONFLICT (title) DO NOTHING;
