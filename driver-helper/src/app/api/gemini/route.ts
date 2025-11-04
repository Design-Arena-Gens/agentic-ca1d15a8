import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key missing" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.type) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  try {
    switch (body.type) {
      case "chat": {
        const history = Array.isArray(body.history)
          ? body.history.map((item: { role: string; text: string }) => ({
              role: item.role,
              parts: [{ text: item.text }],
            }))
          : [];
        const prompt = String(body.prompt || "");
        const response = await model.generateContent({
          contents: [
            ...history,
            { role: "user", parts: [{ text: prompt }] },
          ],
        });
        return NextResponse.json({
          text: response.response.text(),
        });
      }
      case "translate": {
        const text = String(body.text || "");
        const direction = body.direction === "hi-en" ? "Hindi to English" : "English to Hindi";
        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Translate the following text ${direction}. Provide only the translated sentence.\n${text}`,
                },
              ],
            },
          ],
        });
        return NextResponse.json({ text: response.response.text() });
      }
      case "transcribe": {
        const audio = body.audio as string;
        const mimeType = body.mimeType as string;
        if (!audio || !mimeType) {
          return NextResponse.json({ error: "Audio payload missing" }, { status: 400 });
        }
        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: audio,
                    mimeType,
                  },
                },
                { text: "Transcribe the driver's voice note accurately." },
              ],
            },
          ],
        });
        return NextResponse.json({ text: response.response.text() });
      }
      default:
        return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
