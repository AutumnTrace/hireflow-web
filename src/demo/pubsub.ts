type Listener<T> = (payload: T) => void

/** Minimal topic pub/sub that hands GraphQL subscriptions an AsyncIterator, like the API's in-memory provider. */
export function createPubSub() {
  const topics = new Map<string, Set<Listener<unknown>>>()

  return {
    publish<T>(topic: string, payload: T) {
      topics.get(topic)?.forEach((listener) => listener(payload))
    },

    subscribe<T>(topic: string): AsyncIterableIterator<T> {
      const queue: T[] = []
      const waiting: ((result: IteratorResult<T>) => void)[] = []
      let done = false

      const listener: Listener<unknown> = (payload) => {
        const resolve = waiting.shift()
        if (resolve) resolve({ value: payload as T, done: false })
        else queue.push(payload as T)
      }

      const listeners = topics.get(topic) ?? new Set()
      listeners.add(listener)
      topics.set(topic, listeners)

      const close = (): Promise<IteratorResult<T>> => {
        done = true
        listeners.delete(listener)
        waiting.splice(0).forEach((resolve) => resolve({ value: undefined, done: true }))
        return Promise.resolve({ value: undefined, done: true })
      }

      return {
        next() {
          if (queue.length > 0) return Promise.resolve({ value: queue.shift()!, done: false })
          if (done) return Promise.resolve({ value: undefined, done: true })
          return new Promise((resolve) => waiting.push(resolve))
        },
        return: close,
        throw: (error?: unknown) => close().then(() => Promise.reject(error)),
        [Symbol.asyncIterator]() {
          return this
        },
      }
    },
  }
}

export type PubSub = ReturnType<typeof createPubSub>
