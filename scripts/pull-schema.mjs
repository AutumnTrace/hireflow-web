// Syncs the API contract from the HireFlow repo, then regenerates typed documents.
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const ref = process.argv[2] ?? 'main'
const url = `https://raw.githubusercontent.com/AutumnTrace/hireflow/${ref}/schema.graphql`

const response = await fetch(url)
if (!response.ok) {
  throw new Error(`Failed to download schema from ${url}: ${response.status}`)
}

writeFileSync('schema.graphql', await response.text())
console.log(`schema.graphql updated from ${url}`)
execSync('npm run codegen', { stdio: 'inherit' })
