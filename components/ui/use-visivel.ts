'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Fica `true` (e continua) quando o elemento entra na tela. Serve para as
 * barras de medida crescerem só quando a pessoa chega nelas.
 */
export function useVisivel<T extends Element>(limite = 0.35) {
  const ref = useRef<T>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true)
      return
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { threshold: limite },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [limite])

  return [ref, visivel] as const
}
