import { PageDimensions } from '@/types/file'
import { useCallback, useRef } from 'react'

interface UsePDFViewerProps {
  pageDimensions: PageDimensions
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  pageRefs: React.RefObject<Record<number, HTMLDivElement | null>>
  setPageWidth: (width: number) => void
}

export function usePDFViewer({
  pageDimensions,
  scrollContainerRef,
  pageRefs,
  setPageWidth,
}: UsePDFViewerProps) {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToPage = useCallback(
    (pageNumber: number) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (scrollContainerRef.current && pageRefs.current[pageNumber]) {
          const pageElement = pageRefs.current[pageNumber]
          if (pageElement) {
            const container = scrollContainerRef.current
            const containerRect = container.getBoundingClientRect()
            const pageRect = pageElement.getBoundingClientRect()

            if (
              pageRect.top < containerRect.top ||
              pageRect.bottom > containerRect.bottom
            ) {
              pageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          }
        }
      }, 300)
    },
    [scrollContainerRef, pageRefs]
  )

  const calculateScale = useCallback(
    (containerWidth: number) => {
      const newWidth = containerWidth * 0.95
      setPageWidth(newWidth)

      let maxPageWidth = 0
      Object.values(pageDimensions).forEach(
        (dim: { page_width: number; page_height: number }) => {
          if (dim.page_width > maxPageWidth) {
            maxPageWidth = dim.page_width
          }
        }
      )

      return newWidth / maxPageWidth
    },
    [pageDimensions, setPageWidth]
  )

  return {
    scrollToPage,
    calculateScale,
    scrollTimeoutRef,
  }
}
