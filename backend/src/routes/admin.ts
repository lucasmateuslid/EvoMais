import { Router } from 'express';

import { backendCapabilities } from '../config.js';
import { AppError } from '../errors/AppError.js';
import { hasQueueBackend, queueNames } from '../jobs/queue.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { adminSupabase } from '../services/supabase.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);

async function ensureSuperAdmin(request: AuthenticatedRequest) {
	if (!request.userId) {
		throw new AppError({
			code: 'forbidden',
			statusCode: 403,
			domain: 'auth',
			message: 'Missing authenticated user.',
		});
	}

	const { data: profile, error } = await adminSupabase
		.from('profiles')
		.select('role')
		.eq('user_id', request.userId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!profile || profile.role !== 'super_admin') {
		throw new AppError({
			code: 'forbidden',
			statusCode: 403,
			domain: 'auth',
			message: 'Only super admins can access this endpoint.',
		});
	}
}

async function countRows(table: string) {
	const { count, error } = await adminSupabase
		.from(table)
		.select('*', { count: 'exact', head: true });

	if (error) {
		throw error;
	}

	return count || 0;
}

adminRouter.get('/stats', async (req, res, next) => {
	try {
		const request = req as AuthenticatedRequest;
		await ensureSuperAdmin(request);

		const [organizations, tenants, profiles, deals, conversations, messages] = await Promise.all([
			countRows('organizations'),
			countRows('tenants'),
			countRows('profiles'),
			countRows('deals'),
			countRows('conversations'),
			countRows('messages'),
		]);

		res.json({
			stats: {
				organizations,
				tenants,
				profiles,
				deals,
				conversations,
				messages,
			},
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		next(error);
	}
});

adminRouter.get('/jobs', async (req, res, next) => {
	try {
		const request = req as AuthenticatedRequest;
		await ensureSuperAdmin(request);

		res.json({
			jobs: {
				queueBackend: hasQueueBackend(),
				queueNames,
				capabilities: {
					workers: backendCapabilities.workers,
					redis: backendCapabilities.redis,
				},
			},
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		next(error);
	}
});

adminRouter.get('/logs', async (req, res, next) => {
	try {
		const request = req as AuthenticatedRequest;
		await ensureSuperAdmin(request);

		res.json({
			logs: {
				sentryEnabled: backendCapabilities.sentry,
				correlationIdEnabled: true,
				note: 'Application logs are emitted via Pino/Sentry. Centralized log query endpoint is not yet implemented.',
			},
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		next(error);
	}
});
