import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabase();
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ drafts: data });
  } catch (error) {
    console.error("[v0] Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content_html, content_text, topic, content_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabase();
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .insert([
        {
          user_id,
          title: title || "Untitled",
          content_html: content_html || "",
          content_text: content_text || "",
          topic: topic || null,
          content_id: content_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log the edit
    await supabaseAdmin.from("edit_logs").insert([
      {
        draft_id: data.id,
        user_id,
        action: "draft_created",
        new_content: content_text || "",
      },
    ]);

    return NextResponse.json({ draft: data }, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating draft:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}
