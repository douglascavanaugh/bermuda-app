import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }
    
    const schemaPath = path.join(
      process.cwd(), 
      'public/docs/pdf-templates', 
      `${formId}_manual_schema.json`
    );
    
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }
    
    const content = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(content);
    
    // Sort fields by page, then by Y coordinate (top to bottom), then by X coordinate (left to right)
    if (schema.fields) {
      schema.fields.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        if (a.y !== b.y) return b.y - a.y; // Higher Y values first (top to bottom)
        return a.x - b.x; // Lower X values first (left to right)
      });
    }
    
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error loading form schema:', error);
    return NextResponse.json({ error: 'Failed to load schema' }, { status: 500 });
  }
}
