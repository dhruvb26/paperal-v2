'use client'

import Loader from '@/components/global/loader'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { convertToProperUrl } from '@/utils/parse-url'
import { getChunks } from '@/backend/actions/chunk'
import PDFChat from '@/components/chat/pdf-chat'
import { Chunk } from '@/types/chunk'
import { getFile } from '@/backend/actions/file'
import { PageDimensions } from '@/types/file'

const PDF = dynamic(
  () => import('./pdf-viewer-component').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    ),
  }
)

export default function PDFPage() {
  const pathname = usePathname()
  const urlSafe = pathname.replace(/^\/doc\//, '')
  const url = convertToProperUrl(urlSafe)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({})

  useEffect(() => {
    const fetchPdfInfo = async () => {
      const [chunks, pageDimensions] = await Promise.all([
        getChunks(url),
        getFile(url).then((file) => file.pageDimensions),
      ])
      setChunks(chunks)
      setPageDimensions(pageDimensions)
    }
    fetchPdfInfo()
  }, [url])

  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full border-r">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Loader />
            </div>
          }
        >
          <PDF url={url} chunks={chunks} pageDimensions={pageDimensions} />
        </Suspense>
      </div>
      <div className="w-1/2 h-full">
        <PDFChat url={url} />
      </div>
    </div>
  )
}
