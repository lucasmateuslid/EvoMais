import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { responseCache } from '../utils/cache.js';
function normalizeHistory(history = []) {
    return history
        .map(message => `${message.type}:${message.text}`)
        .join('|')
        .toLowerCase();
}
function buildCacheKey(message, history = [], context) {
    const payload = {
        message: message.trim().toLowerCase(),
        history: normalizeHistory(history),
        context,
    };
    return JSON.stringify(payload);
}
function buildFallbackResponse(request) {
    const topDeals = request.context.topDeals
        .slice(0, 3)
        .map(deal => `${deal.company} (R$ ${deal.value.toLocaleString('pt-BR')})`)
        .join(', ');
    return [
        'Análise rápida do pipeline:',
        `- Pipeline total: R$ ${request.context.pipelineTotal.toLocaleString('pt-BR')}`,
        `- Follow-ups vencidos: ${request.context.followupsVencidos}`,
        `- Taxa de conversão: ${request.context.taxaConversao}%`,
        topDeals ? `- Principais negócios: ${topDeals}` : '- Sem negócios destacados no momento',
        '',
        'Recomendação imediata: priorize follow-ups vencidos e revise os deals com maior valor em aberto.',
    ].join('\n');
}
async function tryGeminiResponse(request) {
    if (!config.GEMINI_API_KEY) {
        return null;
    }
    const systemInstruction = `
Você é um assistente de IA especialista em CRM e análise de pipeline de vendas.
Seu objetivo é ajudar o usuário a entender a saúde do pipeline e sugerir ações baseadas em dados reais.

CONTEXTO ATUAL DO PIPELINE:
- Pipeline Total: R$ ${request.context.pipelineTotal.toLocaleString('pt-BR')}
- Negócios por Etapa: ${JSON.stringify(request.context.negociosPorEtapa)}
- Follow-ups Vencidos: ${request.context.followupsVencidos}
- Taxa de Conversão: ${request.context.taxaConversao}%
- Principais Negócios: ${request.context.topDeals.map(deal => `${deal.company} (R$ ${deal.value.toLocaleString('pt-BR')}) na etapa ${deal.stage}`).join(', ')}

Responda de forma profissional, direta e acionável. Use negrito (**texto**) para destacar pontos importantes.
`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            contents: [
                ...(request.history || []).map(message => ({
                    role: message.type === 'user' ? 'user' : 'model',
                    parts: [{ text: message.text }],
                })),
                {
                    role: 'user',
                    parts: [{ text: request.message }],
                },
            ],
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }
    const data = (await response.json());
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
}
export async function generateChatResponse(request) {
    const cacheKey = buildCacheKey(request.message, request.history, request.context);
    const cached = responseCache.get(cacheKey);
    if (cached) {
        return {
            text: cached,
            provider: 'cache',
        };
    }
    try {
        const geminiResponse = await tryGeminiResponse(request);
        if (geminiResponse) {
            responseCache.set(cacheKey, geminiResponse, 1000 * 60 * 30);
            return {
                text: geminiResponse,
                provider: 'gemini',
            };
        }
    }
    catch (error) {
        logger.warn({ error }, 'Gemini execution failed, using deterministic fallback');
    }
    const fallbackText = buildFallbackResponse(request);
    responseCache.set(cacheKey, fallbackText, 1000 * 60 * 10);
    return {
        text: fallbackText,
        provider: 'fallback',
    };
}
export function createConversationId() {
    return randomUUID();
}
