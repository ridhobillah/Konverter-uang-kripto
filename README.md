# Kurs & Koin

Konverter mata uang & tracker kripto real-time. Dibangun dengan React + Vite + Tailwind CSS, memakai dua API gratis:

- **ExchangeRate-API** (`open.er-api.com`) — kurs mata uang fiat, tanpa API key.
- **CoinGecko API** — data pasar & grafik harga kripto, tanpa API key.

## Fitur

- Kalkulator konversi mata uang cepat, dengan pasangan populer (USD→IDR, JPY→IDR, dst).
- Tracker kripto: pencarian, filter, sparkline 7 hari, dan detail koin dengan grafik interaktif (1H/7H/30H).
- Ticker tape berjalan di bagian atas menampilkan harga & perubahan 24 jam koin teratas.
- Toggle tampilan harga kripto USD/IDR (dikonversi otomatis pakai kurs dari ExchangeRate-API).

## Menjalankan secara lokal

Pastikan Node.js (versi 18 ke atas) sudah terpasang, lalu:

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

## Build untuk produksi

```bash
npm run build
npm run preview
```

Hasil build ada di folder `dist/`, siap di-deploy ke Vercel, Netlify, GitHub Pages, atau hosting statis lainnya.

## Struktur proyek

```
kurs-koin/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── src/
    ├── main.jsx      # entry point
    ├── App.jsx       # seluruh UI & logika aplikasi
    └── index.css     # direktif Tailwind
```

## Catatan

- Kedua API dipanggil langsung dari browser (client-side fetch), tidak butuh backend atau API key.
- CoinGecko API publik punya batas rate wajar untuk pemakaian gratis; jika terlalu sering refresh, respons bisa tertunda sesaat.
