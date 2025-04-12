// Server Component
import React from 'react'
import NovelPageClient from './NovelPageClient'

export default function NovelPage({ params }: { params: { levelId: string } }) {
  const levelId = params.levelId
  return <NovelPageClient levelId={levelId} />
} 