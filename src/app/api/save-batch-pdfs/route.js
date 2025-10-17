import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { pdfs, formType, batchId } = await req.json();
    
    // Create batch folder
    const batchFolder = path.join(
      process.cwd(), 
      'docs', 
      'processed-pdfs', 
      formType.toLowerCase(),
      `batch_${batchId}_${new Date().toISOString().split('T')[0]}`
    );
    
    // Ensure directory exists
    fs.mkdirSync(batchFolder, { recursive: true });
    
    const savedFiles = [];
    
    // Save each PDF
    for (const pdf of pdfs) {
      const filePath = path.join(batchFolder, pdf.filename);
      const pdfBuffer = Buffer.from(pdf.bytes, 'base64');
      
      fs.writeFileSync(filePath, pdfBuffer);
      savedFiles.push({
        filename: pdf.filename,
        path: filePath,
        size: pdfBuffer.length
      });
    }
    
    // Create batch manifest
    const manifest = {
      batchId,
      formType,
      processedAt: new Date().toISOString(),
      totalFiles: savedFiles.length,
      totalSize: savedFiles.reduce((sum, file) => sum + file.size, 0),
      files: savedFiles.map(f => ({
        filename: f.filename,
        size: f.size
      }))
    };
    
    fs.writeFileSync(
      path.join(batchFolder, 'batch-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    return NextResponse.json({
      success: true,
      batchId,
      folder: batchFolder,
      filesCount: savedFiles.length,
      totalSize: manifest.totalSize,
      message: `Successfully saved ${savedFiles.length} PDFs to ${batchFolder}`
    });
    
  } catch (error) {
    console.error('Batch PDF save error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
