import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { createEvolutionInstance, sendEvolutionMessage } from '../services/evolutionService.js';
const createInstanceSchema = z.object({
    instanceName: z.string().min(1),
});
const sendMessageSchema = z.object({
    instanceName: z.string().min(1),
    number: z.string().min(1),
    text: z.string().min(1),
});
export const evolutionRouter = Router();
evolutionRouter.use(requireAuth);
evolutionRouter.post('/instances', async (req, res, next) => {
    try {
        const payload = createInstanceSchema.parse(req.body);
        const response = await createEvolutionInstance(payload);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
evolutionRouter.post('/messages', async (req, res, next) => {
    try {
        const payload = sendMessageSchema.parse(req.body);
        const response = await sendEvolutionMessage(payload);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
