# Struktur Proyek Gabungan & Setup Lokal

## Struktur root (monorepo)

```
nama-proyek/
├── backend/              # lihat references/backend-golang.md
├── frontend/             # lihat references/frontend-react.md
├── docker-compose.yml    # jalankan Postgres + backend + frontend sekaligus untuk dev lokal
├── .gitignore
└── README.md
```

Backend dan frontend dipisah sebagai dua folder top-level (bukan dicampur) —
supaya masing-masing punya `go.mod`/`package.json` sendiri, bisa di-deploy
terpisah, dan CI/CD-nya independen.

## docker-compose.yml (contoh untuk development)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: example_db_name
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://user:password@db:5432/example_db_name?sslmode=disable
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:8080
    depends_on:
      - backend

volumes:
  db-data:
```

## Alur setup dari nol

1. `docker compose up -d db` — nyalakan Postgres dulu.
2. `cd backend && migrate -database "$DATABASE_URL" -path migrations up` — jalankan migration.
3. `cd backend && go run cmd/api/main.go` — jalankan backend (atau `docker compose up backend`).
4. `cd frontend && npm install && npm run dev` — jalankan frontend (atau `docker compose up frontend`).

## Environment variables

Setiap folder (`backend/`, `frontend/`) punya `.env.example` sendiri — commit
`.env.example`, jangan pernah commit `.env` asli (tambahkan ke `.gitignore`).

## Checklist "clean folder structure" sebelum dianggap selesai

- [ ] Backend: tidak ada query SQL langsung di `handler/` — semua lewat `repository/`.
- [ ] Backend: tidak ada koneksi DB global (`var db *sql.DB` di top-level package) — selalu di-inject.
- [ ] Frontend: tidak ada `fetch()`/`axios` langsung di dalam komponen — selalu lewat `features/<fitur>/api.ts`.
- [ ] Frontend: tidak ada komponen fitur spesifik yang nyasar ke `components/ui/`.
- [ ] Tidak ada file `.env` asli ter-commit ke git.
- [ ] Setiap fitur baru (mis. tambah modul "Cool Box") ditambahkan sebagai folder baru di `features/` (frontend) dan set `handler+service+repository` baru (backend) — bukan menumpuk logic di file yang sudah ada.