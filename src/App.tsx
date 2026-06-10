import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  ImageOff,
  Loader2,
  RefreshCcw,
  Search,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiBaseUrl, type Capture, type CaptureFilters, listCaptures } from "./api";

const initialFilters: CaptureFilters = {
  deviceId: "",
  motionDetected: "all",
  from: "",
  to: "",
  page: 1,
  pageSize: 12
};

export function App() {
  const [filters, setFilters] = useState<CaptureFilters>(initialFilters);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    setLoading(true);
    setError(null);

    listCaptures(filters)
      .then((result) => {
        if (abortController.signal.aborted) {
          return;
        }

        setCaptures(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setSelectedCapture((current) => {
          if (!current) {
            return result.data[0] ?? null;
          }

          return result.data.find((capture) => capture.id === current.id) ?? result.data[0] ?? null;
        });
      })
      .catch((unknownError) => {
        if (abortController.signal.aborted) {
          return;
        }

        setError(unknownError instanceof Error ? unknownError.message : "Nao foi possivel carregar as capturas");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [filters, refreshToken]);

  const visibleMotionCount = useMemo(
    () => captures.filter((capture) => capture.motionDetected).length,
    [captures]
  );

  const latestCapture = captures[0] ?? null;

  function updateFilters(nextFilters: Partial<CaptureFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1
    }));
  }

  function goToPage(page: number) {
    setFilters((current) => ({
      ...current,
      page: Math.min(Math.max(page, 1), totalPages)
    }));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ESP32-CAM</p>
          <h1>MicroPhotos</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Atualizar capturas"
          aria-label="Atualizar capturas"
          onClick={() => setRefreshToken((current) => current + 1)}
        >
          <RefreshCcw size={18} />
        </button>
      </header>

      <section className="summary-grid" aria-label="Resumo das capturas">
        <Metric label="Capturas" value={formatNumber(total)} />
        <Metric label="Nesta pagina" value={formatNumber(captures.length)} />
        <Metric label="Com movimento" value={formatNumber(visibleMotionCount)} tone="alert" />
        <Metric label="Ultima captura" value={latestCapture ? formatTime(latestCapture.capturedAt) : "-"} />
      </section>

      <section className="workspace">
        <div className="main-column">
          <form className="filters" onSubmit={(event) => event.preventDefault()}>
            <label className="field search-field">
              <span>Dispositivo</span>
              <div className="input-shell">
                <Search size={16} />
                <input
                  value={filters.deviceId}
                  onChange={(event) => updateFilters({ deviceId: event.target.value })}
                  placeholder="esp32cam-01"
                />
              </div>
            </label>

            <label className="field">
              <span>Movimento</span>
              <select
                value={filters.motionDetected}
                onChange={(event) =>
                  updateFilters({
                    motionDetected: event.target.value as CaptureFilters["motionDetected"]
                  })
                }
              >
                <option value="all">Todos</option>
                <option value="true">Detectado</option>
                <option value="false">Sem movimento</option>
              </select>
            </label>

            <label className="field">
              <span>Inicio</span>
              <input
                type="datetime-local"
                value={filters.from}
                onChange={(event) => updateFilters({ from: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Fim</span>
              <input
                type="datetime-local"
                value={filters.to}
                onChange={(event) => updateFilters({ to: event.target.value })}
              />
            </label>

            <button className="clear-button" type="button" onClick={() => setFilters(initialFilters)}>
              <X size={16} />
              Limpar
            </button>
          </form>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Historico</p>
              <h2>Capturas recentes</h2>
            </div>
            <span className="api-pill">{apiBaseUrl.replace(/^https?:\/\//, "")}</span>
          </div>

          {error ? (
            <StateBlock
              icon={<AlertTriangle size={24} />}
              title="Falha ao carregar"
              body={error}
              actionLabel="Tentar novamente"
              onAction={() => setRefreshToken((current) => current + 1)}
            />
          ) : loading ? (
            <StateBlock icon={<Loader2 className="spin" size={24} />} title="Carregando" body=" " />
          ) : captures.length === 0 ? (
            <StateBlock
              icon={<ImageOff size={24} />}
              title="Nenhuma captura"
              body="Ajuste os filtros ou envie uma nova imagem pela API."
            />
          ) : (
            <>
              <div className="capture-grid">
                {captures.map((capture) => (
                  <CaptureCard
                    capture={capture}
                    key={capture.id}
                    selected={selectedCapture?.id === capture.id}
                    onSelect={() => setSelectedCapture(capture)}
                  />
                ))}
              </div>

              <div className="pagination">
                <button
                  className="icon-button"
                  type="button"
                  title="Pagina anterior"
                  aria-label="Pagina anterior"
                  disabled={filters.page <= 1}
                  onClick={() => goToPage(filters.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Pagina {filters.page} de {totalPages}
                </span>
                <button
                  className="icon-button"
                  type="button"
                  title="Proxima pagina"
                  aria-label="Proxima pagina"
                  disabled={filters.page >= totalPages}
                  onClick={() => goToPage(filters.page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        <CaptureDetails capture={selectedCapture} />
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "alert" }) {
  return (
    <article className={`metric ${tone === "alert" ? "metric-alert" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CaptureCard({
  capture,
  selected,
  onSelect
}: {
  capture: Capture;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`capture-card ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
      <div className="thumb">
        <img src={capture.imageUrl} alt={`Captura de ${capture.deviceId}`} loading="lazy" />
        {capture.motionDetected ? <span className="motion-badge">Movimento</span> : null}
      </div>
      <div className="capture-card-body">
        <div>
          <strong>{capture.deviceId}</strong>
          <span>{formatDateTime(capture.capturedAt)}</span>
        </div>
        <small>Diff {capture.diffScore.toFixed(2)}</small>
      </div>
    </button>
  );
}

function CaptureDetails({ capture }: { capture: Capture | null }) {
  if (!capture) {
    return (
      <aside className="details-panel empty-details">
        <Filter size={22} />
        <span>Selecione uma captura</span>
      </aside>
    );
  }

  return (
    <aside className="details-panel">
      <div className="details-image">
        <img src={capture.imageUrl} alt={`Captura selecionada de ${capture.deviceId}`} />
      </div>

      <div className="details-header">
        <div>
          <p className="eyebrow">Detalhe</p>
          <h2>{capture.deviceId}</h2>
        </div>
        <a className="icon-button" href={capture.imageUrl} target="_blank" rel="noreferrer" title="Abrir imagem">
          <ExternalLink size={18} />
        </a>
      </div>

      <dl className="detail-list">
        <DetailItem icon={<Clock3 size={16} />} label="Capturada em" value={formatDateTime(capture.capturedAt)} />
        <DetailItem icon={<Camera size={16} />} label="Origem" value={capture.captureSource || "-"} />
        <DetailItem label="Tamanho" value={formatBytes(capture.sizeBytes)} />
        <DetailItem label="Diff score" value={capture.diffScore.toFixed(2)} />
        <DetailItem label="Movimento" value={capture.motionDetected ? "Detectado" : "Nao"} />
        <DetailItem label="E-mail" value={capture.emailAlertSent ? "Enviado" : "Nao enviado"} />
        <DetailItem label="ID" value={capture.id} />
      </dl>
    </aside>
  );
}

function DetailItem({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <dt>
        {icon}
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function StateBlock({
  icon,
  title,
  body,
  actionLabel,
  onAction
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="state-block">
      {icon}
      <strong>{title}</strong>
      <p>{body}</p>
      {actionLabel && onAction ? (
        <button className="clear-button" type="button" onClick={onAction}>
          <RefreshCcw size={16} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}
