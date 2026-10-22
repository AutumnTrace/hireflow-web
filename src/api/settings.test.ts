import { graphqlHttpUrl, graphqlWsUrl } from './settings'

describe('API URLs', () => {
  it('builds the HTTP endpoint and tolerates trailing slashes', () => {
    expect(graphqlHttpUrl('http://localhost:5230/')).toBe('http://localhost:5230/graphql')
    expect(graphqlHttpUrl('')).toBe('/graphql')
  })

  it('derives a WebSocket URL with the matching scheme', () => {
    expect(graphqlWsUrl('https://api.example.com')).toBe('wss://api.example.com/graphql')
    expect(graphqlWsUrl('http://localhost:5230')).toBe('ws://localhost:5230/graphql')
  })

  it('falls back to the current origin for the dev proxy', () => {
    expect(graphqlWsUrl('', { protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/graphql')
  })
})
