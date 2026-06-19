import { useCallback, useEffect, useState } from 'react'

type AsyncDataState<T> = {
  data?: T
  error?: unknown
  isLoading: boolean
  isFetching: boolean
}

export function useAsyncData<T>(load: () => Promise<T>, enabled = true) {
  const [state, setState] = useState<AsyncDataState<T>>({
    isLoading: enabled,
    isFetching: false,
  })

  const refetch = useCallback(async () => {
    if (!enabled) {
      return undefined
    }

    setState((current) => ({
      ...current,
      error: undefined,
      isLoading: current.data === undefined,
      isFetching: true,
    }))

    try {
      const data = await load()
      setState({ data, isLoading: false, isFetching: false })
      return data
    } catch (error) {
      setState((current) => ({
        ...current,
        error,
        isLoading: false,
        isFetching: false,
      }))
      throw error
    }
  }, [enabled, load])

  useEffect(() => {
    if (!enabled) {
      setState({ isLoading: false, isFetching: false })
      return
    }

    let isCurrent = true
    setState((current) => ({
      ...current,
      error: undefined,
      isLoading: current.data === undefined,
      isFetching: true,
    }))

    load()
      .then((data) => {
        if (isCurrent) {
          setState({ data, isLoading: false, isFetching: false })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setState((current) => ({
            ...current,
            error,
            isLoading: false,
            isFetching: false,
          }))
        }
      })

    return () => {
      isCurrent = false
    }
  }, [enabled, load])

  return { ...state, refetch }
}

export function useAsyncMutation<TArgs, TResult>(mutate: (args: TArgs) => Promise<TResult>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>()

  const run = useCallback(
    async (args: TArgs) => {
      setIsLoading(true)
      setError(undefined)
      try {
        return await mutate(args)
      } catch (mutationError) {
        setError(mutationError)
        throw mutationError
      } finally {
        setIsLoading(false)
      }
    },
    [mutate],
  )

  return [run, { isLoading, error }] as const
}
