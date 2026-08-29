-- Seeder Kontrak dan Pembayaran Sumatera dari Data Kontrak Sumatera.xlsx
DO $$
DECLARE
    v_persiapan_id BIGINT;
    v_knmp_id BIGINT;
BEGIN

    -- Contract #1: PT. Laksana Aneka Sarana
    v_knmp_id := NULL;
    IF 'Tanjung Sangkar' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tanjung Sangkar%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Laksana Aneka Sarana', '2026-08-06', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Tanjung Sangkar, Desa Celagen & Desa Kepoh, Kabupaten Bangka Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026 [No. SP: B.21952/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 1, "nama_penyedia": "PT. Laksana Aneka Sarana", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Tanjung Sangkar, Desa Celagen & Desa Kepoh, Kabupaten Bangka Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21952/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-06", "nilai_kontrak": 13272373000.0, "alamat": "Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat", "npwp": "01.707.370.1-404.000", "nama_direktur": "Siddiq", "jabatan_direktur": "Direktur", "telp": "08129674773", "email": "laksanaanekasarana@gmail.com", "nama_bank": "Bank DKI Syariah", "norek": "71216000062 A.n PT. LAKSANA ANEKA SARANA", "cabang_bank": "KCP Syariah Manggarai", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22724/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1, Desa Tanjung Sangkar, Kec. Lepar, Kab. Bangka Selatan, Prov. Kep. Bangka Belitung\n2. Desa Celagen, Kec. Kepulauan Pongok, Kab. Bangka Selatan, Prov. Kep. Bangka Belitung\n3. Desa Kepoh, Kec. Toboali, Kab. Bangka Selatan, Prov. Kep. Bangka Belitung", "jumlah_desa": 3, "wakil_ppk": "Marta Sarimanu :\n1. Desa Tanjung Sangkar\n2. Desa Celagen\n\nPurwanti :\n1. Desa Kepoh"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 13272373000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 1', 3318093250.00, 25.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 2', 3318093250.00, 50.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 3', 3318093250.00, 75.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 4', 2654474600.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Laksana Aneka Sarana', 'Jaminan Pemeliharaan', 'Retensi', 663618650.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());
    END IF;
    

    -- Contract #2: PT GANESHA JAYA
    v_knmp_id := NULL;
    IF 'Panipahan Darat' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Panipahan Darat%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT GANESHA JAYA', '2026-08-03', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Rokan Hilir Riau Tahun Anggaran 2026 [No. SP: B.21625/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 2, "nama_penyedia": "PT GANESHA JAYA", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Rokan Hilir Riau Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21625/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-03", "nilai_kontrak": 15721317000.0, "alamat": "Jl. Dukuh Kupang Timur XI/42 Surabaya, Kecamatan Sawahan Kelurahan Pakis RW 8 RT 4 Kota Surabaya", "npwp": "001.214.080.263.1.000", "nama_direktur": "A. Yani Ikhsan, ST", "jabatan_direktur": "Direktur", "telp": "081283064488", "email": "ganesha.jaya42@gmail.com", "nama_bank": "Bank Jatim", "norek": "1711009082 A.n GANESHA JAYA, PT", "cabang_bank": "CAPEM KALIBUTUH", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22310/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Panipahan Darat, Kabupaten Rokan Hilir, Provinsi Riau\n2. Desa Sinaboi, Kabupaten Rokan Hilir, Provinsi Riau\n3. Desa Panipahan, Kabupaten Rokan Hilir, Provinsi Riau\n4. Desa Telukpulai, Kabupaten Rokan Hilir, Provinsi Riau", "jumlah_desa": 4, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 15721317000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT GANESHA JAYA', 'Realisasi Konstruksi', 'Termin 1', 3930329250.00, 25.00, '1711009082 A.n GANESHA JAYA, PT (Bank Jatim CAPEM KALIBUTUH)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT GANESHA JAYA', 'Realisasi Konstruksi', 'Termin 2', 3930329250.00, 50.00, '1711009082 A.n GANESHA JAYA, PT (Bank Jatim CAPEM KALIBUTUH)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT GANESHA JAYA', 'Realisasi Konstruksi', 'Termin 3', 3930329250.00, 75.00, '1711009082 A.n GANESHA JAYA, PT (Bank Jatim CAPEM KALIBUTUH)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT GANESHA JAYA', 'Realisasi Konstruksi', 'Termin 4', 3144263400.00, 100.00, '1711009082 A.n GANESHA JAYA, PT (Bank Jatim CAPEM KALIBUTUH)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT GANESHA JAYA', 'Jaminan Pemeliharaan', 'Retensi', 786065850.00, 100.00, '1711009082 A.n GANESHA JAYA, PT (Bank Jatim CAPEM KALIBUTUH)', NOW(), NOW());
    END IF;
    

    -- Contract #3: PT. Indo Jaya Negara Abadi
    v_knmp_id := NULL;
    IF 'Kurau' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kurau%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Indo Jaya Negara Abadi', '2026-08-06', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kurau Provinsi Kepulauan Bangka belitung [No. SP: B.21953/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 3, "nama_penyedia": "PT. Indo Jaya Negara Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kurau Provinsi Kepulauan Bangka belitung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21953/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-06", "nilai_kontrak": 7729376000.0, "alamat": "JALAN PEJATEN BARAT II, JL. TIMBUL NO. 21 Kota Adm. Jakarta Selatan DKI Jakarta", "npwp": "0925 2055 3601 7000", "nama_direktur": "Hero Aska Karnanda", "jabatan_direktur": "Direktur", "telp": "087731490688", "email": "officialindojayanegaraabadi@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1270015184623 A.n PT. Indo Jaya Negara Abadi", "cabang_bank": "KC Jakarta Ampera Raya", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23166/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-18", "tgl_selesai": "2026-12-15", "ruang_lingkup": "1. Desa Kurau, Kec. Koba, Kab. Bangka Tengah, Prov. Kepulauan Bangka belitung", "jumlah_desa": 1, "wakil_ppk": "R. Kurmawan"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7729376000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 1', 1932344000.00, 25.00, '1270015184623 A.n PT. Indo Jaya Negara Abadi (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 2', 1932344000.00, 50.00, '1270015184623 A.n PT. Indo Jaya Negara Abadi (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 3', 1932344000.00, 75.00, '1270015184623 A.n PT. Indo Jaya Negara Abadi (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 4', 1545875200.00, 100.00, '1270015184623 A.n PT. Indo Jaya Negara Abadi (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Indo Jaya Negara Abadi', 'Jaminan Pemeliharaan', 'Retensi', 386468800.00, 100.00, '1270015184623 A.n PT. Indo Jaya Negara Abadi (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());
    END IF;
    

    -- Contract #4: CV. Karya Bona Pasogit
    v_knmp_id := NULL;
    IF 'Pasar Seluma' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pasar Seluma%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Karya Bona Pasogit', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Seluma Kabupaten Seluma Provinsi Bengkulu [No. SP: B.21815/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 4, "nama_penyedia": "CV. Karya Bona Pasogit", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Seluma Kabupaten Seluma Provinsi Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21815/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 3879978000.0, "alamat": "Jalan Terminal Regional Nomor 000, Kota Bengkulu, Provinsi Bengkulu", "npwp": "04.994.734.4-31 l.000", "nama_direktur": "ALI MUSTOFA BISRI", "jabatan_direktur": "Direktur", "telp": "0857-6687-1824", "email": "cvkruyabonapasogit@gmail.com", "nama_bank": "BSI", "norek": "7286359358 A.n CV KARYA BONA PASOGIT", "cabang_bank": "KC BENGKULU A MALIK", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22311/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Pasar Seluma, Kec. Seluma Selatan, Kabupaten Seluma, Provinsi Bengkulu", "jumlah_desa": 1, "wakil_ppk": "Cecep Ahmad Rohimat"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 3879978000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Karya Bona Pasogit', 'Realisasi Konstruksi', 'Termin 1', 969994500.00, 25.00, '7286359358 A.n CV KARYA BONA PASOGIT (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Karya Bona Pasogit', 'Realisasi Konstruksi', 'Termin 2', 969994500.00, 50.00, '7286359358 A.n CV KARYA BONA PASOGIT (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Karya Bona Pasogit', 'Realisasi Konstruksi', 'Termin 3', 969994500.00, 75.00, '7286359358 A.n CV KARYA BONA PASOGIT (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Karya Bona Pasogit', 'Realisasi Konstruksi', 'Termin 4', 775995600.00, 100.00, '7286359358 A.n CV KARYA BONA PASOGIT (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Karya Bona Pasogit', 'Jaminan Pemeliharaan', 'Retensi', 193998900.00, 100.00, '7286359358 A.n CV KARYA BONA PASOGIT (BSI KC BENGKULU A MALIK)', NOW(), NOW());
    END IF;
    

    -- Contract #5: PT. Karang Baru Pratama
    v_knmp_id := NULL;
    IF 'Seri Kembang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Seri Kembang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Karang Baru Pratama', '2026-08-10', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Seri Kembang, Desa Burai, Desa Sunur, Desa Sungai Sibur Provinsi Sumatera Selatan [No. SP: B.22330/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 5, "nama_penyedia": "PT. Karang Baru Pratama", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Seri Kembang, Desa Burai, Desa Sunur, Desa Sungai Sibur Provinsi Sumatera Selatan", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22330/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-10", "nilai_kontrak": 15041201000.0, "alamat": "Perum Puri Kencana Blok J 3, Jl. Urip Sumoharjo No. 88, Kota Bandar Lampung, Lampung", "npwp": "02.812.448.5-323.000", "nama_direktur": "Surya Edi Pratama Putra", "jabatan_direktur": "Kuasa Direktur", "telp": "082175189977", "email": "Karangbarupratama68@gmail.com", "nama_bank": "Bank Lampung", "norek": "3800002088247 A.n PT. Karang Baru Pratama", "cabang_bank": "KC Bandar Lampung", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22726/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Seri Kembang, Kec. Muara Kuang, Kab. Ogan Ilir, Prov. Sumatera Selatan\n2. Desa Burai, Kec. Tanjung Batu, Kab. Ogan Ilir, Prov. Sumatera Selatan\n3. Desa Sunur, Kec. Rembang Kuang, Kab. Ogan Ilir, Prov. Sumatera Selatan\n4. Desa Sungai Sibur, Kec. Sungai Menang, Kab. Ogan Komering Ilir, Prov. Sumatera Selatan", "jumlah_desa": 4, "wakil_ppk": "Rini Afrianty"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 15041201000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Karang Baru Pratama', 'Realisasi Konstruksi', 'Termin 1', 3760300250.00, 25.00, '3800002088247 A.n PT. Karang Baru Pratama (Bank Lampung KC Bandar Lampung)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Karang Baru Pratama', 'Realisasi Konstruksi', 'Termin 2', 3760300250.00, 50.00, '3800002088247 A.n PT. Karang Baru Pratama (Bank Lampung KC Bandar Lampung)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Karang Baru Pratama', 'Realisasi Konstruksi', 'Termin 3', 3760300250.00, 75.00, '3800002088247 A.n PT. Karang Baru Pratama (Bank Lampung KC Bandar Lampung)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Karang Baru Pratama', 'Realisasi Konstruksi', 'Termin 4', 3008240200.00, 100.00, '3800002088247 A.n PT. Karang Baru Pratama (Bank Lampung KC Bandar Lampung)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Karang Baru Pratama', 'Jaminan Pemeliharaan', 'Retensi', 752060050.00, 100.00, '3800002088247 A.n PT. Karang Baru Pratama (Bank Lampung KC Bandar Lampung)', NOW(), NOW());
    END IF;
    

    -- Contract #6: PT. Segi Tiga Tambora
    v_knmp_id := NULL;
    IF 'Tiku Selatan' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tiku Selatan%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Segi Tiga Tambora', '2026-08-10', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tiku Selatan, Desa Pilubang, Desa Ampalu, Desa Marunggi dan Desa Koto Tinggi Kuranji Provinsi Sumatera Barat [No. SP: B.22331/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 6, "nama_penyedia": "PT. Segi Tiga Tambora", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tiku Selatan, Desa Pilubang, Desa Ampalu, Desa Marunggi dan Desa Koto Tinggi Kuranji Provinsi Sumatera Barat", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22331/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-10", "nilai_kontrak": 21082644000.0, "alamat": "BTN PERMATA ANAWAI BLOK A7/4, Kota Kendari Prov. Sulawesi Tenggara", "npwp": "0765 2582 9881 1000", "nama_direktur": "Anwar", "jabatan_direktur": "Direktur", "telp": "082112111009", "email": "segitigatamborapt@gmail.com", "nama_bank": "BRI", "norek": "19201002667564 A.n PT. Segi Tiga Tambora", "cabang_bank": "KC Kendari Samratulangi", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23203/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-19", "tgl_selesai": "2026-12-16", "ruang_lingkup": "1. Desa Tiku Selatan, Kec. Tanjung Mutiara, Kab. Agam. Prov. Sumatera Barat\n2. Desa Pilubang, Kec. Sungai Limai, Kab. Padang Pariaman, Prov. Sumatera Barat\n3. Desa Ampalu, Kec. Pariaman Utara, Kota Pariaman, Prov. Sumatera Barat\n4. Desa Marunggi, Kec. Pariamam Selatan, Kota Pariaman, Prov. Sumatera Barat\n5. Desa Koto Tinggi Kuranji Hilir, Kec. Sungai Limau, Kab. Padang Pariaman, Prov. Sumatera Barat", "jumlah_desa": 5, "wakil_ppk": "Melly Masrul\n\n1. Desa Tiku Selatan, Kec. Tanjung Mutiara, Kab. Agam. Prov. Sumatera Barat\n2. Desa Ampalu, Kec. Pariaman Utara, Kota Pariaman, Prov. Sumatera Barat\n3. Desa Marunggi, Kec. Pariamam Selatan, Kota Pariaman, Prov. Sumatera Barat\n\nAbdul Razak\n\n1. Desa Koto Tinggi Kuranji Hilir, Kec. Sungai Limau, Kab. Padang Pariaman, Prov. Sumatera Barat\n2. Desa Pilubang, Kec. Sungai Limai, Kab. Padang Pariaman, Prov. Sumatera Barat"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 21082644000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Segi Tiga Tambora', 'Realisasi Konstruksi', 'Termin 1', 5270661000.00, 25.00, '19201002667564 A.n PT. Segi Tiga Tambora (BRI KC Kendari Samratulangi)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Segi Tiga Tambora', 'Realisasi Konstruksi', 'Termin 2', 5270661000.00, 50.00, '19201002667564 A.n PT. Segi Tiga Tambora (BRI KC Kendari Samratulangi)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Segi Tiga Tambora', 'Realisasi Konstruksi', 'Termin 3', 5270661000.00, 75.00, '19201002667564 A.n PT. Segi Tiga Tambora (BRI KC Kendari Samratulangi)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Segi Tiga Tambora', 'Realisasi Konstruksi', 'Termin 4', 4216528800.00, 100.00, '19201002667564 A.n PT. Segi Tiga Tambora (BRI KC Kendari Samratulangi)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Segi Tiga Tambora', 'Jaminan Pemeliharaan', 'Retensi', 1054132200.00, 100.00, '19201002667564 A.n PT. Segi Tiga Tambora (BRI KC Kendari Samratulangi)', NOW(), NOW());
    END IF;
    

    -- Contract #7: PT. Putra Meranti
    v_knmp_id := NULL;
    IF 'Centai' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Centai%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Putra Meranti', '2026-08-11', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Meranti, Pelalawan, Siak dan Kota Pekanbaru, Provinsi Riau [No. SP: B.22433/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 7, "nama_penyedia": "PT. Putra Meranti", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Meranti, Pelalawan, Siak dan Kota Pekanbaru, Provinsi Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22433/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-11", "nilai_kontrak": 20653275890.0, "alamat": "Jl. Yos Sudarso, Gang Obor, No. 02, Umban Sari, Rumbai, Kota Pekanbaru, Riau", "npwp": "029854197211000", "nama_direktur": "EFENDRI SAPUTRA", "jabatan_direktur": "Direktur Utama", "telp": "081268231919", "email": "pt.putrameranti@yahoo.co.id", "nama_bank": "Bank Mandiri", "norek": "1230013673068 A.n PUTRA MERANTI", "cabang_bank": "KCP Jakarta Percetakan Negara", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22438/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-11", "tgl_selesai": "2026-12-08", "ruang_lingkup": "1. Desa Centai, Kec. Pulaumerbau, Kab. Kepulauan Meranti, Prov. Riau\n2. Desa Teluk, Kec. Kuala Kampar, Kab. Pelalawan, Prov. Riau\n3. Desa Teluk Batil, Kec. Sungai Apit, Kab. Siak, Prov. Riau\n4. Desa Tebing Tinggi Okura,  Kec. Rumbai Timur, Kota Pekanbaru, Prov. Riau\n5. Desa Mekari Sari, Kec. Merbau, Kab. Kepulauan Meranti, Prov. Riau", "jumlah_desa": 5, "wakil_ppk": "Reydho MS Zahrial"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 20653275890.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Putra Meranti', 'Realisasi Konstruksi', 'Termin 1', 5163318972.50, 25.00, '1230013673068 A.n PUTRA MERANTI (Bank Mandiri KCP Jakarta Percetakan Negara)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Putra Meranti', 'Realisasi Konstruksi', 'Termin 2', 5163318972.50, 50.00, '1230013673068 A.n PUTRA MERANTI (Bank Mandiri KCP Jakarta Percetakan Negara)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Putra Meranti', 'Realisasi Konstruksi', 'Termin 3', 5163318972.50, 75.00, '1230013673068 A.n PUTRA MERANTI (Bank Mandiri KCP Jakarta Percetakan Negara)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Putra Meranti', 'Realisasi Konstruksi', 'Termin 4', 4130655178.00, 100.00, '1230013673068 A.n PUTRA MERANTI (Bank Mandiri KCP Jakarta Percetakan Negara)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Putra Meranti', 'Jaminan Pemeliharaan', 'Retensi', 1032663794.50, 100.00, '1230013673068 A.n PUTRA MERANTI (Bank Mandiri KCP Jakarta Percetakan Negara)', NOW(), NOW());
    END IF;
    

    -- Contract #8: PT. BARAGALU TIAS JAYA
    v_knmp_id := NULL;
    IF 'Kekatang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kekatang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. BARAGALU TIAS JAYA', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kekatang Dan Desa Sukarame Kab. Pesawaran Provinsi Lampung [No. SP: B.21810/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 8, "nama_penyedia": "PT. BARAGALU TIAS JAYA", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Kekatang Dan Desa Sukarame Kab. Pesawaran Provinsi Lampung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21810/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 7402000000.0, "alamat": "Jl. Sukarno Hatta No. 1 LK.III RT.007\nKel.Sukarame, Kec. Suakrame Kota Bandar\nLampung", "npwp": "03.216.770.3-323.000", "nama_direktur": "ARMAN PENDRIK. SE", "jabatan_direktur": "Direktur Utama", "telp": "0812 7331 3171", "email": "pt.baragalutias@yahoo.com", "nama_bank": "Bank Lampung", "norek": "3970002010833 A.n BARAGALU TIAS JAYA", "cabang_bank": "Cabang Antaasari", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22312/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Kekatang, Kec. Marga Punduh, Kab Pesawaran, Prov. Lampung\n2. Desa Sukarame, Kec. Punduh Pidada, Kab. Pesawaran, Prov. Lampung", "jumlah_desa": 2, "wakil_ppk": "M. Yusuf Santoso\n1. Desa Kekatang, Kec. Marga Punduh, Kab Pesawaran, Prov. Lampung\n2. Desa Sukarame, Kec. Punduh Pidada, Kab. Pesawaran, Prov. Lampung"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7402000000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. BARAGALU TIAS JAYA', 'Realisasi Konstruksi', 'Termin 1', 1850500000.00, 25.00, '3970002010833 A.n BARAGALU TIAS JAYA (Bank Lampung Cabang Antaasari)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. BARAGALU TIAS JAYA', 'Realisasi Konstruksi', 'Termin 2', 1850500000.00, 50.00, '3970002010833 A.n BARAGALU TIAS JAYA (Bank Lampung Cabang Antaasari)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. BARAGALU TIAS JAYA', 'Realisasi Konstruksi', 'Termin 3', 1850500000.00, 75.00, '3970002010833 A.n BARAGALU TIAS JAYA (Bank Lampung Cabang Antaasari)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. BARAGALU TIAS JAYA', 'Realisasi Konstruksi', 'Termin 4', 1480400000.00, 100.00, '3970002010833 A.n BARAGALU TIAS JAYA (Bank Lampung Cabang Antaasari)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. BARAGALU TIAS JAYA', 'Jaminan Pemeliharaan', 'Retensi', 370100000.00, 100.00, '3970002010833 A.n BARAGALU TIAS JAYA (Bank Lampung Cabang Antaasari)', NOW(), NOW());
    END IF;
    

    -- Contract #9: CV. Sonta Abadi
    v_knmp_id := NULL;
    IF 'Deluk' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Deluk%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Sonta Abadi', '2026-08-06', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Deluk dan Desa Kuala Alam Kabupaten Bengkalis Provinsi Riau [No. SP: B.21957/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 9, "nama_penyedia": "CV. Sonta Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Deluk dan Desa Kuala Alam Kabupaten Bengkalis Provinsi Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21957/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-06", "nilai_kontrak": 7382433410.36, "alamat": "Jalan Merdeka Barat, Kab. Sekadau, Kalimantan Barat", "npwp": "9.22062203705E14", "nama_direktur": "Hengki Purwanto", "jabatan_direktur": "Direktur", "telp": "082189262966", "email": "hengkyvj@gmail.com", "nama_bank": "Bank BRI", "norek": "035601002351309 A.n CV. Sonta Abadi", "cabang_bank": "KC Jakarta Kemayoran", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22728/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Deluk, Kec. Bantan, Kab. Bengkalis, Prov. Riau\n2. Desa Kuala Alam, Kec. Bengkalis, Kab. Bengkalis, Prov. Riau", "jumlah_desa": 2, "wakil_ppk": "Rianto Yuswara"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7382433410.36 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 1', 1845608352.59, 25.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 2', 1845608352.59, 50.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 3', 1845608352.59, 75.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 4', 1476486682.07, 100.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Sonta Abadi', 'Jaminan Pemeliharaan', 'Retensi', 369121670.52, 100.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());
    END IF;
    

    -- Contract #10: CV. Hanovan Natama
    v_knmp_id := NULL;
    IF 'Tanjung Pasir' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tanjung Pasir%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Hanovan Natama', '2026-08-07', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Pasir, Desa Belaras dan Desa Tanah Merah Provinsi Riau [No. SP: B.22022/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 10, "nama_penyedia": "CV. Hanovan Natama", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Pasir, Desa Belaras dan Desa Tanah Merah Provinsi Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22022/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-07", "nilai_kontrak": 12582211000.0, "alamat": "Dusun V Sumbul Lestari (Perumahan Griya Sumut Paten Blok E16), Kab. Deli Serdang, Sumatera Utara", "npwp": "02.178.456.6-125.000", "nama_direktur": "Muhammad Shaleh Bisri Siregar", "jabatan_direktur": "Direktur", "telp": "082369821927", "email": "mariyamharahapharahap@yahoo.co.id", "nama_bank": "Bank SUMUT", "norek": "38001040000416  A.n CV HANOVAN NATAMA", "cabang_bank": "Cabang Pekanbaru", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22302/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Tanjung Pasir, Kabupaten Indragiri, Provinsi Riau\n2. Desa Balaras, Kabupaten Indragiri, Provinsi Riau\n3. Desa Tanah Merah, Kabupaten Meranti, Provinsi Riau", "jumlah_desa": 3, "wakil_ppk": "Safwan (PPN Sungailiat)\n1. Desa Tanjung Pasir, Kabupaten Indragiri, Provinsi Riau\n2. Desa Balaras, Kabupaten Indragiri, Provinsi Riau\n\nReydho MS Zahrial (PPN Sungailiat)\n3. Desa Tanah Merah, Kabupaten Meranti, Provinsi Riau"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 12582211000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Hanovan Natama', 'Realisasi Konstruksi', 'Termin 1', 3145552750.00, 25.00, '38001040000416  A.n CV HANOVAN NATAMA (Bank SUMUT Cabang Pekanbaru)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Hanovan Natama', 'Realisasi Konstruksi', 'Termin 2', 3145552750.00, 50.00, '38001040000416  A.n CV HANOVAN NATAMA (Bank SUMUT Cabang Pekanbaru)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Hanovan Natama', 'Realisasi Konstruksi', 'Termin 3', 3145552750.00, 75.00, '38001040000416  A.n CV HANOVAN NATAMA (Bank SUMUT Cabang Pekanbaru)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Hanovan Natama', 'Realisasi Konstruksi', 'Termin 4', 2516442200.00, 100.00, '38001040000416  A.n CV HANOVAN NATAMA (Bank SUMUT Cabang Pekanbaru)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Hanovan Natama', 'Jaminan Pemeliharaan', 'Retensi', 629110550.00, 100.00, '38001040000416  A.n CV HANOVAN NATAMA (Bank SUMUT Cabang Pekanbaru)', NOW(), NOW());
    END IF;
    

    -- Contract #11: CV. Putra Raja Parna
    v_knmp_id := NULL;
    IF 'Muara Maras' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Muara Maras%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Putra Raja Parna', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Muara Maras Kabupaten Seluma Provinsi Bengkulu [No. SP: B.21816/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 11, "nama_penyedia": "CV. Putra Raja Parna", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Muara Maras Kabupaten Seluma Provinsi Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21816/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 5840930000.0, "alamat": "Jalan Adam Malik Raya Nomor 016 KM 8, Rukun Tetangga 009, Rukun Warga 003, Kel. Jalan Gedang, Kec. Gading Cempaka, Kota Bengkulu, Prov. Bengkulu", "npwp": "62.527.495.6-311.000", "nama_direktur": "Syaputra Manihuruk", "jabatan_direktur": "Direktur", "telp": "082266333122", "email": "crajaparna@gmail.com", "nama_bank": "BSI", "norek": "7232352811 A.n CV PUTRA RAJA PARNA", "cabang_bank": "-", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22313/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Muara Maras, Kec. Semidang Alas Maras, Kab. Seluma, Prov. Bengkulu", "jumlah_desa": 1, "wakil_ppk": "Cecep Ahmad Rohimat\n\n1 . Desa Muara Maras, Kec. Semidang Alas Maras, Kab. Seluma, Prov. Bengkulu"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 5840930000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Putra Raja Parna', 'Realisasi Konstruksi', 'Termin 1', 1460232500.00, 25.00, '7232352811 A.n CV PUTRA RAJA PARNA (BSI -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Putra Raja Parna', 'Realisasi Konstruksi', 'Termin 2', 1460232500.00, 50.00, '7232352811 A.n CV PUTRA RAJA PARNA (BSI -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Putra Raja Parna', 'Realisasi Konstruksi', 'Termin 3', 1460232500.00, 75.00, '7232352811 A.n CV PUTRA RAJA PARNA (BSI -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Putra Raja Parna', 'Realisasi Konstruksi', 'Termin 4', 1168186000.00, 100.00, '7232352811 A.n CV PUTRA RAJA PARNA (BSI -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Putra Raja Parna', 'Jaminan Pemeliharaan', 'Retensi', 292046500.00, 100.00, '7232352811 A.n CV PUTRA RAJA PARNA (BSI -)', NOW(), NOW());
    END IF;
    

    -- Contract #12: PT. Aruna Karya Bangunindo
    v_knmp_id := NULL;
    IF 'Pasar Ipuh' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pasar Ipuh%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Aruna Karya Bangunindo', '2026-08-11', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Ipuh, Desa Pasar Pino, dan Desa Pasar Palik Provinsi Bengkulu [No. SP: B.22404/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 12, "nama_penyedia": "PT. Aruna Karya Bangunindo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Ipuh, Desa Pasar Pino, dan Desa Pasar Palik Provinsi Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22404/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-11", "nilai_kontrak": 11561022000.0, "alamat": "Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu", "npwp": "1000 0000 0959 6563", "nama_direktur": "Angga Dewa", "jabatan_direktur": "Direktur", "telp": "082183648885", "email": "ptarunakaryabangunindo@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015246893 A.n PT. Aruna Karya Bangunindo", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22729/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Pasar Ipuh, Kec. Ipuh, Kab. Mukomuko, Prov. Bengkulu\n2. Desa Pasar Pino, Kec. Pino Raya, Kab. Bengkulu Selatan, Prov. Bengkulu\n3. Desa Pasar Palik. Kec. Air Napal, Kab. Bengkulu Utara, Prov. Bengkulu", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11561022000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 1', 2890255500.00, 25.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 2', 2890255500.00, 50.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 3', 2890255500.00, 75.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 4', 2312204400.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Aruna Karya Bangunindo', 'Jaminan Pemeliharaan', 'Retensi', 578051100.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #13: CV. Ridho Pratama
    v_knmp_id := NULL;
    IF 'Nenas Siam' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Nenas Siam%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Ridho Pratama', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Nenas Siam dan Desa Siofa Banua Provinsi Sumatera Utara [No. SP: B.21891/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 13, "nama_penyedia": "CV. Ridho Pratama", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Nenas Siam dan Desa Siofa Banua Provinsi Sumatera Utara", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21891/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 13080192000.0, "alamat": "Jalan Sumber Rukun nomor 294, Kota Medan, Sumatera Utara", "npwp": "0312157217112000", "nama_direktur": "Suyoto", "jabatan_direktur": "Direktur", "telp": "081261605171", "email": "cvridhopratama@ymail.com", "nama_bank": "Bank SUMUT", "norek": "11001040006386 A.n CV. Ridho Pratama", "cabang_bank": "KC Kampung Lalang", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23202/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-19", "tgl_selesai": "2026-12-16", "ruang_lingkup": "1. Desa Nenas Siam, Kec. Medang Deras, Kab. Batu Bara, Prov. Sumatera Utara\n2. Desa Siofa Banua, Kec. Tuhemberua, Kab. Nias Utara. Prov. Sumatera Utara", "jumlah_desa": 2, "wakil_ppk": "Renny Novianty Sinaga"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 13080192000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Ridho Pratama', 'Realisasi Konstruksi', 'Termin 1', 3270048000.00, 25.00, '11001040006386 A.n CV. Ridho Pratama (Bank SUMUT KC Kampung Lalang)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Ridho Pratama', 'Realisasi Konstruksi', 'Termin 2', 3270048000.00, 50.00, '11001040006386 A.n CV. Ridho Pratama (Bank SUMUT KC Kampung Lalang)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Ridho Pratama', 'Realisasi Konstruksi', 'Termin 3', 3270048000.00, 75.00, '11001040006386 A.n CV. Ridho Pratama (Bank SUMUT KC Kampung Lalang)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Ridho Pratama', 'Realisasi Konstruksi', 'Termin 4', 2616038400.00, 100.00, '11001040006386 A.n CV. Ridho Pratama (Bank SUMUT KC Kampung Lalang)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Ridho Pratama', 'Jaminan Pemeliharaan', 'Retensi', 654009600.00, 100.00, '11001040006386 A.n CV. Ridho Pratama (Bank SUMUT KC Kampung Lalang)', NOW(), NOW());
    END IF;
    

    -- Contract #14: PT. Putra Global Enterprice
    v_knmp_id := NULL;
    IF 'Matobe' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Matobe%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Putra Global Enterprice', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Matobe, Desa Sikakap dan Desa Sigapokna, Kab. Kep. Mentawai Provinsi Sumatera Barat [No. SP: B.21892/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 14, "nama_penyedia": "PT. Putra Global Enterprice", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Matobe, Desa Sikakap dan Desa Sigapokna, Kab. Kep. Mentawai Provinsi Sumatera Barat", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21892/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 10851860547.0, "alamat": "PAKUWON TOWER LT. 10 UNIT E, JL. CASABLANCA RAYA KAV. 88, Kota Adm. Jakarta Selatan, DKI Jakarta", "npwp": "02002278703014000", "nama_direktur": "Akhmad", "jabatan_direktur": "Direktur", "telp": "081291325884", "email": "putraglobalenterprice@gmail.com", "nama_bank": "Bank BRI", "norek": "043401001259304 A.n PT. Putra Global Enterprice", "cabang_bank": "KC Jakarta Cempaka Mas", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22731/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Matobe, Kab. Kepulauan Mentawai, Prov. Sumatera Barat\n2. Desa Sikakap, Kab. Kepulauan Mentawai, Prov. Sumatera Barat\n3. Desa Sigapokna, Kab. Kepulauan Mentawai, Prov. Sumatera Barat", "jumlah_desa": 3, "wakil_ppk": "Parnandes"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 10851860547.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Putra Global Enterprice', 'Realisasi Konstruksi', 'Termin 1', 2712965136.75, 25.00, '043401001259304 A.n PT. Putra Global Enterprice (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Putra Global Enterprice', 'Realisasi Konstruksi', 'Termin 2', 2712965136.75, 50.00, '043401001259304 A.n PT. Putra Global Enterprice (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Putra Global Enterprice', 'Realisasi Konstruksi', 'Termin 3', 2712965136.75, 75.00, '043401001259304 A.n PT. Putra Global Enterprice (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Putra Global Enterprice', 'Realisasi Konstruksi', 'Termin 4', 2170372109.40, 100.00, '043401001259304 A.n PT. Putra Global Enterprice (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Putra Global Enterprice', 'Jaminan Pemeliharaan', 'Retensi', 542593027.35, 100.00, '043401001259304 A.n PT. Putra Global Enterprice (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());
    END IF;
    

    -- Contract #15: PT. Bukit Zaitun
    v_knmp_id := NULL;
    IF 'Pasar Sorkam' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pasar Sorkam%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Bukit Zaitun', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kab. Tapanuli Tengah dan Nias Selatan Provinsi Sumatera Utara [No. SP: B.21893/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 15, "nama_penyedia": "PT. Bukit Zaitun", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kab. Tapanuli Tengah dan Nias Selatan Provinsi Sumatera Utara", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21893/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 22940215000.0, "alamat": "Jl. Ngumban Surbakti No.66 Kel. Sempakata, Kota Medan, Sumatera Utara", "npwp": "03.319.675-9-121.000", "nama_direktur": "Enda Mora Siregar", "jabatan_direktur": "Direktur", "telp": "082267333341", "email": "zaitunbukit@gmail.com", "nama_bank": "Bank SUMUT", "norek": "10201040002403 A.n PT. Bukit Zaitun", "cabang_bank": "Capem Kampung Baru", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22732/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Pasar Sorkam, Kec. Sorkam Barat, Kab. Tapanuli Tengah, Prov. Sumatera Utara \n2. Desa Bale-bale Sibohou, Kec. Pulau-pulau Batu Utara, Kab. Nias Selatan, Prov. Sumatera Utara \n3. Desa Labuhan Bazau, Kec. Pulau-pulau Batu Timur, Kab. Nias Selatan, Prov. Sumatera Utara", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 22940215000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Bukit Zaitun', 'Realisasi Konstruksi', 'Termin 1', 5735053750.00, 25.00, '10201040002403 A.n PT. Bukit Zaitun (Bank SUMUT Capem Kampung Baru)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Bukit Zaitun', 'Realisasi Konstruksi', 'Termin 2', 5735053750.00, 50.00, '10201040002403 A.n PT. Bukit Zaitun (Bank SUMUT Capem Kampung Baru)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Bukit Zaitun', 'Realisasi Konstruksi', 'Termin 3', 5735053750.00, 75.00, '10201040002403 A.n PT. Bukit Zaitun (Bank SUMUT Capem Kampung Baru)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Bukit Zaitun', 'Realisasi Konstruksi', 'Termin 4', 4588043000.00, 100.00, '10201040002403 A.n PT. Bukit Zaitun (Bank SUMUT Capem Kampung Baru)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Bukit Zaitun', 'Jaminan Pemeliharaan', 'Retensi', 1147010750.00, 100.00, '10201040002403 A.n PT. Bukit Zaitun (Bank SUMUT Capem Kampung Baru)', NOW(), NOW());
    END IF;
    

    -- Contract #16: PT. Aruna Karya Bangunindo
    v_knmp_id := NULL;
    IF 'Pekik Nyaring' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pekik Nyaring%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Aruna Karya Bangunindo', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pekik Nyaring, Desa Serangai dan Desa Pasar Sebelat Provinsi Bengkulu [No. SP: B.21894/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 16, "nama_penyedia": "PT. Aruna Karya Bangunindo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pekik Nyaring, Desa Serangai dan Desa Pasar Sebelat Provinsi Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21894/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 14419172000.0, "alamat": "Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu", "npwp": "1000 0000 0959 6563", "nama_direktur": "Angga Dewa", "jabatan_direktur": "Direktur", "telp": "082183648885", "email": "ptarunakaryabangunindo@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015246893 A.n PT. Aruna Karya Bangunindo", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22733/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Pekik Nyaring, Kec. Pondok Kelapa, Kab. Bengkulu Tengah, Prov. Bengkulu\n2. Desa Serangai, Kec. Batik Nau, Kab. Bengkulu Utara, Prov. Bengkulu\n3. Desa Pasar Sebelat, Kec. Putri Hijau, Kab. Bengkulu Utara, Prov. Bengkulu", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 14419172000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 1', 3604793000.00, 25.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 2', 3604793000.00, 50.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 3', 3604793000.00, 75.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 4', 2883834400.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Aruna Karya Bangunindo', 'Jaminan Pemeliharaan', 'Retensi', 720958600.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #17: CV. Mahanaim
    v_knmp_id := NULL;
    IF 'Ketapang Baru' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Ketapang Baru%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Mahanaim', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ketapang Baru dan Desa Kungkai Baru, Kab. Seluma, Provinsi Bengkulu [No. SP: B.21817/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 17, "nama_penyedia": "CV. Mahanaim", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ketapang Baru dan Desa Kungkai Baru, Kab. Seluma, Provinsi Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21817/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 12000246000.0, "alamat": "Desa/Kelurahan Dermayu, Kecamatan Air Periukan, Kabupaten Seluma Provinsi Bengkulu", "npwp": "70.568. 943.8-311.000", "nama_direktur": "ARY YANANDA MULYANI", "jabatan_direktur": "Wakil Direktur", "telp": "082266333122", "email": "cv.mahanaim79@gmail.com", "nama_bank": "BSI", "norek": "1049882986 A.n CV MAHANAIM", "cabang_bank": "KC BENGKULU A MALIK", "jangka_waktu": "135 Hari", "nomor_spmk": "B.22314/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-10", "tgl_selesai": "2026-12-22", "ruang_lingkup": "1. Desa Ketapang Baru, Kec. Semidang Alas Maras, Provinsi Bengkulu\n2. Desa Kungkai Baru, Kec. Air Periukan, Kab. Seluma, Provinsi Bengkulu", "jumlah_desa": 2, "wakil_ppk": "Cecep Ahmad Rohimat"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 12000246000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 1', 3000061500.00, 25.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 2', 3000061500.00, 50.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 3', 3000061500.00, 75.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 4', 2400049200.00, 100.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Mahanaim', 'Jaminan Pemeliharaan', 'Retensi', 600012300.00, 100.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());
    END IF;
    

    -- Contract #18: CV. Sonta Abadi
    v_knmp_id := NULL;
    IF 'Meskom' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Meskom%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Sonta Abadi', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Meskom dan Desa Muntai Kabupaten Bengkalis Provinsi Riau [No. SP: B.21895/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 18, "nama_penyedia": "CV. Sonta Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Meskom dan Desa Muntai Kabupaten Bengkalis Provinsi Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21895/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 8551698000.0, "alamat": "Jalan Merdeka Barat, Kab. Sekadau, Kalimantan Barat", "npwp": "92.206.220.3-705.000", "nama_direktur": "Hengki Purwanto", "jabatan_direktur": "Direktur", "telp": "082189262966", "email": "hengkyvj@gmail.com", "nama_bank": "Bank BRI", "norek": "035601002351309 A.n CV. Sonta Abadi", "cabang_bank": "KC Jakarta Kemayoran", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22734/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Meskom, Kec. Bengkalis, Kab. Bengkalis, Prov. Riau\n2. Desa Muntai, Kec. Bantan, Kab. Bengkalis, Prov. Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 8551698000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 1', 2137924500.00, 25.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 2', 2137924500.00, 50.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 3', 2137924500.00, 75.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Sonta Abadi', 'Realisasi Konstruksi', 'Termin 4', 1710339600.00, 100.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Sonta Abadi', 'Jaminan Pemeliharaan', 'Retensi', 427584900.00, 100.00, '035601002351309 A.n CV. Sonta Abadi (Bank BRI KC Jakarta Kemayoran)', NOW(), NOW());
    END IF;
    

    -- Contract #19: PT. Innevo Karya Andesindo
    v_knmp_id := NULL;
    IF 'Kota Jawa' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kota Jawa%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Innevo Karya Andesindo', '2026-08-11', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Kota Jawa dan Desa Pasar Kota Krui Kabupaten Pesisir Barat Provinsi Lampung [No. SP: B.22403/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 19, "nama_penyedia": "PT. Innevo Karya Andesindo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Kota Jawa dan Desa Pasar Kota Krui Kabupaten Pesisir Barat Provinsi Lampung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22403/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-11", "nilai_kontrak": 8169000000.0, "alamat": "Jalan Nangka Lintas Nomor 17, Kota Lubuk Linggau, Sumatera Selatan", "npwp": "8.11065903303E14", "nama_direktur": "Febri Aditya Nata", "jabatan_direktur": "Wakil Direktur", "telp": "082281315200", "email": "pt.innevo.ka@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015246588 A.n PT. INNEVO KARYA ANDESINDO", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22735/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Kota Jawa, Kec. Bangkunat, Kab. Pesisir Barat, Prov. Lampung\n2. Desa Pasar Kota Krui, Kec. Pesisir Tengah, Kab. Pesisir Barat, Prov. Lampung", "jumlah_desa": 2, "wakil_ppk": "Ray Hardiansyah (PPS Nizam Zahman)"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 8169000000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Innevo Karya Andesindo', 'Realisasi Konstruksi', 'Termin 1', 2042250000.00, 25.00, '1010015246588 A.n PT. INNEVO KARYA ANDESINDO (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Innevo Karya Andesindo', 'Realisasi Konstruksi', 'Termin 2', 2042250000.00, 50.00, '1010015246588 A.n PT. INNEVO KARYA ANDESINDO (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Innevo Karya Andesindo', 'Realisasi Konstruksi', 'Termin 3', 2042250000.00, 75.00, '1010015246588 A.n PT. INNEVO KARYA ANDESINDO (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Innevo Karya Andesindo', 'Realisasi Konstruksi', 'Termin 4', 1633800000.00, 100.00, '1010015246588 A.n PT. INNEVO KARYA ANDESINDO (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Innevo Karya Andesindo', 'Jaminan Pemeliharaan', 'Retensi', 408450000.00, 100.00, '1010015246588 A.n PT. INNEVO KARYA ANDESINDO (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #20: PT. Fasasi Karya Mandiri
    v_knmp_id := NULL;
    IF 'Purus' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Purus%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Fasasi Karya Mandiri', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Purus, Desa Manggopoh Palak Gadang Ulakan, dan Desa Gasan Gadang Provinsi Sumatera Barat [No. SP: B.21897/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 20, "nama_penyedia": "PT. Fasasi Karya Mandiri", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Purus, Desa Manggopoh Palak Gadang Ulakan, dan Desa Gasan Gadang Provinsi Sumatera Barat", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21897/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 11321158000.0, "alamat": "JL. OTISTA 1 NOMOR 4B, LANTAI 2, Kota Adm. Jakarta Timur, DKI Jakarta", "npwp": "0848966024403000", "nama_direktur": "Sami", "jabatan_direktur": "Direktur", "telp": "082368344597", "email": "fasasi.km2023@gmail.com", "nama_bank": "Bank BRI", "norek": "043401001260305 A.n PT. Fasasi Karya Mandiri", "cabang_bank": "KC Jakarta Cempaka Mas", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22736/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Purus, Kota Padang, Prov. Sumatera Barat\n2. Desa Manggopoh Palak Gadang Ulakan, Kab. Padang Pariaman, Prov. Sumatera Barat\n3. Desa Gasan Gadang, Kab. Padang Pariaman, Prov. Sumatera Barat", "jumlah_desa": 3, "wakil_ppk": "Melly Masrul :\n1. Desa Purus\n\nAbdul Razak :\n1. Desa Manggopoh Palak Gadang Ulakan\n2. Desa Gasan Gadang"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11321158000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Fasasi Karya Mandiri', 'Realisasi Konstruksi', 'Termin 1', 2830289500.00, 25.00, '043401001260305 A.n PT. Fasasi Karya Mandiri (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Fasasi Karya Mandiri', 'Realisasi Konstruksi', 'Termin 2', 2830289500.00, 50.00, '043401001260305 A.n PT. Fasasi Karya Mandiri (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Fasasi Karya Mandiri', 'Realisasi Konstruksi', 'Termin 3', 2830289500.00, 75.00, '043401001260305 A.n PT. Fasasi Karya Mandiri (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Fasasi Karya Mandiri', 'Realisasi Konstruksi', 'Termin 4', 2264231600.00, 100.00, '043401001260305 A.n PT. Fasasi Karya Mandiri (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Fasasi Karya Mandiri', 'Jaminan Pemeliharaan', 'Retensi', 566057900.00, 100.00, '043401001260305 A.n PT. Fasasi Karya Mandiri (Bank BRI KC Jakarta Cempaka Mas)', NOW(), NOW());
    END IF;
    

    -- Contract #21: PT. Duta Bangun Husaeni
    v_knmp_id := NULL;
    IF 'Selading' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Selading%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Duta Bangun Husaeni', '2026-08-05', 'kontrak', 'Paket Pekerjaan Konstruksi, Pembangunan Kampung Nelayan Merah Putih Di Desa Selading, Provinsi Kepulauan Riau [No. SP: B.21898/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 21, "nama_penyedia": "PT. Duta Bangun Husaeni", "nama_paket": "Paket Pekerjaan Konstruksi, Pembangunan Kampung Nelayan Merah Putih Di Desa Selading, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.21898/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-05", "nilai_kontrak": 4150000000.0, "alamat": "Bukit Cimanggu City Blok L 1 nomor 12, Kota Bogor, Jawa Barat", "npwp": "0944 7414 0440 4000", "nama_direktur": "Ibnu Bunyan Al Azizi", "jabatan_direktur": "Direktur", "telp": "082115115424", "email": "ptdutabangunhusaeni@gmail.com", "nama_bank": "Bank BJB", "norek": "0162479563001 A.n PT. Duta Bangun Husaeni", "cabang_bank": "KC Cibinong", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22737/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Selading, Kec. Pulau Tiga Barat, Kab. Natuna, Prov. Kep. Riau", "jumlah_desa": 1, "wakil_ppk": "Dwi Ari Priyanto"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 4150000000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 1', 1037500000.00, 25.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 2', 1037500000.00, 50.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 3', 1037500000.00, 75.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 4', 830000000.00, 100.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Duta Bangun Husaeni', 'Jaminan Pemeliharaan', 'Retensi', 207500000.00, 100.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());
    END IF;
    

    -- Contract #22: PT. Aruna Karya Bangunindo
    v_knmp_id := NULL;
    IF 'Pasar Bawah' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pasar Bawah%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Aruna Karya Bangunindo', '2026-08-11', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Bawah, Kab. Bengkulu Selatan Prov. Bengkulu [No. SP: B.22405/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 22, "nama_penyedia": "PT. Aruna Karya Bangunindo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pasar Bawah, Kab. Bengkulu Selatan Prov. Bengkulu", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22405/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-11", "nilai_kontrak": 4240404000.0, "alamat": "Jl. letkol Sentosa 83, Komp.Oase No.08,Kota Bengkulu, Bengkulu", "npwp": "1000 0000 0959 6563", "nama_direktur": "Angga Dewa", "jabatan_direktur": "Direktur", "telp": "082183648885", "email": "ptarunakaryabangunindo@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015246893 A.n PT. Aruna Karya Bangunindo", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22738/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Pasar Bawah, Kec. Pasar Manna, Kab. Bengkulu Selatan Prov. Bengkulu", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 4240404000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 1', 1060101000.00, 25.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 2', 1060101000.00, 50.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 3', 1060101000.00, 75.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Aruna Karya Bangunindo', 'Realisasi Konstruksi', 'Termin 4', 848080800.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Aruna Karya Bangunindo', 'Jaminan Pemeliharaan', 'Retensi', 212020200.00, 100.00, '1010015246893 A.n PT. Aruna Karya Bangunindo (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #23: PT. Swarnabumi Ilman Persada
    v_knmp_id := NULL;
    IF 'Ampang Pulai' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Ampang Pulai%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Swarnabumi Ilman Persada', '2026-08-07', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ampang Pulai dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan, Provinsi Sumatera Barat [No. SP: B.22004/DJPT.6/PI.420/PPK/VIII/2026]', 'GAGAL', '{"no": 23, "nama_penyedia": "PT. Swarnabumi Ilman Persada", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Ampang Pulai dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan, Provinsi Sumatera Barat", "status_admin": "GAGAL", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22004/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-07", "nilai_kontrak": 7082726000.0, "alamat": "", "npwp": "", "nama_direktur": "", "jabatan_direktur": "Direktur", "telp": "", "email": "", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "1900-04-28", "ruang_lingkup": "1. Desa Ampang Pulai, Kab. Pesisir Selatan, Provinsi Sumatera Barat\n2. Desa Koto Nan Duo IV Koto Hilie, Kab. Pesisir Selatan, Provinsi Sumatera Barat", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7082726000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Swarnabumi Ilman Persada', 'Realisasi Konstruksi', 'Termin 1', 1770681500.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Swarnabumi Ilman Persada', 'Realisasi Konstruksi', 'Termin 2', 1770681500.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Swarnabumi Ilman Persada', 'Realisasi Konstruksi', 'Termin 3', 1770681500.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Swarnabumi Ilman Persada', 'Realisasi Konstruksi', 'Termin 4', 1416545200.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Swarnabumi Ilman Persada', 'Jaminan Pemeliharaan', 'Retensi', 354136300.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #24: PT. Bengkel Kreatif Utama
    v_knmp_id := NULL;
    IF 'Mekar Jaya' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Mekar Jaya%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Bengkel Kreatif Utama', '2026-08-11', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna dan Lingga Provinsi Kepulauan Riau [No. SP: B.22474/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 24, "nama_penyedia": "PT. Bengkel Kreatif Utama", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna dan Lingga Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22474/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-11", "nilai_kontrak": 34941597000.0, "alamat": "Cipta Villa Mas Residence Blok B No. 2, Kota Tanjung Pinang, Kepulauan Riau", "npwp": "0967 4539 8621 4000", "nama_direktur": "Wan Ricco Saputra", "jabatan_direktur": "Direktur Cabang", "telp": "081270099954", "email": "bengkelcreative.tpi@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1090085112233 A.n PT. Bengkel Kreatif Utama", "cabang_bank": "KCP Natuna", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22739/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Mekar Jaya, Kec. Bunguran Barat, Kab. Natuna, Prov. Kep. Riau\n2. Desa Sedanau, Kec. Bunguran Barat, Kab. Natuna, Prov. Kep. Riau\n3. Desa Tanjung Pala, Kec. Pulau Laut, Kab. Natuna, Prov. Kep. Riau \n4. Desa Sabang Mawang, Kec. Pulau Tiga, Kab. Natuna, Prov. Kep. Riau \n5. Desa Sededap, Kec. Pulau Tiga, Kab. Natuna, Prov. Kep. Riau\n6. Desa Pulau Bukit, Kab. Lingga, Prov. Kep. Riau\n7. Desa Cempa, Kab. Lingga, Prov. Kep. Riau\n8. Desa Pulau Duyung, Kab. Lingga, Prov. Kep. Riau", "jumlah_desa": 8, "wakil_ppk": "Solihin :\n1. Kab. Natuna\n\nDarya\n1. Kab. Lingga"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 34941597000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Bengkel Kreatif Utama', 'Realisasi Konstruksi', 'Termin 1', 8735399250.00, 25.00, '1090085112233 A.n PT. Bengkel Kreatif Utama (Bank Mandiri KCP Natuna)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Bengkel Kreatif Utama', 'Realisasi Konstruksi', 'Termin 2', 8735399250.00, 50.00, '1090085112233 A.n PT. Bengkel Kreatif Utama (Bank Mandiri KCP Natuna)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Bengkel Kreatif Utama', 'Realisasi Konstruksi', 'Termin 3', 8735399250.00, 75.00, '1090085112233 A.n PT. Bengkel Kreatif Utama (Bank Mandiri KCP Natuna)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Bengkel Kreatif Utama', 'Realisasi Konstruksi', 'Termin 4', 6988319400.00, 100.00, '1090085112233 A.n PT. Bengkel Kreatif Utama (Bank Mandiri KCP Natuna)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Bengkel Kreatif Utama', 'Jaminan Pemeliharaan', 'Retensi', 1747079850.00, 100.00, '1090085112233 A.n PT. Bengkel Kreatif Utama (Bank Mandiri KCP Natuna)', NOW(), NOW());
    END IF;
    

    -- Contract #25: PT. Laksana Aneka Sarana
    v_knmp_id := NULL;
    IF 'Rambat' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Rambat%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Laksana Aneka Sarana', '2026-08-10', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sadai, Kabupaten Bangka Selatan dan di Desa Rambat dan Desa Tanjung Niur, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026 [No. SP: B.22375/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 25, "nama_penyedia": "PT. Laksana Aneka Sarana", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sadai, Kabupaten Bangka Selatan dan di Desa Rambat dan Desa Tanjung Niur, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22375/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-10", "nilai_kontrak": 11146583000.0, "alamat": "Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat", "npwp": "01.707.370.1-404.000", "nama_direktur": "Siddiq", "jabatan_direktur": "Direktur", "telp": "08129674773", "email": "laksanaanekasarana@gmail.com", "nama_bank": "Bank DKI Syariah", "norek": "71216000062 A.n PT. LAKSANA ANEKA SARANA", "cabang_bank": "KCP Syariah Manggarai", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22740/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Rambat, Kec. Simpang Teritip Kab. Bangka Barat, Prov. Kep. Bangka Belitung\n2. Desa Tanjung Niur, Kec. Tempilang, Kab. Bangka Barat, Prov. Kep. Bangka Belitung\n3. Desa Sadai, Kec. Tukak Sadai, Kab. Bangka Selatan, Prov. Kep. Bangka Belitung", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11146583000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 1', 2786645750.00, 25.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 2', 2786645750.00, 50.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 3', 2786645750.00, 75.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 4', 2229316600.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Laksana Aneka Sarana', 'Jaminan Pemeliharaan', 'Retensi', 557329150.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());
    END IF;
    

    -- Contract #26: PT. Ratu Nayla Mandiri
    v_knmp_id := NULL;
    IF 'Banding' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Banding%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Ratu Nayla Mandiri', '2026-08-10', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Banding, Desa Labuhan Ratu, dan Desa Muara Gading Mas Provinsi Lampung [No. SP: B.22376/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 26, "nama_penyedia": "PT. Ratu Nayla Mandiri", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Banding, Desa Labuhan Ratu, dan Desa Muara Gading Mas Provinsi Lampung", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22376/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-10", "nilai_kontrak": 11394207000.0, "alamat": "Jl. Dr. Wahidin Sudirohusodo, RT. 004 RW. 004, Desa Dahanrejo, Kecamatan Kebomas, Kabupaten Gresik", "npwp": "20.774.048.1-642.000", "nama_direktur": "Dyan Agung Wicaksono", "jabatan_direktur": "Direktur", "telp": "085234904938", "email": "pt.ratunaylamandiri313@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "B.24100/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-28", "tgl_selesai": "2026-12-25", "ruang_lingkup": "1. Desa Banding, Kec. Raja Basa, Kab. Lampung Selatan, Prov. Lampung\n2. Desa Labuhan Ratu, Kec. Pasar Sakti, Kab. Lampung Timur, Prov. Lampung\n3. Desa Muara Gading Mas, Kec. Labuhan Maringgai, Kab. Lampung Timur, Prov. Lampung", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11394207000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Ratu Nayla Mandiri', 'Realisasi Konstruksi', 'Termin 1', 2848551750.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Ratu Nayla Mandiri', 'Realisasi Konstruksi', 'Termin 2', 2848551750.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Ratu Nayla Mandiri', 'Realisasi Konstruksi', 'Termin 3', 2848551750.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Ratu Nayla Mandiri', 'Realisasi Konstruksi', 'Termin 4', 2278841400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Ratu Nayla Mandiri', 'Jaminan Pemeliharaan', 'Retensi', 569710350.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #27: CV. Diego Contractor
    v_knmp_id := NULL;
    IF 'Seulayat Ulakan' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Seulayat Ulakan%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Diego Contractor', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Padang Pariaman dan Pasaman Barat, Prov. Sumatera Barat [No. SP: B.22790/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 27, "nama_penyedia": "CV. Diego Contractor", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Padang Pariaman dan Pasaman Barat, Prov. Sumatera Barat", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22790/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 14138552000.0, "alamat": "Arosuka Jalan Lingkar Pintu Angin, Desa/Kelurahan Batang Barus, Kec. Talang, Kab. Solok, Provinsi Sumatera Barat", "npwp": "0965 1977 1820 1000", "nama_direktur": "Digo Perdana Putra", "jabatan_direktur": "Direktur", "telp": "081332141123", "email": "cvdiegocontractor@gmail.com", "nama_bank": "Bank BJB", "norek": "0162986521001 A.n CV DIEGO CONTRACTOR", "cabang_bank": "Cabang S Parman", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23905/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Seulayat Ulakan, Kecamatan Ulakan Tapakih, Kabupaten Padang Pariaman, Provinsi Sumatera Barat\n2. Desa Katiagan, Kecamatan Kinali, Kabupaten Pasaman Barat, Provinsi Sumatera Barat\n3. Desa Maligi, Kecamatan Sasak Ranah Pasisie, Kabupaten Pasaman Barat, Provinsi Sumatera Barat", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 14138552000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Diego Contractor', 'Realisasi Konstruksi', 'Termin 1', 3534638000.00, 25.00, '0162986521001 A.n CV DIEGO CONTRACTOR (Bank BJB Cabang S Parman)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Diego Contractor', 'Realisasi Konstruksi', 'Termin 2', 3534638000.00, 50.00, '0162986521001 A.n CV DIEGO CONTRACTOR (Bank BJB Cabang S Parman)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Diego Contractor', 'Realisasi Konstruksi', 'Termin 3', 3534638000.00, 75.00, '0162986521001 A.n CV DIEGO CONTRACTOR (Bank BJB Cabang S Parman)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Diego Contractor', 'Realisasi Konstruksi', 'Termin 4', 2827710400.00, 100.00, '0162986521001 A.n CV DIEGO CONTRACTOR (Bank BJB Cabang S Parman)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Diego Contractor', 'Jaminan Pemeliharaan', 'Retensi', 706927600.00, 100.00, '0162986521001 A.n CV DIEGO CONTRACTOR (Bank BJB Cabang S Parman)', NOW(), NOW());
    END IF;
    

    -- Contract #28: PT. Sadatahi Jaya Tama
    v_knmp_id := NULL;
    IF 'Panglima Raja' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Panglima Raja%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Sadatahi Jaya Tama', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kecamatan Concong dan Sungai Batang, Kab. Indragiri Hilir, Prov. Riau [No. SP: B.22791/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 28, "nama_penyedia": "PT. Sadatahi Jaya Tama", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kecamatan Concong dan Sungai Batang, Kab. Indragiri Hilir, Prov. Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22791/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 8250768000.0, "alamat": "Jl Duren Sawit Raya Ruko Duren Sawit Center N0 8-T, Kelurahan Klender, Kecamatan Duren Sawit – Jakarta Timur", "npwp": "81.142.853.1-042.000", "nama_direktur": "Ir. Togi Manik", "jabatan_direktur": "Direktur Utama", "telp": "081264221944", "email": "ptsadatahijayatama@gmail.com", "nama_bank": "Bank BRI", "norek": "032901006748307 A.n SADATAHI JAYA TAMA", "cabang_bank": "KC Jakarta Veteran", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23906/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Panglima Raja, Kecamatan Concong, Kabupaten Indragiri Hilir, Provinsi Riau\n2. Desa Kuala Patah Parang, Kecamatan Sungai Batang, Kabupaten Indragiri Hilir, Provinsi Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 8250768000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Sadatahi Jaya Tama', 'Realisasi Konstruksi', 'Termin 1', 2062692000.00, 25.00, '032901006748307 A.n SADATAHI JAYA TAMA (Bank BRI KC Jakarta Veteran)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Sadatahi Jaya Tama', 'Realisasi Konstruksi', 'Termin 2', 2062692000.00, 50.00, '032901006748307 A.n SADATAHI JAYA TAMA (Bank BRI KC Jakarta Veteran)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Sadatahi Jaya Tama', 'Realisasi Konstruksi', 'Termin 3', 2062692000.00, 75.00, '032901006748307 A.n SADATAHI JAYA TAMA (Bank BRI KC Jakarta Veteran)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Sadatahi Jaya Tama', 'Realisasi Konstruksi', 'Termin 4', 1650153600.00, 100.00, '032901006748307 A.n SADATAHI JAYA TAMA (Bank BRI KC Jakarta Veteran)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Sadatahi Jaya Tama', 'Jaminan Pemeliharaan', 'Retensi', 412538400.00, 100.00, '032901006748307 A.n SADATAHI JAYA TAMA (Bank BRI KC Jakarta Veteran)', NOW(), NOW());
    END IF;
    

    -- Contract #29: PT. Laksana Aneka Sarana
    v_knmp_id := NULL;
    IF 'Tanjung Ketapang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tanjung Ketapang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Laksana Aneka Sarana', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Tobali Kab. Bangka Selatan Prov. Kepulauan Bangka Belitung [No. SP: B.22792/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 29, "nama_penyedia": "PT. Laksana Aneka Sarana", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Tobali Kab. Bangka Selatan Prov. Kepulauan Bangka Belitung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22792/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 6718423000.0, "alamat": "Wonderland Palace Blok B No.8, Jl. Raya Pondok Rajeg, Kab. Bogor, Jawa Barat", "npwp": "01.707.370.1-404.000", "nama_direktur": "Siddiq", "jabatan_direktur": "Direktur", "telp": "08129674773", "email": "laksanaanekasarana@gmail.com", "nama_bank": "Bank DKI Syariah", "norek": "71216000062 A.n PT. LAKSANA ANEKA SARANA", "cabang_bank": "KCP Syariah Manggarai", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23306/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-20", "tgl_selesai": "2026-12-17", "ruang_lingkup": "1. Desa Tanjung Ketapang, Kecamatan Toboali, Kabupaten Bangka Selatan, Provinsi Kepulauan Bangka Belitung\n2. Desa Serdang, Kecamatan Toboali, Kabupaten Bangka Selatan, Provinsi Kepulauan Bangka Belitung", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 6718423000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 1', 1679605750.00, 25.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 2', 1679605750.00, 50.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 3', 1679605750.00, 75.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Laksana Aneka Sarana', 'Realisasi Konstruksi', 'Termin 4', 1343684600.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Laksana Aneka Sarana', 'Jaminan Pemeliharaan', 'Retensi', 335921150.00, 100.00, '71216000062 A.n PT. LAKSANA ANEKA SARANA (Bank DKI Syariah KCP Syariah Manggarai)', NOW(), NOW());
    END IF;
    

    -- Contract #30: PT. Multi Gapura Pembangunan Semesta
    v_knmp_id := NULL;
    IF 'Kwala Serapuh' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kwala Serapuh%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Multi Gapura Pembangunan Semesta', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Kwala Serapuh, Desa Paluh Sibaji, Dan Desa Nelayan Indah, Provinsi Sumatera Utara [No. SP: B.22793/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 30, "nama_penyedia": "PT. Multi Gapura Pembangunan Semesta", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Kwala Serapuh, Desa Paluh Sibaji, Dan Desa Nelayan Indah, Provinsi Sumatera Utara", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22793/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 18993518000.0, "alamat": "Graha Marlanco Lt. 4 Jl. Pulo Asem Utara Raya No. 18 Kota Adm. Jakarta Timur", "npwp": "01.304.706.3-003.000", "nama_direktur": "Gernando R Nainggolan MBA", "jabatan_direktur": "Direktur Utama", "telp": "082260903030/aulia", "email": "mugapes.pt@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "1900-04-28", "ruang_lingkup": "1. Desa Kwala Serapuh, Kecamatan Tanjung Pura, Kabupaten Langkat, Provinsi Sumatera Utara\n2. Desa Paluh Sibaji, Kecamatan Pantai Labu, Kabupaten Deli Serdang, Provinsi Sumatera Utara\n3. Desa Nelayan Indah, Kecamatan Medan Labuhan, Kota Medan, Provinsi Sumatera Utara.", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 18993518000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Multi Gapura Pembangunan Semesta', 'Realisasi Konstruksi', 'Termin 1', 4748379500.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Multi Gapura Pembangunan Semesta', 'Realisasi Konstruksi', 'Termin 2', 4748379500.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Multi Gapura Pembangunan Semesta', 'Realisasi Konstruksi', 'Termin 3', 4748379500.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Multi Gapura Pembangunan Semesta', 'Realisasi Konstruksi', 'Termin 4', 3798703600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Multi Gapura Pembangunan Semesta', 'Jaminan Pemeliharaan', 'Retensi', 949675900.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #31: CV. Rayhan Aditya
    v_knmp_id := NULL;
    IF 'Pasar Lama' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pasar Lama%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Rayhan Aditya', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Pasar Lama & Desa Way Hawang, Kec. Kaur Selatan Kabupaten Kaur, Provinsi Bengkulu Timur [No. SP: B.22709/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 31, "nama_penyedia": "CV. Rayhan Aditya", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Desa Pasar Lama & Desa Way Hawang, Kec. Kaur Selatan Kabupaten Kaur, Provinsi Bengkulu Timur", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22709/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 11303675000.0, "alamat": "Jl. Puskesmas Taba, Kota Lubuk Linggau, Sumatera Selatan", "npwp": "0837946375303000", "nama_direktur": "Febri Aditiya Nata", "jabatan_direktur": "Direktur", "telp": "082281315200", "email": "cvrayhanaditya@yahoo.com", "nama_bank": "Bank Mandiri", "norek": "1010015260779 A.n CV. Rayhan Aditya", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.22742/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-14", "tgl_selesai": "2026-12-11", "ruang_lingkup": "1. Desa Pasar Lama,  Kec. Kaur Selatan, Kab. Kaur, Prov. Bengkulu\n2. Desa Way Hawang,  Kec. Maje, Kab. Saluma, Prov. Bengkulu", "jumlah_desa": 4, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11303675000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Rayhan Aditya', 'Realisasi Konstruksi', 'Termin 1', 2825918750.00, 25.00, '1010015260779 A.n CV. Rayhan Aditya (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Rayhan Aditya', 'Realisasi Konstruksi', 'Termin 2', 2825918750.00, 50.00, '1010015260779 A.n CV. Rayhan Aditya (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Rayhan Aditya', 'Realisasi Konstruksi', 'Termin 3', 2825918750.00, 75.00, '1010015260779 A.n CV. Rayhan Aditya (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Rayhan Aditya', 'Realisasi Konstruksi', 'Termin 4', 2260735000.00, 100.00, '1010015260779 A.n CV. Rayhan Aditya (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Rayhan Aditya', 'Jaminan Pemeliharaan', 'Retensi', 565183750.00, 100.00, '1010015260779 A.n CV. Rayhan Aditya (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #32: PT. Indo Jaya Negara Abadi
    v_knmp_id := NULL;
    IF 'Batu Belubang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Batu Belubang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Indo Jaya Negara Abadi', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Rebo dan Desa Batu Belubang  Provinsi Bangka Belitung Anggaran 2026 [No. SP: B.23143/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 32, "nama_penyedia": "PT. Indo Jaya Negara Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Rebo dan Desa Batu Belubang  Provinsi Bangka Belitung Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23143/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 7071325220.0, "alamat": "Jalan Pejaten Barat II, Gang Timbul No.21 Kelurahan Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan", "npwp": "0925 2055 3601 7000", "nama_direktur": "Hero Aska Karnanda", "jabatan_direktur": "Direktur", "telp": "087731490688", "email": "officialindojayanegaraabadi@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1270015184623 A.n PT INDO JAYA NEGARA ABADI", "cabang_bank": "KC Jakarta Ampera Raya", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23907/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Batu Belubang, Kecamatan Pangkalan Baru, Kabupaten Bangka Tengah, Provinsi Kepulauan Bangka Belitung\n2. Desa Rebo, Kecamatan Sungailiat, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7071325220.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 1', 1767831305.00, 25.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 2', 1767831305.00, 50.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 3', 1767831305.00, 75.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 4', 1414265044.00, 100.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Indo Jaya Negara Abadi', 'Jaminan Pemeliharaan', 'Retensi', 353566261.00, 100.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());
    END IF;
    

    -- Contract #33: PT. Alfatir Risky Group
    v_knmp_id := NULL;
    IF 'Air Sena' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Air Sena%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Alfatir Risky Group', '2026-08-14', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau Tahun Anggaran 2026 [No. SP: B.22794/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 33, "nama_penyedia": "PT. Alfatir Risky Group", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.22794/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-14", "nilai_kontrak": 25770521000.0, "alamat": "Jl. Merpati Dusun Lampoh Baro, Kota Banda Aceh, Provinsi Aceh", "npwp": "1000000007752647", "nama_direktur": "Azzahara Giannisa Sidi", "jabatan_direktur": "Direktur Cabang", "telp": "081269400027", "email": "ptalfatir@gmail.com", "nama_bank": "BNI", "norek": "7687689009 A.n PT. Alfatir Risky Group", "cabang_bank": "KC Tanjung Pinang", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23140/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-18", "tgl_selesai": "2026-12-15", "ruang_lingkup": "1. Desa Air Sena, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n2. Desa Air Asuk, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n3. Desa Telaga Kecil, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n4. Desa Keramut, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n5. Desa Batu Belah, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n6. Desa Telaga, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau", "jumlah_desa": 6, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 25770521000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Alfatir Risky Group', 'Realisasi Konstruksi', 'Termin 1', 6442630250.00, 25.00, '7687689009 A.n PT. Alfatir Risky Group (BNI KC Tanjung Pinang)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Alfatir Risky Group', 'Realisasi Konstruksi', 'Termin 2', 6442630250.00, 50.00, '7687689009 A.n PT. Alfatir Risky Group (BNI KC Tanjung Pinang)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Alfatir Risky Group', 'Realisasi Konstruksi', 'Termin 3', 6442630250.00, 75.00, '7687689009 A.n PT. Alfatir Risky Group (BNI KC Tanjung Pinang)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Alfatir Risky Group', 'Realisasi Konstruksi', 'Termin 4', 5154104200.00, 100.00, '7687689009 A.n PT. Alfatir Risky Group (BNI KC Tanjung Pinang)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Alfatir Risky Group', 'Jaminan Pemeliharaan', 'Retensi', 1288526050.00, 100.00, '7687689009 A.n PT. Alfatir Risky Group (BNI KC Tanjung Pinang)', NOW(), NOW());
    END IF;
    

    -- Contract #34: PT. Yuniarto Sejahtera Abadi
    v_knmp_id := NULL;
    IF 'Betung' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Betung%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Yuniarto Sejahtera Abadi', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Betung dan Desa Karang Brak, Kabupaten Tanggamus, Provinsi Lampung Tahun Anggaran 2026 [No. SP: B.23114/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 34, "nama_penyedia": "PT. Yuniarto Sejahtera Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Betung dan Desa Karang Brak, Kabupaten Tanggamus, Provinsi Lampung Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23114/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 9449472000.0, "alamat": "Kp. Gondrong, Kab. Bekasi, Jawa Barat", "npwp": "39.574.486.5-435.000", "nama_direktur": "R Ario Yuniarto", "jabatan_direktur": "Direktur", "telp": "", "email": "yuniartosejahteraabadi.ysa@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015247594 A.n PT. Yuniarto Sejahtera Abadi", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23307/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-20", "tgl_selesai": "2026-12-17", "ruang_lingkup": "1. Desa Betung, Kecamatan Pematang Sawa, Kabupaten Tanggamus, Provinsi Lampung.\n2. Desa Karang Brak, Kecamatan Pematang Sawa, Kabupaten Tanggamus, Provinsi Lampung.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 9449472000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 1', 2362368000.00, 25.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 2', 2362368000.00, 50.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 3', 2362368000.00, 75.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 4', 1889894400.00, 100.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Yuniarto Sejahtera Abadi', 'Jaminan Pemeliharaan', 'Retensi', 472473600.00, 100.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #35: PT. Sahabat Group Nusantara Mandiri
    v_knmp_id := NULL;
    IF 'Teluk Limau' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Teluk Limau%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Sahabat Group Nusantara Mandiri', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Limau, Kecamatan Parittiga, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung [No. SP: B.23115/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 35, "nama_penyedia": "PT. Sahabat Group Nusantara Mandiri", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Limau, Kecamatan Parittiga, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23115/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 7815817000.0, "alamat": "Green Flower Blok A10, Desa Sukomulyo, Kec. Lamongan, Kab. Lamongan, Prov. Jawa Timur", "npwp": "0279604425645000", "nama_direktur": "Aris Lukmanul Khakim", "jabatan_direktur": "Direktur Utama", "telp": "085730951922", "email": "sgnm.la.jatim@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI", "cabang_bank": "KCP Lamongan", "jangka_waktu": "120 Hari", "nomor_spmk": "B.24101/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-28", "tgl_selesai": "2026-12-25", "ruang_lingkup": "1. Desa Teluk Limau, Kecamatan Parittiga, Kabupaten Bangka Barat, Provinsi Kepulauan Bangka Belitung", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7815817000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Sahabat Group Nusantara Mandiri', 'Realisasi Konstruksi', 'Termin 1', 1953954250.00, 25.00, '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI (Bank Mandiri KCP Lamongan)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Sahabat Group Nusantara Mandiri', 'Realisasi Konstruksi', 'Termin 2', 1953954250.00, 50.00, '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI (Bank Mandiri KCP Lamongan)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Sahabat Group Nusantara Mandiri', 'Realisasi Konstruksi', 'Termin 3', 1953954250.00, 75.00, '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI (Bank Mandiri KCP Lamongan)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Sahabat Group Nusantara Mandiri', 'Realisasi Konstruksi', 'Termin 4', 1563163400.00, 100.00, '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI (Bank Mandiri KCP Lamongan)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Sahabat Group Nusantara Mandiri', 'Jaminan Pemeliharaan', 'Retensi', 390790850.00, 100.00, '1780010528616 A.n PT. SAHABAT GROUP NUSANTARA MANDIRI (Bank Mandiri KCP Lamongan)', NOW(), NOW());
    END IF;
    

    -- Contract #36: PT. Indo Jaya Negara Abadi
    v_knmp_id := NULL;
    IF 'Mapur' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Mapur%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Indo Jaya Negara Abadi', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Mapur, Kecamatan Riau Silip, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung [No. SP: B.23144/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 36, "nama_penyedia": "PT. Indo Jaya Negara Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Mapur, Kecamatan Riau Silip, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23144/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 3052665000.0, "alamat": "Jl. Pejaten Barat II Gg. Timbul No. 21 Pejaten Barat, PasarMinggu, Jakarta Selatan", "npwp": "74.978.211.6-429.000", "nama_direktur": "Hero Aska Karnanda", "jabatan_direktur": "Direktur", "telp": "087731490688", "email": "officialindojayanegaraabadi@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1270015184623 A.n PT INDO JAYA NEGARA ABADI", "cabang_bank": "KC Jakarta Ampera Raya", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23908/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Mapur, Kecamatan Riau Silip, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 3052665000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 1', 763166250.00, 25.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 2', 763166250.00, 50.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 3', 763166250.00, 75.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Indo Jaya Negara Abadi', 'Realisasi Konstruksi', 'Termin 4', 610533000.00, 100.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Indo Jaya Negara Abadi', 'Jaminan Pemeliharaan', 'Retensi', 152633250.00, 100.00, '1270015184623 A.n PT INDO JAYA NEGARA ABADI (Bank Mandiri KC Jakarta Ampera Raya)', NOW(), NOW());
    END IF;
    

    -- Contract #37: PT. Aditya Musdalifah
    v_knmp_id := NULL;
    IF 'Tajur Biru' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tajur Biru%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Aditya Musdalifah', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tajur Biru, Kabupaten Lingga, Provinsi Kepulauan Riau [No. SP: B.23116/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 37, "nama_penyedia": "PT. Aditya Musdalifah", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tajur Biru, Kabupaten Lingga, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23116/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 9122939000.0, "alamat": "Jl. Brawijaya, 07 BTN Sosial Hinekombe, Sentani Jayapura – Papua", "npwp": "0030665574952000", "nama_direktur": "Daniel Klau Bouk", "jabatan_direktur": "Direktur Utama", "telp": "085231015571", "email": "adityamusdalifah01.pt@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "1900-04-28", "ruang_lingkup": "1. Desa Tajur Biru, Kecamatan Temiang Pesisir, Kabupaten Lingga, Provinsi Kepulauan Riau", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 9122939000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 1', 2280734750.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 2', 2280734750.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 3', 2280734750.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 4', 1824587800.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Aditya Musdalifah', 'Jaminan Pemeliharaan', 'Retensi', 456146950.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #38: PT. Duta Bangun Husaeni
    v_knmp_id := NULL;
    IF 'Batu Belanak' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Batu Belanak%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Duta Bangun Husaeni', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Batu Belanak Kabupaten Natuna Provinsi Kepulauan Riau [No. SP: B.23117/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 38, "nama_penyedia": "PT. Duta Bangun Husaeni", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Batu Belanak Kabupaten Natuna Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23117/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 4047787000.0, "alamat": "Bukit Cimanggu City Blok L 1 No.12 RT 02/RW 011, Cibadak, Kota Bogor", "npwp": "0944 7414 0440 4000", "nama_direktur": "Ibnu Bunyan Al Azizi", "jabatan_direktur": "Direktur", "telp": "082115115424", "email": "ptdutabangunhusaeni@gmail.com", "nama_bank": "Bank BJB", "norek": "0162479563001 A.n PT. Duta Bangun Husaeni", "cabang_bank": "KC Cibinong", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23909/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Batu Belanak, Kecamatan Suak Midai, Kabupaten Natuna, Provinsi Kepulauan Riau", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 4047787000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 1', 1011946750.00, 25.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 2', 1011946750.00, 50.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 3', 1011946750.00, 75.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Duta Bangun Husaeni', 'Realisasi Konstruksi', 'Termin 4', 809557400.00, 100.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Duta Bangun Husaeni', 'Jaminan Pemeliharaan', 'Retensi', 202389350.00, 100.00, '0162479563001 A.n PT. Duta Bangun Husaeni (Bank BJB KC Cibinong)', NOW(), NOW());
    END IF;
    

    -- Contract #39: PT. Trengginas Tirta Jaya Abadi
    v_knmp_id := NULL;
    IF 'Ampang Pulai' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Ampang Pulai%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Trengginas Tirta Jaya Abadi', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Ampang Pulai, Dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan Provinsi Sumatera Barat [No. SP: B.23118/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 39, "nama_penyedia": "PT. Trengginas Tirta Jaya Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Ampang Pulai, Dan Desa Koto Nan Duo IV Koto Hilie Kab. Pesisir Selatan Provinsi Sumatera Barat", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23118/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 7082726000.0, "alamat": "Jalan Zamrud LK I H.4 No. 05 RT.002 RW.000 Sukabumi Indah, Sukabumi Kota Bandar Lampung, Lampung", "npwp": "04.995.321.9-323.000", "nama_direktur": "Aldy Mega Syahputra", "jabatan_direktur": "Direktur", "telp": "0812-7845-6690", "email": "pttrengginastirtajayaabadi@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1140059595911 A.n PT. Trengginas Tirta Jaya Abadi", "cabang_bank": "KCP Way Halim", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23308/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-20", "tgl_selesai": "2026-12-17", "ruang_lingkup": "1. Desa Ampang Pulai, Kab. Pesisir Selatan, Provinsi Sumatera Barat\n2. Desa Koto Nan Duo IV Koto Hilie, Kab. Pesisir Selatan, Provinsi Sumatera Barat", "jumlah_desa": 2, "wakil_ppk": "Herdani Widi Supriyo"}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7082726000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Trengginas Tirta Jaya Abadi', 'Realisasi Konstruksi', 'Termin 1', 1770681500.00, 25.00, '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi (Bank Mandiri KCP Way Halim)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Trengginas Tirta Jaya Abadi', 'Realisasi Konstruksi', 'Termin 2', 1770681500.00, 50.00, '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi (Bank Mandiri KCP Way Halim)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Trengginas Tirta Jaya Abadi', 'Realisasi Konstruksi', 'Termin 3', 1770681500.00, 75.00, '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi (Bank Mandiri KCP Way Halim)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Trengginas Tirta Jaya Abadi', 'Realisasi Konstruksi', 'Termin 4', 1416545200.00, 100.00, '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi (Bank Mandiri KCP Way Halim)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Trengginas Tirta Jaya Abadi', 'Jaminan Pemeliharaan', 'Retensi', 354136300.00, 100.00, '1140059595911 A.n PT. Trengginas Tirta Jaya Abadi (Bank Mandiri KCP Way Halim)', NOW(), NOW());
    END IF;
    

    -- Contract #40: PT. Yuniarto Sejahtera Abadi
    v_knmp_id := NULL;
    IF 'Way Nipah' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Way Nipah%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Yuniarto Sejahtera Abadi', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 Di Desa Way Nipah Dan Desa Tanjungan Kabupaten Tagamus Provinsi Lampung [No. SP: B.23119/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 40, "nama_penyedia": "PT. Yuniarto Sejahtera Abadi", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 Di Desa Way Nipah Dan Desa Tanjungan Kabupaten Tagamus Provinsi Lampung", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23119/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 9939916000.0, "alamat": "Kp. Gondrong, Kab. Bekasi, Jawa Barat", "npwp": "39.574.486.5-435.000", "nama_direktur": "R Ario Yuniarto", "jabatan_direktur": "Direktur", "telp": "", "email": "yuniartosejahteraabadi.ysa@gmail.com", "nama_bank": "Bank Mandiri", "norek": "1010015247594 A.n PT. Yuniarto Sejahtera Abadi", "cabang_bank": "KC Jakarta Pondok Indah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23309/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-20", "tgl_selesai": "2026-12-17", "ruang_lingkup": "1. Desa Way Nipah, Kecamatan Pematang Sawa, Kabupaten Tanggamus, Provinsi Lampung.\n2. Desa Tanjungan, Kecamatan Pematang Sawa, Kabupaten Tanggamus, Provinsi Lampung.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 9939916000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 1', 2484979000.00, 25.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 2', 2484979000.00, 50.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 3', 2484979000.00, 75.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Yuniarto Sejahtera Abadi', 'Realisasi Konstruksi', 'Termin 4', 1987983200.00, 100.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Yuniarto Sejahtera Abadi', 'Jaminan Pemeliharaan', 'Retensi', 496995800.00, 100.00, '1010015247594 A.n PT. Yuniarto Sejahtera Abadi (Bank Mandiri KC Jakarta Pondok Indah)', NOW(), NOW());
    END IF;
    

    -- Contract #41: CV. Mahanaim
    v_knmp_id := NULL;
    IF 'Bagan Asahan Baru' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Bagan Asahan Baru%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Mahanaim', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Bagan Asahan Baru, dan Desa Bagan Asahan Pekan, Kabupaten Asahan, Provinsi Sumatera Utara [No. SP: B.23120/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 41, "nama_penyedia": "CV. Mahanaim", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Bagan Asahan Baru, dan Desa Bagan Asahan Pekan, Kabupaten Asahan, Provinsi Sumatera Utara", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23120/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 10539224000.0, "alamat": "Desa/Kelurahan Dermayu, Kecamatan Air Periukan, Kabupaten Seluma Provinsi Bengkulu", "npwp": "70.568. 943.8-311.000", "nama_direktur": "Sahat Sauli Sinaga", "jabatan_direktur": "Wakil Direktur", "telp": "082266333122", "email": "cv.mahanaim79@gmail.com", "nama_bank": "BSI", "norek": "1049882986 A.n CV MAHANAIM", "cabang_bank": "KC BENGKULU A MALIK", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23310/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-20", "tgl_selesai": "2026-12-17", "ruang_lingkup": "1. Desa Bagan Asahan Baru, Kecamatan Tanjung Balai, Kabupaten Asahan, Provinsi Sumatera Utara.\n2. Desa Bagan Asahan Pekan, Kecamatan Tanjung Balai, Kabupaten Asahan, Provinsi Sumatera Utara.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 10539224000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 1', 2634806000.00, 25.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 2', 2634806000.00, 50.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 3', 2634806000.00, 75.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Mahanaim', 'Realisasi Konstruksi', 'Termin 4', 2107844800.00, 100.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Mahanaim', 'Jaminan Pemeliharaan', 'Retensi', 526961200.00, 100.00, '1049882986 A.n CV MAHANAIM (BSI KC BENGKULU A MALIK)', NOW(), NOW());
    END IF;
    

    -- Contract #42: PT. NIAGA KARYA RESTU INDONESIA
    v_knmp_id := NULL;
    IF 'Pulau Rajo Inderapura' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pulau Rajo Inderapura%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. NIAGA KARYA RESTU INDONESIA', '2026-08-18', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kecamatan Airpura, Dan Linggo Sari Baganti, Kabupaten Pesisir Selatan, Provinsi Sumatera Barat T.A 2026 [No. SP: B.23121/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 42, "nama_penyedia": "PT. NIAGA KARYA RESTU INDONESIA", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kecamatan Airpura, Dan Linggo Sari Baganti, Kabupaten Pesisir Selatan, Provinsi Sumatera Barat T.A 2026", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23121/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-18", "nilai_kontrak": 10975005000.0, "alamat": "Jl. Suka Karya No. 63 Babakan Asem Teluk Naga\nTangerang Banten", "npwp": "81.340.476.1.418.000", "nama_direktur": "Raymond Young", "jabatan_direktur": "Direktur", "telp": "08118000599", "email": "niagakaryarestuindonesia@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "1900-04-28", "ruang_lingkup": "1. Desa Pulau Rajo Inderapura, Kecamatan Airpura, Kabupaten Pesisir Selatan,\nProvinsi Sumatera Barat\n2. Desa Air Haji Barat, Kecamatan Linggo Sari Baganti, Kabupaten Pesisir\nSelatan, Provinsi Sumatera Barat.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 10975005000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. NIAGA KARYA RESTU INDONESIA', 'Realisasi Konstruksi', 'Termin 1', 2743751250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. NIAGA KARYA RESTU INDONESIA', 'Realisasi Konstruksi', 'Termin 2', 2743751250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. NIAGA KARYA RESTU INDONESIA', 'Realisasi Konstruksi', 'Termin 3', 2743751250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. NIAGA KARYA RESTU INDONESIA', 'Realisasi Konstruksi', 'Termin 4', 2195001000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. NIAGA KARYA RESTU INDONESIA', 'Jaminan Pemeliharaan', 'Retensi', 548750250.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #43: CV. Pulau Tenggel
    v_knmp_id := NULL;
    IF 'Teluk Bayur' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Teluk Bayur%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Pulau Tenggel', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Bayur, dan Desa Teluk Siantan, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau [No. SP: B.23434/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 43, "nama_penyedia": "CV. Pulau Tenggel", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Teluk Bayur, dan Desa Teluk Siantan, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23434/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 7944128000.0, "alamat": "JL. KASWARI RAYA BLOK D NO. 07 Kota Tanjung Pinang", "npwp": "41.992.294.3-952.000", "nama_direktur": "Dalsah Aziz", "jabatan_direktur": "Direktur", "telp": "08127728816", "email": "cv_pulautenggel@yahoo.co.id", "nama_bank": "Bank Riau KEPRI", "norek": "1030814093 a.n PULAU TENGGEL CV", "cabang_bank": "Cabang Syariah Tanjungpinang", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23911/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Teluk Bayur, Kecamatan Kute Siantan, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau.\n2. Desa Teluk Siantan, Kecamatan Siantan Tengah, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7944128000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 1', 1986032000.00, 25.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 2', 1986032000.00, 50.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 3', 1986032000.00, 75.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 4', 1588825600.00, 100.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Pulau Tenggel', 'Jaminan Pemeliharaan', 'Retensi', 397206400.00, 100.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());
    END IF;
    

    -- Contract #44: PT. Ibnu Munsyir Dwi Guna
    v_knmp_id := NULL;
    IF 'Kampung Bugis' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kampung Bugis%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Ibnu Munsyir Dwi Guna', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kota Tanjung Pinang Dan Kabupaten Karimun Provinsi Kepulauan Riau [No. SP: B.23134/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 44, "nama_penyedia": "PT. Ibnu Munsyir Dwi Guna", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kota Tanjung Pinang Dan Kabupaten Karimun Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23134/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 27692521000.0, "alamat": "JL. KELAPA HIJAU II /20 SUNGGUMINASA-GOWA", "npwp": "02.224.285.3-807.000", "nama_direktur": "Muh Reza", "jabatan_direktur": "Kepala Cabang", "telp": "081341752007", "email": "ibnumuunsyir@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Kampung Bugis, Kecamatan Tanjung Pinang Kota, Kota Tanjung Pinang, Provinsi Kepulauan Riau\n2. Desa Teluk Uma, Kecamatan Tebing, Kabupaten Karimun, Provinsi Kepulauan Riau\n3. Desa Batu Limau, Kecamatan Ungar, Kabupaten Karimun, Provinsi Kepulauan Riau\n4. Desa Telaga Tujuh, Kecamatan Durai, Kabupaten Karimun, Provinsi Kepulauan Riau\n5. Desa Semembang, Kecamatan Durai, Kabupaten Karimun, Provinsi Kepulauan Riau\n6. Desa Tanjung Kilang, Kecamatan Durai, Kabupaten Karimun, Provinsi Kepulauan Riau\n7. Desa Senggarang, Kecamatan Tanjung Pinang Kota, Kota Tanjung Pinang, Provinsi Kepulauan Riau", "jumlah_desa": 7, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 27692521000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Ibnu Munsyir Dwi Guna', 'Realisasi Konstruksi', 'Termin 1', 6923130250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Ibnu Munsyir Dwi Guna', 'Realisasi Konstruksi', 'Termin 2', 6923130250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Ibnu Munsyir Dwi Guna', 'Realisasi Konstruksi', 'Termin 3', 6923130250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Ibnu Munsyir Dwi Guna', 'Realisasi Konstruksi', 'Termin 4', 5538504200.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Ibnu Munsyir Dwi Guna', 'Jaminan Pemeliharaan', 'Retensi', 1384626050.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #45: PT. Kelman Infra Perkasa
    v_knmp_id := NULL;
    IF 'Posek berada di Kecamatan Kepulauan Posek' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Posek berada di Kecamatan Kepulauan Posek%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Kelman Infra Perkasa', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Posek dan Desa Sungai Pinang, Kabupaten Lingga, Provinsi Kepulauan Riau [No. SP: B.23438/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 45, "nama_penyedia": "PT. Kelman Infra Perkasa", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Posek dan Desa Sungai Pinang, Kabupaten Lingga, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23438/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 14428016000.0, "alamat": "Yodya Tower Lantai 11, Jl. D.I. Panjaitan Kav. 8, Jakarta Timur", "npwp": "0829 3942 3800 2000", "nama_direktur": "Nancy Megawaty", "jabatan_direktur": "Direktur", "telp": "08161377556", "email": "enquiry@kelmaninfraperkasa.com", "nama_bank": "BANK BNI", "norek": "1152145582 A.n  KELMAN INFRA PRATAMA PT", "cabang_bank": "Cabang Jakarta", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23912/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Posek berada di Kecamatan Kepulauan Posek, Kabupaten Lingga, Provinsi Kepulauan Riau.\n2. Desa Sungai Pinang berada di Kecamatan Lingga, Kabupaten Lingga, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 14428016000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 1', 3607004000.00, 25.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 2', 3607004000.00, 50.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 3', 3607004000.00, 75.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 4', 2885603200.00, 100.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Kelman Infra Perkasa', 'Jaminan Pemeliharaan', 'Retensi', 721400800.00, 100.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());
    END IF;
    

    -- Contract #46: PT. Mucoindo Prakasa
    v_knmp_id := NULL;
    IF 'Temoyong' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Temoyong%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Mucoindo Prakasa', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kota Batam, Provinsi Kepulauan Riau [No. SP: B.23178/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 46, "nama_penyedia": "PT. Mucoindo Prakasa", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kota Batam, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23178/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 13284000000.0, "alamat": "Roseville SOHO and SUITE Nomor S0607 Sunburst CBD, Lot 1.8 BSD City, Lengkong Gudang, Serpong, Kota Tangerang Selatan, Banten", "npwp": "21.128.369.2-411.000", "nama_direktur": "Ikhsan Septiansyah", "jabatan_direktur": "Direktur Utama", "telp": "0821-1118-6869", "email": "hq@mucoindo.co.id", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Temoyong, Kecamatan Bulang, Kota Batam, Provinsi Kepulauan Riau\n2. Desa Pulau Terung, Kecamatan Belakang Padang, Kota Batam, Provinsi Kepulauan Riau\n3. Desa Karas, Kecamatan Galang, Kota Batam, Provinsi Kepulauan Riau", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 13284000000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 1', 3321000000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 2', 3321000000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 3', 3321000000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 4', 2656800000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Mucoindo Prakasa', 'Jaminan Pemeliharaan', 'Retensi', 664200000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #47: CV. Nafara Karya Consultant
    v_knmp_id := NULL;
    IF 'Air Putih' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Air Putih%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Nafara Karya Consultant', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Air Putih dan Desa Kadur, Kecamatan Natuna, Kabupaten Natuna, Provinsi Kepulauan Riau [No. SP: B.23314/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 47, "nama_penyedia": "CV. Nafara Karya Consultant", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Air Putih dan Desa Kadur, Kecamatan Natuna, Kabupaten Natuna, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23314/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 6516931000.0, "alamat": "Jl. PH.H Mustofa No. 133 RT. 002 / RW. 005 Kel. Sukapada Kec. Cibeunying Kidul Kota Bandung Jawa Barat", "npwp": "53.421.743.5-423.000", "nama_direktur": "ADI NUGRAHA", "jabatan_direktur": "Direktur", "telp": "08814512972", "email": "cv.nafarakaryaconsultant@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Air Putih, Kecamatan Midai, Kabupaten Natuna, Provinsi Kepulauan Riau\n2. Desa Kadur, Kecamatan Pulau Laut, Kabupaten Natuna, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 6516931000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 1', 1629232750.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 2', 1629232750.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 3', 1629232750.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 4', 1303386200.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Nafara Karya Consultant', 'Jaminan Pemeliharaan', 'Retensi', 325846550.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #48: PT. Kelman Infra Perkasa
    v_knmp_id := NULL;
    IF 'Sepempang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Sepempang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Kelman Infra Perkasa', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna Provinsi Kepulauan Riau [No. SP: B.23437/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 48, "nama_penyedia": "PT. Kelman Infra Perkasa", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Natuna Provinsi Kepulauan Riau", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23437/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 29513846000.0, "alamat": "Yodya Tower Lantai 11, Jl. D.I. Panjaitan Kav. 8, Jakarta Timur", "npwp": "0829 3942 3800 2000", "nama_direktur": "Nancy Megawaty", "jabatan_direktur": "Direktur", "telp": "08161377556", "email": "enquiry@kelmaninfraperkasa.com", "nama_bank": "BANK BNI", "norek": "1152145582 A.n  KELMAN INFRA PRATAMA PT", "cabang_bank": "Cabang Jakarta", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23913/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Sepempang, Kecamatan Bunguran Timur, Kabupaten Natuna, Provinsi Kepulauan Riau\n2. Desa Serasan, Kecamatan Serasan, Kabupaten Natuna, Provinsi Kepulauan Riau\n3. Desa Tanjung Setelung, Kecamatan Serasan, Kabupaten Natuna, Provinsi Kepulauan Riau\n4. Desa Air Ringau, Kecamatan Serasan Timur, Kabupaten Natuna, Provinsi Kepulauan Riau\n5. Desa Kelarik, Kecamatan Bunguran Utara, Kabupaten Natuna, Provinsi Kepulauan Riau\n6. Desa Kelarik Barat, Kecamatan Pulau Seluan, Kabupaten Natuna, Provinsi Kepulauan Riau\n7. Desa Tanjung, Kecamatan Bunguran Timur Laut, Kabupaten Natuna, Provinsi Kepulauan Riau", "jumlah_desa": 7, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 29513846000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 1', 7378461500.00, 25.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 2', 7378461500.00, 50.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 3', 7378461500.00, 75.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Kelman Infra Perkasa', 'Realisasi Konstruksi', 'Termin 4', 5902769200.00, 100.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Kelman Infra Perkasa', 'Jaminan Pemeliharaan', 'Retensi', 1475692300.00, 100.00, '1152145582 A.n  KELMAN INFRA PRATAMA PT (BANK BNI Cabang Jakarta)', NOW(), NOW());
    END IF;
    

    -- Contract #49: PT. Persada Artha Swandiri
    v_knmp_id := NULL;
    IF '' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Persada Artha Swandiri', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Nias Utara dan Gunung Sitoli, Provinsi Sumatera Utara [No. SP: B.23312/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 49, "nama_penyedia": "PT. Persada Artha Swandiri", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Nias Utara dan Gunung Sitoli, Provinsi Sumatera Utara", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23312/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 21997516000.0, "alamat": "Jalan Sukajaya, Komp. Arengka Lestari Blok O Nomor 8 Kelurahan Labuhbaru Barat, Kecamatan Payung Sekaki Kota Pekanbaru, Prov. Riau", "npwp": "81.691.705.1-216.000", "nama_direktur": "Leo Panjaitan", "jabatan_direktur": "Direktur", "telp": "081268832290", "email": "", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Afulu. Kecamatan Afulu. Kabupaten Nias Utara. Provinsi Sumatera Utara\n2. Desa Afia. Kecamatan Gunungsitoli. Kota Gunungsitoli. Provinsi Sumatera Utara\n3. Desa Pasar Lahewa. Kecamatan Lahewa. Kabupaten Nias Utara. Provinsi Sumatera Utara", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 21997516000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Persada Artha Swandiri', 'Realisasi Konstruksi', 'Termin 1', 5499379000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Persada Artha Swandiri', 'Realisasi Konstruksi', 'Termin 2', 5499379000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Persada Artha Swandiri', 'Realisasi Konstruksi', 'Termin 3', 5499379000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Persada Artha Swandiri', 'Realisasi Konstruksi', 'Termin 4', 4399503200.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Persada Artha Swandiri', 'Jaminan Pemeliharaan', 'Retensi', 1099875800.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #50: PT. Berkarya Indo Guna
    v_knmp_id := NULL;
    IF 'Sungai Burung' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Sungai Burung%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Berkarya Indo Guna', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sungai Burung, Kabupaten Tulang Bawang Tahun Anggaran 2026 [No. SP: B.23436/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 50, "nama_penyedia": "PT. Berkarya Indo Guna", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Sungai Burung, Kabupaten Tulang Bawang Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23436/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 7738667000.0, "alamat": "Jl. Mochamad Kahfi I Lantai 3, Kelurahan Cipedak, Kec. Jagakarsa, Kota Adm. Jakarta Selatan, Provinsi DKI Jakarta", "npwp": "0536 0373 7701 7000", "nama_direktur": "Mu’adz Usama Bahanan", "jabatan_direktur": "Direktur", "telp": "085718008583", "email": "berkaryaindoguna@gmail.com", "nama_bank": "Bank BRI", "norek": "023001005704309 A.n BERKARYA INDO GUNA", "cabang_bank": "KC Jakarta Cut Mutiah", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23910/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Sungai Burung, Kecamatan Dente Teladas, Kabupaten Tulang Bawang, Provinsi Lampung", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7738667000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Berkarya Indo Guna', 'Realisasi Konstruksi', 'Termin 1', 1934666750.00, 25.00, '023001005704309 A.n BERKARYA INDO GUNA (Bank BRI KC Jakarta Cut Mutiah)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Berkarya Indo Guna', 'Realisasi Konstruksi', 'Termin 2', 1934666750.00, 50.00, '023001005704309 A.n BERKARYA INDO GUNA (Bank BRI KC Jakarta Cut Mutiah)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Berkarya Indo Guna', 'Realisasi Konstruksi', 'Termin 3', 1934666750.00, 75.00, '023001005704309 A.n BERKARYA INDO GUNA (Bank BRI KC Jakarta Cut Mutiah)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Berkarya Indo Guna', 'Realisasi Konstruksi', 'Termin 4', 1547733400.00, 100.00, '023001005704309 A.n BERKARYA INDO GUNA (Bank BRI KC Jakarta Cut Mutiah)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Berkarya Indo Guna', 'Jaminan Pemeliharaan', 'Retensi', 386933350.00, 100.00, '023001005704309 A.n BERKARYA INDO GUNA (Bank BRI KC Jakarta Cut Mutiah)', NOW(), NOW());
    END IF;
    

    -- Contract #51: CV. Pulau Tenggel
    v_knmp_id := NULL;
    IF 'Belibak' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Belibak%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Pulau Tenggel', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Belibak Dan Desa Piabung, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau T.A 2026 [No. SP: B.23435/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 51, "nama_penyedia": "CV. Pulau Tenggel", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Belibak Dan Desa Piabung, Kecamatan Kepulauan Anambas, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau T.A 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23435/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 7825466000.0, "alamat": "JL. KASWARI RAYA BLOK D NO. 07 Kota Tanjung Pinang", "npwp": "41.992.294.3-952.000", "nama_direktur": "Dalsah Aziz", "jabatan_direktur": "Direktur", "telp": "08127728816", "email": "cv_pulautenggel@yahoo.co.id", "nama_bank": "Bank Riau KEPRI", "norek": "1030814093 a.n PULAU TENGGEL CV", "cabang_bank": "Cabang Syariah Tanjungpinang", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23914/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Belibak, Kecamatan Palmatak, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n2. Desa Piabung, Kecamatan Palmatak, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7825466000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 1', 1956366500.00, 25.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 2', 1956366500.00, 50.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 3', 1956366500.00, 75.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Pulau Tenggel', 'Realisasi Konstruksi', 'Termin 4', 1565093200.00, 100.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Pulau Tenggel', 'Jaminan Pemeliharaan', 'Retensi', 391273300.00, 100.00, '1030814093 a.n PULAU TENGGEL CV (Bank Riau KEPRI Cabang Syariah Tanjungpinang)', NOW(), NOW());
    END IF;
    

    -- Contract #52: CV. Rafka Berkah
    v_knmp_id := NULL;
    IF 'Balam' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Balam%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Rafka Berkah', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Balam, Kabupaten Pesisir Barat, Provinsi Lampung dan di Desa Tanjung Pandan, Kabupaten Kaur, Provinsi Bengkulu Tahun Anggaran 2026 [No. SP: B.23439/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 52, "nama_penyedia": "CV. Rafka Berkah", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Balam, Kabupaten Pesisir Barat, Provinsi Lampung dan di Desa Tanjung Pandan, Kabupaten Kaur, Provinsi Bengkulu Tahun Anggaran 2026", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23439/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 7416007000.0, "alamat": "Desa Mukai Mudik, Kab. Kerinci, Jambi.", "npwp": "93.970.939.0-333.000", "nama_direktur": "Nera Ofrida", "jabatan_direktur": "Direktur", "telp": "085341579921", "email": "neraofrida31@gmail.com", "nama_bank": "Bank BNI", "norek": "1860698235 A.n CV RAFKA BERKAH", "cabang_bank": "Cabang Sungai Penue", "jangka_waktu": "120 Hari", "nomor_spmk": "B.23915/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-26", "tgl_selesai": "2026-12-23", "ruang_lingkup": "1. Desa Balam, Kecamatan Pesisir Utara, Kabupaten Pesisir Barat, Provinsi Lampung\n2. Desa Tanjung Pandan, Kecamatan Kaur Tengah, Kabupaten Kaur, Provinsi Bengkulu.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7416007000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Rafka Berkah', 'Realisasi Konstruksi', 'Termin 1', 1854001750.00, 25.00, '1860698235 A.n CV RAFKA BERKAH (Bank BNI Cabang Sungai Penue)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Rafka Berkah', 'Realisasi Konstruksi', 'Termin 2', 1854001750.00, 50.00, '1860698235 A.n CV RAFKA BERKAH (Bank BNI Cabang Sungai Penue)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Rafka Berkah', 'Realisasi Konstruksi', 'Termin 3', 1854001750.00, 75.00, '1860698235 A.n CV RAFKA BERKAH (Bank BNI Cabang Sungai Penue)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Rafka Berkah', 'Realisasi Konstruksi', 'Termin 4', 1483201400.00, 100.00, '1860698235 A.n CV RAFKA BERKAH (Bank BNI Cabang Sungai Penue)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Rafka Berkah', 'Jaminan Pemeliharaan', 'Retensi', 370800350.00, 100.00, '1860698235 A.n CV RAFKA BERKAH (Bank BNI Cabang Sungai Penue)', NOW(), NOW());
    END IF;
    

    -- Contract #53: CV. Gadjah Mine Perkasa
    v_knmp_id := NULL;
    IF 'Kuala Maras' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Kuala Maras%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Gadjah Mine Perkasa', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas Provinsi Kepulauan Riau Tahun Anggaran 2026 [No. SP: B.23246/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 53, "nama_penyedia": "CV. Gadjah Mine Perkasa", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Kabupaten Kepulauan Anambas Provinsi Kepulauan Riau Tahun Anggaran 2026", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23246/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 13826473000.0, "alamat": "JL. LETJEN. SUPRAPTO, Kab. Karimun, Kepulauan Riau", "npwp": "93.593.687.2-223.000", "nama_direktur": "HERMANSYAH", "jabatan_direktur": "Direktur", "telp": "082231503750", "email": "gadjahmineperkasa@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Kuala Maras, Kecamatan Jemaja Timur, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n2. Desa Putik, Kecamatan Palmatak, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 13826473000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Gadjah Mine Perkasa', 'Realisasi Konstruksi', 'Termin 1', 3456618250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Gadjah Mine Perkasa', 'Realisasi Konstruksi', 'Termin 2', 3456618250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Gadjah Mine Perkasa', 'Realisasi Konstruksi', 'Termin 3', 3456618250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Gadjah Mine Perkasa', 'Realisasi Konstruksi', 'Termin 4', 2765294600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Gadjah Mine Perkasa', 'Jaminan Pemeliharaan', 'Retensi', 691323650.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #54: PT. Dewata Teknik
    v_knmp_id := NULL;
    IF 'Berlian' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Berlian%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Dewata Teknik', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Singkep Selatan, Lingga, Lingga Timur Dan Katang Bidare, Kab. Lingga Prov. Kepulauan Riau [No. SP: B.23321/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 54, "nama_penyedia": "PT. Dewata Teknik", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kec. Singkep Selatan, Lingga, Lingga Timur Dan Katang Bidare, Kab. Lingga Prov. Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23321/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 16687780000.0, "alamat": "Jl. Wonorungkut Utara VI/19, Kota Surabaya, Jawa Timur", "npwp": "0020 6770 6861 5000", "nama_direktur": "I Gede Suarsana", "jabatan_direktur": "Direktur", "telp": "08123278045", "email": "", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Berlian, Kecamatan Singkep Selat, Kabupaten Lingga, Provinsi Kepulauan Riau\n2. Desa Mepar, Kecamatan Lingga, Kabupaten Lingga, Provinsi Kepulauan Riau\n3. Desa Belungkur, Kecamatan Lingga Timur, Kabupaten Lingga, Provinsi Kepulauan Riau\n4. Desa Mensanak, Kecamatan Katang Bidare, Kabupaten Lingga, Provinsi Kepulauan Riau", "jumlah_desa": 4, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 16687780000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Dewata Teknik', 'Realisasi Konstruksi', 'Termin 1', 4171945000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Dewata Teknik', 'Realisasi Konstruksi', 'Termin 2', 4171945000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Dewata Teknik', 'Realisasi Konstruksi', 'Termin 3', 4171945000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Dewata Teknik', 'Realisasi Konstruksi', 'Termin 4', 3337556000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Dewata Teknik', 'Jaminan Pemeliharaan', 'Retensi', 834389000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #55: PT. Prima Shina Cahaya
    v_knmp_id := NULL;
    IF 'Busung Panjang' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Busung Panjang%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Prima Shina Cahaya', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi  Pembangunan Kampung Nelayan Merah Putih di Kabupaten Lingga Provinsi Kepulauan Riau [No. SP: B.23322/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 55, "nama_penyedia": "PT. Prima Shina Cahaya", "nama_paket": "Paket Pekerjaan Konstruksi  Pembangunan Kampung Nelayan Merah Putih di Kabupaten Lingga Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23322/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 30000752000.0, "alamat": "Jl. PHH Mustopha No.39 Surapati Core C3 Bandung Jawa Barat 40192", "npwp": "0720 8745 8542 3000", "nama_direktur": "Irvan Fajar Permana", "jabatan_direktur": "Direktur", "telp": "081383000359", "email": "primashina.pt@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Busung Panjang, Kecamatan Kepulauan Posek, Kabupaten Lingga, Provinsi Kepulauan Riau\n2. Desa Kelombok, Kecamatan Lingga, Kabupaten Lingga, Provinsi Kepulauan Riau\n3. Desa Laboh, Kecamatan Senayang, Kabupaten Lingga, Provinsi Kepulauan Riau\n4. Desa Limbung, Kecamatan Lingga Utara, Kabupaten Lingga, Provinsi Kepulauan Riau\n5. Desa Marok Tua, Kecamatan Singkep Barat, Kabupaten Lingga, Provinsi Kepulauan Riau\n6. Desa Pantai Harapan, Kecamatan Selayar, Kabupaten Lingga, Provinsi Kepulauan Riau\n7. Desa Pulau Medang, Kecamatan Katang Bidare, Kabupaten Lingga, Provinsi Kepulauan Riau\n8. Desa Tanjung Lipat, Kecamatan Bakung Serumpun, Kabupaten Lingga, Provinsi Kepulauan Riau", "jumlah_desa": 8, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 30000752000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Prima Shina Cahaya', 'Realisasi Konstruksi', 'Termin 1', 7500188000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Prima Shina Cahaya', 'Realisasi Konstruksi', 'Termin 2', 7500188000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Prima Shina Cahaya', 'Realisasi Konstruksi', 'Termin 3', 7500188000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Prima Shina Cahaya', 'Realisasi Konstruksi', 'Termin 4', 6000150400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Prima Shina Cahaya', 'Jaminan Pemeliharaan', 'Retensi', 1500037600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #56: CV. Putera Matan
    v_knmp_id := NULL;
    IF 'Upang Makmur' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Upang Makmur%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Putera Matan', '2026-08-21', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Banyuasin, Musi Banyuasin dan Ogan Komering Ilir, Provinsi Sumatera Selatan [No. SP: B.23461/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd Kontrak', '{"no": 56, "nama_penyedia": "CV. Putera Matan", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Kabupaten Banyuasin, Musi Banyuasin dan Ogan Komering Ilir, Provinsi Sumatera Selatan", "status_admin": "Sudah ttd Kontrak", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23461/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-21", "nilai_kontrak": 11191628000.0, "alamat": "Jl. Haji Rais Abdur Rahman Gg. Sampang No. 21, Kota Pontianak, Kalimantan Barat", "npwp": "02.086.318.9-703.000", "nama_direktur": "Rapili Abdul Samad Yunus", "jabatan_direktur": "Direktur", "telp": "081299660252", "email": "puteramatan36@yahoo.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "B.24010/DJPT.6/PI.420/PPK/VIII/2026", "tgl_mulai": "2026-08-27", "tgl_selesai": "2026-12-24", "ruang_lingkup": "1. Desa Upang Makmur, Kecamatan Makarti Jaya, Kabupaten Banyuasin, Provinsi Sumatera Selatan\n2. Desa Juru Taro, Kecamatan Muara Sugihan, Kabupaten Banyuasin, Provinsi Sumatera Selatan\n3. Desa Ringin Agung, Kecamatan Lalan, Kabupaten Musi Banyuasin, Provinsi Sumatera Selatan\n4. Desa Sungai Batang, Kecamatan Air Sugihan, Kabupaten Ogan Komering Ilir, Provinsi Sumatera Selatan", "jumlah_desa": 4, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 11191628000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Putera Matan', 'Realisasi Konstruksi', 'Termin 1', 2797907000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Putera Matan', 'Realisasi Konstruksi', 'Termin 2', 2797907000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Putera Matan', 'Realisasi Konstruksi', 'Termin 3', 2797907000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Putera Matan', 'Realisasi Konstruksi', 'Termin 4', 2238325600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Putera Matan', 'Jaminan Pemeliharaan', 'Retensi', 559581400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #57: PT. Mucoindo Prakasa
    v_knmp_id := NULL;
    IF 'Tanjung Piayu' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tanjung Piayu%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Mucoindo Prakasa', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Piayu, dan Pulau Buluh, Kota Batam, Prov. Kepulauan Riau [No. SP: B.23338/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 57, "nama_penyedia": "PT. Mucoindo Prakasa", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Piayu, dan Pulau Buluh, Kota Batam, Prov. Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23338/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 7891100000.0, "alamat": "Roseville SOHO and SUITE Nomor S0607 Sunburst CBD, Lot 1.8 BSD City, Lengkong Gudang, Serpong, Kota Tangerang Selatan, Banten", "npwp": "21.128.369.2-411.000", "nama_direktur": "Ikhsan Septiansyah", "jabatan_direktur": "Direktur Utama", "telp": "0821-1118-6869", "email": "hq@mucoindo.co.id", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Tanjung Piayu, Kecamatan Sei Beduk, Kota Batam, Provinsi Kepulauan Riau\n2. Desa Pulau Buluh, Kecamatan Bulang, Kota Batam, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7891100000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 1', 1972775000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 2', 1972775000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 3', 1972775000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Mucoindo Prakasa', 'Realisasi Konstruksi', 'Termin 4', 1578220000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Mucoindo Prakasa', 'Jaminan Pemeliharaan', 'Retensi', 394555000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #58: PT. Arah Energi Indonesia
    v_knmp_id := NULL;
    IF 'Karang Anyar' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Karang Anyar%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Arah Energi Indonesia', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Karanganyar dan Desa Penyandingan, Kabupaten Tanggamus, Provinsi Lampung [No. SP: B.23410/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 58, "nama_penyedia": "PT. Arah Energi Indonesia", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Karanganyar dan Desa Penyandingan, Kabupaten Tanggamus, Provinsi Lampung", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23410/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 9653157000.0, "alamat": "Orchid Business Centre Blok C2 Batam Center, Kota Batam, Kepulauan Riau 29432", "npwp": "084.427.387.0-225.000", "nama_direktur": "Ice Herry", "jabatan_direktur": "Direktur", "telp": "085272728383", "email": "", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Karang Anyar, Kecamatan Wonosobo, Kabupaten Tanggamus, Provinsi Lampung\n2. Desa Penyandingan, Kecamatan Kelumbayan, Kabupaten Tanggamus, Provinsi Lampung", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 9653157000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Arah Energi Indonesia', 'Realisasi Konstruksi', 'Termin 1', 2413289250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Arah Energi Indonesia', 'Realisasi Konstruksi', 'Termin 2', 2413289250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Arah Energi Indonesia', 'Realisasi Konstruksi', 'Termin 3', 2413289250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Arah Energi Indonesia', 'Realisasi Konstruksi', 'Termin 4', 1930631400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Arah Energi Indonesia', 'Jaminan Pemeliharaan', 'Retensi', 482657850.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #59: CV. Nafara Karya Consultant
    v_knmp_id := NULL;
    IF 'Subi' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Subi%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Nafara Karya Consultant', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Subi, Desa Meliah dan Desa Batu Berlian Kabupaten Natuna Provinsi Kepulauan Riau [No. SP: B.23340/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 59, "nama_penyedia": "CV. Nafara Karya Consultant", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun 2026 Di Desa Subi, Desa Meliah dan Desa Batu Berlian Kabupaten Natuna Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23340/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 12394028000.0, "alamat": "Jl. PH.H Mustofa No. 133 RT. 002 / RW. 005 Kel. Sukapada Kec. Cibeunying Kidul Kota Bandung Jawa Barat", "npwp": "53.421.743.5-423.000", "nama_direktur": "Adi Nugraha", "jabatan_direktur": "Direktur", "telp": "08814512972", "email": "cv.nafarakaryaconsultant@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Subi, Kecamatan Subi, Kabupaten Natuna, Provinsi Kepulauan Riau\n2. Desa Meliah, Kecamatan Subi, Kabupaten Natuna, Provinsi Kepulauan Riau\n3. Desa Batu Berlian, Kecamatan Serasan, Kabupaten Natuna, Provinsi Kepulauan Riau", "jumlah_desa": 3, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 12394028000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 1', 3098507000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 2', 3098507000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 3', 3098507000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Nafara Karya Consultant', 'Realisasi Konstruksi', 'Termin 4', 2478805600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Nafara Karya Consultant', 'Jaminan Pemeliharaan', 'Retensi', 619701400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #60: PT. Raharjo
    v_knmp_id := NULL;
    IF 'Mampok' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Mampok%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Raharjo', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 di Desa Mampok, dan Air Bini, Kabupaten Kepulauan Anambas, Prov. Kepulauan Riau [No. SP: B.23346/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 60, "nama_penyedia": "PT. Raharjo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Tahun Anggaran 2026 di Desa Mampok, dan Air Bini, Kabupaten Kepulauan Anambas, Prov. Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23346/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 7627273000.0, "alamat": "Jl. Trikora Kampung Pisang, Bintan Timur, Desa/Kelurahan Kijang Kota, Kec. Bintan Timur, Provinsi Kepulauan Riau", "npwp": "0017 6850 6622 4000", "nama_direktur": "Nursyahri", "jabatan_direktur": "Direktur", "telp": "081375602922", "email": "pt.raharjo@yahoo.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "#N/A", "tgl_mulai": "#N/A", "tgl_selesai": "#N/A", "ruang_lingkup": "1. Desa Mampok, Kecamatan Jemaja, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau.\n2. Desa Air Bini, Kecamatan Siantan Selatan, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau.", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 7627273000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 1', 1906818250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 2', 1906818250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 3', 1906818250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 4', 1525454600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Raharjo', 'Jaminan Pemeliharaan', 'Retensi', 381363650.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #61: PT. Lubuk Indah
    v_knmp_id := NULL;
    IF 'Tanjung Kelit' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Tanjung Kelit%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Lubuk Indah', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Kelit, Benan, Pulau Bukit Dan Pulau Duyung Pada Kab. Lingga Provinsi Kepulauan Riau Tahun Anggaran 2026 [No. SP: B.23358/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 61, "nama_penyedia": "PT. Lubuk Indah", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Tanjung Kelit, Benan, Pulau Bukit Dan Pulau Duyung Pada Kab. Lingga Provinsi Kepulauan Riau Tahun Anggaran 2026", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23358/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 17648631000.0, "alamat": "Sagulung Sumber Sari Blok C.10 no 71, Desa/Kelurahan Sungai Langkai, Kec. Sagulung, Kota Batam, Provinsi Kepulauan Riau", "npwp": "01.763.805.7-1-1.000", "nama_direktur": "", "jabatan_direktur": "Direktur", "telp": "0813 6072 8789", "email": "ptlubukindah8@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "2026-08-29", "ruang_lingkup": "1. Desa Tanjung Kelit, Kecamatan Bakung Serumpun, Kabupaten Lingga, Provinsi Kepulauan Riau\n2. Desa Benan, Kecamatan Katang Bidare, Kabupaten Lingga, Provinsi Kepulauan Riau\n3. Desa Pulau Bukit, Kecamatan Katang Bidare, Kabupaten Lingga, Provinsi Kepulauan Riau\n4. Desa Pulau Duyung, Kecamatan Katang Bidare, Kabupaten Lingga, Provinsi Kepulauan Riau", "jumlah_desa": 4, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 17648631000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Lubuk Indah', 'Realisasi Konstruksi', 'Termin 1', 4412157750.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Lubuk Indah', 'Realisasi Konstruksi', 'Termin 2', 4412157750.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Lubuk Indah', 'Realisasi Konstruksi', 'Termin 3', 4412157750.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Lubuk Indah', 'Realisasi Konstruksi', 'Termin 4', 3529726200.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Lubuk Indah', 'Jaminan Pemeliharaan', 'Retensi', 882431550.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #62: PT. Raharjo
    v_knmp_id := NULL;
    IF 'Pesisir Timur' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Pesisir Timur%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Raharjo', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pesisir Timur dan Desa Rewak, Kab. Kepulauan Anambas, Provinsi Kepulauan Riau [No. SP: B.23725/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 62, "nama_penyedia": "PT. Raharjo", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Pesisir Timur dan Desa Rewak, Kab. Kepulauan Anambas, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23725/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 8463468000.0, "alamat": "Jl. Trikora Kampung Pisang, Bintan Timur, Desa/Kelurahan Kijang Kota, Kec. Bintan Timur, Provinsi Kepulauan Riau", "npwp": "0017685066224000", "nama_direktur": "Nursyahri", "jabatan_direktur": "Direktur", "telp": "081375602922", "email": "pt.raharjo@yahoo.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "2026-08-29", "ruang_lingkup": "1. Desa Pesisir Timur, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau\n2. Desa Rewak, Kabupaten Kepulauan Anambas, Provinsi Kepulauan Riau", "jumlah_desa": 2, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 8463468000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 1', 2115867000.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 2', 2115867000.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 3', 2115867000.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Raharjo', 'Realisasi Konstruksi', 'Termin 4', 1692693600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Raharjo', 'Jaminan Pemeliharaan', 'Retensi', 423173400.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #63: CV. Sabrina Almahyra
    v_knmp_id := NULL;
    IF 'Penyengat Kecamatan Tanjung Apit' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Penyengat Kecamatan Tanjung Apit%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'CV. Sabrina Almahyra', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Penyengat Kecamatan Tanjung Apit, Kabupaten Siak, Provinsi Riau Tahun Anggaran 2026 [No. SP: B.23463/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 63, "nama_penyedia": "CV. Sabrina Almahyra", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih Di Desa Penyengat Kecamatan Tanjung Apit, Kabupaten Siak, Provinsi Riau Tahun Anggaran 2026", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23463/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 3691798000.0, "alamat": "Jalan kelapapati Tengah, Kab.Bengkalis, Riau.", "npwp": "0627 5824 1421 9000", "nama_direktur": "", "jabatan_direktur": "Direktur", "telp": "", "email": "", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "2026-08-29", "ruang_lingkup": "", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 3691798000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - CV. Sabrina Almahyra', 'Realisasi Konstruksi', 'Termin 1', 922949500.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - CV. Sabrina Almahyra', 'Realisasi Konstruksi', 'Termin 2', 922949500.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - CV. Sabrina Almahyra', 'Realisasi Konstruksi', 'Termin 3', 922949500.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - CV. Sabrina Almahyra', 'Realisasi Konstruksi', 'Termin 4', 738359600.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - CV. Sabrina Almahyra', 'Jaminan Pemeliharaan', 'Retensi', 184589900.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    

    -- Contract #64: PT. Aditya Musdalifah
    v_knmp_id := NULL;
    IF 'Penaah' <> '' THEN
        SELECT id INTO v_knmp_id FROM knmps WHERE name ILIKE '%Penaah%' LIMIT 1;
    END IF;

    -- Insert into persiapans
    INSERT INTO persiapans (knmp_id, nama, tanggal, jenis, keterangan, status, additional_data, created_at, updated_at)
    VALUES (v_knmp_id, 'PT. Aditya Musdalifah', '2026-08-29', 'kontrak', 'Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Penaah, Kecamatan Senayang, Kabupaten Lingga, Provinsi Kepulauan Riau [No. SP: B.23347/DJPT.6/PI.420/PPK/VIII/2026]', 'Sudah ttd SPPBJ', '{"no": 64, "nama_penyedia": "PT. Aditya Musdalifah", "nama_paket": "Paket Pekerjaan Konstruksi Pembangunan Kampung Nelayan Merah Putih di Desa Penaah, Kecamatan Senayang, Kabupaten Lingga, Provinsi Kepulauan Riau", "status_admin": "Sudah ttd SPPBJ", "nama_ppk": "Widodo S.Pi, Msc", "nip_ppk": "197101071999031002", "nomor_sp": "B.23347/DJPT.6/PI.420/PPK/VIII/2026", "tgl_sp": "2026-08-29", "nilai_kontrak": 4608465000.0, "alamat": "Jl. Brawijaya, 07 BTN Sosial Hinekombe, Sentani Jayapura – Papua", "npwp": "0030665574952000", "nama_direktur": "Daniel Klau Bouk", "jabatan_direktur": "Direktur Utama", "telp": "085231015571", "email": "adityamusdalifah01.pt@gmail.com", "nama_bank": "Bank Mandiri", "norek": "-", "cabang_bank": "-", "jangka_waktu": "120 Hari", "nomor_spmk": "", "tgl_mulai": "2026-08-29", "tgl_selesai": "2026-08-29", "ruang_lingkup": "", "jumlah_desa": 1, "wakil_ppk": ""}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_persiapan_id;

    -- Insert Termin Payments if nilai_kontrak > 0
    IF 4608465000.0 > 0 THEN
        -- Termin 1 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Uang Muka / Termin 1 - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 1', 1152116250.00, 25.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 2 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 2 (Progress 50%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 2', 1152116250.00, 50.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 3 (25%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 3 (Progress 75%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 3', 1152116250.00, 75.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Termin 4 (20%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Termin 4 (Progress 100%) - PT. Aditya Musdalifah', 'Realisasi Konstruksi', 'Termin 4', 921693000.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());

        -- Retensi (5%)
        INSERT INTO pembayarans (persiapan_kontrak_id, name, kategori, termin, realisasi_anggaran, realisasi_fisik, norek_pekerja, created_at, updated_at)
        VALUES (v_persiapan_id, 'Retensi Pemeliharaan (5%) - PT. Aditya Musdalifah', 'Jaminan Pemeliharaan', 'Retensi', 230423250.00, 100.00, '- (Bank Mandiri -)', NOW(), NOW());
    END IF;
    
END $$;