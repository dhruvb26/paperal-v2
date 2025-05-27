export function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          const output = callback(...args)
          resolve(output)
        } catch (err) {
          reject(err)
        }
      }, delay)
    }).catch((error) => {
      console.error('Error in debounced function:', error)
      throw error
    })
  }
}

export function createButton(
  text: string,
  handler: (e: Event) => void
): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  button.classList.add('shortcut-button')
  button.onclick = handler
  return button
}

export function getTextFromDocument(
  doc: any,
  maxLength: number = 4000
): string {
  return doc.textBetween(0, doc.content.size, ' ').slice(-maxLength)
}
