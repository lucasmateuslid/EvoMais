export type ErrorDomain = 'auth' | 'validation' | 'database' | 'external' | 'application';

export interface AppErrorOptions {
	code: string;
	statusCode: number;
	domain: ErrorDomain;
	message: string;
	details?: unknown;
}

export class AppError extends Error {
	readonly code: string;

	readonly statusCode: number;

	readonly domain: ErrorDomain;

	readonly details?: unknown;

	constructor(options: AppErrorOptions) {
		super(options.message);
		this.name = 'AppError';
		this.code = options.code;
		this.statusCode = options.statusCode;
		this.domain = options.domain;
		this.details = options.details;
	}
}
