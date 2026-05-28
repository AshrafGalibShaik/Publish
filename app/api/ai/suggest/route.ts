import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

// Initialize Groq client with the API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, type, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let systemInstruction = "You are a professional AI content writing assistant.";
    let userPrompt = prompt;

    if (type === "description") {
      systemInstruction =
        "You are an expert SEO and content editor. Write a concise, engaging 1-2 sentence description summarizing the provided article content. Keep it under 160 characters.";
      userPrompt = `Generate a description for this article content:\n\n${prompt}`;
    } else if (type === "outline") {
      systemInstruction =
        "You are a professional content architect. Create a structured outline with key sections and bullet points for the provided topic.";
      userPrompt = `Create a detailed outline for an article about: "${prompt}"`;
    } else if (type === "enhance") {
      systemInstruction =
        "You are a master editor. Enhance and improve the grammar, style, clarity, and flow of the provided text while keeping its core meaning intact. Return only the enhanced text.";
      userPrompt = `Enhance the following text:\n\n${prompt}`;
    } else if (type === "tags") {
      systemInstruction =
        "You are a content tagger. Generate 3-5 relevant, single-word topics or keywords (comma-separated, no bullet points) for the provided text.";
      userPrompt = `Generate 3-5 keywords for this content:\n\n${prompt}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "qwen/qwen3-32b", // Using the active Qwen 3 32B model on Groq
      temperature: 0.7,
      max_tokens: 1024,
    });

    const suggestion = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("[Groq suggestion error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI suggestion" },
      { status: 500 }
    );
  }
}
