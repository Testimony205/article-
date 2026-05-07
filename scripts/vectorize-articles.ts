import { recomputeAllVectors } from '../lib/vectorizer'

async function main() {
  console.log('Starting vectorization of all articles...')
  
  try {
    await recomputeAllVectors()
    console.log('Vectorization complete!')
  } catch (error) {
    console.error('Error during vectorization:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

main()
