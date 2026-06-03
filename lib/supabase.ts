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

// Reddit-like Comment Interface
export interface Comment {
  id: string;
  content_id: string;
  user_id: string | null;
  parent_id: string | null;
  comment_text: string;
  is_ai: boolean;
  ai_model?: string;
  created_at: string;
  author_name?: string;
  replies?: Comment[];
}

// Reddit-like Vote Interface
export interface Vote {
  id: string;
  user_id: string;
  content_id: string;
  vote_type: 1 | -1;
  created_at: string;
}

// ── Comments & Voting Query Helpers with Local Fallbacks ──

// Helper: Get all votes for a post
export async function getPostVotes(contentId: string): Promise<{ score: number; userVote: 1 | -1 | null }> {
  try {
    const { data: votes, error } = await supabase
      .from("votes")
      .select("user_id, vote_type")
      .eq("content_id", contentId);

    if (error) throw error;

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    let score = 0;
    let userVote: 1 | -1 | null = null;

    if (votes) {
      votes.forEach((v: any) => {
        score += v.vote_type;
        if (currentUserId && v.user_id === currentUserId) {
          userVote = v.vote_type;
        }
      });
    }

    return { score, userVote };
  } catch (err) {
    // Fallback to localStorage
    const localVotes = JSON.parse(localStorage.getItem(`votes_fallback_${contentId}`) || '{"score": 15, "userVote": null}');
    return localVotes;
  }
}

// Helper: Cast vote
export async function castPostVote(contentId: string, voteType: 1 | -1 | null): Promise<{ score: number; userVote: 1 | -1 | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Authentication required");

    if (voteType === null) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("content_id", contentId)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("votes")
        .upsert({
          content_id: contentId,
          user_id: user.id,
          vote_type: voteType,
          created_at: new Date().toISOString()
        }, { onConflict: "user_id,content_id" });
      if (error) throw error;
    }

    return await getPostVotes(contentId);
  } catch (err) {
    // Fallback state update in localStorage
    const key = `votes_fallback_${contentId}`;
    const current = JSON.parse(localStorage.getItem(key) || '{"score": 15, "userVote": null}');
    
    let diff = 0;
    if (current.userVote === voteType) {
      // No change
    } else {
      // Revert current vote contribution
      if (current.userVote !== null) diff -= current.userVote;
      // Add new vote contribution
      if (voteType !== null) diff += voteType;
    }

    const nextState = {
      score: current.score + diff,
      userVote: voteType
    };
    localStorage.setItem(key, JSON.stringify(nextState));
    return nextState;
  }
}

// Helper: Get threaded comments for a post
export async function getPostComments(contentId: string): Promise<Comment[]> {
  try {
    const { data: dbComments, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:users (
          name,
          email
        )
      `)
      .eq("content_id", contentId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formatted: Comment[] = (dbComments || []).map((c: any) => ({
      id: c.id,
      content_id: c.content_id,
      user_id: c.user_id,
      parent_id: c.parent_id,
      comment_text: c.comment_text,
      is_ai: c.is_ai,
      ai_model: c.ai_model,
      created_at: c.created_at,
      author_name: c.is_ai ? "AI Co-pilot Bot" : (c.author?.name || c.author?.email?.split("@")[0] || "User")
    }));

    return buildThreadedComments(formatted);
  } catch (err) {
    // Fallback to localStorage
    const localKey = `comments_fallback_${contentId}`;
    const raw = localStorage.getItem(localKey);
    if (!raw) {
      // Seed default AI comment if empty
      const defaultAIComments: Comment[] = [
        {
          id: `ai-seed-${contentId}`,
          content_id: contentId,
          user_id: null,
          parent_id: null,
          comment_text: "Welcome to this AI-native Reddit post! Ask me any questions, request summaries, or query key concepts. I will dynamically reply.",
          is_ai: true,
          ai_model: "Qwen 2.5 32B",
          created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          author_name: "Qwen 2.5 32B Bot"
        }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultAIComments));
      return defaultAIComments;
    }
    return buildThreadedComments(JSON.parse(raw));
  }
}

// Helper: Add a comment
export async function addPostComment(
  contentId: string, 
  text: string, 
  parentId: string | null = null, 
  isAi: boolean = false, 
  aiModel?: string
): Promise<Comment> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    
    const commentData = {
      content_id: contentId,
      user_id: isAi ? null : (user?.id || null),
      parent_id: parentId,
      comment_text: text,
      is_ai: isAi,
      ai_model: aiModel || (isAi ? "Qwen 2.5 32B" : undefined),
      created_at: new Date().toISOString()
    };

    const { data: newComment, error } = await supabase
      .from("comments")
      .insert(commentData)
      .select(`
        *,
        author:users (
          name,
          email
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: newComment.id,
      content_id: newComment.content_id,
      user_id: newComment.user_id,
      parent_id: newComment.parent_id,
      comment_text: newComment.comment_text,
      is_ai: newComment.is_ai,
      ai_model: newComment.ai_model,
      created_at: newComment.created_at,
      author_name: newComment.is_ai ? `${newComment.ai_model} Bot` : (newComment.author?.name || newComment.author?.email?.split("@")[0] || "User")
    };
  } catch (err) {
    // Fallback to localStorage
    const localKey = `comments_fallback_${contentId}`;
    const raw = localStorage.getItem(localKey);
    const list: Comment[] = raw ? JSON.parse(raw) : [];

    const newComment: Comment = {
      id: `local-${Math.random().toString(36).substr(2, 9)}`,
      content_id: contentId,
      user_id: isAi ? null : "local-user",
      parent_id: parentId,
      comment_text: text,
      is_ai: isAi,
      ai_model: aiModel || (isAi ? "Qwen 2.5 32B" : undefined),
      created_at: new Date().toISOString(),
      author_name: isAi ? `${aiModel || "Qwen 2.5"} Bot` : "You"
    };

    list.push(newComment);
    localStorage.setItem(localKey, JSON.stringify(list));
    return newComment;
  }
}

// Sub-helper: Build tree representation of comments
function buildThreadedComments(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  // Initialize map
  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  // Build hierarchy
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
