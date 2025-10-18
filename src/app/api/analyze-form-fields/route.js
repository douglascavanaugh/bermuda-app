import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    console.log(`🔍 Analyzing form fields for: ${fileName}`);

    // Call our Python API to analyze the PDF
    const pythonApiUrl = 'https://bermuda-app.onrender.com/api/analyze-pdf-fields';
    
    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf_url: `https://bermuda-app.vercel.app/docs/sample-pdfs/${fileName}`
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Python API error: ${response.status}`);
    }

    const analysisResult = await response.json();
    
    // Extract clean field names and generate CSV
    const fields = analysisResult.fields.map(field => ({
      originalName: field.name,
      cleanName: extractCleanFieldName(field.name),
      x: field.x,
      y: field.y,
      type: field.type || 'text'
    }));

    // Generate form type from filename
    const formType = generateFormType(fileName);
    
    // Generate CSV with headers and sample data
    const csv = generateCSV(fields, formType);

    console.log(`✅ Analysis complete: ${fields.length} fields detected`);

    return NextResponse.json({
      success: true,
      fields: fields,
      csv: csv,
      formType: formType,
      fieldCount: fields.length
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF: ' + error.message },
      { status: 500 }
    );
  }
}

function extractCleanFieldName(pdfFieldName) {
  // Extract the meaningful part from PDF field names like:
  // "form1[0].#subform[0].contractor[0]" → "contractor"
  // "form1[0].#subform[0].project_desc[0]" → "project_desc"
  
  let cleaned = pdfFieldName;
  
  // Remove form structure parts
  cleaned = cleaned.replace(/form\d+\[\d+\]\.?/g, '');
  cleaned = cleaned.replace(/#subform\[\d+\]\.?/g, '');
  cleaned = cleaned.replace(/\[\d+\]$/g, '');
  
  // Clean up any remaining dots or special chars
  cleaned = cleaned.replace(/^\.+|\.+$/g, '');
  cleaned = cleaned.toLowerCase();
  
  // If we end up with something too generic, use a fallback
  if (!cleaned || cleaned.length < 2) {
    // Extract the last meaningful part before [0]
    const match = pdfFieldName.match(/([a-zA-Z_]+)\[\d+\]$/);
    if (match) {
      cleaned = match[1].toLowerCase();
    } else {
      cleaned = 'field_' + Math.random().toString(36).substr(2, 5);
    }
  }
  
  return cleaned;
}

function generateFormType(fileName) {
  // Generate form type from filename
  // "sf24-23a.pdf" → "sf24_23a"
  // "sf25-performance-bond.pdf" → "sf25_performance_bond"
  
  let formType = fileName
    .toLowerCase()
    .replace('.pdf', '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
    
  return formType;
}

function generateCSV(fields, formType) {
  // Generate CSV with FORM_TYPE header and sample data
  const headers = fields.map(field => field.cleanName);
  
  // Create sample data rows
  const sampleRows = [
    generateSampleRow(fields, 1),
    generateSampleRow(fields, 2),
    generateSampleRow(fields, 3)
  ];
  
  // Build CSV string
  let csv = `FORM_TYPE: ${formType.toUpperCase()}\n`;
  csv += headers.join(',') + '\n';
  csv += sampleRows.join('\n');
  
  return csv;
}

function generateSampleRow(fields, rowNumber) {
  return fields.map(field => {
    const cleanName = field.cleanName;
    
    // Generate intelligent sample data based on field name
    if (cleanName.includes('name') || cleanName.includes('contractor')) {
      return `"Sample Company ${rowNumber} LLC"`;
    } else if (cleanName.includes('address')) {
      return `"${100 + rowNumber * 100} Main Street, City ST ${10000 + rowNumber}"`;
    } else if (cleanName.includes('date')) {
      const month = String(rowNumber + 2).padStart(2, '0');
      return `"${month}/15/2025"`;
    } else if (cleanName.includes('percent') || cleanName.includes('pct')) {
      return `"${10 + rowNumber * 2}%"`;
    } else if (cleanName.includes('amount') || cleanName.includes('sum')) {
      return `"${rowNumber * 50000}"`;
    } else if (cleanName.includes('phone')) {
      return `"(555) ${100 + rowNumber}-${1000 + rowNumber}"`;
    } else if (cleanName.includes('email')) {
      return `"contact${rowNumber}@company${rowNumber}.com"`;
    } else if (cleanName.includes('state')) {
      const states = ['TX', 'CA', 'NY', 'FL', 'IL'];
      return `"${states[rowNumber % states.length]}"`;
    } else if (cleanName.includes('project') || cleanName.includes('construction')) {
      return `"Sample Project ${rowNumber} Description"`;
    } else if (cleanName.includes('invitation') || cleanName.includes('number')) {
      return `"IFB-2025-${String(rowNumber).padStart(3, '0')}"`;
    } else {
      // Generic sample data
      return `"Sample Data ${rowNumber}"`;
    }
  }).join(',');
}
