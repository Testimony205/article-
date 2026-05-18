import { loadEnvFile } from './load-env'

loadEnvFile()

async function main() {
  console.log('Starting vectorization of all articles...')
  
  try {
    const { recomputeAllVectors } = await import('../lib/vectorizer')
    await recomputeAllVectors()
    console.log('Vectorization complete!')
  } catch (error) {
    console.error('Error during vectorization:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

main()
