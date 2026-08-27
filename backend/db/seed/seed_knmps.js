const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../../../data/knmp.json');
let initialData = [];
if (fs.existsSync(jsonPath)) {
  initialData = JSON.parse(fs.readFileSync(jsonPath, 'utf8')).data || [];
}

const sumatraRegencies = [
  { regency: 'KABUPATEN DELI SERDANG', prov: 'SUMATERA UTARA', dist: 'PANTAI LABU', baseLat: 3.65, baseLng: 98.88 },
  { regency: 'KABUPATEN ASAHAN', prov: 'SUMATERA UTARA', dist: 'TANJUNG BALAI', baseLat: 2.98, baseLng: 99.85 },
  { regency: 'KABUPATEN TAPANULI TENGAH', prov: 'SUMATERA UTARA', dist: 'BARUS', baseLat: 2.01, baseLng: 98.42 },
  { regency: 'KABUPATEN MANDAILING NATAL', prov: 'SUMATERA UTARA', dist: 'NATAL', baseLat: 0.54, baseLng: 99.12 },
  { regency: 'KOTA MEDAN', prov: 'SUMATERA UTARA', dist: 'MEDAN BELAWAN', baseLat: 3.78, baseLng: 98.68 },
  { regency: 'KABUPATEN BATUBARA', prov: 'SUMATERA UTARA', dist: 'TANJUNG TIRAM', baseLat: 3.22, baseLng: 99.58 },
  { regency: 'KABUPATEN SERDANG BEDAGAI', prov: 'SUMATERA UTARA', dist: 'TELUK MENGKUDU', baseLat: 3.55, baseLng: 99.12 },
  { regency: 'KABUPATEN LANGKAT', prov: 'SUMATERA UTARA', dist: 'PANGKALAN SUSU', baseLat: 4.02, baseLng: 98.28 },
  { regency: 'KABUPATEN BENGKALIS', prov: 'RIAU', dist: 'BENGKALIS', baseLat: 1.48, baseLng: 102.13 },
  { regency: 'KOTA DUMAI', prov: 'RIAU', dist: 'DUMAI KOTA', baseLat: 1.67, baseLng: 101.45 },
  { regency: 'KABUPATEN ROKAN HILIR', prov: 'RIAU', dist: 'BAGAN SINEMBAH', baseLat: 2.15, baseLng: 100.82 },
  { regency: 'KABUPATEN INDRAGIRI HILIR', prov: 'RIAU', dist: 'KUALA INDRAGIRI', baseLat: -0.32, baseLng: 103.15 },
  { regency: 'KOTA BATAM', prov: 'KEPULAUAN RIAU', dist: 'BATAM KOTA', baseLat: 1.13, baseLng: 104.05 },
  { regency: 'KOTA TANJUNG PINANG', prov: 'KEPULAUAN RIAU', dist: 'TANJUNG PINANG BARAT', baseLat: 0.92, baseLng: 104.45 },
  { regency: 'KABUPATEN BINTAN', prov: 'KEPULAUAN RIAU', dist: 'BINTAN UTARA', baseLat: 1.08, baseLng: 104.25 },
  { regency: 'KABUPATEN KARIMUN', prov: 'KEPULAUAN RIAU', dist: 'KARIMUN', baseLat: 0.99, baseLng: 103.42 },
  { regency: 'KABUPATEN LINGGA', prov: 'KEPULAUAN RIAU', dist: 'SINGKEP', baseLat: -0.48, baseLng: 104.42 },
  { regency: 'KABUPATEN NATUNA', prov: 'KEPULAUAN RIAU', dist: 'BUNGURAN TIMUR', baseLat: 3.95, baseLng: 108.38 },
  { regency: 'KABUPATEN KEPULAUAN ANAMBAS', prov: 'KEPULAUAN RIAU', dist: 'SIANTAN', baseLat: 3.22, baseLng: 106.22 },
  { regency: 'KABUPATEN PESISIR SELATAN', prov: 'SUMATERA BARAT', dist: 'IV JURAI', baseLat: -1.35, baseLng: 100.58 },
  { regency: 'KOTA PADANG', prov: 'SUMATERA BARAT', dist: 'PADANG SELATAN', baseLat: -0.95, baseLng: 100.37 },
  { regency: 'KABUPATEN AGAM', prov: 'SUMATERA BARAT', dist: 'TANJUNG MUTIARA', baseLat: -0.32, baseLng: 99.98 },
  { regency: 'KABUPATEN PASAMAN BARAT', prov: 'SUMATERA BARAT', dist: 'SUNGAI BEREMAS', baseLat: 0.22, baseLng: 99.38 },
  { regency: 'KABUPATEN BANGKA', prov: 'KEPULAUAN BANGKA BELITUNG', dist: 'SUNGAILIAT', baseLat: -1.85, baseLng: 106.12 },
  { regency: 'KABUPATEN BANGKA SELATAN', prov: 'KEPULAUAN BANGKA BELITUNG', dist: 'TOBOALI', baseLat: -3.01, baseLng: 106.45 },
  { regency: 'KABUPATEN BELITUNG', prov: 'KEPULAUAN BANGKA BELITUNG', dist: 'TANJUNG PANDAN', baseLat: -2.73, baseLng: 107.63 },
  { regency: 'KABUPATEN LAMPUNG SELATAN', prov: 'LAMPUNG', dist: 'KALIANDA', baseLat: -5.72, baseLng: 105.62 },
  { regency: 'KABUPATEN TANGGAMUS', prov: 'LAMPUNG', dist: 'KOTA AGUNG', baseLat: -5.50, baseLng: 104.62 },
  { regency: 'KABUPATEN PESISIR BARAT', prov: 'LAMPUNG', dist: 'KRUI', baseLat: -5.18, baseLng: 103.92 },
  { regency: 'KABUPATEN ACEH BESAR', prov: 'ACEH', dist: 'PEUKAN BADA', baseLat: 5.52, baseLng: 95.28 },
  { regency: 'KOTA BANDA ACEH', prov: 'ACEH', dist: 'KUTA RAJA', baseLat: 5.57, baseLng: 95.32 },
  { regency: 'KOTA SABANG', prov: 'ACEH', dist: 'SUKAKARYA', baseLat: 5.88, baseLng: 95.31 },
  { regency: 'KABUPATEN ACEH TIMUR', prov: 'ACEH', dist: 'IDI RAYEUK', baseLat: 4.95, baseLng: 97.77 },
  { regency: 'KABUPATEN ACEH UTARA', prov: 'ACEH', dist: 'SEUNUDDON', baseLat: 5.18, baseLng: 97.45 },
  { regency: 'KOTA LHOKSEUMAWE', prov: 'ACEH', dist: 'BANDA SAKTI', baseLat: 5.18, baseLng: 97.14 },
  { regency: 'KABUPATEN ACEH BARAT', prov: 'ACEH', dist: 'JOHAN PAHLAWAN', baseLat: 4.14, baseLng: 96.13 },
  { regency: 'KABUPATEN ACEH SELATAN', prov: 'ACEH', dist: 'TAPAKTUAN', baseLat: 3.25, baseLng: 97.18 }
];

const coastalNames = [
  'Kelambir', 'Paluh Sabaji', 'Sei Sembilang', 'Sei Jawi-Jawi', 'Bagan Asahan Pekan', 'Bagan Asahan Baru',
  'Kedai Gedang', 'Pasar V Natal', 'Pasar Sorkam', 'Pasar Baru Batahan', 'Benan', 'Tanjung Kelit',
  'Kelarik Barat', 'Rebo', 'Tanjung Sangkar', 'Kota Jawa', 'Belawan Bahari', 'Titi Kuning', 'Kuala Tanjung',
  'Tanjung Tiram', 'Pagurawan', 'Pantai Cermin', 'Sialang Buah', 'Pangkalan Susu', 'Brandan Barat',
  'Tanjung Pura', 'Sungai Apit', 'Bukit Batu', 'Rupat Utara', 'Purnama Dumai', 'Sungai Sembilan',
  'Bagansiapiapi', 'Sinaboi', 'Pasir Limau Kapas', 'Kuala Enok', 'Sungai Guntung', 'Concong Luar',
  'Batu Ampar', 'Belakang Padang', 'Nongsa', 'Galang', 'Bulang', 'Sei Beduk', 'Senggarang',
  'Kampung Bugis', 'Dompak', 'Tanjung Sebauk', 'Tanjung Uban', 'Teluk Sebong', 'Gunung Kijang',
  'Tanjung Balai Karimun', 'Moro', 'Kundur', 'Dabo Singkep', 'Daik Lingga', 'Senayang', 'Selayar',
  'Ranai Kota', 'Sedanau', 'Pulau Laut', 'Midai', 'Tarempa', 'Siantan Timur', 'Jemaja', 'Palmatak',
  'Painan', 'Batang Kapas', 'Lengayang', 'Air Haji', 'Muara Padang', 'Bungus Teluk Kabung', 'Koto Tangah',
  'Tiku Agam', 'Sasak Ranah Pasisie', 'Air Bangis', 'Sungailiat', 'Belinyu', 'Matras', 'Toboali',
  'Sadai', 'Lepar Pongok', 'Tanjung Pandan', 'Membalong', 'Manggar', 'Gantung', 'Kalianda', 'Rajabasa',
  'Bakauheni', 'Kota Agung', 'Wonosobo', 'Cukuh Balak', 'Krui', 'Pesisir Tengah', 'Lemong', 'Ngambur',
  'Ulee Lheue', 'Lampulo', 'Deah Glumpang', 'Lhoknga', 'Leupung', 'Pulo Aceh', 'Iboih Sabang', 'Gapang',
  'Kuala Idi', 'Peureulak', 'Simpang Ulim', 'Lhoksukon', 'Seunuddon', 'Tanah Pasir', 'Pusong', 'Ujong Blang',
  'Meulaboh', 'Samatiga', 'Johan Pahlawan', 'Tapaktuan', 'Sawang', 'Labuhan Haji', 'Singkil', 'Pulau Banyak'
];

let items = [];

// 1. First push initialData from data/knmp.json
for (const d of initialData) {
  items.push({
    name: d.name,
    regional_name: 'Sumatera',
    province_name: d.province || 'SUMATERA UTARA',
    regency_name: d.regency || 'KABUPATEN DELI SERDANG',
    district_name: d.district || 'PANTAI LABU',
    sub_district_name: d.sub_district || 'KELAMBIR',
    lat: d.lat,
    long: d.long,
    status: 'on_track',
    jenis_knmp: d.jenis_knmp || 'penyangga'
  });
}

// 2. Fill up to 346 items
let idx = 0;
while (items.length < 346) {
  const reg = sumatraRegencies[idx % sumatraRegencies.length];
  const nameBase = coastalNames[idx % coastalNames.length];
  const variant = Math.floor(idx / coastalNames.length) > 0 ? ' ' + (Math.floor(idx / coastalNames.length) + 1) : '';
  const latOff = (((idx * 17) % 50) - 25) * 0.008;
  const lngOff = (((idx * 23) % 50) - 25) * 0.008;
  
  items.push({
    name: 'KNMP ' + nameBase + variant,
    regional_name: 'Sumatera',
    province_name: reg.prov,
    regency_name: reg.regency,
    district_name: reg.dist,
    sub_district_name: nameBase,
    lat: (reg.baseLat + latOff).toFixed(6),
    long: (reg.baseLng + lngOff).toFixed(6),
    status: 'on_track',
    jenis_knmp: idx % 3 === 0 ? 'baru' : 'penyangga'
  });
  idx++;
}

console.log('Total generated KNMP items:', items.length);

let sql = '-- 000007_seed_346_knmps.up.sql\n\n';
sql += 'DELETE FROM knmps;\n\n';

for (const it of items) {
  sql += "INSERT INTO knmps (name, jenis_knmp, lat, long, status, created_at, updated_at) VALUES ('" +
    it.name.replace(/'/g, "''") + "', '" +
    it.jenis_knmp + "', '" +
    it.lat + "', '" +
    it.long + "', '" +
    it.status + "', NOW(), NOW());\n";
}

const outUp = path.join(__dirname, '../../migrations/000007_seed_346_knmps.up.sql');
const outDown = path.join(__dirname, '../../migrations/000007_seed_346_knmps.down.sql');

fs.writeFileSync(outUp, sql);
fs.writeFileSync(outDown, 'DELETE FROM knmps;\n');
console.log('Migration 000007 written to:', outUp);
