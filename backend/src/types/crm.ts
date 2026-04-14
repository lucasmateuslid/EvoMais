export type DealStage = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechamento';

export type FollowupStatus = 'vencido' | 'hoje' | 'amanhã' | 'ok' | 'reunião' | 'contrato';

export type InfoType = 'danger' | 'success' | 'info';

export interface DealChecklist {
  feitos: number;
  total: number;
}

export interface Deal {
  id: string;
  organization_id: string;
  stage: DealStage;
  company: string;
  value: number;
  consultant_id: string;
  consultant_name: string;
  consultant_initials: string;
  days_in_stage: number;
  followup_status: FollowupStatus;
  checklist: DealChecklist | null;
  color: string;
  info: string | null;
  info_type: InfoType | null;
  created_at: string;
}