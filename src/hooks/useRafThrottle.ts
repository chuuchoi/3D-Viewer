import { useRef, useEffect, useCallback } from "react"

function useRafThrottle<T>(callback: (arg: T) => void) {
  const rafRef = useRef<number>(0)
  const lastArgRef = useRef<T>(null)
  const isPendingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return useCallback((arg: T) => {
    lastArgRef.current = arg
    isPendingRef.current = true

    if (rafRef.current) return

    rafRef.current = requestAnimationFrame(() => {
      if (isPendingRef.current) {
        callback(lastArgRef.current as T)
        isPendingRef.current = false
      }
      rafRef.current = 0
    })
  }, [callback])
}

export default useRafThrottle
