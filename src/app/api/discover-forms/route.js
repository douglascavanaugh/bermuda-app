import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public/docs/pdf-templates');
    
    // Check if directory exists
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json([]);
    }
    
    const files = fs.readdirSync(templatesDir);
    const schemaFiles = files.filter(file => file.endsWith('_manual_schema.json'));
    
    const availableForms = [];
    
    for (const file of schemaFiles) {
      try {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const schema = JSON.parse(content);
        
        // Extract form ID from filename (e.g., "sf24_23a_manual_schema.json" -> "sf24_23a")
        const formId = file.replace('_manual_schema.json', '');
        
        availableForms.push({
          id: formId,
          name: schema.name || schema.formType || formId.toUpperCase(),
          description: schema.description || `${formId.toUpperCase()} Form`,
          fieldCount: schema.fields ? schema.fields.length : 0,
          version: schema.version || '1.0',
          hasFormFields: schema.hasFormFields || false
        });
      } catch (error) {
        console.error(`Error parsing schema file ${file}:`, error);
      }
    }
    
    // Sort by form ID for consistent ordering
    availableForms.sort((a, b) => a.id.localeCompare(b.id));
    
    return NextResponse.json(availableForms);
  } catch (error) {
    console.error('Error discovering forms:', error);
    return NextResponse.json({ error: 'Failed to discover forms' }, { status: 500 });
  }
}
