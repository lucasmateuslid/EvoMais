import { z } from 'zod';
const configSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    REDIS_URL: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    EVOLUTION_API_URL: z.string().url().default('http://localhost:8080'),
    EVOLUTION_GLOBAL_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    ENABLE_WORKERS: z.coerce.boolean().default(false),
    LOG_CORRELATION_ID: z.coerce.boolean().default(true),
    ENABLE_TENANT_SUBDOMAIN: z.coerce.boolean().default(true),
    TENANT_ROOT_DOMAIN: z.string().default('fulana.com'),
    TENANT_LOCAL_ROOT_DOMAIN: z.string().default('fulana.local'),
    ENABLE_WEBSOCKETS: z.coerce.boolean().default(true),
});
export const config = configSchema.parse(process.env);
export const isProduction = config.NODE_ENV === 'production';
export const backendCapabilities = {
    supabase: Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY && config.SUPABASE_ANON_KEY),
    redis: Boolean(config.REDIS_URL),
    workers: config.ENABLE_WORKERS && Boolean(config.REDIS_URL),
    tenantSubdomain: config.ENABLE_TENANT_SUBDOMAIN,
    websockets: config.ENABLE_WEBSOCKETS,
    ai: Boolean(config.GEMINI_API_KEY || config.ANTHROPIC_API_KEY || config.GROQ_API_KEY),
    evolution: Boolean(config.EVOLUTION_API_URL),
    sentry: Boolean(config.SENTRY_DSN),
};
