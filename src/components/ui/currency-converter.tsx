import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const CURRENCIES = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
];

interface Props {
  defaultFrom?: string;
  defaultTo?: string;
}

export function CurrencyConverter({ defaultFrom = "MXN", defaultTo = "USD" }: Props) {
  const [fromCurrency, setFromCurrency] = useState(defaultFrom);
  const [toCurrency, setToCurrency] = useState(defaultTo);
  const [fromAmount, setFromAmount] = useState("1");
  const [toAmount, setToAmount] = useState("");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastEdited, setLastEdited] = useState<"from" | "to">("from");

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setRates({ ...data.rates, USD: 1 });
      setLastUpdated(new Date());
    } catch {
      try {
        const res2 = await fetch("https://open.er-api.com/v6/latest/USD");
        const data2 = await res2.json();
        setRates(data2.rates);
        setLastUpdated(new Date());
      } catch {
        setError("No se pudo obtener las tasas de cambio");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const convert = useCallback((amount: string, from: string, to: string): string => {
    if (!rates || !amount || isNaN(parseFloat(amount))) return "";
    const fromRate = rates[from];
    const toRate = rates[to];
    if (!fromRate || !toRate) return "";
    const result = (parseFloat(amount) / fromRate) * toRate;
    if (["ARS", "CLP", "COP"].includes(to)) {
      return result.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }, [rates]);

  useEffect(() => {
    if (!rates) return;
    if (lastEdited === "from") {
      setToAmount(convert(fromAmount, fromCurrency, toCurrency));
    } else {
      setFromAmount(convert(toAmount, toCurrency, fromCurrency));
    }
  }, [fromAmount, toAmount, fromCurrency, toCurrency, rates, lastEdited, convert]);

  const handleFromChange = (val: string) => { setLastEdited("from"); setFromAmount(val); };
  const handleToChange  = (val: string) => { setLastEdited("to");   setToAmount(val);  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setLastEdited("from");
    setFromAmount(toAmount || "1");
  };

  const openGoogle = () => {
    window.open(`https://www.google.com/search?q=${fromAmount}+${fromCurrency}+to+${toCurrency}`, "_blank");
  };

  const getRateDisplay = () => {
    if (!rates) return "";
    return `1 ${fromCurrency} = ${convert("1", fromCurrency, toCurrency)} ${toCurrency}`;
  };

  const inputBox: React.CSSProperties = {
    background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 8,
  };
  const label: React.CSSProperties = {
    fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const numInput: React.CSSProperties = {
    flex: 1, background: "transparent", border: "none", outline: "none",
    fontSize: 24, fontWeight: 600, fontFamily: "Inter, sans-serif", minWidth: 0,
  };
  const currSelect: React.CSSProperties = {
    background: "#f0f0f3", border: "1px solid #e5e7eb", borderRadius: 8,
    color: "#0f172a", fontSize: 14, fontWeight: 600, padding: "6px 10px",
    cursor: "pointer", outline: "none", flexShrink: 0,
  };

  return (
    <div style={{ background: "#f9f9fb", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, width: "100%", maxWidth: 420, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Conversor de divisas</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {lastUpdated && (
            <span style={{ fontSize: 10, color: "#4b5563" }}>
              Tasa: {lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchRates} disabled={loading} title="Actualizar tasas"
            style={{ background: "transparent", border: "none", color: loading ? "#4b5563" : "#6b7280", cursor: loading ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", lineHeight: 0 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", padding: 12 }}>
          {error}
          <button onClick={openGoogle} style={{ display: "block", margin: "8px auto 0", color: "#E8193C", background: "transparent", border: "1px solid #E8193C", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
            Abrir en Google →
          </button>
        </div>
      ) : (
        <>
          {/* FROM */}
          <div style={inputBox}>
            <p style={label}>Monto</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number" value={fromAmount} onChange={(e) => handleFromChange(e.target.value)}
                style={{ ...numInput, color: "#0f172a" }} placeholder="0"
              />
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} style={currSelect}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code} style={{ background: "#f0f0f3" }}>{c.code}</option>)}
              </select>
            </div>
            <p style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
              {CURRENCIES.find((c) => c.code === fromCurrency)?.name}
            </p>
          </div>

          {/* SWAP */}
          <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
            <button
              onClick={swapCurrencies}
              title="Invertir divisas"
              style={{ background: "#f0f0f3", border: "1px solid #e5e7eb", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b7280", fontSize: 18, transition: "all 150ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8193C"; (e.currentTarget as HTMLButtonElement).style.color = "#E8193C"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
            >
              ⇅
            </button>
          </div>

          {/* TO */}
          <div style={inputBox}>
            <p style={label}>Equivale a</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number" value={toAmount} onChange={(e) => handleToChange(e.target.value)}
                style={{ ...numInput, color: "#10b981" }} placeholder="0"
              />
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} style={currSelect}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code} style={{ background: "#f0f0f3" }}>{c.code}</option>)}
              </select>
            </div>
            <p style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
              {CURRENCIES.find((c) => c.code === toCurrency)?.name}
            </p>
          </div>

          {/* RATE DISPLAY */}
          {!loading && rates && (
            <div style={{ background: "#ffffff", borderRadius: 8, padding: "10px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#a3a3a3" }}>{getRateDisplay()}</span>
              <span style={{ fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: 4 }}>En vivo</span>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", color: "#4b5563", fontSize: 12, padding: 8 }}>
              Cargando tasas...
            </div>
          )}

          {/* GOOGLE FALLBACK */}
          <button
            onClick={openGoogle}
            style={{ width: "100%", background: "transparent", border: "1px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontSize: 12, padding: 8, cursor: "pointer", transition: "all 150ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8193C"; (e.currentTarget as HTMLButtonElement).style.color = "#E8193C"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
          >
            Ver en Google →
          </button>
        </>
      )}
    </div>
  );
}
