# Frontend — React (Feature-based, Clean)

Struktur berbasis **fitur** (bukan berbasis tipe file seperti `components/`,
`pages/`, `hooks/` yang dipisah rata) — supaya kode yang berhubungan (API call,
komponen, hook, tipe) untuk satu fitur ada di satu tempat, dan mudah dihapus/
dipindah tanpa nyari file tersebar ke mana-mana.

## Setup

- **Build tool**: Vite (bukan Create React App — lebih cepat, lebih ringan)
- **Bahasa**: TypeScript (wajib, bukan opsional — supaya tipe response API dari Go konsisten sampai ke komponen)
- **Data fetching / server state**: TanStack Query (React Query) — jangan simpan data server (hasil fetch API) di `useState`/Redux, biar caching & refetch otomatis
- **Styling**: Tailwind CSS
- **Routing**: React Router

## Struktur folder

```
frontend/
├── public/
├── src/
│   ├── main.tsx                     # entrypoint, pasang provider (QueryClient, Router)
│   ├── App.tsx
│   ├── app/
│   │   ├── routes.tsx                # daftar semua route
│   │   └── providers.tsx             # QueryClientProvider, AuthProvider, dll
│   ├── features/                     # satu folder = satu domain/fitur
│   │   ├── lokasi/
│   │   │   ├── api.ts                 # fetch/mutate ke backend khusus fitur ini
│   │   │   ├── types.ts               # tipe data (idealnya sinkron dgn struct Go)
│   │   │   ├── hooks/
│   │   │   │   ├── useLokasiList.ts    # wrapper useQuery
│   │   │   │   └── useLokasiDetail.ts
│   │   │   └── components/
│   │   │       ├── LokasiTable.tsx
│   │   │       └── LokasiFilterBar.tsx
│   │   ├── progres/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   ├── hooks/
│   │   │   └── components/
│   │   │       ├── ProgresForm.tsx
│   │   │       └── ProgresTimeline.tsx
│   │   └── auth/
│   │       ├── api.ts
│   │       ├── hooks/
│   │       │   └── useAuth.ts
│   │       └── components/
│   │           └── LoginForm.tsx
│   ├── components/                   # komponen UI generik dipakai lintas fitur
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Table.tsx
│   │       └── Badge.tsx
│   ├── lib/
│   │   ├── api-client.ts             # instance fetch/axios: base URL, header auth, error handling terpusat
│   │   └── utils.ts
│   ├── hooks/                        # hook generik lintas fitur (mis. useDebounce)
│   ├── types/                        # tipe global (mis. Role, ApiEnvelope<T>)
│   └── styles/
│       └── globals.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Aturan

- **Tidak ada fetch langsung di komponen.** Semua panggilan API lewat `features/<fitur>/api.ts`, dibungkus hook (`useLokasiList`) yang dipakai komponen. Komponen tidak tahu detail endpoint/URL.
- **`components/ui/`** hanya untuk komponen generik yang benar-benar dipakai lebih dari satu fitur (Button, Table, Badge, Modal). Kalau cuma dipakai 1 fitur, taruh di `features/<fitur>/components/`.
- **State server vs state lokal**: data dari backend (daftar lokasi, progres, dsb) selalu lewat React Query. State UI murni (mis. modal terbuka/tertutup, filter yang belum di-submit) pakai `useState` biasa.
- **Tipe data**: definisikan `types.ts` per fitur yang merefleksikan struct `domain/` di backend Go — supaya field yang berubah di backend cepat ketahuan di frontend saat build TypeScript gagal.

## Contoh tiap layer

```ts
// src/lib/api-client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? "Terjadi kesalahan");
  }

  return json.data as T;
}

function getToken() {
  return localStorage.getItem("token"); // atau ambil dari httpOnly cookie via auth context
}
```

```ts
// src/features/lokasi/types.ts
export interface Lokasi {
  id: number;
  nomor_urut: number;
  nama_kampung_nelayan: string;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  status: "belum_mulai" | "proses" | "selesai" | "terlambat";
}
```

```ts
// src/features/lokasi/api.ts
import { apiFetch } from "../../lib/api-client";
import type { Lokasi } from "./types";

export function fetchLokasiList(params?: { provinsi?: string }) {
  const query = params?.provinsi ? `?provinsi=${params.provinsi}` : "";
  return apiFetch<Lokasi[]>(`/api/v1/lokasi${query}`);
}

export function fetchLokasiDetail(id: number) {
  return apiFetch<Lokasi>(`/api/v1/lokasi/${id}`);
}
```

```ts
// src/features/lokasi/hooks/useLokasiList.ts
import { useQuery } from "@tanstack/react-query";
import { fetchLokasiList } from "../api";

export function useLokasiList(provinsi?: string) {
  return useQuery({
    queryKey: ["lokasi", { provinsi }],
    queryFn: () => fetchLokasiList({ provinsi }),
  });
}
```

```tsx
// src/features/lokasi/components/LokasiTable.tsx
import { useLokasiList } from "../hooks/useLokasiList";

export function LokasiTable() {
  const { data, isLoading, error } = useLokasiList();

  if (isLoading) return <p>Memuat data lokasi...</p>;
  if (error) return <p>Gagal memuat data.</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-left">Kampung Nelayan</th>
          <th className="text-left">Provinsi</th>
          <th className="text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((lokasi) => (
          <tr key={lokasi.id}>
            <td>{lokasi.nama_kampung_nelayan}</td>
            <td>{lokasi.provinsi}</td>
            <td>{lokasi.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Konvensi penamaan

- Komponen: `PascalCase.tsx`
- Hook: `useCamelCase.ts`
- Fungsi/util biasa: `camelCase.ts`
- Satu file = satu export utama (memudahkan pencarian & code splitting)

## Styling

Kalau ada design system yang sudah dibuat sebelumnya (mis. skill `daybreak-design-system`), pakai token warna/tipografi dari sana lewat CSS variables di `globals.css` — jangan hardcode hex warna langsung di komponen.