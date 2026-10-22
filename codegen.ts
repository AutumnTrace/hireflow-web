import type { CodegenConfig } from '@graphql-codegen/cli'

// Typed documents generated from the HireFlow API contract (schema.graphql is synced from
// https://github.com/AutumnTrace/hireflow with `npm run schema:pull`).
const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  ignoreNoDocuments: false,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: { UUID: 'string', DateTime: 'string' },
      },
    },
  },
}

export default config
