'use client'

import { useEffect, useState, useMemo } from 'react'
import { GraphData } from 'react-force-graph-2d'
import { Link, Node } from '@/types/graph'
import { getGraph } from '@/backend/actions/graph'
import Loader from '@/components/global/loader'
import FlowComponent from '@/components/graph/flow-component'
import dynamic from 'next/dynamic'

const NodeComponent = dynamic(
  () => import('@/components/graph/node-component'),
  {
    ssr: false,
  }
)
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from '@/components/ui/select'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData<Node, Link> | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([])

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const makeReq = async () => {
      const data = await getGraph('01d88d85-9dd6-407d-b9f2-9dcb17b8aabc')
      setGraphData(data)
    }
    makeReq()
  }, [])

  const typeOrder = ['task', 'origin', 'cited']
  const columnWidth = dimensions.width / (typeOrder.length - 1)

  const safeNodes = graphData?.nodes ?? []
  const safeLinks = graphData?.links ?? []

  const nodes = useMemo(() => {
    const nodesByType: Record<string, Node[]> = safeNodes.reduce(
      (acc, node) => {
        const type = node.labels[0].toLowerCase()
        if (!acc[type]) acc[type] = []
        acc[type].push(node)
        return acc
      },
      {} as Record<string, Node[]>
    )

    return typeOrder.flatMap((type, typeIndex) => {
      const nodesOfType = nodesByType[type] || []
      const spacing = dimensions.height / (nodesOfType.length + 1)
      return nodesOfType.map((node, idx) => ({
        id: node.id,
        position: {
          x: typeIndex * columnWidth,
          y: spacing * (idx + 1),
        },
        type,
        data: { ...node },
      }))
    })
  }, [safeNodes, dimensions.height, columnWidth])

  const edges = useMemo(
    () =>
      safeLinks.map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
      })),
    [safeLinks]
  )

  if (!graphData || dimensions.width === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  const originNodes = nodes.filter((n) =>
    selectedChunkIds.includes(n.data.chunk_id)
  )

  const allOriginNodes = nodes.filter((n) => n.data.labels[0] === 'Origin')
  const taskNode = nodes.find((n) => n.data.labels[0] === 'Task')

  // Only compute the graph elements if nodes are selected
  let finalNodes: typeof nodes = []
  let finalEdges: typeof edges = []

  if (selectedChunkIds.length > 0 && originNodes.length > 0) {
    // Track all target nodes and edges to avoid duplicates
    const targetNodesMap = new Map()
    const edgesMap = new Map()

    // For each selected origin node
    for (const originNode of originNodes) {
      // Get all edges where this origin node is the source
      const outgoingEdges = edges.filter((e) => e.source === originNode.id)

      // Get target nodes of those edges
      const targetIds = outgoingEdges.map((e) => e.target)
      const targetNodes = nodes.filter((n) => targetIds.includes(n.id))

      // Add target nodes to map to avoid duplicates
      targetNodes.forEach((node) => targetNodesMap.set(node.id, node))

      // Get the edge from task to this origin node
      if (taskNode) {
        const taskEdge = edges.find(
          (e) => e.source === taskNode.id && e.target === originNode.id
        )
        if (taskEdge) {
          edgesMap.set(taskEdge.id, taskEdge)
        }
      }

      // Add outgoing edges to map
      outgoingEdges.forEach((edge) => edgesMap.set(edge.id, edge))
    }

    // Combine all unique nodes and edges
    finalNodes = [...originNodes, ...Array.from(targetNodesMap.values())]
    if (taskNode) finalNodes.push(taskNode)

    finalEdges = Array.from(edgesMap.values())
  }

  const toggleChunkId = (chunkId: string) => {
    setSelectedChunkIds((prev) =>
      prev.includes(chunkId)
        ? prev.filter((id) => id !== chunkId)
        : [...prev, chunkId]
    )
  }

  const removeChunkId = (chunkId: string) => {
    setSelectedChunkIds((prev) => prev.filter((id) => id !== chunkId))
  }

  return (
    <>
      <div className="flex flex-col gap-2 top-4 left-4 z-10 absolute p-4 max-w-xl">
        <Select onValueChange={(value) => toggleChunkId(value)}>
          <SelectTrigger className="w-[300px] bg-background">
            <SelectValue placeholder="Select origin nodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Origin Nodes</SelectLabel>
              {allOriginNodes.map((node) => (
                <SelectItem
                  key={node.data.chunk_id}
                  value={node.data.chunk_id}
                  className="flex items-center justify-between pr-2"
                >
                  <div className="flex items-center">
                    <span
                      className={cn(
                        'mr-2 h-4 w-4 flex items-center justify-center',
                        selectedChunkIds.includes(node.data.chunk_id)
                          ? 'text-primary'
                          : 'opacity-0'
                      )}
                    >
                      {selectedChunkIds.includes(node.data.chunk_id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </span>
                    {node.data.content.substring(0, 50)}...
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {selectedChunkIds.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {selectedChunkIds.map((chunkId) => {
              const node = allOriginNodes.find(
                (n) => n.data.chunk_id === chunkId
              )
              return (
                <Badge
                  key={chunkId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {node?.data.content.substring(0, 20)}...
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeChunkId(chunkId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}
          </div>
        )}
      </div>
      {selectedChunkIds.length > 0 ? (
        <FlowComponent
          nodes={finalNodes.filter(Boolean)}
          edges={finalEdges.filter(Boolean)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Select one or more nodes to view the graph.
          </p>
        </div>
      )}
      {/* <NodeComponent graphData={graphData} /> */}
    </>
  )
}
