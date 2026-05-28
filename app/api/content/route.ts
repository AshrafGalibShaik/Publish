import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import slug from "slug";
import { generateContentEmbedding } from "@/lib/embeddings";

export async function GET(request: NextRequest) {
  try {
    const topic = request.nextUrl.searchParams.get("topic");
    const supabaseAdmin = getSupabase();

    let query = supabaseAdmin
      .from("content")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (topic) {
      query = query.eq("topic", topic);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error("[v0] Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      description,
      content_html,
      content_text,
      topic,
      draft_id,
    } = body;

    if (!user_id || !title || !content_html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabase();

    // Create slug
    const baseSlug = slug(title);
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from("content")
      .insert([
        {
          user_id,
          title,
          slug: uniqueSlug,
          description: description || null,
          content_html,
          content_text,
          topic: topic || null,
          status: "published",
          published_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create initial version
    await supabaseAdmin.from("content_versions").insert([
      {
        content_id: data.id,
        version_number: 1,
        title,
        content_html,
        content_text,
        changed_by: user_id,
        change_summary: "Initial version",
      },
    ]);

    // Log the edit
    await supabaseAdmin.from("edit_logs").insert([
      {
        content_id: data.id,
        user_id,
        action: "published",
        new_content: content_text,
      },
    ]);

    // Delete draft if provided
    if (draft_id) {
      await supabaseAdmin.from("drafts").delete().eq("id", draft_id);
    }

    // Generate vector embedding in background/parallel to keep publish flow fast
    generateContentEmbedding(data.id, `${title} ${description || ""} ${content_text}`);

    return NextResponse.json({ content: data }, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating content:", error);
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    );
  }
}
