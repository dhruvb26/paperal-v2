'use client'
import { OriginNode } from '@/types/graph'
import { Handle, Position } from '@xyflow/react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

function OriginNodeComponent({ data }: { data: OriginNode }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      style={{ backgroundColor: '#fff', fontSize: '20px', width: '512px' }}
      className="p-4 text-black rounded-md border border-black"
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-row items-center justify-between w-full">
        <p className="font-semibold">{data.labels[0]}</p>
        <Button
          size="lg"
          onClick={() => setExpanded(!expanded)}
          className="ml-2"
        >
          {expanded ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
        </Button>
      </div>
      <div className={`expand-content ${expanded ? 'expanded' : ''}`}>
        <div className="py-2 text-wrap space-y-2">{data.content}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default React.memo(OriginNodeComponent)
