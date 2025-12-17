import { GoogleGenAI } from "@google/genai";
import { Question } from '../types';

// Initialize Gemini safely
// Note: In a real production app, ensure API keys are handled via backend proxies.
// For this demo, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzeWithGemini = async (
  questions: Question[], 
  answers: Record<number, string>
): Promise<string> => {
  if (!apiKey) {
    return "عذراً، لم يتم تكوين مفتاح API الخاص بالذكاء الاصطناعي.";
  }

  try {
    // Construct a prompt based on user answers
    let promptContext = "قم بتحليل شخصية المستخدم بناءً على إجاباته في الاستبيان التالي:\n";
    
    questions.forEach(q => {
      const selectedOptionId = answers[q.id];
      const selectedOption = q.options.find(o => o.id === selectedOptionId);
      if (selectedOption) {
        promptContext += `- السؤال: ${q.text}\n  الإجابة: ${selectedOption.text}\n`;
      }
    });

    promptContext += "\nأعطني تحليلاً نفسياً ومهنياً مفصلاً ومختصراً (حوالي 100 كلمة) لهذا الشخص بأسلوب مشجع وإيجابي باللغة العربية.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContext,
    });

    return response.text || "لم نتمكن من الحصول على تحليل في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بخدمة التحليل الذكي.";
  }
};
