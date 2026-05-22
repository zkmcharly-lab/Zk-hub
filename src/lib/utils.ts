import { formatCurrency as _fmt } from './currencies'

export { formatCurrency } from './currencies'

const PALETTE = ['#E8193C', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function relativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`
  const m = Math.floor(diff / 2592000)
  return `hace ${m} mes${m > 1 ? 'es' : ''}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

import { type ClassValue, clsx as clsxBase } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsxBase(inputs))
}
