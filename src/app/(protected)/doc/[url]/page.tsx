'use client'

import Loader from '@/components/global/loader'
import dynamic from 'next/dynamic'

const PDF = dynamic(() => import('./pdf-viewer-component'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader />
    </div>
  ),
})

export default function PDFPage() {
  return <PDF />
}
