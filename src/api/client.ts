import { createClient as createWsClient } from 'graphql-ws'
import { Client, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { graphqlHttpUrl, graphqlWsUrl } from './settings'

/** urql client for a real HireFlow API: HTTP for queries/mutations, graphql-ws for subscriptions. */
export function createLiveClient(apiUrl: string, token: string): { client: Client; dispose: () => void } {
  const ws = createWsClient({
    url: graphqlWsUrl(apiUrl),
    // Browsers cannot set headers on a WebSocket handshake; the API reads this payload instead.
    connectionParams: () => ({ Authorization: `Bearer ${token}` }),
    lazy: true,
    retryAttempts: 5,
  })

  const client = new Client({
    url: graphqlHttpUrl(apiUrl),
    fetchOptions: () => ({ headers: { Authorization: `Bearer ${token}` } }),
    exchanges: [
      cacheExchange,
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query ?? '' }
          return {
            subscribe(sink) {
              const unsubscribe = ws.subscribe(input, sink)
              return { unsubscribe }
            },
          }
        },
      }),
    ],
  })

  return { client, dispose: () => void ws.dispose() }
}
