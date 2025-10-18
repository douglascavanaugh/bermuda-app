import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure the public/docs/sample-pdfs directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'docs', 'sample-pdfs');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate a clean filename
    const originalName = file.name;
    const cleanName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');

    const filePath = path.join(uploadDir, cleanName);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`📤 Uploaded PDF: ${cleanName}`);

    return NextResponse.json({
      success: true,
      fileName: cleanName,
      originalName: originalName,
      message: 'PDF uploaded successfully!'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + error.message },
      { status: 500 }
    );
  }
}
