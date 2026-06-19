import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useGsapFadeIn<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    gsap.fromTo(
      ref.current,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power2.out' },
    )
  }, [])

  return ref
}
