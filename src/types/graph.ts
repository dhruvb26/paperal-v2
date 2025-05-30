interface BaseNode {
  id: string
  color: string
  [key: string]: any
}

export interface TaskNode extends BaseNode {
  labels: ['Task']
  task_id: string
}

export interface OriginNode extends BaseNode {
  labels: ['Origin']
  chunk_id: string
  content: string
}

export interface CitedNode extends BaseNode {
  labels: ['Cited']
  year: string
  title: string
  authors: string
  order: number
}

export type Node = OriginNode | CitedNode | TaskNode

export interface Link {
  id: string
  source: string
  target: string
  type: string
}

export interface Reference {
  title: string
  authors: string[]
  year: string
  order?: number
  url: string
}
