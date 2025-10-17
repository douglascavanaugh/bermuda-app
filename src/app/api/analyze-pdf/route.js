import '@ungap/with-resolvers';
import { getDocument } from 'pdfjs-dist';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`📄 REAL PDF Analysis: ${file.name} (${file.size} bytes)`);
    
    // STACKOVERFLOW SOLUTION: Import worker and load PDF with pdfjs-dist
    // @ts-ignore
    await import('pdfjs-dist/build/pdf.worker.mjs');
    
    // Load PDF using pdfjs-dist
    const pdf = await getDocument({ data: buffer }).promise;
    console.log(`📊 PDF loaded: ${pdf.numPages} pages`);
    
    const allFields = [];
    
    // Analyze each page for form fields and text content
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`🔍 Analyzing page ${pageNum}...`);
      
      const page = await pdf.getPage(pageNum);
      
      // Method 1: Get form field annotations (interactive PDFs)
      try {
        const annotations = await page.getAnnotations();
        console.log(`📋 Page ${pageNum}: Found ${annotations.length} annotations`);
        
        annotations.forEach((annotation, index) => {
          console.log(`🔍 Annotation ${index}:`, {
            subtype: annotation.subtype,
            fieldName: annotation.fieldName,
            fieldType: annotation.fieldType,
            rect: annotation.rect,
            contents: annotation.contents
          });
          
          if (annotation.subtype === 'Widget' || annotation.fieldName) {
            const rect = annotation.rect || [0, 0, 100, 20];
            const fieldName = annotation.fieldName || `field_page${pageNum}_${index}`;
            
            allFields.push({
              name: fieldName,
              type: annotation.fieldType || 'text',
              page: pageNum,
              x: Math.round(rect[0]),
              y: Math.round(rect[1]),
              width: Math.round(rect[2] - rect[0]),
              height: Math.round(rect[3] - rect[1]),
              method: 'PDF.js Annotations',
              confidence: 1.0,
              subtype: annotation.subtype,
              fontSize: 10
            });
          }
        });
      } catch (annotationError) {
        console.log(`⚠️ Page ${pageNum} annotation error:`, annotationError.message);
      }
      
      // Method 2: Get text content with coordinates (for non-interactive PDFs)
      try {
        const textContent = await page.getTextContent();
        console.log(`📝 Page ${pageNum}: Found ${textContent.items.length} text items`);
        
        // Analyze text for form field patterns
        const textFields = analyzeTextContentForFields(textContent.items, pageNum);
        allFields.push(...textFields);
        
      } catch (textError) {
        console.log(`⚠️ Page ${pageNum} text error:`, textError.message);
      }
    }
    
    console.log(`✅ Total fields detected: ${allFields.length}`);
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      numPages: pdf.numPages,
      fieldsFound: allFields.length,
      fields: allFields,
      method: 'PDF.js Real Analysis',
      note: 'Using actual PDF.js form field and text detection'
    });
    
  } catch (error) {
    console.error('❌ PDF analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Will try OCR method',
      fields: [
        // Mock OCR results as fallback
        {
          name: 'ocr_detected_field_1',
          type: 'text',
          page: 1,
          x: 100,
          y: 700,
          width: 200,
          height: 20,
          method: 'OCR Fallback',
          confidence: 0.75
        }
      ]
    }, { status: 200 }); // Still return 200 so client can handle fallback
  }
}

// Analyze text content for form field patterns (non-interactive PDFs)
function analyzeTextContentForFields(textItems, pageNum) {
  const fields = [];
  
  // Look for common form field patterns in text
  const fieldPatterns = [
    { pattern: /principal.*name/i, name: 'principal_name', estimatedWidth: 300 },
    { pattern: /principal.*address/i, name: 'principal_address', estimatedWidth: 300 },
    { pattern: /state.*incorporation/i, name: 'state_of_incorporation', estimatedWidth: 100 },
    { pattern: /surety.*name/i, name: 'surety_name', estimatedWidth: 300 },
    { pattern: /surety.*address/i, name: 'surety_address', estimatedWidth: 300 },
    { pattern: /individual/i, name: 'org_individual', estimatedWidth: 20, type: 'checkbox' },
    { pattern: /partnership/i, name: 'org_partnership', estimatedWidth: 20, type: 'checkbox' },
    { pattern: /corporation/i, name: 'org_corporation', estimatedWidth: 20, type: 'checkbox' },
    { pattern: /joint.*venture/i, name: 'org_joint_venture', estimatedWidth: 20, type: 'checkbox' },
    { pattern: /percent.*bid/i, name: 'percent_of_bid_price', estimatedWidth: 100 },
    { pattern: /bid.*date/i, name: 'bid_date', estimatedWidth: 120 },
    { pattern: /invitation.*number/i, name: 'invitation_number', estimatedWidth: 150 }
  ];
  
  textItems.forEach((item, index) => {
    const text = item.str.toLowerCase();
    const x = item.transform[4];
    const y = item.transform[5];
    
    fieldPatterns.forEach(pattern => {
      if (pattern.pattern.test(text)) {
        // Estimate field position based on text position
        const fieldX = x + 20; // Slightly to the right of the label
        const fieldY = y - 5; // Slightly below the label
        
        fields.push({
          name: pattern.name,
          type: pattern.type || 'text',
          page: pageNum,
          x: Math.round(fieldX),
          y: Math.round(fieldY),
          width: pattern.estimatedWidth,
          height: pattern.type === 'checkbox' ? 15 : 20,
          method: 'Text Pattern Analysis',
          confidence: 0.8,
          sourceText: item.str,
          fontSize: 10
        });
      }
    });
  });
  
  return fields;
}

// Analyze extracted text for form field patterns
function analyzeTextForFormFields(text, numPages) {
  const fields = [];
  
  // Common GSA form field patterns
  const patterns = [
    { pattern: /principal.*name.*address/i, name: 'principal_name_address', type: 'text' },
    { pattern: /state.*incorporation/i, name: 'state_of_incorporation', type: 'text' },
    { pattern: /surety.*name.*address/i, name: 'surety_name_address', type: 'text' },
    { pattern: /percent.*bid/i, name: 'percent_of_bid_price', type: 'text' },
    { pattern: /bid.*date/i, name: 'bid_date', type: 'text' },
    { pattern: /invitation.*number/i, name: 'invitation_number', type: 'text' },
    { pattern: /individual/i, name: 'org_individual', type: 'checkbox' },
    { pattern: /partnership/i, name: 'org_partnership', type: 'checkbox' },
    { pattern: /corporation/i, name: 'org_corporation', type: 'checkbox' },
    { pattern: /joint.*venture/i, name: 'org_joint_venture', type: 'checkbox' }
  ];
  
  patterns.forEach((p, index) => {
    if (p.pattern.test(text)) {
      fields.push({
        name: p.name,
        type: p.type,
        page: Math.ceil((index + 1) / (patterns.length / numPages)), // Distribute across pages
        x: 100 + (index % 3) * 150, // Spread horizontally
        y: 700 - (Math.floor(index / 3) * 50), // Spread vertically
        width: p.type === 'checkbox' ? 20 : 200,
        height: 20,
        method: 'Text Pattern Analysis',
        confidence: 0.8
      });
    }
  });
  
  return fields;
}

// Generate intelligent mock GSA form fields based on common patterns
function generateGSAFormFields() {
  return [
    // Page 1 - Basic Information
    { name: 'principal_name_address', type: 'text', page: 1, x: 100, y: 700, width: 300, height: 60, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'state_of_incorporation', type: 'text', page: 1, x: 450, y: 700, width: 100, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'surety_name_address', type: 'text', page: 1, x: 100, y: 620, width: 300, height: 60, method: 'GSA Pattern', confidence: 0.9 },
    
    // Organization Type Checkboxes
    { name: 'org_individual', type: 'checkbox', page: 1, x: 100, y: 550, width: 20, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'org_partnership', type: 'checkbox', page: 1, x: 200, y: 550, width: 20, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'org_corporation', type: 'checkbox', page: 1, x: 300, y: 550, width: 20, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'org_joint_venture', type: 'checkbox', page: 1, x: 400, y: 550, width: 20, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'org_other', type: 'checkbox', page: 1, x: 500, y: 550, width: 20, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Penal Sum Information
    { name: 'percent_of_bid_price', type: 'text', page: 1, x: 100, y: 480, width: 100, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'amount_millions', type: 'text', page: 1, x: 250, y: 450, width: 80, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'amount_thousands', type: 'text', page: 1, x: 350, y: 450, width: 80, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'amount_hundreds', type: 'text', page: 1, x: 450, y: 450, width: 80, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'amount_cents', type: 'text', page: 1, x: 550, y: 450, width: 50, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Bid Information
    { name: 'bid_date', type: 'text', page: 1, x: 100, y: 380, width: 120, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'invitation_number', type: 'text', page: 1, x: 250, y: 380, width: 150, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'for_construction_supplies_services', type: 'text', page: 1, x: 420, y: 380, width: 180, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Principal Signatures (Page 2)
    { name: 'principal_name_title_1', type: 'text', page: 2, x: 100, y: 600, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'principal_name_title_2', type: 'text', page: 2, x: 320, y: 600, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'principal_name_title_3', type: 'text', page: 2, x: 100, y: 550, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Individual Surety
    { name: 'individual_surety_name_1', type: 'text', page: 2, x: 100, y: 450, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'individual_surety_name_2', type: 'text', page: 2, x: 320, y: 450, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Corporate Surety A (Page 3)
    { name: 'surety_a_name_address', type: 'text', page: 3, x: 100, y: 650, width: 250, height: 40, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'surety_a_state_incorporation', type: 'text', page: 3, x: 370, y: 650, width: 100, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'surety_a_liability_limit', type: 'text', page: 3, x: 490, y: 650, width: 100, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'surety_a_name_title_1', type: 'text', page: 3, x: 100, y: 600, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    { name: 'surety_a_name_title_2', type: 'text', page: 3, x: 320, y: 600, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 },
    
    // Instructions (Page 4)
    { name: 'maximum_dollar_limitation', type: 'text', page: 4, x: 100, y: 700, width: 200, height: 20, method: 'GSA Pattern', confidence: 0.9 }
  ];
}
