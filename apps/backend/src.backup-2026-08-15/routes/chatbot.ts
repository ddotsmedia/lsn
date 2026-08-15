import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import { logMatch } from '../integrations/chatbot-analytics.js';
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
  'a', 'about', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'for', 'from', 'get', 'give', 'had', 'has', 'have', 'her', 'here', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'know', 'like', 'looking', 'many',
  'may', 'me', 'much', 'my', 'need', 'of', 'on', 'or', 'our', 'please', 'she', 'should', 'so',
  'some', 'tell', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they',
  'this', 'to', 'up', 'us', 'want', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who',
  'why', 'will', 'with', 'would', 'you', 'your',
]);

/**
 * Soundex, used only as a fallback so near-misses like "allergys" or "nutricion"
 * still land. It is far looser than exact matching, so hits score below any
 * exact hit and short words are excluded — "fee"/"few" collide otherwise.
 */
export function soundex(word: string): string {
  const codes: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };
  const letters = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!letters) return '';

  const first = letters[0] as string;
  let result = first.toUpperCase();
  let previous = codes[first] ?? '';

  for (const char of letters.slice(1)) {
    const code = codes[char] ?? '';
    if (code && code !== previous) result += code;
    if (char !== 'h' && char !== 'w') previous = code;
    if (result.length === 4) break;
  }
  return result.padEnd(4, '0');
}

const MIN_FUZZY_LENGTH = 5;

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
  fuzzy: boolean;
}

export interface MatchResult {
  faq: ChatbotFaq;
  score: number;
  fuzzy: boolean;
}

/**
 * Scores one FAQ against a visitor message.
 *
 * Multi-word keywords are matched as substrings and weighted far higher than
 * single words, because a phrase like "how much" is a much stronger signal than
 * any one token. Single words must match a whole token — plain `includes` would
 * let "art" match "start" and "eat" match "great".
 */
function scoreFaq(
  normalized: string,
  tokens: Set<string>,
  soundexTokens: Set<string>,
  faq: ChatbotFaq
): FaqMatch {
  let score = 0;
  let specificity = 0;
  let fuzzy = false;

  for (const rawKeyword of faq.keywords.split(',')) {
    const keyword = normalizeText(rawKeyword);
    if (!keyword) continue;

    if (keyword.includes(' ')) {
      if (normalized.includes(keyword)) {
        score += 6;
        specificity += keyword.length;
      }
      continue;
    }

    if (STOPWORDS.has(keyword)) continue;

    if (tokens.has(keyword)) {
      score += 2;
      specificity += keyword.length;
    } else if (keyword.length >= MIN_FUZZY_LENGTH && soundexTokens.has(soundex(keyword))) {
      score += 1;
      specificity += keyword.length;
      fuzzy = true;
    }
  }

  return { faq, score, specificity, fuzzy };
}

/**
 * Best-matching active FAQ, or null. Ties break towards the more specific match.
 * A purely fuzzy match needs a higher score to win, since soundex alone is weak
 * evidence and a wrong confident answer is worse than handing over to a human.
 */
export function matchFaqDetailed(
  message: string,
  faqs: readonly ChatbotFaq[]
): MatchResult | null {
  const normalized = normalizeText(message);
  if (!normalized) return null;

  const tokens = new Set(normalized.split(' ').filter((t) => !STOPWORDS.has(t)));
  const soundexTokens = new Set(
    [...tokens].filter((t) => t.length >= MIN_FUZZY_LENGTH).map(soundex)
  );

  let best: FaqMatch | null = null;
  for (const faq of faqs) {
    const candidate = scoreFaq(normalized, tokens, soundexTokens, faq);
    if (candidate.score === 0) continue;
    if (
      best === null ||
      candidate.score > best.score ||
      (candidate.score === best.score && candidate.specificity > best.specificity)
    ) {
      best = candidate;
    }
  }

  if (!best) return null;
  if (best.fuzzy && best.score < 2) return null;
  return { faq: best.faq, score: best.score, fuzzy: best.fuzzy };
}

export function matchFaq(message: string, faqs: readonly ChatbotFaq[]): ChatbotFaq | null {
  return matchFaqDetailed(message, faqs)?.faq ?? null;
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
    const result = matchFaqDetailed(data.message, faqResult.rows as ChatbotFaq[]);
    const match = result?.faq ?? null;

    const settings = await loadSettings(db);
    const replyText = match ? match.answer : settings.fallback_message;
    const botMessage = await insertMessage(db, conversationId, 'bot', replyText);

    logMatch(db, {
      conversationId,
      question: data.message,
      faqId: match?.id ?? null,
      category: match?.category ?? null,
      score: result?.score ?? 0,
      fuzzy: result?.fuzzy ?? false,
      escalated: match === null,
    });

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
