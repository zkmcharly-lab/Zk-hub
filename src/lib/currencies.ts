export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR' },
] as const

export type CurrencyCode = 'USD' | 'EUR' | 'MXN' | 'ARS'

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
}

export function formatCurrency(amount: number | null | undefined, currencyCode?: string | null): string {
  if (amount === null || amount === undefined) return '—'
  const currency = getCurrency(currencyCode ?? 'USD')
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`
  }
}

export function getCurrencySymbol(code: string): string {
  return getCurrency(code).symbol
}
