import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { formType, formData } = await request.json();
    
    console.log('📥 Received data:', {
      formType,
      formData,
      dataKeys: Object.keys(formData || {}),
      dataCount: Object.keys(formData || {}).length
    });
    
    if (!formType || !formData) {
      console.error('❌ Missing required data:', { formType: !!formType, formData: !!formData });
      return NextResponse.json({ error: 'Form type and data are required' }, { status: 400 });
    }
    
    // Determine Python API URL based on environment
    const pythonApiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5001' 
      : 'https://bermuda-pdf-api.onrender.com';
    
    console.log(`Calling Python API: ${pythonApiUrl}/api/process-gsa-pdf`);
    
    // 🚀 REUSE BATCH PROCESSOR FORMAT - EXACT SAME AS WORKING CODE!
    console.log('Using batch processor format (form_data + template_type)');
    
    // 🚀 REORDER DATA TO MATCH CSV HEADER ORDER (CRITICAL FOR FIELD ALIGNMENT!)
    // 🚀 NO REORDERING! Send data as-is (Python API handles mapping by template_type)
    const reorderedFormData = formData;
    
    console.log('🎯 REORDERED TO MATCH CSV (like batch processor):', {
      originalKeys: Object.keys(formData),
      reorderedKeys: Object.keys(reorderedFormData),
      dataCount: Object.keys(reorderedFormData).length,
      entityTypes: {
        partnership: reorderedFormData.partnership,
        individual: reorderedFormData.individual,
        jointventure: reorderedFormData.jointventure,
        corporation: reorderedFormData.corporation,
        other: reorderedFormData.other
      }
    });

    // Call Python API - SAME FORMAT AS BATCH PROCESSOR (OBJECT, NOT ARRAY!)
    const response = await fetch(`${pythonApiUrl}/api/process-gsa-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        form_data: reorderedFormData,  // 🎯 REORDERED TO MATCH CSV FIELD ORDER
        template_type: formType
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
    
    // Return the PDF blob
    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formType}_${Date.now()}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating single PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
