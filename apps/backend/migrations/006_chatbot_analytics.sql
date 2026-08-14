CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  matched_faq_id INT REFERENCES chatbot_faq(id) ON DELETE SET NULL,
  matched_category VARCHAR(50),
  match_score INT NOT NULL DEFAULT 0,
  fuzzy BOOLEAN NOT NULL DEFAULT FALSE,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at ON chatbot_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_escalated ON chatbot_analytics(escalated);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_category ON chatbot_analytics(matched_category);
