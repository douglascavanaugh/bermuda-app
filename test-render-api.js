// Test the live Render API
const testData = {
  form_data: {
    principal_name_address: "Brown Engineering LLC, 123 Main St, Seattle WA 98101",
    state_of_incorporation: "WA", 
    surety_name_address: "AIG Insurance Company, 456 Oak Ave, New York NY 10001",
    org_corporation: "X",
    percent_of_bid_price: "12%",
    bid_date: "08/15/2025",
    invitation_number: "IFB-2024-001",
    for_construction_of: "Construction"
  },
  template_type: "sf24_23a"
};

async function testRenderAPI() {
  try {
    console.log('🚀 Testing Render API at: https://bermuda-app.onrender.com');
    
    const response = await fetch('https://bermuda-app.onrender.com/api/process-gsa-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ SUCCESS! PDF generated!');
      console.log('📄 PDF size:', blob.size, 'bytes');
      console.log('🎯 Content type:', blob.type);
      
      // Save the PDF
      const fs = require('fs');
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync('test-render-output.pdf', buffer);
      console.log('💾 PDF saved as: test-render-output.pdf');
      
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

testRenderAPI();
