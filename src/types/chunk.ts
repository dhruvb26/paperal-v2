export type Chunk = {
  id: string
  namespace: string
  text: string
  bbox: {
    top: number
    left: number
    width: number
    height: number
  }
  page?: number
  createdAt: Date
}
