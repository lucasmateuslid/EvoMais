import { z } from 'zod';

import { AI_PROVIDERS, type AIProvider } from './types/ai.js';

const aiProviderSchema = z.enum(AI_PROVIDERS);

const optionalEnvString = (schema: z.ZodString) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: optionalEnvString(z.string().url()),
  SUPABASE_ANON_KEY: optionalEnvString(z.string().min(1)),
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString(z.string().min(1)),
  REDIS_URL: optionalEnvString(z.string()),
  GEMINI_API_KEY: optionalEnvString(z.string()),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_API_KEY: optionalEnvString(z.string()),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_API_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  ANTHROPIC_API_KEY: optionalEnvString(z.string()),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-latest'),
  DEEPSEEK_API_KEY: optionalEnvString(z.string()),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  DEEPSEEK_API_BASE_URL: z.string().url().default('https://api.deepseek.com/v1'),
  GROQ_API_KEY: optionalEnvString(z.string()),
  GROQ_MODEL: z.string().default('llama-3.1-70b-versatile'),
  AI_PROVIDER_ORDER: z
    .string()
    .default('gemini,anthropic,openai,deepseek,groq')
    .transform(value =>
      value
        .split(',')
        .map(provider => provider.trim().toLowerCase())
        .filter((provider): provider is AIProvider => aiProviderSchema.safeParse(provider).success),
    ),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(1800),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  EVOLUTION_API_URL: z.string().url().default('http://localhost:8080'),
  EVOLUTION_REQUEST_ORIGIN: z.string().url().optional(),
  EVOLUTION_GLOBAL_API_KEY: optionalEnvString(z.string()),
  EVOLUTION_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  WEBHOOK_SECRET: optionalEnvString(z.string().min(1)),
  EVOLUTION_WEBHOOK_SECRET: optionalEnvString(z.string().min(1)),
  SENTRY_DSN: optionalEnvString(z.string()),
  ENABLE_WORKERS: z.coerce.boolean().default(false),
  LOG_CORRELATION_ID: z.coerce.boolean().default(true),
  ENABLE_TENANT_SUBDOMAIN: z.coerce.boolean().default(true),
  TENANT_ROOT_DOMAIN: z.string().default('fulana.com'),
  TENANT_LOCAL_ROOT_DOMAIN: z.string().default('fulana.local'),
  ENABLE_WEBSOCKETS: z.coerce.boolean().default(true),
});

const rawConfig = configSchema.parse(process.env);

if (rawConfig.ENABLE_WORKERS && !rawConfig.REDIS_URL) {
  throw new Error('ENABLE_WORKERS=true requires REDIS_URL to be configured.');
}

export const config = {
  ...rawConfig,
  WEBHOOK_SECRET: rawConfig.WEBHOOK_SECRET ?? rawConfig.EVOLUTION_WEBHOOK_SECRET,
};

export const isProduction = config.NODE_ENV === 'production';

export const backendCapabilities = {
  supabase: Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY && config.SUPABASE_ANON_KEY),
  redis: Boolean(config.REDIS_URL),
  workers: config.ENABLE_WORKERS && Boolean(config.REDIS_URL),
  tenantSubdomain: config.ENABLE_TENANT_SUBDOMAIN,
  websockets: config.ENABLE_WEBSOCKETS,
  ai: Boolean(
    config.GEMINI_API_KEY ||
      config.OPENAI_API_KEY ||
      config.ANTHROPIC_API_KEY ||
      config.DEEPSEEK_API_KEY ||
      config.GROQ_API_KEY,
  ),
  aiProviders: {
    gemini: Boolean(config.GEMINI_API_KEY),
    openai: Boolean(config.OPENAI_API_KEY),
    anthropic: Boolean(config.ANTHROPIC_API_KEY),
    deepseek: Boolean(config.DEEPSEEK_API_KEY),
    groq: Boolean(config.GROQ_API_KEY),
  },
  evolution: Boolean(config.EVOLUTION_API_URL),
  webhookAuth: Boolean(config.WEBHOOK_SECRET),
  sentry: Boolean(config.SENTRY_DSN),
};