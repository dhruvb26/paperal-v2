'use client'
import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  MiniMap,
  Controls,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import TaskNodeComponent from '@/components/graph/task-node'
import OriginNodeComponent from '@/components/graph/origin-node'
import CitedNodeComponent from '@/components/graph/cited-node'
import { BackgroundVariant } from '@xyflow/react'

interface FlowComponentProps {
  nodes: any[]
  edges: any[]
}

export default function FlowComponent({
  nodes: initialNodes,
  edges: initialEdges,
}: FlowComponentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

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
