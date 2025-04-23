// Server Component
import NovelPageClient from './NovelPageClient'

// 使用默认的 Next.js 页面组件，不使用额外的异步包装
export default function NovelPage({ params }: { params: { levelId: string } }) {
  return <NovelPageClient levelId={params.levelId} />
} 