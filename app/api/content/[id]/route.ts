import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { generateContentEmbedding } from "@/lib/embeddings";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabase();
    const { data, error } = await supabaseAdmin
      .from("content")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error("[v0] Error fetching content:", error);
    return NextResponse.json(
      { error: "Content not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content_html, content_text, description, topic, user_id } = body;

    const supabaseAdmin = getSupabase();

    // Get current version number
    const { data: versions } = await supabaseAdmin
      .from("content_versions")
      .select("version_number")
      .eq("content_id", params.id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = ((versions?.[0]?.version_number || 0) + 1) as number;

    // Create new version
    await supabaseAdmin.from("content_versions").insert([
      {
        content_id: params.id,
        version_number: nextVersion,
        title,
        content_html,
        content_text,
        changed_by: user_id,
        change_summary: "Updated content",
      },
    ]);

    // Update main content
    const { data, error } = await supabaseAdmin
      .from("content")
      .update({
        title: title !== undefined ? title : undefined,
        content_html: content_html !== undefined ? content_html : undefined,
        content_text: content_text !== undefined ? content_text : undefined,
        description: description !== undefined ? description : undefined,
        topic: topic !== undefined ? topic : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Log the edit
    await supabaseAdmin.from("edit_logs").insert([
      {
        content_id: params.id,
        user_id,
        action: "updated",
        new_content: content_text,
      },
    ]);

    // Generate vector embedding in background/parallel to keep patch flow fast
    if (title || description || content_text) {
      const fullText = `${title || data.title} ${description || data.description || ""} ${content_text || data.content_text}`;
      generateContentEmbedding(params.id, fullText);
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error("[v0] Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabase();
    const { error } = await supabaseAdmin
      .from("content")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
