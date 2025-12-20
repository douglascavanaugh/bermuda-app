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
              text: `Extract all the data from this Master Bond Sheet form. Return ONLY a valid JSON object with these exact field names (use empty string "" for any missing or unclear values):

{
  "clientFullName": "Full name of the client",
  "dateBondExecuted": "Date in mm/dd/yyyy format or empty",
  "courtCaseNumber": "Court case number",
  "pastConvictionsCaseNumbers": "Past conviction case numbers or empty",
  "birthCertificateNumber": "Birth certificate number",
  "stateOfBirth": "State of birth (full name)",
  "dateOfBirth": "Date of birth in mm/dd/yyyy format",
  "uccTrustNumber": "UCC Trust number",
  "socialSecurityNumber": "Social security number (xxx-xx-xxxx format)",
  "ssnBackNumber": "Number on back of SS card",
  "thirdPartyName": "Third party name or empty",
  "thirdPartyAddress": "Street address only",
  "thirdPartyCity": "City",
  "thirdPartyState": "State/Province abbreviation (2 letters, e.g., NY, CA, ON, BC)",
  "thirdPartyZip": "ZIP/Postal code with brackets like [12345] or [M5V 2H1]",
  "thirdPartyCounty": "County or Region name",
  "prisonNumber": "Prison number or empty",
  "prisonName": "Prison name or empty", 
  "prisonAddress": "Prison address or empty",
  "trialCourtName": "Name of trial court",
  "trialCourtType": "State" or "Federal",
  "courtAddress": "Court street address",
  "courtCity": "Court city",
  "courtState": "Court state/province abbreviation (2 letters)",
  "courtZip": "Court ZIP/Postal code with brackets like [12345] or [M5V 2H1]",
  "amountOwed": "Amount owed (numbers only, no $ or commas)"
}

Return ONLY the JSON object, no markdown, no explanation.`,
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

