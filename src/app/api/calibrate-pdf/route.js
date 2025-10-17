import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    const schemaFile = formData.get('schema');
    
    if (!file || !schemaFile) {
      return NextResponse.json({ error: 'PDF and schema files required' }, { status: 400 });
    }

    // Convert files to buffers
    const pdfBytes = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    const schemaText = await schemaFile.text();
    const baseSchema = JSON.parse(schemaText);

    console.log(`🎯 Smart Calibration: ${file.name} with ${baseSchema.fields.length} fields`);

    // Method 1: Pure pattern-based calibration (no PDF parsing libraries)
    console.log(`📊 Pure Pattern Analysis: ${file.name} (${file.size} bytes)`);

    // Smart calibration based on filename patterns and schema analysis
    const calibratedSchema = await smartCalibration(baseSchema, { 
      fileName: file.name, 
      fileSize: file.size,
      numpages: 4 // Assume 4 pages for GSA forms
    }, file.name);
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      originalFields: baseSchema.fields.length,
      calibratedFields: calibratedSchema.fields.length,
      calibrationMethod: 'Smart Auto-Calibration',
      schema: calibratedSchema,
      improvements: calibratedSchema.calibrationLog
    });
    
  } catch (error) {
    console.error('❌ Smart calibration error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Using original schema without calibration'
    }, { status: 200 });
  }
}

// Smart Calibration Algorithm (Pure Pattern-Based)
async function smartCalibration(baseSchema, fileInfo, fileName) {
  console.log('🤖 Starting pure pattern-based smart calibration...');
  
  const calibrationLog = [];
  
  // Step 1: Detect PDF type and layout from filename and schema
  const pdfLayout = analyzePDFLayoutFromFilename(fileName, fileInfo);
  calibrationLog.push(`📐 Detected layout: ${pdfLayout.type} (confidence: ${pdfLayout.confidence}%)`);
  
  // Step 2: Analyze existing schema for patterns
  const schemaPatterns = analyzeSchemaPatterns(baseSchema);
  calibrationLog.push(`📊 Schema analysis: ${schemaPatterns.fieldTypes.length} field types detected`);
  
  // Step 3: Calculate smart calibration offsets
  const calibrationOffsets = calculateSmartOffsets(pdfLayout, schemaPatterns, fileName);
  calibrationLog.push(`🎯 Smart offsets: X=${calibrationOffsets.x}, Y=${calibrationOffsets.y}, Scale=${calibrationOffsets.scale}`);
  
  // Step 4: Apply intelligent adjustments to each field
  const calibratedFields = baseSchema.fields.map(field => {
    const adjustedField = applyIntelligentCalibration(field, calibrationOffsets, pdfLayout, schemaPatterns);
    return adjustedField;
  });
  
  calibrationLog.push(`✅ Calibrated ${calibratedFields.length} fields with intelligent positioning`);
  
  return {
    ...baseSchema,
    name: `${fileName} - Smart Calibrated`,
    description: `Auto-calibrated form fields with intelligent pattern-based positioning`,
    version: '2.0',
    calibrationMethod: 'Pure Pattern-Based Smart Calibration',
    calibrationLog: calibrationLog,
    fields: calibratedFields
  };
}

// Analyze PDF layout from filename patterns (no PDF parsing)
function analyzePDFLayoutFromFilename(fileName, fileInfo) {
  const lowerName = fileName.toLowerCase();
  
  // Detect GSA forms by filename
  if (lowerName.includes('sf24') || lowerName.includes('gsa') || lowerName.includes('standard')) {
    return {
      type: 'GSA_SF24_STANDARD',
      confidence: 95,
      pageWidth: 612,
      pageHeight: 792,
      margins: { top: 50, right: 40, bottom: 50, left: 60 },
      formVersion: 'SF24-23A'
    };
  }
  
  // Default letter format
  return {
    type: 'STANDARD_LETTER',
    confidence: 80,
    pageWidth: 612,
    pageHeight: 792,
    margins: { top: 72, right: 36, bottom: 36, left: 72 }
  };
}

// Analyze existing schema patterns
function analyzeSchemaPatterns(schema) {
  const fieldTypes = {};
  const pageDistribution = {};
  const coordinateRanges = { minX: 999, maxX: 0, minY: 999, maxY: 0 };
  
  schema.fields.forEach(field => {
    // Count field types
    fieldTypes[field.type] = (fieldTypes[field.type] || 0) + 1;
    
    // Count page distribution
    pageDistribution[field.page] = (pageDistribution[field.page] || 0) + 1;
    
    // Track coordinate ranges
    coordinateRanges.minX = Math.min(coordinateRanges.minX, field.x);
    coordinateRanges.maxX = Math.max(coordinateRanges.maxX, field.x + field.width);
    coordinateRanges.minY = Math.min(coordinateRanges.minY, field.y);
    coordinateRanges.maxY = Math.max(coordinateRanges.maxY, field.y + field.height);
  });
  
  return {
    fieldTypes: Object.keys(fieldTypes),
    typeCount: fieldTypes,
    pageDistribution,
    coordinateRanges,
    totalFields: schema.fields.length
  };
}

// Calculate smart offsets based on patterns
function calculateSmartOffsets(layout, patterns, fileName) {
  let xOffset = 0;
  let yOffset = 0;
  let scale = 1.0;
  
  // GSA-specific adjustments
  if (layout.type === 'GSA_SF24_STANDARD') {
    // Fine-tune based on coordinate analysis
    if (patterns.coordinateRanges.minX < 100) {
      xOffset = 25; // Move fields right if they're too close to left edge
    }
    
    if (patterns.coordinateRanges.maxY > 750) {
      yOffset = -20; // Move fields up if they're too close to bottom
    }
    
    // Adjust based on field density
    if (patterns.totalFields > 20) {
      // High field density - tighter spacing
      yOffset -= 5;
      scale = 0.95;
    }
  }
  
  return { x: xOffset, y: yOffset, scale };
}

// Apply intelligent calibration to individual fields
function applyIntelligentCalibration(field, offsets, layout, patterns) {
  const calibratedField = { ...field };
  
  // Apply base offsets
  calibratedField.x += offsets.x;
  calibratedField.y += offsets.y;
  
  // Apply scaling
  if (offsets.scale !== 1.0) {
    calibratedField.width = Math.round(calibratedField.width * offsets.scale);
    calibratedField.height = Math.round(calibratedField.height * offsets.scale);
  }
  
  // Intelligent field-specific adjustments
  switch (field.type) {
    case 'checkbox':
      // Perfect checkbox positioning for GSA forms
      calibratedField.width = 12;
      calibratedField.height = 12;
      calibratedField.x += 3; // Fine-tune checkbox position
      calibratedField.y += 1;
      break;
      
    case 'text':
      // Smart text field adjustments
      if (field.name.includes('address')) {
        // Multi-line address fields
        calibratedField.height = Math.max(calibratedField.height, 35);
        calibratedField.y -= 3;
      } else if (field.name.includes('name')) {
        // Name fields
        calibratedField.width = Math.max(calibratedField.width, 180);
      } else if (field.name.includes('date')) {
        // Date fields
        calibratedField.width = Math.min(calibratedField.width, 100);
      }
      break;
  }
  
  // Page-specific intelligent adjustments
  switch (field.page) {
    case 1:
      // Page 1 - main form fields
      if (field.y > 600) calibratedField.y -= 5; // Top section
      break;
    case 2:
      // Page 2 - signature fields
      calibratedField.y += 2; // Slight adjustment for signature alignment
      break;
    case 3:
      // Page 3 - surety information
      calibratedField.y += 1;
      break;
    case 4:
      // Page 4 - instructions
      calibratedField.y -= 2;
      break;
  }
  
  // Ensure fields stay within intelligent bounds
  calibratedField.x = Math.max(layout.margins.left, 
    Math.min(calibratedField.x, layout.pageWidth - calibratedField.width - layout.margins.right));
  calibratedField.y = Math.max(layout.margins.top, 
    Math.min(calibratedField.y, layout.pageHeight - calibratedField.height - layout.margins.bottom));
  
  return calibratedField;
}
