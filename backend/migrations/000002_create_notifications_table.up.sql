-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_target VARCHAR(100) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    link VARCHAR(255) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role_target ON notifications(role_target);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Seed initial sample notifications
INSERT INTO notifications (title, message, category, type, link, is_read, created_at)
VALUES 
('Selamat Datang di SIMANDOR', 'Sistem Monitoring dan Evaluasi Lapangan siap digunakan.', 'system', 'info', '/', FALSE, NOW() - INTERVAL '2 hours'),
('Pembaruan Dokumen Terverifikasi', 'Dokumen persiapan kontrak telah diverifikasi oleh Pengawas Lapangan.', 'verifikasi', 'success', '/persiapan_kontrak', FALSE, NOW() - INTERVAL '1 hour'),
('Laporan Harian Masuk', 'Laporan harian pekerjaan konstruksi baru telah diunggah oleh Kontraktor.', 'laporan', 'primary', '/laporan', FALSE, NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
