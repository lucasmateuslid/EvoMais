import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, QrCode, Plus, Trash2, SignalHigh } from 'lucide-react';

import { evolutionService, type EvolutionInstance } from '../services/evolutionService';

function statusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('open') || normalized.includes('connected') || normalized.includes('ready')) {
    return 'Conectada';
  }

  if (normalized.includes('qr') || normalized.includes('connect')) {
    return 'Aguardando QR';
  }

  if (normalized.includes('error')) {
    return 'Erro';
  }

  return status;
}

export default function SettingsPage() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  const selectedRecord = useMemo(
    () => instances.find(instance => instance.instance_name === selectedInstance) || null,
    [instances, selectedInstance],
  );

  async function loadInstances() {
    try {
      setLoading(true);
      const data = await evolutionService.listInstances();
      setInstances(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInstances();
  }, []);

  async function onCreateInstance() {
    if (!name.trim()) {
      return;
    }

    try {
      setSaving(true);
      await evolutionService.createInstance({ name: name.trim() });
      setName('');
      await loadInstances();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Erro ao criar instância');
    } finally {
      setSaving(false);
    }
  }

  async function onShowQrCode(instanceName: string) {
    try {
      const data = await evolutionService.getQrCode(instanceName);
      setSelectedInstance(instanceName);
      setQrcode(data.qrcode || null);
      setError(null);
    } catch (qrError) {
      setError(qrError instanceof Error ? qrError.message : 'Erro ao carregar QR code');
    }
  }

  async function onRestartInstance(instanceName: string) {
    try {
      setSaving(true);
      await evolutionService.restartInstance(instanceName);
      await loadInstances();
    } catch (restartError) {
      setError(restartError instanceof Error ? restartError.message : 'Erro ao reiniciar instância');
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteInstance(instanceName: string) {
    if (!window.confirm(`Remover a instância "${instanceName}"?`)) {
      return;
    }

    try {
      setSaving(true);
      await evolutionService.deleteInstance(instanceName);
      if (selectedInstance === instanceName) {
        setSelectedInstance(null);
        setQrcode(null);
      }
      await loadInstances();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir instância');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Configurações</h2>
            <p className="text-sm text-secondary">Instâncias Evolution, conexões e manutenção operacional.</p>
          </div>
          <button
            onClick={() => void loadInstances()}
            className="inline-flex items-center gap-2 rounded-xl border border-divider-subtle px-3 py-2 text-sm font-medium text-primary hover:bg-surface-input"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-divider-subtle bg-surface-input p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" />
              Criar instância
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="nome-da-instancia"
                className="flex-1 rounded-xl border border-divider-subtle bg-surface px-4 py-2 text-sm outline-none"
              />
              <button
                onClick={() => void onCreateInstance()}
                disabled={saving || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SignalHigh className="h-4 w-4" />}
                Criar
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-divider-subtle bg-surface-input p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Resumo</p>
            <p className="mt-2 text-3xl font-bold text-primary">{instances.length}</p>
            <p className="text-sm text-secondary">instância(s) cadastrada(s)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-primary">Instâncias Evolution</h3>
              <p className="text-xs text-secondary">Gerencie QR code, reinício e remoção.</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-secondary" />}
          </div>

          <div className="space-y-3">
            {!loading && instances.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-divider-subtle p-6 text-sm text-secondary">
                Nenhuma instância cadastrada.
              </div>
            ) : null}

            {instances.map(instance => {
              const isSelected = selectedInstance === instance.instance_name;

              return (
                <div
                  key={instance.id}
                  className={`rounded-2xl border p-4 transition ${isSelected ? 'border-brand bg-brand/5' : 'border-divider-subtle bg-surface-input/50'}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{instance.instance_name}</p>
                      <p className="text-xs text-secondary">{statusLabel(instance.status)}</p>
                      {instance.error_message && (
                        <p className="mt-2 max-w-xl text-xs text-red-600">{instance.error_message}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void onShowQrCode(instance.instance_name)}
                        className="inline-flex items-center gap-2 rounded-lg border border-divider-subtle px-3 py-2 text-xs font-medium text-primary hover:bg-surface"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        QR code
                      </button>
                      <button
                        onClick={() => void onRestartInstance(instance.instance_name)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-divider-subtle px-3 py-2 text-xs font-medium text-primary hover:bg-surface disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reiniciar
                      </button>
                      <button
                        onClick={() => void onDeleteInstance(instance.instance_name)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primary">Detalhes da instância</h3>
          <p className="text-xs text-secondary">QR code e dados da instância selecionada.</p>

          {selectedRecord ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-divider-subtle bg-surface-input p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Selecionada</p>
                <p className="mt-1 text-base font-semibold text-primary">{selectedRecord.instance_name}</p>
                <p className="text-sm text-secondary">{statusLabel(selectedRecord.status)}</p>
              </div>

              {qrcode ? (
                <div className="rounded-2xl border border-divider-subtle bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-primary">QR code</p>
                  <img src={qrcode} alt={`QR code da instância ${selectedRecord.instance_name}`} className="mx-auto max-w-full rounded-xl" />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-divider-subtle p-4 text-sm text-secondary">
                  Clique em QR code para visualizar a conexão.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-divider-subtle p-4 text-sm text-secondary">
              Selecione uma instância para ver o QR code e os detalhes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
