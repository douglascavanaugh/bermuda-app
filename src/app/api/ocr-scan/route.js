import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { image, mediaType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    // Call Claude Vision API to extract text from the image
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `You are an expert at reading handwritten forms. Extract all data from this Master Bond Sheet form.

CRITICAL ACCURACY RULES:
1. Look VERY carefully at each character - handwriting can be ambiguous
2. For numbers: 1 vs 7, 0 vs O, 5 vs S, 6 vs G, 8 vs B - use context clues
3. For letters: I vs l vs 1, O vs 0, S vs 5, Z vs 2 - consider what makes sense
4. SSN format: US uses XXX-XX-XXXX (9 digits), Canada SIN uses XXX-XXX-XXX (9 digits)
5. ZIP codes: US is 5 digits (12345) or 5+4 (12345-6789), Canada is A1A 1A1 format
6. Dates should be mm/dd/yyyy format
7. If a field is crossed out, marked N/A, or empty - use ""
8. State abbreviations are 2 letters (NY, CA, ON, BC, etc.)

COMMON HANDWRITING ISSUES TO WATCH FOR:
- "1" often looks like "l" or "I"
- "0" often looks like "O" 
- "5" often looks like "S"
- Numbers in sequence provide context (SSN pattern, phone pattern)

Return ONLY a valid JSON object with these exact field names:

{
  "clientFullName": "Full legal name - check capitalization",
  "dateBondExecuted": "mm/dd/yyyy format or empty string",
  "courtCaseNumber": "Case number exactly as written",
  "pastConvictionsCaseNumbers": "Prior case numbers or empty",
  "birthCertificateNumber": "Birth cert number exactly as written",
  "stateOfBirth": "Full state/province name (e.g., 'New York' not 'NY')",
  "dateOfBirth": "mm/dd/yyyy format",
  "uccTrustNumber": "UCC number exactly as written",
  "socialSecurityNumber": "Format: XXX-XX-XXXX (US) or XXX-XXX-XXX (Canada)",
  "ssnBackNumber": "Number from back of SS card or empty for Canada",
  "thirdPartyName": "Name or empty",
  "thirdPartyAddress": "Street address ONLY (no city/state/zip)",
  "thirdPartyCity": "City name",
  "thirdPartyState": "2-letter abbreviation (NY, CA, ON, BC)",
  "thirdPartyZip": "With brackets: [12345] or [M5V 2H1]",
  "thirdPartyCounty": "County or Region name",
  "prisonNumber": "Inmate number or empty",
  "prisonName": "Facility name or empty",
  "prisonAddress": "Full address or empty",
  "trialCourtName": "Full court name",
  "trialCourtType": "State or Federal only",
  "courtAddress": "Court street address",
  "courtCity": "Court city",
  "courtState": "2-letter abbreviation",
  "courtZip": "With brackets: [12345] or [M5V 2H1]",
  "amountOwed": "Numbers only - no $ or commas"
}

Return ONLY the JSON object. No markdown. No explanation.`,
            },
          ],
        },
      ],
    });

    // Extract the JSON from Claude's response
    const extractedText = response.content[0].text;
    
    // Try to parse as JSON
    let formData;
    try {
      // Remove any markdown code blocks if present
      const jsonString = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      formData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', extractedText);
      return NextResponse.json({ 
        error: 'Failed to parse extracted data',
        rawText: extractedText 
      }, { status: 422 });
    }

    return NextResponse.json({ 
      success: true,
      formData,
      message: 'Form data extracted successfully'
    });

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ 
      error: error.message || 'OCR processing failed' 
    }, { status: 500 });
  }
}

