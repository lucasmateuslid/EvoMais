import { Router } from 'express';
import { backendCapabilities, config } from '../config.js';
import { hasQueueBackend } from '../jobs/queue.js';
import { getEvolutionHealthSnapshot } from '../services/evolutionService.js';
import { isSupabaseReady } from '../services/supabase.js';
export const healthRouter = Router();
healthRouter.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        environment: config.NODE_ENV,
        capabilities: {
            ...backendCapabilities,
            queue: hasQueueBackend(),
            supabaseReady: isSupabaseReady(),
        },
        evolution: getEvolutionHealthSnapshot(),
    });
});
