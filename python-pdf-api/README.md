# GSA PDF Processing API 🐍⚡

**PYTHON BACKEND FOR PERFECT GSA PDF OVERLAYS!**

## 🚀 Features

- ✅ **Perfect coordinate mapping** for GSA forms
- ✅ **Batch processing** for thousands of entries
- ✅ **ReportLab integration** for precise PDF generation
- ✅ **Flask API** with CORS for Next.js frontend
- ✅ **Railway deployment** ready

## 🛠️ API Endpoints

### `POST /api/process-gsa-pdf`
Process single GSA form with data overlay
```json
{
  "form_data": {
    "principal_name_address": "Brown Engineering LLC, 123 Main St, Seattle WA 98101",
    "state_of_incorporation": "WA",
    "surety_name_address": "AIG Insurance Company, 456 Oak Ave, New York NY 10001",
    "org_corporation": "X",
    "percent_of_bid_price": "12%",
    "bid_date": "08/15/2025",
    "invitation_number": "IFB-2024-001",
    "for_construction_of": "Construction"
  },
  "template_type": "sf24_23a"
}
```

### `POST /api/batch-process-gsa`
Batch process multiple GSA forms
```json
{
  "entries": [
    { "principal_name_address": "...", "state_of_incorporation": "..." },
    { "principal_name_address": "...", "state_of_incorporation": "..." }
  ],
  "template_type": "sf24_23a"
}
```

### `POST /api/get-coordinates`
Get coordinate mapping for a template
```json
{
  "template_type": "sf24_23a"
}
```

## 🚂 Railway Deployment

1. **Connect GitHub repo** to Railway
2. **Auto-deploy** on push to main
3. **Environment variables** (none needed for basic setup)
4. **Custom domain** available

## 🔗 Next.js Integration

```javascript
// Call from Next.js frontend
const response = await fetch('https://your-railway-app.railway.app/api/process-gsa-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ form_data, template_type: 'sf24_23a' })
});

const pdfBlob = await response.blob();
// Download or display PDF
```

## 🎯 Perfect Coordinates

The coordinates in this API are **PRECISELY MEASURED** from actual GSA forms:
- No more guessing!
- No more misaligned text!
- Perfect overlays every time!

**MON FRERE, THIS IS THE SOLUTION!** 🌟💪
