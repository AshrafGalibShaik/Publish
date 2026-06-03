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
        "You are an expert SEO and content editor. Write a concise, engaging 1-2 sentence description summarizing the provided article content. Keep it under 160 characters. Do NOT use any HTML or markdown formatting, just plain text.";
      userPrompt = `Generate a description for this article content:\n\n${prompt}`;
    } else if (type === "outline") {
      systemInstruction =
        "You are a professional content architect. Create a structured outline with key sections and bullet points for the provided topic. Return the outline ONLY as valid, semantic HTML elements (e.g. <h2> for headings, <p> for paragraphs, <ul> and <li> for list items). Do NOT wrap it in a markdown block, do NOT use triple backticks, and do NOT use raw markdown formatting like asterisks or hashtags. Wrap all content in clean, semantic HTML tags.";
      userPrompt = `Create a detailed outline for an article about: "${prompt}"`;
    } else if (type === "enhance") {
      systemInstruction =
        "You are a master editor. Enhance and improve the grammar, style, clarity, and flow of the provided text while keeping its core meaning intact. Return the enhanced content as valid HTML tags (like <p>, <strong>, etc.) so that it can be directly loaded into a rich text editor. Do NOT use markdown code fences, do NOT include triple backticks, and do NOT use markdown formatting characters.";
      userPrompt = `Enhance the following text:\n\n${prompt}`;
    } else if (type === "tags") {
      systemInstruction =
        "You are a content tagger. Generate 3-5 relevant, single-word topics or keywords (comma-separated, no bullet points) for the provided text. Do NOT use any markdown or HTML.";
      userPrompt = `Generate 3-5 keywords for this content:\n\n${prompt}`;
    } else if (type === "ai-reply") {
      systemInstruction =
        "You are an active, intelligent, and slightly witty community member on an AI-native forum. Analyze the provided post or comment context and write a thoughtful, conversational response. Keep it relatively brief, use clean line breaks for paragraph separation, and do NOT use any HTML tags. Offer real value or a unique angle.";
      userPrompt = `Post/Comment Context:\n${context || ''}\n\nUser Question/Input:\n"${prompt}"\n\nGenerate your community response:`;
    } else if (type === "image-prompt") {
      systemInstruction =
        "You are an expert visual prompt engineer for AI image generation models. Given article content, generate a single vivid, descriptive prompt (1-2 sentences max) that would create a beautiful, relevant cover image for the article. Focus on aesthetic qualities, lighting, composition, and mood. Do NOT include any explanation — just the prompt itself, as plain text.";
      userPrompt = `Generate an image generation prompt for this article:\n\nTitle: ${context || ''}\nContent: ${prompt}`;
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

    let suggestion = completion.choices[0]?.message?.content || "";

    // 1. Strip reasoning/thinking tags (e.g. <think>...</think>)
    suggestion = suggestion.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Strip markdown code block wrappers (e.g. ```html ... ```)
    if (suggestion.includes("```")) {
      suggestion = suggestion.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
    }

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("[Groq suggestion error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI suggestion" },
      { status: 500 }
    );
  }
}
