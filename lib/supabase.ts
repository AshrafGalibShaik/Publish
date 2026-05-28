import { createBrowserClient } from "@supabase/ssr";

// Re-export a singleton browser client for backwards compatibility
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Legacy aliases
export const getSupabase = () => supabase;
export const getClientSupabase = () => supabase;
export const supabaseAdmin = supabase;

export interface Content {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description?: string;
  content_html: string;
  content_text: string;
  topic?: string;
  status: "published" | "draft";
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  title?: string;
  content_html?: string;
  content_text?: string;
  topic?: string;
  content_id?: string;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  content_html: string;
  content_text: string;
  changed_by?: string;
  change_summary?: string;
  created_at: string;
}

export interface EditLog {
  id: string;
  content_id?: string;
  draft_id?: string;
  user_id: string;
  action: string;
  previous_content?: string;
  new_content?: string;
  timestamp: string;
}

export interface ContentEmbedding {
  id: string;
  content_id: string;
  embedding: number[];
  embedding_model: string;
  created_at: string;
}
