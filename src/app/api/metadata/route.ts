'use server'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { content } = await req.json()
  const GEMINI_API_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models'
  const DEFAULT_MODEL = 'gemini-2.0-flash'
  const API_KEY = 'AIzaSyBF6D16AWwA3Hu99LGHEmwtzEqb0CA8ki4'

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Based on the following document excerpt, extract the title, authors, a short description, year of publication, and create an APA style in-text citation.
                Return the information in a valid JSON format with these exact keys: title, description, authors (as list), citations.in_text, year

                If you cannot determine any field with high confidence, use null for that field.

                Document excerpt:
                ${content}

                Example output format:
                {
                    "title": "The Impact of AI on Modern Society",
                    "description": "The Impact of AI on Modern Society is a paper that discusses the impact of AI on modern society. It is a paper that was published in 2024.",
                    "authors": ["Smith, J.", "Jones, K."],
                    "citations": {
                        "in_text": "(Smith & Jones, 2024)"
                    },
                    "year": "2024"
                }`,
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}/${DEFAULT_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    const data = await response.json()

    const metadata = JSON.parse(
      data.candidates[0].content.parts[0].text
        .replace('```json', '')
        .replace('```', '')
        .trim()
    )

    console.log(metadata)

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error extracting metadata:', error)
    throw error
  }
}
