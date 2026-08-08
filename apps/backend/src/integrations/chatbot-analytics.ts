import type { Pool } from 'pg';

export interface MatchLog {
  conversationId: string;
  question: string;
  faqId: number | null;
  category: string | null;
  score: number;
  fuzzy: boolean;
  escalated: boolean;
}

/** Fire-and-forget: analytics must never fail a visitor's message. */
export function logMatch(db: Pool, entry: MatchLog): void {
  db.query(
    `INSERT INTO chatbot_analytics
       (conversation_id, question, matched_faq_id, matched_category, match_score, fuzzy, escalated)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      entry.conversationId,
      entry.question.slice(0, 2000),
      entry.faqId,
      entry.category,
      entry.score,
      entry.fuzzy,
      entry.escalated,
    ]
  ).catch((err) => console.error('logMatch failed', err));
}

export interface AnalyticsSummary {
  total: number;
  matched: number;
  escalated: number;
  hitRate: number;
  byCategory: Array<{ category: string; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
  topUnanswered: Array<{ question: string; count: number }>;
}

export async function getSummary(db: Pool, days: number): Promise<AnalyticsSummary> {
  const since = `${days} days`;

  const totals = await db.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(matched_faq_id)::int AS matched,
            COUNT(*) FILTER (WHERE escalated)::int AS escalated
     FROM chatbot_analytics WHERE created_at > NOW() - $1::interval`,
    [since]
  );

  const byCategory = await db.query(
    `SELECT COALESCE(matched_category,'unanswered') AS category, COUNT(*)::int AS count
     FROM chatbot_analytics WHERE created_at > NOW() - $1::interval
     GROUP BY 1 ORDER BY count DESC LIMIT 20`,
    [since]
  );

  const byHour = await db.query(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
     FROM chatbot_analytics WHERE created_at > NOW() - $1::interval
     GROUP BY 1 ORDER BY hour`,
    [since]
  );

  const topUnanswered = await db.query(
    `SELECT LOWER(question) AS question, COUNT(*)::int AS count
     FROM chatbot_analytics
     WHERE matched_faq_id IS NULL AND created_at > NOW() - $1::interval
     GROUP BY 1 ORDER BY count DESC, question LIMIT 20`,
    [since]
  );

  const row = totals.rows[0] as { total: number; matched: number; escalated: number };
  return {
    total: row.total,
    matched: row.matched,
    escalated: row.escalated,
    hitRate: row.total === 0 ? 0 : Math.round((row.matched / row.total) * 100),
    byCategory: byCategory.rows,
    byHour: byHour.rows,
    topUnanswered: topUnanswered.rows,
  };
}
