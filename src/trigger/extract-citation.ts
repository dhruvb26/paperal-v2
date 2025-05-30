import { Mistral } from '@mistralai/mistralai';

// Standalone function for testing
export async function extractCitations(pdf_url: string) {
  try {
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is required');
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    console.log('Using Mistral OCR to process PDF...');
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    
    const ocr_response = await client.ocr.process(
      {
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: pdf_url
        },
        includeImageBase64: true,
      }
    );
    
    console.log(`OCR completed. Found ${ocr_response.pages.length} pages.`);
    
    const pages_after_references = [];
    let found_references = false;
    
    for (let i = 0; i < ocr_response.pages.length; i++) {
        const page = ocr_response.pages[i];
        if (page.markdown.match(/.*references.*/i)) {  
            console.log(`Found references section on page ${i + 1}`);
            pages_after_references.push(page.markdown);
            found_references = true;
        } else if (found_references) {
            pages_after_references.push(page.markdown);
        }
    }

    if (pages_after_references.length === 0) {
      console.log('No references section found. Using last 3 pages instead.');
      const lastPages = ocr_response.pages.slice(-3);
      for (const page of lastPages) {
        pages_after_references.push(page.markdown);
      }
    }

    console.log(`Extracted ${pages_after_references.length} pages of references.`);
    console.log('Using OpenAI to extract citation data...');
    
    const prompt = `You are a citation extraction specialist. Your task is to extract citations from the following academic paper pages and structure them as JSON objects.
    The citations should be in the following format:
    {
      "citations": [
        {
          "title": "The Impact of AI on Modern Society",
          "authors": ["Smith, J.", "Jones, K."],
          "year": "2024",
          "url": "https://www.arxiv.org/pdf/2401.00001 | blank (if available)"
        },
        // more citations


      ]

      Include the url if it is available. If not, leave it blank.
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: pages_after_references.join('\n') },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error extracting citations:', error);
    throw error;
  }
}

export default extractCitations;