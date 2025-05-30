import { ChunkrAPIChunk } from '@/types/chunk'

export async function extractReferences(chunks: ChunkrAPIChunk[]) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required')
    }

    const pages_after_references = []
    let found_references = false

    for (const chunk of chunks) {
      for (const segment of chunk.segments) {
        const content = segment.content
        if (content.match(/.*(?:bibliograph|appendix).*/i)) {
          break
        }
        if (content.match(/.*references.*/i)) {
          pages_after_references.push(content)
          found_references = true
        } else if (found_references) {
          pages_after_references.push(content)
        }
      }

      if (
        chunk.segments.some((segment: { content: string }) =>
          segment.content.match(/.*(?:bibliograph|appendix).*/i)
        )
      ) {
        break
      }
    }

    // If no references are found, try to extract from the last 3 chunks
    if (pages_after_references.length === 0) {
      const lastChunks = chunks.slice(-3)
      for (const chunk of lastChunks) {
        for (const segment of chunk.segments) {
          pages_after_references.push(segment.content)
        }
      }
    }

    const prompt = `
    Extract references from the following academic paper content and structure them as objects.

    The references should be in the following format:
    {
      [
        {
          "title": "The Impact of AI on Modern Society",
          "authors": ["Smith, J.", "Jones, K."],
          "year": "2024" | null,
          "url": "https://www.arxiv.org/pdf/2401.00001 | blank (if available)"
        },
      ]
    }

      Include the url if it is available. If not, leave it blank. Extract all references.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'references',
            schema: {
              type: 'object',
              properties: {
                references: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: pages_after_references.join('\n') },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(
        `OpenAI API call failed: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    throw error
  }
}
