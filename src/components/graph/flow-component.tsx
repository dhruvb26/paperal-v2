'use client'
import React, { useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  MiniMap,
  BackgroundVariant,
  Controls,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import TaskNodeComponent from '@/components/graph/task-node'
import OriginNodeComponent from '@/components/graph/origin-node'
import CitedNodeComponent from '@/components/graph/cited-node'
import { Link, Node } from '@/types/graph'

interface FlowNode {
  id: string
  position: {
    x: number
    y: number
  }
  type: string
  data: Node
}

interface FlowComponentProps {
  nodes: FlowNode[]
  edges: Omit<Link, 'type'>[]
}

export default function FlowComponent({
  nodes: initialNodes,
  edges: initialEdges,
}: FlowComponentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const nodeTypes = useMemo(
    () => ({
      task: TaskNodeComponent,
      origin: OriginNodeComponent,
      cited: CitedNodeComponent,
    }),
    []
  )

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        panOnDrag={true}
        zoomOnScroll={true}
        nodesDraggable={true}
        nodesConnectable={false}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
