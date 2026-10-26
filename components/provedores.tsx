'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Respeita a preferência "reduzir movimento" do sistema em todas as animações
 * do framer-motion: transformações e deslocamentos viram trocas simples.
 */
export function Provedores({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
