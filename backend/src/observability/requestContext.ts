import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextValue {
  correlationId: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContextValue>();

export function runWithRequestContext(context: RequestContextValue, callback: () => void) {
  requestContextStorage.run(context, callback);
}

export function getRequestContext() {
  return requestContextStorage.getStore();
}

export function getCorrelationId() {
  return requestContextStorage.getStore()?.correlationId;
}
