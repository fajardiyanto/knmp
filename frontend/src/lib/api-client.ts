const BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL
    ? (import.meta as any).env?.VITE_API_BASE_URL
    : (import.meta as any).env?.DEV
    ? "http://localhost:8080"
    : "";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("knmp_token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type if uploading FormData (browser handles boundary automatically)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("knmp_token");
    localStorage.removeItem("knmp_user");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || json.message || `Terjadi kesalahan (HTTP ${res.status})`);
  }

  if (json.data !== undefined) {
    return json.data as T;
  }

  return json as T;
}

export function getFileUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  let cleanPath = path;
  while (cleanPath.includes("uploads/uploads/")) {
    cleanPath = cleanPath.replace("uploads/uploads/", "uploads/");
  }
  if (!cleanPath.startsWith("/uploads/") && !cleanPath.startsWith("uploads/")) {
    cleanPath = "/uploads/" + cleanPath.replace(/^\/+/, "");
  }
  return `${BASE_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
}
