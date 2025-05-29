'use client'

import { useEffect, useState, useMemo } from 'react'
import { GraphData } from 'react-force-graph-2d'
import { Link, Node } from '@/types/graph'
import { getGraph } from '@/backend/actions/graph'
import Loader from '@/components/global/loader'
import dynamic from 'next/dynamic'
import FlowComponent from '@/components/graph/flow-component'
const NodeComponent = dynamic(
  () => import('@/components/graph/node-component'),
  {
    ssr: false,
  }
)

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData<Node, Link> | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

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
      const data = await getGraph()
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

  const originNodes = nodes.filter(
    (n) => n.data.chunk_id === '5a0e7213-522d-468a-b771-8f9793d6d9c3'
  )

  const outgoingEdges = edges.filter((e) => e.source === originNodes[0]?.id)

  const targetIds = outgoingEdges.map((e) => e.target)

  const targetNodes = nodes.filter((n) => targetIds.includes(n.id))

  const taskNode = nodes.find((n) => n.data.labels[0] === 'Task')

  const taskEdge = edges.find(
    (e) => e.source === taskNode?.id && e.target === originNodes[0]?.id
  )

  const finalEdges = [...outgoingEdges, taskEdge]

  const finalNodes = [...originNodes, ...targetNodes, taskNode]

  return (
    <>
      {/* <NodeComponent graphData={graphData} /> */}
      <FlowComponent nodes={finalNodes} edges={finalEdges} />
    </>
  )
}
