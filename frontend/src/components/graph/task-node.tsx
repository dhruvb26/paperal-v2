'use client'
import { TaskNode } from '@/types/graph'
import { Handle, Position } from '@xyflow/react'
import React from 'react'

function TaskNodeComponent({ data }: { data: TaskNode }) {
  return (
    <div className="p-4 text-black text-xl font-semibold rounded-md bg-background border border-black">
      <Handle type="target" position={Position.Left} />
      Paper [{data.task_id}]
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default React.memo(TaskNodeComponent)
