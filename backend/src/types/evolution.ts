export interface EvolutionInstanceRequest {
  instanceName: string;
}

export interface EvolutionMessageRequest {
  instanceName: string;
  number: string;
  text: string;
}

export interface EvolutionOperationResponse {
  status: 'queued' | 'sent' | 'failed' | 'conflict';
  message: string;
  payload?: unknown;
}