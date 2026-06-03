import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabaseAdmin = getSupabase();
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("[v0] Error fetching draft:", error);
    return NextResponse.json(
      { error: "Draft not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, content_html, content_text, topic } = body;

    const supabaseAdmin = getSupabase();
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .update({
        title: title !== undefined ? title : undefined,
        content_html: content_html !== undefined ? content_html : undefined,
        content_text: content_text !== undefined ? content_text : undefined,
        topic: topic !== undefined ? topic : undefined,
        last_saved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log the edit
    await supabaseAdmin.from("edit_logs").insert([
      {
        draft_id: id,
        user_id: data.user_id,
        action: "draft_updated",
        new_content: content_text || "",
      },
    ]);

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("[v0] Error updating draft:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabaseAdmin = getSupabase();
    const { error } = await supabaseAdmin
      .from("drafts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
