import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { responseCache } from '../utils/cache.js';
// ─────────────────────────────────────────────
// Configurações e Schemas (otimizados e centralizados)
// ─────────────────────────────────────────────
const PROVIDER_TIMEOUT_MS = 18_000; // Reduzido para maior agilidade (mantém segurança)
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos para respostas de IA
const FALLBACK_CACHE_TTL_MS = 1000 * 60 * 10;
const providerTextSchema = z.string().trim().min(1).max(12000);
const CRM_INTENT_TERMS = [
    'pipeline', 'deal', 'negocio', 'negócio', 'crm', 'follow-up', 'followup',
    'vendas', 'conversao', 'conversão', 'bant', 'lead', 'proposta',
    'negociacao', 'negociação', 'fechamento', 'receita', 'faturamento',
];
const MESSAGE_SUGGESTION_TERMS = [
    'sugest', 'mensagem', 'responder cliente', 'resposta para cliente',
    'texto para cliente', 'obje', 'fechar hoje', 'script comercial',
    'copy de vendas', 'whatsapp', 'mensagem para', 'resposta de vendas',
];
const SALES_ANALYSIS_TERMS = [
    'analise de vendas', 'análise de vendas', 'analise detalhada', 'análise detalhada',
    'diagnostico comercial', 'diagnóstico comercial', 'analisar deal', 'analise de deal',
    'análise de deal', 'potencial de venda', 'potencial comercial', 'probabilidade de fechamento',
    'chance de fechamento', 'plano de ataque', 'plano comercial', 'mentoria comercial',
    'mentor comercial', 'closer', 'consultor comercial', 'consultores',
];
const AGGRESSIVENESS_TERMS = [
    'agressividade', 'agressivo', 'agressiva', 'nivel de agressividade', 'nível de agressividade',
    'tom comercial', 'tom de abordagem', 'urgencia de fechamento', 'urgência de fechamento',
    'nivel de pressão', 'nível de pressão',
];
// Aplicação de contexto de vendas fraco (permissivo) que pode indicar necessidade de resposta mais autoritária
const WEAK_PERMISSION_PATTERNS = [
    /o que achou\??/i,
    /como far[ií]amos\??/i,
    /o que fazer\??/i,
    /se quiser/i,
    /quando puder/i,
    /podemos ver/i,
    /fique [àa] vontade/i,
    /me avise/i,
    /qual sua opinião/i,
    /sugest[ií]es?/i,
    /poderia/i,
    /seria possível/i,
    /fico no seu aguardo/i,
];
// Schemas de resposta (reutilizados e tipados)
const openAICompatibleResponseSchema = z.object({
    choices: z.array(z.object({
        finish_reason: z.string().nullable().optional(),
        message: z.object({ content: z.string().nullable().optional() }).optional(),
    })).default([]),
});
const geminiResponseSchema = z.object({
    candidates: z.array(z.object({
        finishReason: z.string().optional(),
        content: z
            .object({
            parts: z.array(z.object({ text: z.string().optional() })).default([]),
        })
            .optional(),
    })).default([]),
});
// ─────────────────────────────────────────────
// Clientes de IA (singleton otimizado)
// ─────────────────────────────────────────────
const anthropicClient = config.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })
    : null;
const groqClient = config.GROQ_API_KEY
    ? new Groq({ apiKey: config.GROQ_API_KEY })
    : null;
// ─────────────────────────────────────────────
// Utilitários de cache e normalização (mais performáticos)
// ─────────────────────────────────────────────
const normalizeHistory = (history = []) => history.map(m => `${m.type}:${m.text}`).join('|').toLowerCase();
const buildCacheKey = (message, history = [], context, providerPreference = 'auto') => JSON.stringify({
    message: message.trim().toLowerCase(),
    history: normalizeHistory(history),
    context,
    providerPreference,
});
const withTimeout = (promise, timeoutMs, label) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
    promise.then(value => { clearTimeout(timer); resolve(value); }).catch(err => { clearTimeout(timer); reject(err); });
});
// ─────────────────────────────────────────────
// Detecção de intenção (otimizada com Set para O(1))
// ─────────────────────────────────────────────
const crmIntentSet = new Set(CRM_INTENT_TERMS);
const messageSuggestionSet = new Set(MESSAGE_SUGGESTION_TERMS);
const salesAnalysisSet = new Set(SALES_ANALYSIS_TERMS);
const aggressivenessSet = new Set(AGGRESSIVENESS_TERMS);
const isCRMQuestion = (question) => {
    const normalized = question.toLowerCase();
    return [...crmIntentSet].some(term => normalized.includes(term));
};
const isMessageSuggestionQuestion = (question) => {
    const normalized = question.toLowerCase();
    return [...messageSuggestionSet].some(term => normalized.includes(term));
};
const isSalesAnalysisQuestion = (question) => {
    const normalized = question.toLowerCase();
    return [...salesAnalysisSet].some(term => normalized.includes(term));
};
const shouldClassifyAggressiveness = (question) => {
    const normalized = question.toLowerCase();
    return isSalesAnalysisQuestion(question) || [...aggressivenessSet].some(term => normalized.includes(term));
};
const hasWeakPermissionLanguage = (text) => WEAK_PERMISSION_PATTERNS.some(pattern => pattern.test(text));
const hasAggressivenessLabel = (text) => /(nível\s*[1-4]|nivel\s*[1-4]|\bn[1-4]\b)/i.test(text);
// ─────────────────────────────────────────────
// Templates de mensagens AGRESSIVAS (nova versão)
// ─────────────────────────────────────────────
function buildAuthorityMessageTemplates(request) {
    const strongestDeal = request.context.topDeals[0];
    const companyContext = strongestDeal?.company ? ` com a ${strongestDeal.company}` : '';
    return [
        '### Variação 1 — Nível 2 (Assertiva consultiva)',
        `Boa tarde! Revisei seu cenário${companyContext} e o fit está claro. Podemos fechar hoje sem fricção: me diga o único ponto que falta para avançarmos agora.`,
        '',
        '### Variação 2 — Nível 3 (Direta com urgência)',
        `Faz sentido avaliar com calma, e pelos dados o melhor timing é agora. Se houver objeção, me diga em uma frase que eu te respondo com precisão e já alinhamos o próximo passo.`,
        '',
        '### Variação 3 — Nível 4 (Fechamento)',
        `Estamos no ponto de decisão. Se estiver de acordo, te envio o passo final agora e marcamos a assinatura para hoje. Qual horário funciona melhor?`,
    ].join('\n');
}
// ─────────────────────────────────────────────
// Construção de contexto comum (evita duplicação)
// ─────────────────────────────────────────────
function buildCommonContext(request) {
    const { context } = request;
    const topDealsFormatted = context.topDeals
        .map(deal => `  • ${deal.company} | Valor: R$ ${deal.value.toLocaleString('pt-BR')} | Etapa: ${deal.stage}`)
        .join('\n');
    const etapasSummary = Object.entries(context.negociosPorEtapa)
        .map(([etapa, qtd]) => `${etapa}: ${qtd}`)
        .join(', ');
    return `
CONTEXTO DO PIPELINE EM TEMPO REAL (use sempre que relevante):
- Pipeline Total: R$ ${context.pipelineTotal.toLocaleString('pt-BR')}
- Negócios por Etapa: ${etapasSummary}
- Follow-ups Vencidos: ${context.followupsVencidos}
- Taxa de Conversão: ${context.taxaConversao}%
- Principais Negócios:
${topDealsFormatted}
`.trim();
}
// ─────────────────────────────────────────────
// System Prompt — VERSÃO MELHORADA E AGRESSIVA
// ─────────────────────────────────────────────
function buildSystemPrompt(request) {
    const commonContext = buildCommonContext(request);
    const isMessageSuggestion = isMessageSuggestionQuestion(request.message);
    const isSalesAnalysisMode = isSalesAnalysisQuestion(request.message);
    const classifyAggressiveness = shouldClassifyAggressiveness(request.message);
    const isGeneral = !isCRMQuestion(request.message);
    if (isMessageSuggestion) {
        return `
Você é ARIA, closer sênior e mentora de consultores em vendas B2B consultivas. Sua missão é gerar mensagens que **fechem negócio com inteligência comercial**.

${commonContext}

REGRAS OBRIGATÓRIAS — TOM ASSERTIVO E NATURAL:
- Sempre assuma que o deal está próximo do fechamento.
- Use urgência sem parecer agressiva ou robótica.
- Seja direta, humana e objetiva.
- Sempre entregue **exatamente 3 variações** com títulos claros.
- Rotule cada variação com o nível de agressividade (N2, N3 e N4 nessa ordem).
- Cada variação deve ter no máximo 70 palavras.
- Inclua CTA concreto com prazo + próxima ação.
- Nunca use linguagem fraca ou permissiva.

EVITE TOTALMENTE:
- "O que achou?", "Como faríamos?", "Se quiser", "Quando puder", "Me avise", etc.

PREFIRA ESTRUTURAS AGRESSIVAS:
- "Vamos fechar HOJE."
- "Me diga AGORA o obstáculo que eu resolvo."
- "A assinatura é hoje à tarde – qual horário?"

Responda apenas as 3 variações prontas para copiar e enviar no WhatsApp.
`.trim();
    }
    if (isGeneral) {
        return `
Você é ARIA, assistente de IA útil, objetiva e direta.
Responda em pt-BR. Quando a pergunta for sobre vendas/CRM use o contexto abaixo. Caso contrário, responda normalmente sem forçar análise comercial.

${commonContext}

Regras:
- Seja clara, útil e natural.
- Nunca invente dados.
`.trim();
    }
    const salesAnalysisModeBlock = isSalesAnalysisMode
        ? `
MODO ANÁLISE DE VENDAS: ATIVO
- Faça leitura detalhada do cenário e comporte-se como closer experiente mentorando consultores.
- Classifique o cenário comercial (Frio, Morno, Quente, Hot) com base no contexto.
- Traga orientação de execução: abordagem, objeções prováveis e linha de fechamento.
${classifyAggressiveness ? `- Inclua obrigatoriamente: "Nível de agressividade recomendado: N1|N2|N3|N4" + justificativa curta com 2 evidências do pipeline.` : ''}

Matriz de agressividade (usar somente quando houver potencial de venda):
- N1 Consultivo: pouca urgência, baixa clareza de dor, ciclo inicial.
- N2 Assertivo: dor clara, abertura de conversa, timing moderado.
- N3 Direto: alto potencial, decisão próxima, objeções mapeadas.
- N4 Fechamento: janela curta, fit validado, foco em compromisso e assinatura.
`.trim()
        : `
MODO ANÁLISE DE VENDAS: INATIVO
- Responda de forma natural, objetiva e acionável, sem forçar framework longo.
- Não imponha classificação de agressividade se o usuário não pedir análise comercial.
- Se perceber oportunidade relevante, sinalize brevemente a melhor postura de venda.
`.trim();
    // Modo CRM completo (mais conciso e escaneável)
    return `
Você é ARIA (Assistente de Revenue Intelligence), closer sênior e mentora comercial para times B2B.

${commonContext}

${salesAnalysisModeBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METODOLOGIAS DE VENDAS — CONTEXTOS MELHORADOS E PRONTOS PARA USO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**SPIN Selling** (use quando o deal estiver estagnado ou Need baixo):
- Situação → mapear contexto atual.
- Problema → extrair dores explícitas.
- Implicação → amplificar custo de NÃO resolver (perda de receita, tempo, risco).
- Necessidade-Solução → ligar sua oferta diretamente à dor.
Exemplo de ação: "Sugira 2 perguntas de Implicação para o vendedor usar no próximo call."

**MEDDIC / MEDDPICC** (ideal para deals > R$ 50k ou complexos):
- Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition, Paper Process.
Avalie cada critério com score 0-10 e identifique o que está faltando.

**Challenger Sale** (use quando o prospect está confortável com status quo):
- Ensine algo novo sobre o mercado/dor dele.
- Personalize para o negócio dele.
- Assuma controle da conversa e leve para o fechamento.

**Value Selling** (use sempre que possível):
- Quantifique ROI, payback, redução de custo ou aumento de receita baseado nos dados do deal.
- Nunca fale preço — fale VALOR.

**BANT + Lead Scoring** (sempre aplique):
- BANT Score (0-40) → percentual + classificação (Frio/Morno/Quente/Hot).
- Lead Score 0-100 com pesos claros (BANT 40%, engajamento 20%, etc.).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE RESPOSTA (obrigatórias)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Responda sempre em pt-BR, profissional e objetiva, em tom de conversa natural (estilo LLM).
- Priorize clareza e ação: respostas entre 120 e 220 palavras (até 300 quando solicitado).
- Estruture em fluxo curto e legível:
  1) leitura do cenário,
  2) diagnóstico comercial,
  3) próximo passo com prazo.
- Use markdown simples com no máximo 3 blocos por resposta; evite paredes de texto.
- Só use cards (###) quando o usuário pedir análise completa de deal ou comparação entre oportunidades.
- Quando usar cards, limite a no máximo 3 cards e 3 bullets por card.
- Use negrito apenas no essencial (scores, alertas e valores críticos).
- Se faltar dado, diga exatamente o que precisa coletar.
- Follow-ups vencidos > 5: iniciar resposta com alerta objetivo.
- Sempre termine com até 3 ações priorizadas (verbo + prazo + por quê + owner).

Quando o usuário pedir "análise completa", aplique cards curtos e mantenha foco em decisão comercial.
`.trim();
}
// ─────────────────────────────────────────────
// Builders de mensagens por provider (refatorados e reutilizáveis)
// ─────────────────────────────────────────────
const buildOpenAICompatibleMessages = (request) => [
    { role: 'system', content: buildSystemPrompt(request) },
    ...(request.history || []).slice(-15).map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text,
    })),
    { role: 'user', content: request.message },
];
const buildGeminiContents = (request) => [
    ...(request.history || []).slice(-15).map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: request.message }] },
];
const buildAnthropicMessages = (request) => (request.history || []).slice(-15).map(m => ({
    role: m.type === 'user' ? 'user' : 'assistant',
    content: m.text,
})).concat({ role: 'user', content: request.message });
// ─────────────────────────────────────────────
// Normalização e extração de texto (otimizada)
// ─────────────────────────────────────────────
const normalizeProviderText = (provider, text) => {
    const parsed = providerTextSchema.safeParse(text?.trim());
    if (!parsed.success)
        throw new Error(`${provider} returned invalid/empty response`);
    return parsed.data;
};
const isOpenAICompatibleTruncated = (finishReason) => finishReason === 'length' || finishReason === 'max_tokens';
const extractOpenAICompatibleResult = (payload, provider) => {
    const parsed = openAICompatibleResponseSchema.parse(payload);
    const finishReason = parsed.choices[0]?.finish_reason;
    return {
        text: normalizeProviderText(provider, parsed.choices[0]?.message?.content),
        truncated: isOpenAICompatibleTruncated(finishReason),
    };
};
const extractGeminiResult = (payload) => {
    const parsed = geminiResponseSchema.parse(payload);
    const text = parsed.candidates
        .flatMap(c => c.content?.parts || [])
        .map(p => p.text || '')
        .join('\n');
    return {
        text: normalizeProviderText('gemini', text),
        truncated: parsed.candidates[0]?.finishReason === 'MAX_TOKENS',
    };
};
// ─────────────────────────────────────────────
// Invocadores por provider (map centralizado para agilidade)
// ─────────────────────────────────────────────
const providerInvokers = {
    gemini: async (request) => {
        if (!config.GEMINI_API_KEY)
            return null;
        return withTimeout((async () => {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: buildSystemPrompt(request) }] },
                    contents: buildGeminiContents(request),
                    generationConfig: {
                        temperature: config.AI_TEMPERATURE,
                        maxOutputTokens: config.AI_MAX_OUTPUT_TOKENS,
                    },
                }),
            });
            if (!res.ok)
                throw new Error(`Gemini failed: ${res.status}`);
            return extractGeminiResult(await res.json());
        })(), PROVIDER_TIMEOUT_MS, 'gemini');
    },
    openai: async (request) => withTimeout((async () => {
        const res = await fetch(`${config.OPENAI_API_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: config.OPENAI_MODEL,
                messages: buildOpenAICompatibleMessages(request),
                temperature: config.AI_TEMPERATURE,
                max_tokens: config.AI_MAX_OUTPUT_TOKENS,
            }),
        });
        if (!res.ok)
            throw new Error(`OpenAI failed: ${res.status}`);
        return extractOpenAICompatibleResult(await res.json(), 'openai');
    })(), PROVIDER_TIMEOUT_MS, 'openai'),
    anthropic: async (request) => {
        if (!anthropicClient)
            return null;
        const response = await withTimeout(anthropicClient.messages.create({
            model: config.ANTHROPIC_MODEL,
            max_tokens: config.AI_MAX_OUTPUT_TOKENS,
            temperature: config.AI_TEMPERATURE,
            system: buildSystemPrompt(request),
            messages: buildAnthropicMessages(request),
        }), PROVIDER_TIMEOUT_MS, 'anthropic');
        const text = response.content.map(block => (block.type === 'text' ? block.text : '')).join('\n');
        return {
            text: normalizeProviderText('anthropic', text),
            truncated: response.stop_reason === 'max_tokens',
        };
    },
    deepseek: async (request) => withTimeout((async () => {
        const res = await fetch(`${config.DEEPSEEK_API_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: config.DEEPSEEK_MODEL,
                messages: buildOpenAICompatibleMessages(request),
                temperature: config.AI_TEMPERATURE,
                max_tokens: config.AI_MAX_OUTPUT_TOKENS,
            }),
        });
        if (!res.ok)
            throw new Error(`Deepseek failed: ${res.status}`);
        return extractOpenAICompatibleResult(await res.json(), 'deepseek');
    })(), PROVIDER_TIMEOUT_MS, 'deepseek'),
    groq: async (request) => {
        if (!groqClient)
            return null;
        const response = await withTimeout(groqClient.chat.completions.create({
            model: config.GROQ_MODEL,
            temperature: config.AI_TEMPERATURE,
            max_tokens: config.AI_MAX_OUTPUT_TOKENS,
            messages: buildOpenAICompatibleMessages(request),
        }), PROVIDER_TIMEOUT_MS, 'groq');
        return {
            text: normalizeProviderText('groq', response.choices[0]?.message?.content),
            truncated: isOpenAICompatibleTruncated(response.choices[0]?.finish_reason ?? null),
        };
    },
};
const isProviderConfigured = (provider) => {
    switch (provider) {
        case 'gemini': return Boolean(config.GEMINI_API_KEY);
        case 'openai': return Boolean(config.OPENAI_API_KEY);
        case 'anthropic': return Boolean(config.ANTHROPIC_API_KEY);
        case 'deepseek': return Boolean(config.DEEPSEEK_API_KEY);
        case 'groq': return Boolean(config.GROQ_API_KEY);
    }
};
const resolveProviderOrder = (preference = 'auto') => {
    const configured = config.AI_PROVIDER_ORDER;
    return preference === 'auto' ? configured : [preference, ...configured.filter(p => p !== preference)];
};
function buildContinuationRequest(request, partialText) {
    const continuationPrompt = [
        'A resposta anterior foi interrompida por limite de tokens.',
        'Continue exatamente de onde parou, sem repetir blocos anteriores.',
        'Mantenha o mesmo formato e finalize a resposta com objetividade.',
        '',
        'Trecho final da resposta anterior:',
        partialText.slice(-1200),
    ].join('\n');
    return {
        ...request,
        message: continuationPrompt,
    };
}
// ─────────────────────────────────────────────
// Fallback (mantido e otimizado)
// ─────────────────────────────────────────────
function buildFallbackResponse(request) {
    if (!isCRMQuestion(request.message)) {
        return 'Não consegui acessar a IA no momento. Tente novamente em 10 segundos.';
    }
    const { context } = request;
    const topDeals = context.topDeals
        .slice(0, 3)
        .map(d => `${d.company} (R$ ${d.value.toLocaleString('pt-BR')}) — ${d.stage}`)
        .join('\n  • ');
    const riskAlert = context.followupsVencidos > 5
        ? `\n⚠️ **ALERTA CRÍTICO:** ${context.followupsVencidos} follow-ups vencidos. Risco alto de perda!`
        : '';
    return [
        `## Resumo Pipeline${riskAlert}`,
        `- Pipeline total: R$ ${context.pipelineTotal.toLocaleString('pt-BR')}`,
        `- Follow-ups vencidos: ${context.followupsVencidos}`,
        `- Taxa de conversão: ${context.taxaConversao}%`,
        `- Principais deals: ${topDeals || 'Nenhum'}`,
        '',
        '## Ações Imediatas',
        '1. Regularizar follow-ups vencidos (hoje)',
        '2. Priorizar os 3 maiores deals',
        '3. Confirmar próximo passo em propostas',
    ].join('\n');
}
// ─────────────────────────────────────────────
// Enforce de mensagens (ainda mais rigoroso)
// ─────────────────────────────────────────────
function enforceMessageSuggestionStyle(request, text) {
    if (!isMessageSuggestionQuestion(request.message))
        return text;
    const isTooShort = text.trim().length < 280;
    const isWeak = hasWeakPermissionLanguage(text);
    const missingAggressivenessLabel = !hasAggressivenessLabel(text);
    return isTooShort || isWeak || missingAggressivenessLabel ? buildAuthorityMessageTemplates(request) : text;
}
// ─────────────────────────────────────────────
// Função principal (refatorada e mais ágil)
// ─────────────────────────────────────────────
export async function generateChatResponse(request) {
    const providerPreference = request.provider ?? 'auto';
    const cacheKey = buildCacheKey(request.message, request.history, request.context, providerPreference);
    const cached = responseCache.get(cacheKey);
    if (cached)
        return { text: cached, provider: 'cache' };
    const providerOrder = resolveProviderOrder(providerPreference);
    for (const provider of providerOrder) {
        if (!isProviderConfigured(provider))
            continue;
        try {
            const invoker = providerInvokers[provider];
            const response = await invoker(request);
            if (!response)
                continue;
            let finalText = response.text;
            if (response.truncated) {
                logger.warn({ provider, responseLength: finalText.length }, 'AI response truncated, attempting continuation');
                try {
                    const continuationRequest = buildContinuationRequest(request, finalText);
                    const continuation = await invoker(continuationRequest);
                    if (continuation?.text) {
                        finalText = `${finalText}\n\n${continuation.text.trim()}`;
                    }
                }
                catch (continuationError) {
                    const msg = continuationError instanceof Error ? continuationError.message : String(continuationError);
                    logger.warn({ provider, error: msg }, 'Continuation attempt failed');
                }
            }
            finalText = enforceMessageSuggestionStyle(request, finalText);
            responseCache.set(cacheKey, finalText, CACHE_TTL_MS);
            logger.info({ provider, responseLength: finalText.length }, 'AI response accepted');
            return { text: finalText, provider };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.warn({ provider, error: msg }, 'Provider failed → next');
        }
    }
    // Fallback
    const fallbackText = buildFallbackResponse(request);
    responseCache.set(cacheKey, fallbackText, FALLBACK_CACHE_TTL_MS);
    return { text: fallbackText, provider: 'fallback' };
}
export function createConversationId() {
    return randomUUID();
}
