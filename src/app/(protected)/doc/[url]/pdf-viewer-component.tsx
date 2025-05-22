import React, { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { usePathname } from 'next/navigation'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const convertToProperUrl = (urlSafeString: string): string => {
  const withColons = urlSafeString.replace(/^([a-zA-Z]+)\/\//, '$1://')
  return decodeURIComponent(withColons)
}

export default function PDFViewerComponent() {
  const pathname = usePathname()
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [error, setError] = useState(false)

  const urlSafe = pathname.replace(/^\/doc\//, '')
  const url = convertToProperUrl(urlSafe)

  useEffect(() => {
    const updatePageDimensions = () => {
      const containerWidth = window.innerWidth
      let width = Math.min(600, containerWidth - 60)
      setPageWidth(width)
    }

    updatePageDimensions()
    window.addEventListener('resize', updatePageDimensions)
    return () => window.removeEventListener('resize', updatePageDimensions)
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setError(false)
  }

  function onDocumentLoadError(error: Error) {
    setError(true)
    console.error('Error loading PDF:', error)
  }

  return (
    <div className="relative h-full w-full max-w-full">
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Failed to load PDF.</p>
        </div>
      )}
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col items-start justify-start">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex w-full flex-col items-start"
            loading={''}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="w-full [&:not(:last-child)]:mb-[1px]"
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
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  )
}
