import { spawn } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req) {
  try {
    const formData = await req.json();
    console.log('Form data received:', formData);
    
    const scriptPath = path.join(process.cwd(), 'src/templates/create_hawaii_pdf.py');
    const pythonPath = path.join(process.cwd(), 'venv/bin/python3');
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        JSON.stringify(formData)
      ]);

      let pdfPath = '';
      let debugOutput = '';
      
      // Handle stdout (PDF path)
      pythonProcess.stdout.on('data', (data) => {
        pdfPath = data.toString().trim();
        console.log('Generated PDF:', pdfPath);
      });

      // Handle stderr (debug messages)
      pythonProcess.stderr.on('data', (data) => {
        debugOutput += data.toString();
        // Only log as error if it starts with "Error:"
        if (data.toString().startsWith('Error:')) {
          console.error('Python error:', data.toString());
        } else {
          console.log('Python debug:', data.toString());
        }
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script failed:', debugOutput);
          reject(new Error('PDF generation failed'));
        } else {
          resolve(NextResponse.json({ pdfPath }));
        }
      });
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}