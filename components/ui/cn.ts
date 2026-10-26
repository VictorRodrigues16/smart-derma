import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Junta classes e resolve conflito do Tailwind (a última vence). */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas))
}
