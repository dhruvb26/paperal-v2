import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCitationStore } from '@/stores/citation-store'

interface CitationProps {
  citation: string
  count: number
}

export default function Citation({ citation, count }: CitationProps) {
  const setHoveredChunkId = useCitationStore((state) => state.setHoveredChunkId)

  const handleMouseEnter = () => {
    try {
      const match = citation.match(/^(.+?)\[(\d+)\]$/)
      if (match) {
        const chunkId = match[1]
        const pageNumber = parseInt(match[2], 10)
        setHoveredChunkId(chunkId, pageNumber)
      } else {
        setHoveredChunkId(citation, null)
      }
    } catch (error) {
      console.error('Error parsing citation:', error)
      setHoveredChunkId(null, null)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setHoveredChunkId(null, null)}
          className="inline-flex items-center align-baseline"
        >
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium rounded-full bg-primary/10 text-primary ml-1 align-text-top">
            {count}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Source: {citation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
