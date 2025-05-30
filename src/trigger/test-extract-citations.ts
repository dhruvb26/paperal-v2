// Use CommonJS require for better compatibility with ts-node
const { extractCitations } = require('./extract-citation');
const { logger } = require('@trigger.dev/sdk/v3');

async function main() {
  try {
    // Replace with a valid PDF URL
    const pdfUrl = 'https://arxiv.org/pdf/1706.03762.pdf'; // Attention Is All You Need paper
    
    console.log(`Testing citation extraction from: ${pdfUrl}`);
    const citations = await extractCitations(pdfUrl);
    
    console.log('Extracted citations:');
    console.log(JSON.stringify(citations, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main(); 