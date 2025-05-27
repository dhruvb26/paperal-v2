'use client'

import BoundingBox from '@/components/chat/bounding-box'
import { useSelectedTextStore } from '@/stores/selected-text-store'
import { useCitationStore } from '@/stores/citation-store'
import React, { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { Chunk } from '@/types/chunk'
import { usePDFViewer } from '@/hooks/use-pdf-viewer'
import { PageDimensions } from '@/types/file'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PDFViewerComponent({
  url,
  chunks,
  pageDimensions,
}: {
  url: string
  chunks: Chunk[]
  pageDimensions: PageDimensions
}) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [error, setError] = useState(false)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const setSelectedText = useSelectedTextStore((state) => state.setSelectedText)
  const hoveredChunkPage = useCitationStore((state) => state.hoveredChunkPage)
  const { scrollToPage, calculateScale, scrollTimeoutRef } = usePDFViewer({
    pageDimensions,
    scrollContainerRef,
    pageRefs,
    setPageWidth,
  })

  useEffect(() => {
    if (hoveredChunkPage) {
      scrollToPage(hoveredChunkPage)
    }
  }, [hoveredChunkPage, scrollToPage])

  useEffect(() => {
    const timeoutRef = scrollTimeoutRef.current
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef)
      }
    }
  }, [scrollTimeoutRef])

  useEffect(() => {
    const updatePageDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const newScale = calculateScale(containerWidth)
        setScale(newScale)
      }
    }
    updatePageDimensions()
    window.addEventListener('resize', updatePageDimensions)
    return () => window.removeEventListener('resize', updatePageDimensions)
  }, [calculateScale])

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim())
      }
    }

    document.addEventListener('mouseup', handleTextSelection)
    return () => document.removeEventListener('mouseup', handleTextSelection)
  }, [setSelectedText])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setError(false)
  }

  function onDocumentLoadError(error: Error) {
    setError(true)
    console.error('Error loading PDF:', error)
  }

  return (
    <div className="relative h-full w-full max-w-full" ref={containerRef}>
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Failed to load PDF.</p>
        </div>
      )}
      <div className="h-full overflow-y-auto px-4" ref={scrollContainerRef}>
        <div className="flex flex-col items-center justify-start">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex w-full flex-col items-center"
            loading={''}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="relative w-full [&:not(:last-child)]:mb-4"
                ref={(el) => {
                  pageRefs.current[index + 1] = el
                }}
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  onRenderError={(error) =>
                    console.error(`Error rendering page ${index + 1}:`, error)
                  }
                  loading={''}
                />
                <BoundingBox
                  chunks={chunks}
                  pageNumber={index + 1}
                  scale={scale}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  )
}
