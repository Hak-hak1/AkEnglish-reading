import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonContent, QuizQuestion, Vocabulary } from "../types";

// Dynamic AI Client
let ai: GoogleGenAI | null = null;

export const initGenAI = (apiKey: string) => {
    ai = new GoogleGenAI({ apiKey: apiKey });
};

const SYSTEM_INSTRUCTION_ANALYSIS = `
You are an expert English teacher and Transcriber. 
Your primary goal is to convert the input (Text, Image, or PDF) into a study lesson.

STRICT INSTRUCTION FOR IMAGES/PDFs (OCR):
1. **TRANSCRIPTION**: You must transcribe ALL visible English text from the image/file EXACTLY as it appears. 
   - Do NOT summarize. 
   - Do NOT skip paragraphs.
   - Preserve line breaks where appropriate.
   - This exact text must go into the 'fullText' JSON field.

2. **VOCABULARY**: Identify 8-15 key vocabulary words (B1-C2 level) from that text.
   - For each word, provide a clear ENGLISH definition AND the VIETNAMESE meaning.
3. **SUMMARY**: Provide a short Vietnamese summary.

If the image contains no text, return "No text found in image" for fullText.
`;

const SYSTEM_INSTRUCTION_QUIZ = `
You are an exam creator for English learners. Create a quiz based on the provided text.
Include a mix of:
- Multiple Choice (4 options)
- True / False / Doesn't Say
- Fill in the blank (extracted from the text, use "_______" for the blank)
- Drag and Drop (Fill in blank with a provided word bank of 3-4 options)
Output strictly valid JSON.
`;

const cleanJSON = (text: string): string => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export const analyzeContent = async (input: string, mimeType?: string): Promise<LessonContent> => {
  if (!ai) throw new Error("Vui lòng nhập API Key trước khi sử dụng.");

  try {
    let contentPart: any;

    if (mimeType && mimeType.startsWith('image/')) {
        const base64Data = input.split(',')[1] || input;
        contentPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };
    } else if (mimeType === 'application/pdf') {
         const base64Data = input.split(',')[1] || input;
         contentPart = {
            inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
            }
         };
    } else {
        contentPart = { text: input };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [contentPart, { text: "Transcribe this image/file exactly into text and analyze for learning. Provide English definitions AND Vietnamese meanings for vocabulary." }]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            fullText: { type: Type.STRING },
            summary: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  ipa: { type: Type.STRING },
                  englishDefinition: { type: Type.STRING, description: "Simple definition in English" },
                  meaning: { type: Type.STRING, description: "Meaning in Vietnamese" },
                  type: { type: Type.STRING },
                },
                required: ["word", "ipa", "englishDefinition", "meaning", "type"]
              }
            }
          },
          required: ["title", "fullText", "summary", "vocabulary"]
        }
      }
    });

    const cleanText = cleanJSON(response.text || "{}");
    const data = JSON.parse(cleanText);
    
    if (!data.title) data.title = "Lesson " + new Date().toLocaleDateString();
    
    const imageUrl = (mimeType && mimeType.startsWith('image/')) ? input : undefined;

    return {
      id: Date.now().toString(),
      title: data.title,
      fullText: data.fullText || "No text extracted. Please try a clearer image.",
      summary: data.summary || "",
      vocabulary: (data.vocabulary || []).map((v: any, idx: number) => ({ ...v, id: `vocab-${idx}` })),
      dateCreated: Date.now(),
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Không thể phân tích nội dung. Vui lòng kiểm tra lại Key hoặc file.");
  }
};

export const generateQuiz = async (text: string): Promise<QuizQuestion[]> => {
  if (!ai) return [];
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a quiz for this text: ${text}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_QUIZ,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "fill_blank", "drag_drop", "matching"] },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "type", "question", "correctAnswer"]
          }
        }
      }
    });

    const cleanText = cleanJSON(response.text || "[]");
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return [];
  }
};

export const getWordDefinition = async (word: string, context: string): Promise<Vocabulary> => {
    if (!ai) return { id: 'err', word, ipa: '', englishDefinition: '', meaning: 'Chưa nhập Key', type: 'unknown' };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Define the word "${word}" based on this context: "${context}". Return a simple English Definition AND Vietnamese meaning.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        word: {type: Type.STRING},
                        ipa: {type: Type.STRING},
                        englishDefinition: {type: Type.STRING, description: "Definition in English"},
                        meaning: {type: Type.STRING, description: "Meaning in Vietnamese"},
                        type: {type: Type.STRING}
                    }
                }
            }
        });
        const cleanText = cleanJSON(response.text || "{}");
        const data = JSON.parse(cleanText);
        return { ...data, id: `quick-${Date.now()}` };
    } catch (e) {
        return { id: 'err', word, ipa: '', englishDefinition: '', meaning: 'Không tìm thấy định nghĩa', type: 'unknown' };
    }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!ai || !text) return null;
    try {
        const safeText = text.slice(0, 3000); 
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read the following text aloud: \n\n ${safeText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
}