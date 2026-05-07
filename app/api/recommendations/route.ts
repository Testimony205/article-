import { NextRequest, NextResponse } from 'next/server'
import { getPersonalizedRecommendations } from '@/lib/recommendation-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const recommendations = await getPersonalizedRecommendations(limit)

    return NextResponse.json({
      articles: recommendations,
      personalized: recommendations.length > 0,
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
