/** Shapes returned by the chatbot endpoints and stored in the chatbot_* tables. */

export type ConversationStatus = 'active' | 'escalated' | 'closed';
export type MessageSender = 'visitor' | 'bot' | 'admin';
export type AppointmentStatus = 'pending' | 'contacted' | 'scheduled' | 'cancelled';

export interface ChatbotConversation {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: ConversationStatus;
  created_at: string;
  last_message_at: string;
}

export interface ChatbotMessage {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  message: string;
  created_at: string;
}

export interface ChatbotFaq {
  id: number;
  question: string;
  answer: string;
  category: string;
  keywords: string;
  is_active: boolean;
}

export interface ChatbotAppointmentRequest {
  id: string;
  conversation_id: string | null;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  preferred_date: string | null;
  preferred_time: string | null;
  age_group: string | null;
  notes: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

/** A conversation plus its full message thread. */
export interface ConversationWithMessages extends ChatbotConversation {
  messages: ChatbotMessage[];
}

/** Conversation summary used by the admin list view. */
export interface ConversationSummary extends ChatbotConversation {
  message_count: number;
  last_message_preview: string | null;
}

/** What POST /chatbot/message returns to the widget. */
export interface BotReply {
  conversation_id: string;
  visitor_message: ChatbotMessage;
  bot_message: ChatbotMessage;
  /** True when nothing matched and the conversation was escalated for a human. */
  escalated: boolean;
  /** Category of the FAQ that matched, for light client-side theming. */
  matched_category: string | null;
}

/** Public chatbot configuration exposed to the widget. */
export interface ChatbotSettings {
  bot_name: string;
  welcome_message: string;
  fallback_message: string;
  whatsapp_number: string;
  office_phone: string;
  is_enabled: boolean;
}
