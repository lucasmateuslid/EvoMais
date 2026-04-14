import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { generateChatResponse } from '../services/aiService.js';
const chatRequestSchema = z.object({
    message: z.string().min(1),
    history: z
        .array(z.object({
        id: z.string(),
        type: z.enum(['user', 'ai']),
        text: z.string(),
        created_at: z.string(),
    }))
        .default([]),
    context: z.object({
        pipelineTotal: z.number(),
        negociosPorEtapa: z.record(z.string(), z.number()),
        followupsVencidos: z.number(),
        taxaConversao: z.number(),
        topDeals: z.array(z.object({
            company: z.string(),
            value: z.number(),
            stage: z.string(),
        })),
    }),
});
export const aiRouter = Router();
aiRouter.use(requireAuth);
aiRouter.post('/chat', async (req, res, next) => {
    try {
        const payload = chatRequestSchema.parse(req.body);
        const response = await generateChatResponse(payload);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
