import { useQuery } from '@tanstack/react-query'

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.frankfurter.app/latest?from=USD")
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        return { ...data.rates, USD: 1 } as Record<string, number>
      } catch (err) {
        console.warn("Fallo Frankfurter API, intentando fallback:", err)
        try {
          const res2 = await fetch("https://open.er-api.com/v6/latest/USD")
          if (!res2.ok) throw new Error("Fallback API error")
          const data2 = await res2.json()
          return data2.rates as Record<string, number>
        } catch (err2) {
          console.error("Fallo ambas APIs de tasas:", err2)
          // Retornar tasas por defecto cableadas como último recurso
          return {
            USD: 1,
            EUR: 0.92,
            MXN: 16.8,
            ARS: 880,
            GBP: 0.79,
            CLP: 920,
            COP: 3900,
            BRL: 5.15,
          } as Record<string, number>
        }
      }
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 horas de caché
  })
}

export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number>): number {
  const fromCode = from?.toUpperCase() || 'USD'
  const toCode = to?.toUpperCase() || 'USD'
  
  if (fromCode === toCode) return amount
  
  const fromRate = rates[fromCode]
  const toRate = rates[toCode]
  
  if (!fromRate || !toRate) return amount
  
  // Como la base de las tasas es USD:
  // Convertimos de la moneda origen a USD, luego de USD a la moneda destino
  const inUSD = amount / fromRate
  return inUSD * toRate
}
