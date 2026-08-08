-- Chatbot: conversations, messages, FAQ knowledge base, appointment requests
-- and settings.
--
-- Additive only. Every CREATE uses IF NOT EXISTS and every seed row uses
-- ON CONFLICT DO NOTHING, so this can be re-applied safely.

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  visitor_phone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chatbot_conversations_status_check
    CHECK (status IN ('active', 'escalated', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status
  ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_last_message_at
  ON chatbot_conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL
    REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chatbot_messages_sender_check
    CHECK (sender IN ('visitor', 'bot', 'admin'))
);

-- Messages are almost always read as "the thread for one conversation, oldest
-- first", so index the pair rather than the id alone.
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation
  ON chatbot_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS chatbot_faq (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  keywords TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_faq_active ON chatbot_faq(is_active);

CREATE TABLE IF NOT EXISTS chatbot_appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID
    REFERENCES chatbot_conversations(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(30) NOT NULL,
  preferred_date DATE,
  preferred_time VARCHAR(20),
  age_group VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chatbot_appointment_requests_status_check
    CHECK (status IN ('pending', 'contacted', 'scheduled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_appointments_status
  ON chatbot_appointment_requests(status);

CREATE TABLE IF NOT EXISTS chatbot_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Seed FAQ entries
--
-- `keywords` drives the matcher. Answers repeat the facts already published on
-- the site (hours from the contact page, age groups from /age-groups, tour
-- length from /booking) so the bot cannot contradict the pages themselves.
-- ---------------------------------------------------------------------------

INSERT INTO chatbot_faq (question, answer, category, keywords) VALUES
  (
    'What are your opening hours?',
    'We are open Monday to Friday, 7:00 AM to 6:00 PM. We are closed on Saturdays, Sundays and public holidays. Extended hours can sometimes be arranged on request — just ask.',
    'hours',
    'hours,open,opening,time,times,timing,close,closed,closing,when,weekend,saturday,sunday,holiday,schedule'
  ),
  (
    'What age groups do you accept?',
    'We have six groups: Bouncing Bunnies (0-1), Precious Pandas (1-2), Gentle Giraffes (2-3), Dazzling Dolphins (3-4), Fuzzy Foxes (4-5) and Cuddly Camels (4-5 advanced). Each has its own room and team. You can see a full day in each group on our Age Groups page.',
    'age_groups',
    'age,ages,group,groups,old,year,years,month,months,baby,babies,infant,toddler,preschool,programme,program,class,classes'
  ),
  (
    'How do I enrol my child?',
    'Enrolment starts with our online registration form, which takes about five minutes. We then contact you within two working days to confirm a place and arrange a visit. You can register from the Register page, or I can take your details here and have someone call you.',
    'enrollment',
    'enrol,enroll,enrolment,enrollment,register,registration,sign up,signup,apply,application,admission,admissions,join,place,waiting list'
  ),
  (
    'How much does it cost?',
    'Fees depend on the age group and whether you need full-time, part-time or flexible hours, so we quote per family rather than publishing a single price. Tuition covers daily care, meals and snacks, activities and trips. Leave your details and our admissions team will send you a full fee schedule.',
    'pricing',
    'cost,costs,price,prices,pricing,fee,fees,tuition,payment,pay,expensive,cheap,afford,monthly,term,discount,how much'
  ),
  (
    'What activities do the children do?',
    'Days are built around play-based learning: art and craft, music and movement, story and library time, science discovery, and outdoor play every day. Older groups also get early literacy and numeracy, sports and enrichment classes. Our Facilities page shows the rooms each activity happens in.',
    'activities',
    'activity,activities,curriculum,learn,learning,teach,teaching,play,art,music,sport,sports,outdoor,science,reading,library,routine,timetable,lesson,lessons'
  ),
  (
    'Do you provide meals?',
    'Yes. Fresh meals and snacks are prepared on site in our own kitchen and planned with our nutritionist. We cater for allergies and dietary requirements — tell us what your child needs during registration and we will confirm we can accommodate it.',
    'meals',
    'meal,meals,food,eat,eating,lunch,breakfast,snack,snacks,menu,diet,dietary,allergy,allergies,allergic,nutrition,halal,vegetarian,kitchen'
  ),
  (
    'Can I visit before deciding?',
    'Yes, and we would encourage it. Tours run on weekdays and take about 45 minutes, in groups of two to four people, in English or Arabic. You will see every room while the children are in them and can ask whatever you like. You can book from our Book a Tour page, or I can take your details here.',
    'tours',
    'tour,tours,visit,visiting,viewing,open day,appointment,book a tour,booking,meet the team,show me around'
  )
ON CONFLICT DO NOTHING;

INSERT INTO chatbot_settings (setting_key, setting_value) VALUES
  ('bot_name', 'Smartie'),
  ('welcome_message', 'Hello! I''m Smartie, the Little Smarties assistant. Ask me about our hours, age groups, fees, meals or booking a visit.'),
  ('fallback_message', 'I am not sure about that one. I have passed it to our team, who will reply here — or you can call us on +971 56 267 7747.'),
  ('whatsapp_number', '971562677747'),
  ('office_phone', '+971 56 267 7747'),
  ('is_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;
