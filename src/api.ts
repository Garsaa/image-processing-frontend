export type Capture = {
  id: string;
  deviceId: string;
  captureSource?: string;
  imageUrl: string;
  imagePath: string;
  sizeBytes: number;
  mimeType: "image/jpeg";
  capturedAt: string;
  triggerCommand?: string;
  diffScore: number;
  motionDetected: boolean;
  emailAlertSent: boolean;
};

export type CapturesResponse = {
  data: Capture[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CaptureFilters = {
  deviceId: string;
  motionDetected: "all" | "true" | "false";
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

const defaultApiBaseUrl = "https://image-processing-server-eight.vercel.app";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || defaultApiBaseUrl;

export async function listCaptures(filters: CaptureFilters): Promise<CapturesResponse> {
  const searchParams = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize)
  });

  if (filters.deviceId.trim()) {
    searchParams.set("deviceId", filters.deviceId.trim());
  }

  if (filters.motionDetected !== "all") {
    searchParams.set("motionDetected", filters.motionDetected);
  }

  if (filters.from) {
    searchParams.set("from", new Date(filters.from).toISOString());
  }

  if (filters.to) {
    searchParams.set("to", new Date(filters.to).toISOString());
  }

  const response = await fetch(`${apiBaseUrl}/captures?${searchParams.toString()}`);

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new Error(payload || `Erro ${response.status} ao carregar capturas`);
  }

  return response.json() as Promise<CapturesResponse>;
}

async function readErrorPayload(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { error?: string; details?: unknown };
    return payload.details ? `${payload.error}: ${String(payload.details)}` : payload.error ?? null;
  } catch {
    return null;
  }
}
