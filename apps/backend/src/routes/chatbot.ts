import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import type {
  ChatbotFaq,
  ChatbotMessage,
  ChatbotSettings,
  ConversationWithMessages,
} from '../types/chatbot.js';

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

const CreateConversationSchema = z.object({
  visitor_name: z.string().trim().min(1).max(255).optional(),
  visitor_email: z.string().trim().email().max(255).optional(),
  visitor_phone: z.string().trim().min(5).max(30).optional(),
});

const MessageSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000),
  visitor_name: z.string().trim().max(255).optional(),
  visitor_email: z.string().trim().max(255).optional(),
  visitor_phone: z.string().trim().max(30).optional(),
});

const AppointmentSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  visitor_name: z.string().trim().min(2).max(255),
  visitor_email: z.string().trim().email().max(255),
  visitor_phone: z.string().trim().min(7).max(30),
  preferred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'preferred_date must be YYYY-MM-DD')
    .optional(),
  preferred_time: z.string().trim().max(20).optional(),
  age_group: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/* -------------------------------------------------------------------------- */
/* FAQ matching                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Words too common to carry meaning. Without this the matcher latches onto
 * whichever FAQ happens to list a filler word and answers the wrong question.
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'get', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my',
  'of', 'on', 'or', 'our', 'please', 'so', 'that', 'the', 'their', 'them', 'then', 'there',
  'they', 'this', 'to', 'up', 'want', 'was', 'we', 'what', 'which', 'will', 'with', 'would',
  'you', 'your',
]);

/** Lowercases and strips punctuation, keeping letters/digits from any script. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface FaqMatch {
  faq: ChatbotFaq;
  score: number;
  specificity: number;
}

/**
 * Scores one FAQ against a visitor message.
 *
 * Multi-word keywords are matched as substrings and weighted far higher than
 * single words, because a phrase like "how much" is a much stronger signal than
 * any one token. Single words must match a whole token — plain `includes` would
 * let "art" match "start" and "eat" match "great".
 */
function scoreFaq(normalized: string, tokens: Set<string>, faq: ChatbotFaq): FaqMatch {
  let score = 0;
  let specificity = 0;

  for (const rawKeyword of faq.keywords.split(',')) {
    const keyword = normalizeText(rawKeyword);
    if (!keyword) continue;

    if (keyword.includes(' ')) {
      if (normalized.includes(keyword)) {
        score += 3;
        specificity += keyword.length;
      }
      continue;
    }

    if (STOPWORDS.has(keyword)) continue;
    if (tokens.has(keyword)) {
      score += 1;
      specificity += keyword.length;
    }
  }

  return { faq, score, specificity };
}

/**
 * Returns the best-matching active FAQ, or null when nothing matched.
 * Ties break towards the more specific match (longer matched keywords).
 */
export function matchFaq(message: string, faqs: readonly ChatbotFaq[]): ChatbotFaq | null {
  const normalized = normalizeText(message);
  if (!normalized) return null;

  const tokens = new Set(normalized.split(' '));

  let best: FaqMatch | null = null;
  for (const faq of faqs) {
    const candidate = scoreFaq(normalized, tokens, faq);
    if (candidate.score === 0) continue;
    if (
      best === null ||
      candidate.score > best.score ||
      (candidate.score === best.score && candidate.specificity > best.specificity)
    ) {
      best = candidate;
    }
  }

  return best ? best.faq : null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

async function loadSettings(db: Pool): Promise<ChatbotSettings> {
  const result = await db.query('SELECT setting_key, setting_value FROM chatbot_settings');
  const map = new Map<string, string>(
    result.rows.map((r: { setting_key: string; setting_value: string }) => [
      r.setting_key,
      r.setting_value,
    ])
  );

  return {
    bot_name: map.get('bot_name') ?? 'Smartie',
    welcome_message: map.get('welcome_message') ?? 'Hello! How can I help?',
    fallback_message:
      map.get('fallback_message') ??
      'I am not sure about that one — our team will reply here shortly.',
    whatsapp_number: map.get('whatsapp_number') ?? '971562677747',
    office_phone: map.get('office_phone') ?? '+971 56 267 7747',
    is_enabled: (map.get('is_enabled') ?? 'true') === 'true',
  };
}

async function insertMessage(
  db: Pool,
  conversationId: string,
  sender: 'visitor' | 'bot' | 'admin',
  message: string
): Promise<ChatbotMessage> {
  const result = await db.query(
    `INSERT INTO chatbot_messages (conversation_id, sender, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, sender, message]
  );
  return result.rows[0] as ChatbotMessage;
}

/* -------------------------------------------------------------------------- */
/* Handlers                                                                    */
/* -------------------------------------------------------------------------- */

async function createConversation(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = CreateConversationSchema.parse(req.body ?? {});
    const result = await db.query(
      `INSERT INTO chatbot_conversations (visitor_name, visitor_email, visitor_phone)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.visitor_name ?? null, data.visitor_email ?? null, data.visitor_phone ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('createConversation failed', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
}

async function getConversation(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || !z.string().uuid().safeParse(id).success) {
      res.status(400).json({ error: 'Invalid conversation id' });
      return;
    }

    const conversation = await db.query('SELECT * FROM chatbot_conversations WHERE id = $1', [id]);
    if (conversation.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = await db.query(
      'SELECT * FROM chatbot_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const payload: ConversationWithMessages = {
      ...conversation.rows[0],
      messages: messages.rows as ChatbotMessage[],
    };
    res.json(payload);
  } catch (error) {
    console.error('getConversation failed', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}

/**
 * Stores the visitor's message, answers it from the FAQ table and stores the
 * reply. When nothing matches, the conversation is escalated so it surfaces in
 * the admin queue for a human answer.
 */
async function postMessage(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = MessageSchema.parse(req.body);

    let conversationId = data.conversation_id ?? null;

    if (conversationId) {
      const existing = await db.query(
        'SELECT id, status FROM chatbot_conversations WHERE id = $1',
        [conversationId]
      );
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      if ((existing.rows[0] as { status: string }).status === 'closed') {
        res.status(409).json({ error: 'This conversation has been closed' });
        return;
      }
      // Fill in contact details if the visitor supplied them mid-conversation,
      // without overwriting anything already captured.
      await db.query(
        `UPDATE chatbot_conversations
         SET visitor_name  = COALESCE(visitor_name, $2),
             visitor_email = COALESCE(visitor_email, $3),
             visitor_phone = COALESCE(visitor_phone, $4)
         WHERE id = $1`,
        [
          conversationId,
          data.visitor_name || null,
          data.visitor_email || null,
          data.visitor_phone || null,
        ]
      );
    } else {
      const created = await db.query(
        `INSERT INTO chatbot_conversations (visitor_name, visitor_email, visitor_phone)
         VALUES ($1, $2, $3) RETURNING id`,
        [data.visitor_name || null, data.visitor_email || null, data.visitor_phone || null]
      );
      conversationId = (created.rows[0] as { id: string }).id;
    }

    const visitorMessage = await insertMessage(db, conversationId, 'visitor', data.message);

    const faqResult = await db.query(
      'SELECT id, question, answer, category, keywords, is_active FROM chatbot_faq WHERE is_active = TRUE ORDER BY id ASC'
    );
    const match = matchFaq(data.message, faqResult.rows as ChatbotFaq[]);

    const settings = await loadSettings(db);
    const replyText = match ? match.answer : settings.fallback_message;
    const botMessage = await insertMessage(db, conversationId, 'bot', replyText);

    // An unanswered question is the only signal we get that a human is needed.
    // Never downgrade a conversation an admin already escalated or closed.
    await db.query(
      `UPDATE chatbot_conversations
       SET last_message_at = CURRENT_TIMESTAMP,
           status = CASE WHEN $2 AND status = 'active' THEN 'escalated' ELSE status END
       WHERE id = $1`,
      [conversationId, match === null]
    );

    res.status(201).json({
      conversation_id: conversationId,
      visitor_message: visitorMessage,
      bot_message: botMessage,
      escalated: match === null,
      matched_category: match ? match.category : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('postMessage failed', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
}

async function bookAppointment(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = AppointmentSchema.parse(req.body);

    if (data.conversation_id) {
      const exists = await db.query('SELECT id FROM chatbot_conversations WHERE id = $1', [
        data.conversation_id,
      ]);
      if (exists.rows.length === 0) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
    }

    const result = await db.query(
      `INSERT INTO chatbot_appointment_requests
         (conversation_id, visitor_name, visitor_email, visitor_phone,
          preferred_date, preferred_time, age_group, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.conversation_id ?? null,
        data.visitor_name,
        data.visitor_email,
        data.visitor_phone,
        data.preferred_date ?? null,
        data.preferred_time ?? null,
        data.age_group ?? null,
        data.notes ?? null,
      ]
    );

    // A request for a callback needs a human, so surface it in the admin queue.
    if (data.conversation_id) {
      await db.query(
        `UPDATE chatbot_conversations
         SET status = CASE WHEN status = 'active' THEN 'escalated' ELSE status END,
             last_message_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [data.conversation_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('bookAppointment failed', error);
    res.status(500).json({ error: 'Failed to save appointment request' });
  }
}

async function getSettings(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json(await loadSettings(db));
  } catch (error) {
    console.error('getSettings failed', error);
    res.status(500).json({ error: 'Failed to fetch chatbot settings' });
  }
}

/* -------------------------------------------------------------------------- */
/* Router                                                                      */
/* -------------------------------------------------------------------------- */

export function createChatbotRouter(db: Pool): express.Router {
  const router = express.Router();

  router.get('/settings', (req, res) => getSettings(db, req as AuthRequest, res));
  router.post('/conversations', (req, res) => createConversation(db, req as AuthRequest, res));
  router.get('/conversations/:id', (req, res) => getConversation(db, req as AuthRequest, res));
  router.post('/message', (req, res) => postMessage(db, req as AuthRequest, res));
  router.post('/book-appointment', (req, res) => bookAppointment(db, req as AuthRequest, res));

  return router;
}
