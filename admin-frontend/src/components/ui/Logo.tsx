import { ShieldCheck } from 'lucide-react';

export function LogoIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 ${className}`}>
      <ShieldCheck className="h-1/2 w-1/2" />
    </div>
  );
}

export function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoIcon className="h-10 w-10" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-wide text-primary">EvoMais Admin</div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-secondary">Super Admin</div>
      </div>
    </div>
  );
}