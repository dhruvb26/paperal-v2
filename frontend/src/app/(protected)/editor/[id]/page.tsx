import Tiptap from '@/components/tip-tap'
import { getDocument } from '@/backend/actions/document'
import ErrorPage from '@/components/global/error-page'

export default async function EditorPage({ params }: any) {
  const { id } = await params
  const document = await getDocument(id)

  if ('error' in document) {
    return <ErrorPage error={document.error} />
  }

  return (
    <div className="flex-1 w-full h-full overflow-auto">
      <Tiptap content={document.value.content as string} />
    </div>
  )
}
