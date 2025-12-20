import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { masterData, packageData, forms } = await request.json();
    
    console.log('📦 GENERATE BOND PACKAGE REQUEST');
    console.log('📋 Master Data:', masterData);
    console.log('📋 Package Data:', packageData);
    console.log('📋 Forms to generate:', forms);

    // Get Python API URL
    const pythonApiUrl = process.env.PYTHON_API_URL 
      ? `${process.env.PYTHON_API_URL}/api/generate-bond-package`
      : 'http://localhost:5001/api/generate-bond-package';

    console.log('🐍 Calling Python API:', pythonApiUrl);

    // Call Python API to generate all PDFs and merge them
    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        master_data: masterData,
        package_data: packageData,
        forms: forms
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Python API error:', errorText);
      throw new Error(`Python API error: ${response.status} - ${errorText}`);
    }

    // Get the merged PDF from Python
    const pdfBuffer = await response.arrayBuffer();
    
    console.log('✅ Package generated successfully, size:', pdfBuffer.byteLength, 'bytes');

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Completed_Package_${masterData.clientFullName?.replace(/\s+/g, '_') || 'Client'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('❌ Generate bond package error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


