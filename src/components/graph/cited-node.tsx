'use client'
import { CitedNode } from '@/types/graph'
import { Position } from '@xyflow/react'
import { Handle } from '@xyflow/react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

function CitedNodeComponent({ data }: { data: CitedNode }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      style={{ backgroundColor: '#fff', width: '384px' }}
      className="p-4 text-black rounded-md border border-black"
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-row items-center justify-between w-full">
        <p className="text-xl font-semibold">[{data.order}]</p>
        <Button
          size="lg"
          onClick={() => setExpanded(!expanded)}
          className="ml-2"
        >
          {expanded ? <ArrowUpRight /> : <ArrowDownRight />}
        </Button>
      </div>
      <div className={`expand-content text-xl ${expanded ? 'expanded' : ''}`}>
        <div className="py-2 text-wrap space-y-2">
          <p>
            <b>Year: </b>
            {data.year}
          </p>
          <p>
            <b>Authors: </b>
            {data.authors.split(',').map((author, index, array) => (
              <React.Fragment key={index}>
                {author.trim()}
                {index < array.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default React.memo(CitedNodeComponent)
