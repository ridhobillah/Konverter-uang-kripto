import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import {
  ArrowUpDown,
  Search,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TOKEN DESAIN                                                       */
/*  Tema: "meja dealing room" — gelap, presisi, angka sebagai hero.    */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#0A0E17",
  surface: "#111826",
  surfaceAlt: "#161F30",
  border: "#232E45",
  borderSoft: "#1B2436",
  text: "#EDEFF5",
  textMuted: "#8A93A8",
  textFaint: "#5C6480",
  gold: "#D4A94A",
  goldSoft: "#3A3120",
  green: "#33C48C",
  greenSoft: "#12261F",
  red: "#F0554B",
  redSoft: "#2A1616",
  teal: "#3FA7A0",
};

const POPULAR = ["USD", "IDR", "EUR", "JPY", "GBP", "SGD", "AUD", "CNY", "MYR", "KRW"];
const QUICK_PAIRS = [
  ["USD", "IDR"],
  ["JPY", "IDR"],
  ["EUR", "IDR"],
  ["SGD", "IDR"],
];

function useGoogleFonts() {
  useEffect(() => {
    const id = "kurskoin-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function fmtNumber(n, maxDigits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: Math.min(2, maxDigits),
  }).format(n);
}

function fmtCryptoPrice(n, vs) {
  if (n === null || n === undefined) return "—";
  const digits = n < 1 ? 6 : n < 100 ? 4 : 2;
  const symbol = vs === "idr" ? "Rp" : "$";
  return symbol + " " + fmtNumber(n, digits);
}

function fmtCompact(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

/* ------------------------------------------------------------------ */
/*  TICKER TAPE — elemen signature                                     */
/* ------------------------------------------------------------------ */
function TickerTape({ coins, loading }) {
  const items = coins && coins.length ? coins.slice(0, 14) : [];
  const doubled = [...items, ...items];
  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center" style={{ minHeight: 40 }}>
        {loading ? (
          <div
            className="px-4 text-xs tracking-widest"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.textMuted }}
          >
            MEMUAT PASAR...
          </div>
        ) : (
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: "kk-ticker 42s linear infinite",
              width: "max-content",
            }}
          >
            {doubled.map((c, i) => {
              const up = (c.price_change_percentage_24h ?? 0) >= 0;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ borderRight: `1px solid ${C.borderSoft}` }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}
                  >
                    {c.symbol?.toUpperCase()}
                  </span>
                  <span
                    className="text-xs"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.textMuted }}
                  >
                    {fmtCryptoPrice(c.current_price, "usd")}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: up ? C.green : C.red,
                    }}
                  >
                    {up ? "▲" : "▼"} {Math.abs(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KONVERTER MATA UANG                                                 */
/* ------------------------------------------------------------------ */
function CurrencyConverter({ rates, ratesTime, loading, error, onRetry }) {
  const [amount, setAmount] = useState("1");
  const [fromCurr, setFromCurr] = useState("USD");
  const [toCurr, setToCurr] = useState("IDR");

  const codes = useMemo(() => {
    if (!rates) return [];
    const all = Object.keys(rates).sort();
    const rest = all.filter((c) => !POPULAR.includes(c));
    return [...POPULAR.filter((c) => all.includes(c)), ...rest];
  }, [rates]);

  const numericAmount = parseFloat(amount.replace(",", ".")) || 0;

  const result = useMemo(() => {
    if (!rates || !rates[fromCurr] || !rates[toCurr]) return null;
    const usd = numericAmount / rates[fromCurr];
    return usd * rates[toCurr];
  }, [rates, fromCurr, toCurr, numericAmount]);

  const unitRate = useMemo(() => {
    if (!rates || !rates[fromCurr] || !rates[toCurr]) return null;
    return rates[toCurr] / rates[fromCurr];
  }, [rates, fromCurr, toCurr]);

  const swap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: C.textMuted }}>
        <RefreshCw className="animate-spin mr-2" size={18} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">
          Mengambil kurs terbaru...
        </span>
      </div>
    );
  }

  if (error || !rates) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm" style={{ color: C.textMuted }}>
          Kurs tidak dapat dimuat. Periksa koneksi kamu.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: C.gold, color: "#181206" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* pasangan populer */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_PAIRS.map(([f, t]) => {
          const active = f === fromCurr && t === toCurr;
          return (
            <button
              key={f + t}
              onClick={() => {
                setFromCurr(f);
                setToCurr(t);
              }}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                borderColor: active ? C.gold : C.border,
                color: active ? C.gold : C.textMuted,
                background: active ? C.goldSoft : "transparent",
              }}
            >
              {f} → {t}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* dari */}
          <div>
            <label
              className="block text-xs mb-2 tracking-widest"
              style={{ color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              DARI
            </label>
            <div
              className="rounded-xl p-4"
              style={{ background: C.surfaceAlt, border: `1px solid ${C.borderSoft}` }}
            >
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                className="w-full bg-transparent outline-none text-2xl mb-3"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}
              />
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value)}
                className="w-full bg-transparent outline-none text-sm py-1"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {codes.map((c) => (
                  <option key={c} value={c} style={{ background: C.surface, color: C.text }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* swap */}
          <button
            onClick={swap}
            className="justify-self-center rounded-full p-3 mb-1 transition-transform hover:rotate-180"
            style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, color: C.gold }}
            aria-label="Tukar mata uang"
          >
            <ArrowUpDown size={18} />
          </button>

          {/* ke */}
          <div>
            <label
              className="block text-xs mb-2 tracking-widest"
              style={{ color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              KE
            </label>
            <div
              className="rounded-xl p-4"
              style={{ background: C.surfaceAlt, border: `1px solid ${C.borderSoft}` }}
            >
              <div
                className="text-2xl mb-3 truncate"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.gold }}
              >
                {result !== null ? fmtNumber(result, 2) : "—"}
              </div>
              <select
                value={toCurr}
                onChange={(e) => setToCurr(e.target.value)}
                className="w-full bg-transparent outline-none text-sm py-1"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {codes.map((c) => (
                  <option key={c} value={c} style={{ background: C.surface, color: C.text }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span>
            1 {fromCurr} = {unitRate !== null ? fmtNumber(unitRate, 4) : "—"} {toCurr}
          </span>
          <span>Diperbarui: {ratesTime || "—"}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TRACKER KRIPTO                                                      */
/* ------------------------------------------------------------------ */
function MiniSpark({ prices, up }) {
  if (!prices || prices.length < 2) return <div style={{ width: 100, height: 36 }} />;
  const data = prices.map((p, i) => ({ i, p }));
  return (
    <div style={{ width: 100, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="p"
            stroke={up ? C.green : C.red}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CoinDetail({ coin, rates, vsCurrency, onClose }) {
  const [range, setRange] = useState(7);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  const fetchChart = useCallback(
    async (days) => {
      setLoading(true);
      setErr(false);
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await res.json();
        const pts = (data.prices || []).map(([t, p]) => ({ t, price: p }));
        setPoints(pts);
      } catch (e) {
        setErr(true);
      } finally {
        setLoading(false);
      }
    },
    [coin.id]
  );

  useEffect(() => {
    fetchChart(range);
  }, [range, fetchChart]);

  const idrRate = rates?.IDR;
  const converted = useMemo(() => {
    if (!points) return null;
    if (vsCurrency === "idr" && idrRate) {
      return points.map((p) => ({ ...p, price: p.price * idrRate }));
    }
    return points;
  }, [points, vsCurrency, idrRate]);

  const change = coin.price_change_percentage_24h ?? 0;
  const up = change >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: "rgba(6,8,13,0.72)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-xl rounded-t-2xl md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {coin.image && <img src={coin.image} alt="" className="w-9 h-9 rounded-full" />}
            <div>
              <div
                className="text-lg"
                style={{ fontFamily: "'Fraunces', serif", color: C.text }}
              >
                {coin.name}
                <span className="ml-2 text-sm" style={{ color: C.textMuted }}>
                  {coin.symbol?.toUpperCase()}
                </span>
              </div>
              <div
                className="text-2xl"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.gold }}
              >
                {fmtCryptoPrice(coin.current_price * (vsCurrency === "idr" ? idrRate || 1 : 1), vsCurrency)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: C.textMuted }} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div
          className="flex items-center gap-1 text-sm mb-4"
          style={{ color: up ? C.green : C.red, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(change).toFixed(2)}% (24 jam)
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { d: 1, l: "1H" },
            { d: 7, l: "7H" },
            { d: 30, l: "30H" },
          ].map((r) => (
            <button
              key={r.d}
              onClick={() => setRange(r.d)}
              className="px-3 py-1 rounded-md text-xs"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                background: range === r.d ? C.goldSoft : "transparent",
                color: range === r.d ? C.gold : C.textMuted,
                border: `1px solid ${range === r.d ? C.gold : C.borderSoft}`,
              }}
            >
              {r.l}
            </button>
          ))}
        </div>

        <div style={{ height: 220 }}>
          {loading ? (
            <div className="h-full flex items-center justify-center" style={{ color: C.textMuted }}>
              <RefreshCw className="animate-spin mr-2" size={16} />
              <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Memuat grafik...
              </span>
            </div>
          ) : err || !converted ? (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: C.textMuted }}>
              Grafik tidak tersedia.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={converted}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                  }}
                  labelFormatter={() => ""}
                  formatter={(v) => [fmtCryptoPrice(v, vsCurrency), "Harga"]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={up ? C.green : C.red}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <div>
            <div style={{ color: C.textFaint }}>KAPITALISASI PASAR</div>
            <div style={{ color: C.text }} className="mt-1">
              {vsCurrency === "idr" ? "Rp" : "$"} {fmtCompact(coin.market_cap * (vsCurrency === "idr" ? idrRate || 1 : 1))}
            </div>
          </div>
          <div>
            <div style={{ color: C.textFaint }}>VOLUME 24 JAM</div>
            <div style={{ color: C.text }} className="mt-1">
              {vsCurrency === "idr" ? "Rp" : "$"} {fmtCompact(coin.total_volume * (vsCurrency === "idr" ? idrRate || 1 : 1))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CryptoTracker({ coins, loading, error, onRetry, rates }) {
  const [query, setQuery] = useState("");
  const [vsCurrency, setVsCurrency] = useState("usd");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    if (!coins) return [];
    const q = query.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [coins, query]);

  const idrRate = rates?.IDR;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: C.textMuted }}>
        <RefreshCw className="animate-spin mr-2" size={18} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">
          Mengambil data pasar kripto...
        </span>
      </div>
    );
  }

  if (error || !coins) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm" style={{ color: C.textMuted }}>
          Data kripto tidak dapat dimuat.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: C.gold, color: "#181206" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div
          className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <Search size={16} color={C.textMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari koin, misal: bitcoin, eth..."
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: C.text, fontFamily: "'Inter', sans-serif" }}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {["usd", "idr"].map((v) => (
            <button
              key={v}
              onClick={() => setVsCurrency(v)}
              className="px-4 py-2.5 text-xs font-semibold"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                background: vsCurrency === v ? C.goldSoft : "transparent",
                color: vsCurrency === v ? C.gold : C.textMuted,
              }}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div
          className="hidden md:grid px-4 py-2 text-xs tracking-widest"
          style={{
            gridTemplateColumns: "2.2fr 1fr 0.8fr 1fr 1fr auto",
            background: C.surfaceAlt,
            color: C.textFaint,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <span>ASET</span>
          <span>HARGA</span>
          <span>24J</span>
          <span>TREN 7H</span>
          <span>KAP. PASAR</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>
            Tidak ada koin yang cocok dengan "{query}".
          </div>
        )}
        {filtered.slice(0, 60).map((c, idx) => {
          const up = (c.price_change_percentage_24h ?? 0) >= 0;
          const price =
            vsCurrency === "idr" && idrRate ? c.current_price * idrRate : c.current_price;
          const mcap = vsCurrency === "idr" && idrRate ? c.market_cap * idrRate : c.market_cap;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full grid md:grid-cols-[2.2fr_1fr_0.8fr_1fr_1fr_auto] grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-0 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
              style={{
                borderTop: idx === 0 ? "none" : `1px solid ${C.borderSoft}`,
              }}
            >
              <span className="flex items-center gap-3 md:col-auto">
                <img src={c.image} alt="" className="w-6 h-6 rounded-full" />
                <span>
                  <span className="block text-sm" style={{ color: C.text }}>
                    {c.name}
                  </span>
                  <span
                    className="block text-xs"
                    style={{ color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {c.symbol?.toUpperCase()}
                  </span>
                </span>
              </span>
              <span
                className="hidden md:block text-sm"
                style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {fmtCryptoPrice(price, vsCurrency)}
              </span>
              <span
                className="text-xs md:text-sm justify-self-end md:justify-self-start"
                style={{ color: up ? C.green : C.red, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {up ? "+" : ""}
                {(c.price_change_percentage_24h ?? 0).toFixed(2)}%
              </span>
              <span className="hidden md:block">
                <MiniSpark prices={c.sparkline_in_7d?.price} up={up} />
              </span>
              <span
                className="hidden md:block text-sm"
                style={{ color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {vsCurrency === "idr" ? "Rp" : "$"} {fmtCompact(mcap)}
              </span>
              <span className="hidden md:flex justify-end">
                <ChevronRight size={16} color={C.textFaint} />
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <CoinDetail
          coin={selected}
          rates={rates}
          vsCurrency={vsCurrency}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP                                                                  */
/* ------------------------------------------------------------------ */
export default function App() {
  useGoogleFonts();

  const [tab, setTab] = useState("currency");

  const [rates, setRates] = useState(null);
  const [ratesTime, setRatesTime] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);

  const [coins, setCoins] = useState(null);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [coinsError, setCoinsError] = useState(false);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(false);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.result === "success") {
        setRates(data.rates);
        setRatesTime(data.time_last_update_utc);
      } else {
        setRatesError(true);
      }
    } catch (e) {
      setRatesError(true);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const fetchCoins = useCallback(async () => {
    setCoinsLoading(true);
    setCoinsError(false);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=60&page=1&sparkline=true&price_change_percentage=24h"
      );
      const data = await res.json();
      if (Array.isArray(data)) setCoins(data);
      else setCoinsError(true);
    } catch (e) {
      setCoinsError(true);
    } finally {
      setCoinsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchCoins();
  }, [fetchRates, fetchCoins]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes kk-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        select option { background: ${C.surface}; }
        ::selection { background: ${C.goldSoft}; color: ${C.gold}; }
      `}</style>

      <TickerTape coins={coins} loading={coinsLoading} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-10 pb-24">
        <div className="mb-10">
          <div
            className="text-xs tracking-[0.25em] mb-3"
            style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            PASAR REAL-TIME
          </div>
          <h1
            className="text-4xl md:text-5xl mb-3"
            style={{ fontFamily: "'Fraunces', serif", color: C.text, fontWeight: 500 }}
          >
            Kurs &amp; Koin
          </h1>
          <p className="text-sm md:text-base max-w-lg" style={{ color: C.textMuted }}>
            Konversi mata uang asing dan pantau pergerakan harga kripto, dalam satu meja kerja.
          </p>
        </div>

        <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {[
            { id: "currency", label: "Konversi Mata Uang" },
            { id: "crypto", label: "Tracker Kripto" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.id ? C.goldSoft : "transparent",
                color: tab === t.id ? C.gold : C.textMuted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "currency" ? (
          <CurrencyConverter
            rates={rates}
            ratesTime={ratesTime}
            loading={ratesLoading}
            error={ratesError}
            onRetry={fetchRates}
          />
        ) : (
          <CryptoTracker
            coins={coins}
            loading={coinsLoading}
            error={coinsError}
            onRetry={fetchCoins}
            rates={rates}
          />
        )}

        <div
          className="mt-16 pt-6 text-xs flex flex-wrap gap-x-6 gap-y-1"
          style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span>Data kurs: ExchangeRate-API (open.er-api.com)</span>
          <span>Data kripto: CoinGecko API</span>
        </div>
      </div>
    </div>
  );
}
