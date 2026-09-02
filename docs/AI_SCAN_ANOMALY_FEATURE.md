# AI Scan & Anomaly Analysis

Fitur ini menerima input dokumen, foto, PDF, atau teks dari web dan kanal eksternal opsional untuk dianalisis sebagai potensi anomali pada titik KNMP. Titik KNMP dibaca otomatis dari isi teks/OCR atau caption yang masuk.

## Kanal Input

- Web: aktif melalui halaman `AI Scan`; user tidak memilih kanal manual karena kanal ditentukan otomatis oleh endpoint.
- Telegram: aktif melalui webhook `POST /api/v1/integrations/telegram/webhook` untuk teks, caption, foto, dan dokumen. File Telegram diunduh via Bot API jika `TELEGRAM_BOT_TOKEN` tersedia.
- WhatsApp Meta Business: disiapkan sebagai konfigurasi opsional, endpoint produksi bisa ditambahkan saat kredensial Meta tersedia.

## Environment

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
WHATSAPP_ENABLED=false
WHATSAPP_VERIFY_TOKEN=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
CLAUDE_API_KEY=
```

Token bot tidak disimpan di repository. Simpan token Telegram di environment server, lalu rotasi token jika pernah dibagikan di chat atau tiket.

Saat mendaftarkan webhook Telegram, gunakan URL backend public:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<PUBLIC_BACKEND_URL>/api/v1/integrations/telegram/webhook
```

Jika memakai `TELEGRAM_WEBHOOK_SECRET`, kirim secret tersebut sebagai `secret_token` saat `setWebhook`.

## Endpoint Web

- `GET /api/v1/ai-analysis`
- `GET /api/v1/ai-analysis/stats`
- `GET /api/v1/ai-analysis/:id`
- `POST /api/v1/ai-analysis`
- `PATCH /api/v1/ai-analysis/:id/status`
- `DELETE /api/v1/ai-analysis/:id`

`POST /api/v1/ai-analysis` memakai `multipart/form-data`:

- `title`
- `source_channel`: otomatis `web` dari halaman web
- `model_provider`: `rule_based`, `codex`, `deepseek`, `gemini`, atau `claude`
- `knmp_id`: opsional dan normalnya tidak dikirim dari UI; backend akan mendeteksi titik dari teks
- `assigned_user_id`
- `input_text`
- `file`

## Analisa AI

User dapat memilih provider analisa `Codex / OpenAI`, `DeepSeek`, `Gemini`, atau `Claude`. Jika API key provider tersedia, backend mengirim teks dokumen ke provider tersebut dan meminta AI mengembalikan JSON terstruktur:

- `risk_level`
- `risk_score`
- `document_type`: jenis dokumen yang terbaca
- `is_knmp_related`: penanda apakah dokumen terkait KNMP
- `summary`: ringkasan keseluruhan isi file, bukan hanya kalimat risiko
- `findings`
- `recommendations`
- `target_module`: modul tujuan seperti `laporan`, `pelaksanaan`, `issue`, `absensi`, `pembayaran`, `persiapan`, atau `dokumen_umum`
- `draft_input`: field hasil baca AI yang siap dipakai untuk form modul tujuan
- `extracted_facts`: fakta penting yang terbaca dari file

Provider yang didukung:

- `codex`: OpenAI chat completions memakai `OPENAI_API_KEY`
- `deepseek`: DeepSeek chat completions memakai `DEEPSEEK_API_KEY`
- `gemini`: Gemini generate content memakai `GEMINI_API_KEY`
- `claude`: Anthropic Messages API memakai `CLAUDE_API_KEY`

Jika API key kosong, provider error, atau respons AI tidak valid, sistem otomatis memakai fallback `rule_based_v1` agar proses scan tetap tersimpan dan tidak gagal total.

Hasil scan tetap dianalisis dan disimpan walaupun dokumen tidak lolos validasi KNMP. Jika dokumen tidak terkait KNMP atau tidak ditemukan titik KNMP aktif yang cocok dari isi dokumen/caption, item tetap tampil di daftar dengan penanda `Tidak valid` dan alasan validasinya.

Fallback lokal membaca teks/caption/file teks dan memberi skor risiko berdasarkan:

- kata risiko seperti `kritis`, `terlambat`, `kendala`, `kecelakaan`, `tidak sesuai`, `over budget`;
- selisih persentase progres besar di dalam teks;
- kelengkapan sinyal dasar seperti tanggal, lokasi, dan progres;
- file non-teks yang belum memiliki hasil OCR penuh.

Hasil disimpan di tabel `ai_analyses` dengan relasi dokumen di tabel `documents` memakai `documentable_type = 'ai_analysis'`. Data struktur seperti `target_module`, `draft_input`, dan `extracted_facts` disimpan di `ai_analyses.metadata` agar bisa dipakai sebagai bahan auto-fill ke menu terkait.

Setiap hasil analisa memiliki `summary` singkat agar reviewer bisa langsung membaca inti risiko tanpa membuka detail temuan.

## Auto-Fill Modul

Saat PDF/laporan masuk, AI Scan tidak hanya menyimpan hasil analisa. Sistem juga menyiapkan draft input:

- Dokumen laporan/progres diarahkan ke modul `laporan` dengan field seperti `tanggal`, `jenis_laporan`, `cuaca`, `jumlah_tenaga_kerja`, `rencana_progres_fisik`, `realisasi_progres_fisik`, dan `keterangan`.
- Dokumen kendala/K3 diarahkan ke modul `issue` dengan field seperti `kategori_issue`, `tingkat`, dan `uraian_masalah`.
- Dokumen mobilisasi/SPMK/PCM diarahkan ke modul `persiapan`.
- Dokumen pembayaran/termin diarahkan ke modul `pembayaran`.

Untuk menjaga data produksi tetap aman, hasil AI disimpan sebagai draft terstruktur terlebih dahulu. Modul tujuan bisa memakai `draft_input` ini untuk auto-fill form dan user tetap melakukan review sebelum data final tersimpan.

Hapus dokumen pada halaman AI Scan melakukan soft-delete terhadap record analisa dan lampiran dokumen terkait.

## Scoping

Super Admin melihat semua data. User lain hanya melihat hasil analisa dari titik KNMP yang ada pada `user_knmps`.
