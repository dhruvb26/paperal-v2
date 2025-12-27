export type PageDimensions = Record<
  number,
  { page_width: number; page_height: number }
>

export type File = {
  id: string
  userId: string
  namespace: string
  title: string
  description: string
  pageDimensions: PageDimensions
  fileUrl: string
}
