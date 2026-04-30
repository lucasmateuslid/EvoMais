export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
  halfOpenSuccessThreshold: number;
}

export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: CircuitState = 'closed';
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  canProceed(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      const cooledDown = Date.now() - this.openedAt >= this.options.cooldownMs;

      if (cooledDown) {
        this.state = 'half-open';
        this.successes = 0;
        return true;
      }

      return false;
    }

    return true;
  }

  recordSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes += 1;

      if (this.successes >= this.options.halfOpenSuccessThreshold) {
        this.state = 'closed';
        this.successes = 0;
      }
    }
  }

  recordFailure(): void {
    this.failures += 1;

    if (this.state === 'half-open' || this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      this.successes = 0;
    }
  }

  snapshot() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      openedAt: this.openedAt,
      cooldownRemainingMs:
        this.state === 'open' ? Math.max(0, this.options.cooldownMs - (Date.now() - this.openedAt)) : 0,
    };
  }
}

export const evolutionCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 30 * 1000,
  halfOpenSuccessThreshold: 2,
});