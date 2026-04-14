import { GoogleGenAI } from "@google/genai";
import { AIContext, ChatMessage } from "../types/ai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export const aiService = {
  async chat(message: string, history: ChatMessage[], context: AIContext): Promise<string> {
    if (BACKEND_URL) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            history,
            context,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { text?: string };
          if (data.text) {
            return data.text;
          }
        }
      } catch (error) {
        console.warn('Backend AI proxy unavailable, falling back to local Gemini client.', error);
      }
    }

    const systemInstruction = `
      Você é um assistente de IA especialista em CRM e análise de pipeline de vendas.
      Seu objetivo é ajudar o usuário a entender a saúde do seu pipeline e sugerir ações baseadas em dados reais.

      CONTEXTO ATUAL DO PIPELINE:
      - Pipeline Total: R$ ${context.pipelineTotal.toLocaleString('pt-BR')}
      - Negócios por Etapa: ${JSON.stringify(context.negociosPorEtapa)}
      - Follow-ups Vencidos: ${context.followupsVencidos}
      - Taxa de Conversão: ${context.taxaConversao}%
      - Principais Negócios: ${context.topDeals.map(d => `${d.company} (R$ ${d.value.toLocaleString('pt-BR')}) na etapa ${d.stage}`).join(', ')}

      Responda de forma profissional, direta e acionável. Use negrito (**texto**) para destacar pontos importantes.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(m => ({
          role: m.type === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação.";
  }
};
