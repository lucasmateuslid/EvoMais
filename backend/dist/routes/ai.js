import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { generateChatResponse } from '../services/aiService.js';
import { AI_PROVIDERS } from '../types/ai.js';
const CHAT_HISTORY_MAX_ITEMS = 20;
const CHAT_HISTORY_TEXT_MAX_CHARS = 12_000;
const chatRequestSchema = z.object({
    message: z.string().trim().min(1).max(8000),
    history: z
        .array(z.object({
        id: z.string(),
        type: z.enum(['user', 'ai']),
        text: z.string().trim().min(1).max(CHAT_HISTORY_TEXT_MAX_CHARS),
        created_at: z.string().min(1).max(64),
    }))
        .max(CHAT_HISTORY_MAX_ITEMS)
        .default([]),
    provider: z.union([z.enum(AI_PROVIDERS), z.literal('auto')]).default('auto'),
    context: z.object({
        pipelineTotal: z.number().nonnegative(),
        negociosPorEtapa: z.record(z.string().min(1), z.number().nonnegative()),
        followupsVencidos: z.number().int().nonnegative(),
        taxaConversao: z.number().min(0).max(100),
        topDeals: z.array(z.object({
            company: z.string().trim().min(1).max(160),
            value: z.number().nonnegative(),
            stage: z.string().trim().min(1).max(80),
        })).max(10),
    }),
});
export const aiRouter = Router();
const aiRateLimiter = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.AI_RATE_LIMIT_PER_USER ?? '20'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip,
    message: {
        error: 'Too many AI requests. Please wait a minute and try again.',
    },
});
aiRouter.use(requireAuth);
function normalizePreview(text, maxLength = 180) {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (compact.length <= maxLength) {
        return compact;
    }
    return `${compact.slice(0, maxLength - 1)}…`;
}
function buildHistoryPreview(history = []) {
    return history.slice(-5).map(message => ({
        type: message.type,
        created_at: message.created_at,
        text: normalizePreview(message.text, 120),
    }));
}
function buildContextPreview(context) {
    return {
        pipelineTotal: context.pipelineTotal,
        followupsVencidos: context.followupsVencidos,
        taxaConversao: context.taxaConversao,
        negociosPorEtapa: context.negociosPorEtapa,
        topDeals: context.topDeals.slice(0, 3).map(deal => ({
            company: deal.company,
            value: deal.value,
            stage: deal.stage,
        })),
    };
}
aiRouter.post('/chat', aiRateLimiter, async (req, res, next) => {
    const startedAt = Date.now();
    try {
        const payload = chatRequestSchema.parse(req.body);
        logger.info({
            route: 'ai.chat',
            providerPreference: payload.provider,
            messagePreview: normalizePreview(payload.message),
            historyCount: payload.history?.length ?? 0,
            historyPreview: buildHistoryPreview(payload.history),
            context: buildContextPreview(payload.context),
        }, 'AI chat request received');
        const response = await generateChatResponse(payload);
        logger.info({
            route: 'ai.chat',
            provider: response.provider,
            responseLength: response.text.length,
            responsePreview: normalizePreview(response.text, 240),
            durationMs: Date.now() - startedAt,
        }, 'AI chat response generated');
        res.json(response);
    }
    catch (error) {
        logger.error({
            route: 'ai.chat',
            durationMs: Date.now() - startedAt,
            error,
        }, 'AI chat request failed');
        next(error);
    }
});
