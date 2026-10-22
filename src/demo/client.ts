import { executeExchange } from '@urql/exchange-execute'
import { Client, cacheExchange } from 'urql'
import { createDemoStore } from './data'
import { createPubSub } from './pubsub'
import { createDemoSchema } from './schema'

/** urql client that executes every operation in the browser against the demo schema. No network involved. */
export function createDemoClient(): Client {
  const schema = createDemoSchema(createDemoStore(), createPubSub())
  return new Client({
    url: 'demo://hireflow',
    exchanges: [cacheExchange, executeExchange({ schema })],
  })
}
