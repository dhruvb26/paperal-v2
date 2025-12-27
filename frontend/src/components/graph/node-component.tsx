'use client'

import ForceGraph2D, { GraphData } from 'react-force-graph-2d'
import { Node, Link } from '@/types/graph'

function NodeComponent({ graphData }: { graphData: GraphData<Node, Link> }) {
  function findCorrectInfo(node: Node) {
    if (node.labels[0] === 'Cited') {
      return node.title
    }
    if (node.labels[0] === 'Origin') {
      return node.chunk_id
    }
    if (node.labels[0] === 'Task') {
      return node.task_id
    }
    return ''
  }

  return (
    <div className="h-screen w-screen">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node) => {
          const info = findCorrectInfo(node)
          return `${info}`
        }}
        linkLabel={(link) => `-${link.type}-`}
        nodeCanvasObject={(node: Node, ctx) => {
          const nodeColor = node.color
          const nodeSize = 3
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false)
          ctx.fillStyle = nodeColor
          ctx.fill()

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }}
        linkDirectionalArrowLength={1}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0}
      />
    </div>
  )
}

export default NodeComponent
