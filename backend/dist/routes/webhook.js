import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../logger.js';
const webhookPayloadSchema = z.record(z.string(), z.unknown());
export const webhookRouter = Router();
webhookRouter.post('/evolution', async (req, res, next) => {
    try {
        const payload = webhookPayloadSchema.parse(req.body);
        logger.info({ payload }, 'Evolution webhook received');
        res.json({
            received: true,
        });
    }
    catch (error) {
        next(error);
    }
});
