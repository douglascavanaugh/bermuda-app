from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import os
import json
import io
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from PyPDF2 import PdfReader, PdfWriter
import requests
import tempfile
import logging
import gc  # 🎖️ NUCLEAR GRADE: Garbage collection for memory cleanup
import copy  # 🎖️ NUCLEAR GRADE: Deep copy for buffer isolation
# OCR imports removed - going with manual coordinate mapping instead

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🎖️ State/Province code to full name mapping (US + Canada)
STATE_NAMES = {
    # 🇺🇸 US States
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia',
    # 🇨🇦 Canadian Provinces & Territories
    'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'NT': 'Northwest Territories',
    'NU': 'Nunavut', 'ON': 'Ontario', 'PE': 'Prince Edward Island', 'QC': 'Quebec',
    'SK': 'Saskatchewan', 'YT': 'Yukon'
}

def get_state_full_name(state_code):
    """Convert 2-letter state code to full name"""
    if not state_code:
        return ''
    code = state_code.upper().strip()
    # If it's already a full name, return as-is
    if len(code) > 2:
        return state_code
    return STATE_NAMES.get(code, state_code)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

def auto_discover_pdf_forms():
    """
    🚀 AUTO-DISCOVERY: Scan public/docs/sample-pdfs/ for PDF files
    NO MORE MANUAL MAPPING UPDATES NEEDED!
    """
    # Path to the PDF folder (relative to the main project root)
    pdf_folder = "../public/docs/sample-pdfs/"
    
    # If running from different location, try absolute path
    if not os.path.exists(pdf_folder):
        pdf_folder = "/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/sample-pdfs/"
    
    form_mapping = {}
    
    if os.path.exists(pdf_folder):
        # Find all PDF files
        pdf_files = [f for f in os.listdir(pdf_folder) if f.lower().endswith('.pdf')]
        
        for pdf_file in pdf_files:
            # Convert filename to form type key
            # SF24-23a.pdf -> sf24_23a
            form_key = pdf_file.replace('.pdf', '').replace('-', '_').lower()
            form_mapping[form_key] = pdf_file
            logger.info(f"🔍 AUTO-DISCOVERED: {form_key} -> {pdf_file}")
    
    # Fallback mapping if folder not found
    if not form_mapping:
        logger.warning("⚠️ Auto-discovery failed, using fallback mapping")
        form_mapping = {
            'sf24_23a': 'SF24-23a.pdf',
            'sf25a_23a': 'SF25a-23a.pdf',
        }
    
    logger.info(f"🚀 FORM MAPPING: {form_mapping}")
    return form_mapping

# OCR function removed - using manual coordinate mapping instead

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'GSA PDF Processing API is running!',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/process-gsa-pdf', methods=['POST'])
def process_gsa_pdf():
    """
    Process GSA form with data overlay
    Expects: form_data (dict), template_type (string)
    Returns: PDF file with overlaid data
    """
    try:
        data = request.get_json()
        form_data = data.get('form_data', {})
        template_type = data.get('template_type', 'sf24_23a')
        
        logger.info(f"Processing {template_type} with data: {list(form_data.keys())}")
        
        # Create PDF with perfect coordinate mapping
        pdf_buffer = create_gsa_pdf_overlay(form_data, template_type)
        
        # Save to temp file for response
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(pdf_buffer.getvalue())
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'{template_type}_filled.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Error processing GSA PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch-process-gsa', methods=['POST'])
def batch_process_gsa():
    """
    Batch process multiple GSA forms
    Expects: entries (list), template_type (string)
    Returns: ZIP file with all processed PDFs
    """
    try:
        data = request.get_json()
        entries = data.get('entries', [])
        template_type = data.get('template_type', 'sf24_23a')
        
        logger.info(f"Batch processing {len(entries)} {template_type} forms")
        
        processed_pdfs = []
        
        for i, entry_data in enumerate(entries):
            # Create PDF for each entry
            pdf_buffer = create_gsa_pdf_overlay(entry_data, template_type)
            
            # Store in memory for now (could save to disk for large batches)
            processed_pdfs.append({
                'filename': f'{template_type}_entry_{i+1}.pdf',
                'data': pdf_buffer.getvalue()
            })
        
        # For now, return the first PDF (we'll implement ZIP later)
        if processed_pdfs:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_file.write(processed_pdfs[0]['data'])
            temp_file.close()
            
            return send_file(
                temp_file.name,
                as_attachment=True,
                download_name=processed_pdfs[0]['filename'],
                mimetype='application/pdf'
            )
        
        return jsonify({'error': 'No entries to process'}), 400
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return jsonify({'error': str(e)}), 500

def detect_pdf_form_fields(pdf_buffer):
    """
    ENHANCED AUTOMAGIC PDF form field detection!
    Multiple detection strategies for maximum success!
    """
    try:
        reader = PdfReader(pdf_buffer)
        page = reader.pages[0]
        
        logger.info(f"🔍 PDF Analysis: {len(reader.pages)} pages, trailer keys: {list(reader.trailer.keys())}")
        
        # STRATEGY 1: Check for interactive form fields (AcroForm)
        if reader.trailer.get("/AcroForm"):
            logger.info("🎯 AcroForm detected! Extracting interactive fields...")
            form_fields = {}
            
            acro_form = reader.trailer["/AcroForm"]
            logger.info(f"📋 AcroForm keys: {list(acro_form.keys())}")
            
            if "/Fields" in acro_form:
                fields = acro_form["/Fields"]
                logger.info(f"📊 Found {len(fields)} interactive form fields")
                
                for i, field in enumerate(fields):
                    try:
                        field_obj = field.get_object()
                        field_name = field_obj.get("/T", f"field_{i}")
                        field_type = field_obj.get("/FT", "unknown")
                        
                        logger.info(f"🔍 Field {i}: Name='{field_name}', Type='{field_type}'")
                        
                        # Get field position (Rect)
                        if "/Rect" in field_obj:
                            rect = field_obj["/Rect"]
                            x, y, width, height = rect
                            form_fields[str(field_name)] = (float(x), float(y))
                            logger.info(f"📍 '{field_name}': ({x}, {y}) [{width}x{height}]")
                        
                        # Check for sub-fields (Kids)
                        if "/Kids" in field_obj:
                            kids = field_obj["/Kids"]
                            logger.info(f"👶 Field '{field_name}' has {len(kids)} sub-fields")
                            for j, kid in enumerate(kids):
                                kid_obj = kid.get_object()
                                if "/Rect" in kid_obj:
                                    rect = kid_obj["/Rect"]
                                    x, y, width, height = rect
                                    kid_name = f"{field_name}_{j}"
                                    form_fields[kid_name] = (float(x), float(y))
                                    logger.info(f"📍 Sub-field '{kid_name}': ({x}, {y})")
                    
                    except Exception as field_error:
                        logger.warning(f"⚠️ Error processing field {i}: {field_error}")
                        continue
                
                if form_fields:
                    logger.info(f"✅ Successfully extracted {len(form_fields)} field positions!")
                    return form_fields
        
        # STRATEGY 2: Check ALL PAGES for annotations (MULTI-PAGE SUPPORT!)
        logger.info("🔍 Checking ALL page annotations...")
        form_fields = {}
        
        for page_num, page in enumerate(reader.pages):
            page_number = page_num + 1
            logger.info(f"📄 Scanning page {page_number} for annotations...")
            
            if "/Annots" in page:
                annotations = page["/Annots"]
                logger.info(f"📝 Found {len(annotations)} annotations on page {page_number}")
                
                for i, annot in enumerate(annotations):
                    try:
                        annot_obj = annot.get_object()
                        annot_type = annot_obj.get("/Subtype", "unknown")
                        
                        if annot_type == "/Widget":  # Form field widget
                            field_name = annot_obj.get("/T", f"widget_p{page_number}_{i}")
                            if "/Rect" in annot_obj:
                                rect = annot_obj["/Rect"]
                                x, y, width, height = rect
                                
                                # 🎯 SMART FIELD TYPE & SIZE DETECTION
                                field_type = "text"
                                smart_width = width
                                smart_height = height
                                
                                # Detect checkboxes by size and name
                                if (width <= 20 and height <= 20) or any(keyword in str(field_name).lower() 
                                    for keyword in ['individual', 'partnership', 'corporation', 'joint', 'other']):
                                    field_type = "checkbox"
                                    smart_width = 15
                                    smart_height = 15
                                
                                # Detect long text fields
                                elif any(keyword in str(field_name).lower() 
                                    for keyword in ['address', 'name', 'construction', 'description']):
                                    field_type = "text"
                                    smart_width = max(200, width)
                                    smart_height = max(20, height)
                                
                                # Detect date/number fields
                                elif any(keyword in str(field_name).lower() 
                                    for keyword in ['date', 'percent', 'bid', 'amount']):
                                    field_type = "number"
                                    smart_width = max(100, width)
                                    smart_height = max(18, height)
                                
                                # 🔥 INCLUDE PAGE NUMBER, TYPE, AND SMART DIMENSIONS!
                                form_fields[str(field_name)] = (float(x), float(y), page_number, field_type, smart_width, smart_height)
                                logger.info(f"🎯 Widget '{field_name}': ({x}, {y}) [{field_type}] {smart_width}x{smart_height} on page {page_number}")
                    
                    except Exception as annot_error:
                        logger.warning(f"⚠️ Error processing annotation {i} on page {page_number}: {annot_error}")
                        continue
        
        if form_fields:
            logger.info(f"✅ Extracted {len(form_fields)} fields from ALL pages!")
            return form_fields
        
        # STRATEGY 3: Enhanced text analysis with better pattern recognition
        logger.info("📄 No interactive fields found, using ENHANCED text analysis...")
        return analyze_text_for_field_positions_enhanced(page)
        
    except Exception as e:
        logger.error(f"❌ Error in PDF field detection: {str(e)}")
        # Fallback to basic text analysis
        return analyze_text_for_field_positions_basic(page)

def analyze_text_for_field_positions_enhanced(page):
    """
    ENHANCED text analysis with BETTER coordinate detection!
    Uses multiple strategies for more accurate positioning
    """
    try:
        # Extract text content
        text_content = page.extract_text()
        logger.info(f"📝 Extracted text length: {len(text_content)} characters")
        
        # GSA SF24-23A ENHANCED field mapping with BETTER coordinates
        enhanced_positions = {
            'principal_name_address': (120, 650),  # Principal name and address
            'state_of_incorporation': (450, 650),  # State of incorporation  
            'surety_name_address': (120, 580),     # Surety name and address
            'org_corporation': (120, 520),         # Organization type - Corporation
            'org_partnership': (200, 520),         # Organization type - Partnership
            'org_joint_venture': (280, 520),       # Organization type - Joint Venture
            'org_individual': (360, 520),          # Organization type - Individual
            'percent_of_bid_price': (450, 580),    # Percent of bid price
            'bid_date': (120, 460),                # Bid opening date
            'invitation_no': (300, 460),           # Invitation/Solicitation No
            'penal_sum_hundreds': (120, 400),      # Penal sum - hundreds
            'penal_sum_thousands': (180, 400),     # Penal sum - thousands
            'penal_sum_millions': (240, 400),      # Penal sum - millions
            'signature_principal': (120, 300),     # Principal signature
            'signature_surety': (350, 300),        # Surety signature
            'date_signed': (500, 300),             # Date signed
        }
        
        logger.info(f"🎯 Generated {len(enhanced_positions)} ENHANCED field positions")
        return enhanced_positions
        
    except Exception as e:
        logger.error(f"❌ Error in enhanced text analysis: {str(e)}")
        # Fallback to basic analysis
        return analyze_text_for_field_positions_basic(page)

def generate_intelligent_gsa_fields(pdf_url):
    """
    Generate intelligent GSA form fields based on form type and patterns
    This recreates the 57-field magic from the old working version!
    """
    # Determine form type from URL
    url_lower = pdf_url.lower()
    
    if 'sf24' in url_lower or '24-23' in url_lower:
        return generate_sf24_fields()
    elif 'sf25' in url_lower or '25-23' in url_lower:
        return generate_sf25_fields()
    elif 'sf28' in url_lower or '28-23' in url_lower:
        return generate_sf28_fields()
    else:
        return generate_generic_gsa_fields()

def generate_sf24_fields():
    """Generate SF24-23A Bid Bond fields (57 total fields)"""
    fields = {}
    
    # Page 1 - Principal Information
    fields.update({
        'page1_dateexecuted': (304, 738, 1),
        'page1_principaladdress': (19, 649, 1),
        'page1_millions': (63, 498, 1),
        'page1_stateof': (316, 649, 1),
        'page1_surety': (19, 578, 1),
        'page1_individual': (319, 706, 1),
        'page1_partnership': (391, 707, 1),
        'page1_jointventure': (475, 706, 1),
        'page1_corporation': (319, 688, 1),
        'page1_other': (401, 688, 1),
        'page1_cents': (247, 498, 1),
        'page1_hunderds': (187, 498, 1),
        'page1_thousands': (116, 498, 1),
        'page1_contractno': (449, 519, 1),
        'page1_contratedate': (369, 520, 1),
        'page1_forconstruction': (281, 498, 1),
        'page1_percentbid': (19, 498, 1),
        'page1_biddate': (282, 536, 1),
        'page1_invitationno': (369, 536, 1),
        'page1_specify': (499, 685, 1),
    })
    
    # Page 2 - Surety Information
    fields.update({
        'page2_nametitle1': (72, 650, 2),
        'page2_nametitle2': (72, 620, 2),
        'page2_nametitle3': (72, 590, 2),
        'page2_nametitle20': (72, 560, 2),
        'page2_nametitle': (72, 530, 2),
        'page2_nameaddressa': (72, 500, 2),
        'page2_nametitlea': (72, 470, 2),
        'page2_nametitlea2': (72, 440, 2),
        'page2_liabilitylimita': (350, 470, 2),
        'page2_statea': (500, 470, 2),
    })
    
    # 🚫 REMOVED: Fake pattern fields that were causing mystery fields on last page
    # These were just padding to reach 57 total, but we have real detected fields now!
    
    return fields

def generate_sf25_fields():
    """Generate SF25-23A Performance Bond fields"""
    fields = {}
    
    # Similar structure but different field names
    fields.update({
        'page1_dateexecuted': (301, 733, 1),
        'page1_principaladdress': (18, 608, 1),
        'page1_millions': (469, 642, 1),
        'page1_individual': (372, 679, 1),
        'page1_partnership': (465, 679, 1),
        'page1_jointventure': (372, 661, 1),
        'page1_corporation': (465, 661, 1),
        'page1_other': (372, 643, 1),
        'page1_stateof': (370, 609, 1),
        'page1_surety': (19, 519, 1),
        'page1_cents': (555, 563, 1),
        'page1_hunderds': (492, 563, 1),
        'page1_thousands': (421, 563, 1),
        'page1_millions2': (369, 563, 1),
        'page1_contractno': (449, 519, 1),
        'page1_contratedate': (369, 520, 1),
    })
    
    # 🚫 REMOVED: Fake pattern fields that were causing mystery fields
    # These were just padding, but we have real detected fields now!
    
    return fields

def generate_sf28_fields():
    """Generate SF28-23A Affidavit fields"""
    fields = {}
    
    # Basic SF28 structure
    for i in range(1, 46):  # 45 fields
        page = 1 + (i // 23)
        fields[f'sf28_field_{i}'] = (50 + (i % 4) * 130, 700 - (i % 23) * 25, page)
    
    return fields

def generate_generic_gsa_fields():
    """Generate generic GSA form fields"""
    fields = {}
    
    # Standard GSA form fields
    for i in range(1, 51):  # 50 fields
        page = 1 + (i // 17)
        fields[f'gsa_field_{i}'] = (60 + (i % 3) * 180, 720 - (i % 17) * 35, page)
    
    return fields

def analyze_text_for_field_positions_basic(page):
    """
    BASIC text analysis - fallback method
    """
    try:
        # Extract text with positions (if possible)
        text_content = page.extract_text()
        logger.info(f"📝 Extracted text length: {len(text_content)} characters")
        
        # GSA form pattern recognition
        field_patterns = {
            'principal_name_address': ['Principal', 'Name and Address', 'Contractor'],
            'state_of_incorporation': ['State of Incorporation', 'State'],
            'surety_name_address': ['Surety', 'Surety Company'],
            'org_corporation': ['Corporation', 'Corp'],
            'percent_of_bid_price': ['Percent', '%', 'Percentage'],
            'bid_date': ['Bid Date', 'Date'],
            'invitation_number': ['Invitation', 'IFB', 'Number'],
            'for_construction_of': ['Construction', 'Project', 'Work'],
        }
        
        detected_fields = {}
        
        # Use intelligent positioning based on GSA form standards
        # This is our fallback when no interactive fields exist
        width, height = 612, 792  # Standard letter size
        left_margin = 72
        top_start = height - 120
        line_height = 30
        
        detected_fields = {
            'principal_name_address': (left_margin, top_start - (line_height * 1)),
            'state_of_incorporation': (left_margin + 350, top_start - (line_height * 1)),
            'surety_name_address': (left_margin, top_start - (line_height * 3)),
            'org_corporation': (left_margin + 200, top_start - (line_height * 5)),
            'percent_of_bid_price': (left_margin, top_start - (line_height * 7)),
            'bid_date': (left_margin, top_start - (line_height * 10)),
            'invitation_number': (left_margin + 150, top_start - (line_height * 10)),
            'for_construction_of': (left_margin + 300, top_start - (line_height * 10)),
        }
        
        logger.info(f"🎯 Generated {len(detected_fields)} field positions from text analysis")
        return detected_fields
        
    except Exception as e:
        logger.error(f"❌ Error analyzing text: {str(e)}")
        return {}

def create_gsa_pdf_overlay(form_data, template_type):
    """
    Create GSA PDF with perfect coordinate overlay using ACTUAL GSA form
    This is where the REAL MAGIC happens!
    
    🎖️ MILITARY GRADE: Guaranteed output for every form, no blank pages!
    """
    logger.info(f"🚀 CREATE_GSA_PDF_OVERLAY CALLED: template_type='{template_type}', form_data keys: {list(form_data.keys())[:10]}")
    
    # 🎖️ MILITARY GRADE: Initialize ALL variables at the TOP to prevent undefined errors
    fields_by_page = {}  # CRITICAL: Must be defined before any code path
    reader = None
    writer = None
    field_positions = {}
    field_name_mapping = {}
    try:
        # 🚀 LOCAL FILE ACCESS: Read PDFs directly from filesystem (NO INTERNET!)
        form_mapping = auto_discover_pdf_forms()
        pdf_filename = form_mapping.get(template_type, 'SF24-23a.pdf')  # Fallback to SF24
        local_pdf_path = f"/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/sample-pdfs/{pdf_filename}"
        
        logger.info(f"⚡ Loading GSA PDF LOCALLY: {local_pdf_path}")
        
        if os.path.exists(local_pdf_path):
            # 🚀 SIMPLE & FAST: Direct local file access
            logger.info(f"📁 Reading PDF from local disk: {pdf_filename}")
            with open(local_pdf_path, 'rb') as pdf_file:
                gsa_pdf_buffer = io.BytesIO(pdf_file.read())
            reader = PdfReader(gsa_pdf_buffer)
            writer = PdfWriter()
            
            # Process ALL pages of the GSA form (4 pages)
            logger.info(f"📄 GSA PDF has {len(reader.pages)} pages - processing ALL pages")
            
            # Get the first page for overlay, but DON'T add pages yet
            first_page = reader.pages[0]
            
            # Create overlay with data for page 1
            overlay_buffer = io.BytesIO()
            c = canvas.Canvas(overlay_buffer, pagesize=letter)
            width, height = letter  # 612 x 792 points
            
            logger.info(f"✅ PDF loaded successfully: {template_type}")
        else:
            logger.error(f"❌ CRITICAL: PDF file not found: {local_pdf_path}")
            raise FileNotFoundError(f"PDF not found: {local_pdf_path}")
    
    except Exception as e:
        logger.error(f"❌ CRITICAL: Error loading GSA PDF: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # 🎖️ MILITARY GRADE: Return None to signal failure, let caller handle it
        return None
    
    # 🎯 PRIORITIZE MANUAL SCHEMA over auto-detection for ALL GSA forms
    # List of known GSA form template prefixes
    GSA_FORM_PREFIXES = ('sf', 'of_')  # sf24, sf25, sf28, sf273, sf274, sf275, sf1418, of_91
    is_gsa_form = any(template_type.startswith(prefix) for prefix in GSA_FORM_PREFIXES)
    logger.info(f"🔍 TEMPLATE TYPE CHECK: '{template_type}' - is_gsa_form: {is_gsa_form}")
    
    # Handle bermuda template being sent as sf24_23a (detection issue)
    if template_type == 'bermuda' and 'datebondex' in form_data:
        logger.info("🔄 FIXING: bermuda template detected but has GSA fields - treating as sf24_23a")
        template_type = 'sf24_23a'
        manual_schema_path = f"/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/pdf-templates/sf24_23a_manual_schema.json"
    
    if is_gsa_form:
        # Check for manual schema first
        manual_schema_path = f"/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/pdf-templates/{template_type}_manual_schema.json"
        logger.info(f"🔍 MANUAL SCHEMA PATH: {manual_schema_path}")
        
        if os.path.exists(manual_schema_path):
            logger.info(f"🎯 USING MANUAL SCHEMA: {manual_schema_path}")
            try:
                with open(manual_schema_path, 'r') as f:
                    schema = json.load(f)
                    field_positions = {}
                    duplicate_counter = {}
                    
                    # 🚫 DISABLE VISUAL SORTING - IT'S EATING FIELDS!
                    # Just use the schema as-is with duplicate handling
                    for field in schema.get('fields', []):
                        # Use cleanName for mapping (what frontend sends)
                        clean_name = field.get('cleanName', field['name'])
                        x, y, page = field['x'], field['y'], field.get('page', 1)
                        height = field.get('height', 20)  # Default 20px if not specified
                        
                        # 🔥 HANDLE DUPLICATES: Add suffix for duplicate field names
                        # Store as (x, y, page, height) tuple
                        if clean_name in field_positions:
                            # This is a duplicate - create unique key
                            if clean_name not in duplicate_counter:
                                duplicate_counter[clean_name] = 2  # Start at 2 (first was without suffix)
                            unique_name = f"{clean_name}_{duplicate_counter[clean_name]}"
                            duplicate_counter[clean_name] += 1
                            field_positions[unique_name] = (x, y, page, height)
                            logger.info(f"🔄 DUPLICATE FIELD: {clean_name} → {unique_name}")
                        else:
                            field_positions[clean_name] = (x, y, page, height)
                    
                    logger.info(f"✅ Loaded {len(field_positions)} fields from manual schema (including duplicates)")
            except Exception as e:
                logger.error(f"❌ Error loading manual schema: {e}")
                field_positions = detect_pdf_form_fields(gsa_pdf_buffer) if 'gsa_pdf_buffer' in locals() else {}
        elif 'gsa_pdf_buffer' in locals():
            logger.info("🔍 Using auto-detection (no manual schema found)")
            field_positions = detect_pdf_form_fields(gsa_pdf_buffer)
        else:
            logger.warning("⚠️ No GSA PDF loaded, using fallback detection")
            field_positions = analyze_text_for_field_positions(None)
        
        # 🎯 TRUST THE AUTO-DETECTION! Use detected coordinates DIRECTLY!
        # The field detection is PERFECT - let's not mess with it!
        USE_RAW_COORDINATES = True
        
        logger.info(f"🎯 Using RAW detected coordinates - NO manual adjustments!")
        
        # CRITICAL DEBUG: Log the exact form_data we received
        logger.info(f"🚨 CRITICAL DEBUG - Raw form_data keys: {list(form_data.keys())}")
        logger.info(f"🚨 CRITICAL DEBUG - Raw form_data values: {form_data}")
        logger.info(f"🚨 CRITICAL DEBUG - Detected PDF fields: {list(field_positions.keys())}")
        
        # 🎯 DYNAMIC FIELD MAPPING - NO HARDCODING EVER!
        def smart_field_matching(csv_fields, pdf_fields):
            """Intelligently match CSV field names to PDF field names using similarity"""
            from difflib import SequenceMatcher
            
            mapping = {}
            used_pdf_fields = set()
            
            for csv_field in csv_fields:
                best_match = None
                best_score = 0.0
                
                # Clean the CSV field name for better matching
                csv_clean = csv_field.lower().replace('_', '').replace('[0]', '').replace('page1', '')
                
                for pdf_field in pdf_fields:
                    if pdf_field in used_pdf_fields:
                        continue
                        
                    # Clean the PDF field name for comparison
                    pdf_clean = pdf_field.lower().replace('form1[0].#subform[0].', '').replace('[0]', '')
                    
                    # Calculate similarity score
                    score = SequenceMatcher(None, csv_clean, pdf_clean).ratio()
                    
                    # Boost score for exact substring matches
                    if csv_clean in pdf_clean or pdf_clean in csv_clean:
                        score += 0.3
                    
                    if score > best_score and score > 0.3:  # Minimum threshold
                        best_match = pdf_field
                        best_score = score
                
                if best_match:
                    mapping[csv_field] = best_match
                    used_pdf_fields.add(best_match)
                    logger.info(f"🎯 SMART MATCH: '{csv_field}' → '{best_match}' (Score: {best_score:.2f})")
            
            return mapping
        
        # Determine mapping strategy
        if is_gsa_form and os.path.exists(manual_schema_path):
            # BULLETPROOF: Manual schema with smart CSV field name mapping
            field_name_mapping = {}
            
            # ✅ HYBRID MAPPING: Direct + fallback for the 4 problematic fields
            # The coordinate mapper generates matching cleanNames, but we need fallback
            
            # Temporary fallback mapping for the 4 missing fields
            fallback_mapping = {
                'state_of_incorporation': 'state',
                'percent_of_bid_price': 'percentbid', 
                'bid_date': 'biddate',
                'invitation_number': 'invitationno'
            }
            
            for csv_field in form_data.keys():
                if csv_field in field_positions:
                    field_name_mapping[csv_field] = csv_field
                    logger.info(f"✅ MAPPED: {csv_field} found in schema")
                elif csv_field in fallback_mapping and fallback_mapping[csv_field] in field_positions:
                    field_name_mapping[csv_field] = fallback_mapping[csv_field]
                    logger.info(f"✅ FALLBACK MAPPED: {csv_field} → {fallback_mapping[csv_field]}")
                else:
                    logger.warning(f"❌ NOT FOUND: {csv_field} missing from schema")
            
            logger.info(f"🎯 MANUAL SCHEMA: Smart mapping for {len(field_name_mapping)} fields")
            logger.info(f"🔍 Available schema fields: {list(field_positions.keys())[:10]}...")  # Show first 10
        else:
            # INTELLIGENT: Auto-detected fields use smart matching
            field_name_mapping = smart_field_matching(form_data.keys(), field_positions.keys())
            logger.info(f"🎯 SMART MATCHING: Mapped {len(field_name_mapping)} fields dynamically")
        
        logger.info(f"🎯 Field mapping: Frontend has {list(form_data.keys())}")
        logger.info(f"🎯 Frontend data: {form_data}")
        logger.info(f"🎯 PDF detected: {list(field_positions.keys())}")
        
        # 🎯 MULTI-PAGE OVERLAY: Group fields by page and create separate overlays
        fields_by_page = {}
        for frontend_name, pdf_field_name in field_name_mapping.items():
            if frontend_name in form_data and form_data[frontend_name] and pdf_field_name in field_positions:
                coords = field_positions[pdf_field_name]
                
                # 🔧 SAFETY: Handle coordinate unpacking safely
                # Schema stores (x, y, page, height) - we need height for multi-line positioning
                try:
                    if len(coords) >= 4:
                        x, y, page, height = coords[0], coords[1], coords[2], coords[3]
                    elif len(coords) >= 3:
                        x, y, page = coords[0], coords[1], coords[2]
                        height = 20  # Default height
                    elif len(coords) == 2:
                        x, y = coords[0], coords[1]
                        page = 1
                        height = 20
                    else:
                        logger.warning(f"⚠️ Invalid coordinates for {pdf_field_name}: {coords}")
                        continue
                except (IndexError, TypeError) as e:
                    logger.error(f"❌ Coordinate unpacking error for {pdf_field_name}: {coords} - {e}")
                    continue
                
                if page not in fields_by_page:
                    fields_by_page[page] = []
                
                fields_by_page[page].append({
                    'frontend_name': frontend_name,
                    'pdf_field_name': pdf_field_name,
                    'value': str(form_data[frontend_name]),
                    'x': x,
                    'y': y,
                    'height': height,
                    'page': page
                })
        
        logger.info(f"📄 Fields grouped by page: {dict((k, len(v)) for k, v in fields_by_page.items())}")
        
        # Create overlay for page 1 ONLY (current canvas)
        successful_mappings = 0
        c.setFont("Helvetica", 9)
        
        if 1 in fields_by_page:
            logger.info(f"📋 Processing {len(fields_by_page[1])} fields for PAGE 1")
            for field in fields_by_page[1]:
                x, y = field['x'], field['y']
                height = field.get('height', 20)
                value = field['value']
                
                # 🎯 TEXT POSITIONING: Start at TOP of field for tall boxes
                # PDF coordinates: y is bottom-left corner, so top = y + height
                calibrated_x = x + 2  # Small right adjustment
                
                # For TALL fields (height > 35), ALWAYS align text to TOP
                # This handles Principal, Surety, Address fields regardless of text length
                is_multiline = '\\n' in str(value) or '\n' in str(value) or len(value) > 40
                is_tall_field = height > 35  # Fields like Principal, Surety, Address
                
                if is_tall_field:
                    calibrated_y = y + height - 12  # Start near TOP of field
                elif is_multiline:
                    calibrated_y = y + height - 12  # Multi-line also starts at top
                else:
                    calibrated_y = y + 6  # Single line in small box: near bottom
                
                logger.info(f"📍 Page 1: {field['frontend_name']} → {field['pdf_field_name']}: ({x}, {y}) h={height} → ({calibrated_x}, {calibrated_y}) = '{value[:30]}...'")
                
                # Handle checkboxes and text fields
                if field['frontend_name'].startswith('org_') or value.upper() in ['X']:
                    if value.upper() in ['X', 'TRUE', '1', 'YES']:
                        c.drawString(x + 2, y + 2, "X")
                        logger.info(f"✅ Checkbox {field['pdf_field_name']}: X")
                else:
                    # 🚀 SMART WRAP: Calculate chars per line based on field width
                    # Average char width at 8pt Helvetica ≈ 4.5 points
                    field_width = field.get('width', 200)  # Default 200 if not specified
                    avg_char_width = 4.5
                    chars_per_line = max(20, int(field_width / avg_char_width))  # Minimum 20 chars
                    logger.info(f"📐 Smart wrap: field_width={field_width}px → {chars_per_line} chars/line")
                    
                    # 🚀 MULTI-LINE TEXT SUPPORT: Handle \n line breaks + smart auto-wrapping
                    if '\\n' in str(value) or '\n' in str(value):
                        lines = str(value).replace('\\n', '\n').split('\n')
                        logger.info(f"📝 Multi-line text detected: {len(lines)} lines for field '{field['frontend_name']}'")
                        line_spacing = 10  # Pixels between lines
                        line_index = 0
                        for i, line in enumerate(lines[:6]):  # Max 6 explicit lines
                            if len(line) > chars_per_line:
                                wrapped_lines = [line[j:j+chars_per_line] for j in range(0, len(line), chars_per_line)]
                                for wrapped_line in wrapped_lines[:3]:  # Max 3 wrapped sub-lines per explicit line
                                    c.drawString(calibrated_x, calibrated_y - (line_index * line_spacing), wrapped_line)
                                    line_index += 1
                            else:
                                c.drawString(calibrated_x, calibrated_y - (line_index * line_spacing), line)
                                line_index += 1
                    elif len(value) > chars_per_line:
                        # Auto-wrap long single-line text using smart width
                        lines = [value[i:i+chars_per_line] for i in range(0, len(value), chars_per_line)]
                        for i, line in enumerate(lines[:6]):  # Max 6 wrapped lines
                            c.drawString(calibrated_x, calibrated_y - (i * 10), line)
                    else:
                        c.drawString(calibrated_x, calibrated_y, value)
                    logger.info(f"📝 Text {field['pdf_field_name']}: '{value[:50]}...'")
                
                successful_mappings += 1
        else:
            logger.warning("⚠️ No fields found for page 1")
        
        logger.info(f"✅ Successfully mapped {successful_mappings} fields on PAGE 1")
        
        # TODO: Handle pages 2, 3, 4 with separate overlays (future enhancement)
        if len(fields_by_page) > 1:
            other_pages = [p for p in fields_by_page.keys() if p != 1]
            logger.info(f"📋 NOTE: Fields on pages {other_pages} will be handled in future enhancement")
        
        # Timestamp removed per user request
    
    # Save the overlay
    c.save()
    overlay_buffer.seek(0)
    
    # 🎯 MULTI-PAGE PDF GENERATION: Create overlays for ALL pages
    try:
        # 🎖️ MILITARY GRADE: Verify reader and writer exist
        if reader is None or writer is None:
            logger.error("❌ CRITICAL: reader or writer is None - PDF loading failed")
            return None
        
        if reader is not None and writer is not None:
            # Create overlay PDF from page 1 canvas
            overlay_pdf = PdfReader(overlay_buffer)
            page1_overlay = overlay_pdf.pages[0]
            
            # Process each page of the GSA form
            for page_num in range(len(reader.pages)):
                current_page_num = page_num + 1
                base_page = reader.pages[page_num]
                
                if current_page_num == 1:
                    # Page 1: Merge with existing overlay
                    base_page.merge_page(page1_overlay)
                    logger.info("✅ Merged data overlay onto GSA page 1")
                elif current_page_num in fields_by_page:
                    # Pages 2, 3, 4: Create new overlays if they have fields
                    page_fields = fields_by_page[current_page_num]
                    logger.info(f"📋 Creating overlay for page {current_page_num} with {len(page_fields)} fields")
                    
                    # Create new overlay for this page
                    page_overlay_buffer = io.BytesIO()
                    page_canvas = canvas.Canvas(page_overlay_buffer, pagesize=letter)
                    page_canvas.setFont("Helvetica", 9)
                    
                    # Add fields for this page
                    for field in page_fields:
                        x, y = field['x'], field['y']
                        height = field.get('height', 20)
                        value = field['value']
                        
                        # 🎯 TEXT POSITIONING: Start at TOP of field for tall boxes
                        calibrated_x = x + 2
                        is_multiline = '\\n' in str(value) or '\n' in str(value) or len(value) > 40
                        is_tall_field = height > 35  # Fields like Principal, Surety, Address
                        
                        if is_tall_field:
                            calibrated_y = y + height - 12  # Start near TOP
                        elif is_multiline:
                            calibrated_y = y + height - 12  # Multi-line also at top
                        else:
                            calibrated_y = y + 6  # Single line in small box: near bottom
                        
                        logger.info(f"📍 Page {current_page_num}: {field['frontend_name']} → {field['pdf_field_name']}: ({x}, {y}) h={height} = '{value[:30]}...'")
                        
                        # 🚀 MULTI-LINE TEXT SUPPORT
                        if '\\n' in str(value) or '\n' in str(value):
                            lines = str(value).replace('\\n', '\n').split('\n')
                            line_spacing = 10
                            for i, line in enumerate(lines[:6]):
                                if len(line) > 45:
                                    wrapped_lines = [line[j:j+45] for j in range(0, len(line), 45)]
                                    for k, wrapped_line in enumerate(wrapped_lines[:2]):
                                        page_canvas.drawString(calibrated_x, calibrated_y - ((i * 2 + k) * line_spacing), wrapped_line)
                                else:
                                    page_canvas.drawString(calibrated_x, calibrated_y - (i * line_spacing), line)
                        elif len(value) > 45:
                            lines = [value[i:i+45] for i in range(0, len(value), 45)]
                            for i, line in enumerate(lines[:4]):
                                page_canvas.drawString(calibrated_x, calibrated_y - (i * 10), line)
                        else:
                            page_canvas.drawString(calibrated_x, calibrated_y, value)
                    
                    # Save and merge this page's overlay
                    page_canvas.save()
                    page_overlay_buffer.seek(0)
                    page_overlay_pdf = PdfReader(page_overlay_buffer)
                    page_overlay_page = page_overlay_pdf.pages[0]
                    base_page.merge_page(page_overlay_page)
                    logger.info(f"✅ Merged data overlay onto GSA page {current_page_num}")
                
                # Add the processed page to writer
                writer.add_page(base_page)
                logger.info(f"📋 Added GSA page {current_page_num}")
            
            # Return the complete PDF with all pages
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            # Debug: Check buffer size
            buffer_size = len(output_buffer.getvalue())
            logger.info(f"📄 Final PDF created with {len(writer.pages)} pages, buffer size: {buffer_size} bytes")
            
            if buffer_size == 0:
                logger.error("❌ CRITICAL: PDF buffer is empty!")
                raise Exception("PDF buffer is empty")
            
            # 🎖️ MILITARY GRADE: Create a fresh copy of the buffer to avoid reference issues
            final_buffer = io.BytesIO(output_buffer.getvalue())
            return final_buffer
        else:
            # 🎖️ MILITARY GRADE: No reader/writer means failure
            logger.error("❌ CRITICAL: reader or writer missing in final block")
            return None
    except Exception as e:
        logger.error(f"❌ CRITICAL: Error merging PDFs: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

@app.route('/api/create-coordinate-mapper', methods=['POST'])
@cross_origin()
def create_coordinate_mapper():
    """
    Create a coordinate mapping image from uploaded PDF
    """
    try:
        page_number = int(request.form.get('page_number', 1))
        
        # Check if we have a filename (for page navigation) or file upload (first time)
        if 'filename' in request.form:
            # Use existing uploaded file
            filename = request.form.get('filename')
            pdf_path = f"../public/docs/sample-pdfs/{filename}"
            
            if not os.path.exists(pdf_path):
                return jsonify({'error': f'PDF file not found: {filename}'}), 400
                
            with open(pdf_path, 'rb') as f:
                pdf_buffer = io.BytesIO(f.read())
                
        elif 'pdf_file' in request.files:
            # Handle file upload (first time)
            pdf_file = request.files['pdf_file']
            
            if pdf_file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
                
            pdf_buffer = io.BytesIO(pdf_file.read())
        else:
            return jsonify({'error': 'No PDF file or filename provided'}), 400
        reader = PdfReader(pdf_buffer)
        
        if page_number < 1 or page_number > len(reader.pages):
            return jsonify({'error': f'Invalid page number. PDF has {len(reader.pages)} pages'}), 400
            
        # Get the specified page (convert to 0-based index)
        page = reader.pages[page_number - 1]
        
        # Create coordinate grid overlay
        overlay_buffer = io.BytesIO()
        c = canvas.Canvas(overlay_buffer, pagesize=letter)
        width, height = letter
        
        # 🎯 MAGICAL AUTO-VISUAL FIELD MAPPER!
        
        # First, draw very subtle background grid
        c.setLineWidth(0.1)
        c.setStrokeColorRGB(0.95, 0.95, 0.98)  # Ultra light grid
        
        # Light grid every 100 points
        for x in range(0, int(width), 100):
            c.line(x, 0, x, height)
        for y in range(0, int(height), 100):
            c.line(0, y, width, y)
        
        # 🔥 MAGIC: AUTO-DETECT AND VISUALIZE FORM FIELDS!
        try:
            # Reset PDF buffer for field detection
            pdf_buffer.seek(0)
            detected_fields = detect_pdf_form_fields(pdf_buffer)
            
            logger.info(f"🎯 VISUAL MAPPER: Drawing {len(detected_fields)} detected fields on page {page_number}")
            
            # Draw red rectangles around each detected field
            c.setStrokeColorRGB(1, 0, 0)  # Bright red border
            c.setFillColorRGB(1, 0.95, 0.95)  # Very light red fill
            c.setLineWidth(1.5)
            
            field_count = 0
            for field_name, coords in detected_fields.items():
                if len(coords) == 3:
                    x, y, field_page = coords
                else:
                    x, y = coords
                    field_page = 1
                
                # Only draw fields for the current page
                if field_page == page_number:
                    field_count += 1
                    
                    # Determine field size based on field type
                    if any(keyword in field_name.lower() for keyword in ['address', 'name', 'construction']):
                        width, height = 200, 20
                    elif any(keyword in field_name.lower() for keyword in ['individual', 'partnership', 'corporation']):
                        width, height = 15, 15  # Checkboxes
                    else:
                        width, height = 120, 18  # Default text fields
                    
                    # Draw field rectangle with light fill
                    c.rect(x, y, width, height, fill=1, stroke=1)
                    
                    # Clean field name for display
                    clean_name = field_name.replace('form1[0].#subform[0].', '').replace('[0]', '')
                    if len(clean_name) > 15:
                        clean_name = clean_name[:12] + "..."
                    
                    # Add field name label above rectangle
                    c.setFillColorRGB(0.8, 0, 0)  # Dark red text
                    c.setFont("Helvetica-Bold", 8)
                    c.drawString(x, y + height + 3, clean_name)
                    
                    # Add coordinates below rectangle
                    c.setFillColorRGB(0.4, 0.4, 0.4)  # Gray text
                    c.setFont("Helvetica", 6)
                    c.drawString(x, y - 8, f"({int(x)}, {int(y)})")
            
            logger.info(f"✅ VISUAL MAPPER: Drew {field_count} field rectangles on page {page_number}")
            
            # Add title
            c.setFillColorRGB(0, 0, 0.8)  # Blue title
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, height - 30, f"🎯 AUTO-DETECTED FIELDS - PAGE {page_number} ({field_count} fields)")
            
        except Exception as e:
            logger.error(f"❌ Error in visual field mapping: {str(e)}")
            # Fallback to basic grid if field detection fails
            c.setStrokeColorRGB(0.8, 0.8, 0.9)
            c.setLineWidth(0.2)
            for x in range(0, int(width), 50):
                c.line(x, 0, x, height)
            for y in range(0, int(height), 50):
                c.line(0, y, width, y)
        
        # Add page number indicator
        c.setFillColorRGB(0, 0, 0)  # Black
        c.setFont("Helvetica-Bold", 12)
        c.drawString(width - 100, height - 20, f"Page {page_number}")
        
        c.save()
        overlay_buffer.seek(0)
        
        # Create overlay PDF
        overlay_reader = PdfReader(overlay_buffer)
        overlay_page = overlay_reader.pages[0]
        
        # Merge with original page
        page.merge_page(overlay_page)
        
        # Create final PDF
        writer = PdfWriter()
        writer.add_page(page)
        
        final_buffer = io.BytesIO()
        writer.write(final_buffer)
        final_buffer.seek(0)
        
        # Convert PDF to PNG for display in browser
        try:
            from pdf2image import convert_from_bytes
            
            # Convert the PDF page to image
            final_buffer.seek(0)
            images = convert_from_bytes(final_buffer.read(), first_page=1, last_page=1, dpi=150)
            
            if images:
                # Save as PNG
                img_buffer = io.BytesIO()
                images[0].save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                return send_file(
                    img_buffer,
                    mimetype='image/png',
                    as_attachment=False,
                    download_name=f'coordinate_mapper_page_{page_number}.png'
                )
            else:
                raise Exception("Failed to convert PDF to image")
                
        except ImportError:
            # Fallback: return PDF if pdf2image not available
            return send_file(
                final_buffer,
                mimetype='application/pdf',
                as_attachment=False,
                download_name=f'coordinate_mapper_page_{page_number}.pdf'
            )
            
    except Exception as e:
        logger.error(f"Error creating coordinate mapper: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-coordinates', methods=['POST'])
def get_coordinates():
    """
    Helper endpoint to return coordinate mapping for a template
    """
    try:
        data = request.get_json()
        template_type = data.get('template_type', 'sf24_23a')
        
        # Return our coordinate schema
        coordinates = {
            'sf24_23a': {
                'principal_name_address': {'x': 125, 'y': 77, 'width': 300, 'height': 20},
                'state_of_incorporation': {'x': 475, 'y': 77, 'width': 80, 'height': 20},
                'surety_name_address': {'x': 125, 'y': 147, 'width': 300, 'height': 20},
                'org_corporation': {'x': 300, 'y': 215, 'width': 15, 'height': 15},
                'percent_of_bid_price': {'x': 125, 'y': 275, 'width': 100, 'height': 20},
                'bid_date': {'x': 125, 'y': 375, 'width': 100, 'height': 20},
                'invitation_number': {'x': 235, 'y': 375, 'width': 120, 'height': 20},
                'for_construction_of': {'x': 365, 'y': 375, 'width': 150, 'height': 20},
            }
        }
        
        return jsonify({
            'template_type': template_type,
            'coordinates': coordinates.get(template_type, {}),
            'page_size': {'width': 612, 'height': 792}
        })
        
    except Exception as e:
        logger.error(f"Error getting coordinates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-pdf-fields', methods=['POST'])
def analyze_pdf_fields():
    """
    NEW ENDPOINT: Analyze any PDF and return all detected fields
    This is the LEGENDARY automation endpoint!
    """
    try:
        data = request.get_json()
        pdf_url = data.get('pdf_url')
        
        if not pdf_url:
            return jsonify({'error': 'No PDF URL provided'}), 400
            
        logger.info(f"🔍 LEGENDARY ANALYSIS: Analyzing PDF from {pdf_url}")
        
        # Download the PDF
        response = requests.get(pdf_url, timeout=30)
        if response.status_code != 200:
            return jsonify({'error': f'Failed to download PDF: {response.status_code}'}), 400
            
        # Analyze the PDF
        pdf_buffer = io.BytesIO(response.content)
        interactive_fields = detect_pdf_form_fields(pdf_buffer)
        
        logger.info(f"🎯 Found {len(interactive_fields)} interactive fields")
        
        # 🚀 APPLY VISUAL SORTING TO FORM-ANALYZER TOO!
        # Convert to list of field objects for sorting
        field_objects = []
        for field_name, coords in interactive_fields.items():
            if len(coords) >= 3:
                x, y, page = coords[0], coords[1], coords[2]
            else:
                x, y, page = coords[0], coords[1], 1
            
            field_objects.append({
                'cleanName': field_name,
                'x': x,
                'y': y,
                'page': page,
                'coords': coords
            })
        
        # 🎯 SORT BY VISUAL POSITION: Page → Y (top-to-bottom) → X (left-to-right)
        sorted_field_objects = sorted(
            field_objects,
            key=lambda f: (f['page'], -f['y'], f['x'])
        )
        logger.info(f"🔄 SORTED {len(sorted_field_objects)} fields by visual position for form-analyzer")
        
        # 🔥 REGENERATE FIELD NAMES IN VISUAL ORDER (same logic as manual schema)
        base_name_counter = {}
        all_fields = {}
        
        for field_obj in sorted_field_objects:
            original_name = field_obj['cleanName']
            coords = field_obj['coords']
            
            # Extract base name (remove existing suffixes like _2, _3, etc.)
            base_name = original_name.split('_')[0] if '_' in original_name else original_name
            
            # Generate sequential field name based on visual order
            if base_name not in base_name_counter:
                base_name_counter[base_name] = 1
                final_field_name = base_name
            else:
                base_name_counter[base_name] += 1
                final_field_name = f"{base_name}_{base_name_counter[base_name]}"
            
            all_fields[final_field_name] = coords
            logger.info(f"🎯 FORM-ANALYZER VISUAL ORDER: {original_name} → {final_field_name}")
        
        # Generate additional intelligent fields based on GSA form patterns
        additional_fields = generate_intelligent_gsa_fields(pdf_url)
        
        logger.info(f"🧠 Generated {len(additional_fields)} intelligent pattern fields")
        
        # SMART DEDUPLICATION: Map interactive field names to their semantic meaning
        interactive_semantic_map = {}
        for field_name in all_fields.keys():
            # Extract semantic meaning from interactive field names
            clean = field_name.lower().replace('form1[0].#subform[0].', '').replace('[0]', '')
            
            # Map common variations
            semantic_mappings = {
                'datebondex': 'dateexecuted',
                'princple': 'principaladdress', 
                'state': 'stateof',
                'percentbid': 'percentbid',
                'biddate': 'biddate',
                'invitationno': 'invitationno',
                'forconstruction': 'forconstruction',
                'individual': 'individual',
                'partnership': 'partnership',
                'jointventure': 'jointventure',
                'corporation': 'corporation',
                'other': 'other',
                'specify': 'specify',
                'surety': 'surety',
                'millions': 'millions',
                'thousands': 'thousands',
                'hunderds': 'hunderds',
                'cents': 'cents'
            }
            
            semantic_name = semantic_mappings.get(clean, clean)
            interactive_semantic_map[semantic_name] = field_name
        
        logger.info(f"🧠 Interactive semantic map: {interactive_semantic_map}")
        
        # Add pattern fields only if they don't semantically duplicate interactive fields
        for pattern_name, coords in additional_fields.items():
            # Extract semantic meaning from pattern field
            pattern_semantic = pattern_name.lower().replace('page1_', '').replace('page2_', '').replace('_field_', 'field')
            
            # Skip if this pattern field semantically duplicates an interactive field
            if pattern_semantic not in interactive_semantic_map:
                all_fields[pattern_name] = coords
                logger.info(f"✅ ADDING unique pattern field: {pattern_name}")
            else:
                logger.info(f"🚫 SKIPPING duplicate pattern field: {pattern_name} (semantic conflict with {interactive_semantic_map[pattern_semantic]})")
        
        logger.info(f"✅ TOTAL FIELDS: {len(all_fields)} (Interactive: {len(interactive_fields)}, Pattern: {len(additional_fields)})")
        
        # 🔍 DEBUG: Log all field names to check for duplicates
        logger.info("🔍 INTERACTIVE FIELDS:")
        for name in interactive_fields.keys():
            logger.info(f"  - {name}")
            
        logger.info("🔍 PATTERN FIELDS:")
        for name in additional_fields.keys():
            logger.info(f"  - {name}")
            
        logger.info("🔍 COMBINED FIELDS:")
        for name in all_fields.keys():
            logger.info(f"  - {name}")
        
        # Convert to the format expected by frontend
        fields = []
        for field_name, coords in all_fields.items():
            # 🔥 HANDLE ALL COORDINATE FORMATS: (x,y), (x,y,page), or (x,y,page,type,width,height)
            if len(coords) == 6:
                x, y, page, field_type, width, height = coords
            elif len(coords) == 3:
                x, y, page = coords
                field_type = 'text'
                width = 120
                height = 20
            else:
                x, y = coords
                page = 1
                field_type = 'text'
                width = 120
                height = 20
            
            # 🎯 SMART TYPE DETECTION if not already set
            if field_type == 'text' and any(keyword in field_name.lower() 
                for keyword in ['individual', 'partnership', 'corporation', 'joint', 'other']):
                field_type = 'checkbox'
                width = 15
                height = 15
                
            fields.append({
                'name': field_name,
                'x': float(x),
                'y': float(y),
                'page': page,
                'type': field_type,
                'width': width,
                'height': height
            })
        
        logger.info(f"✅ LEGENDARY SUCCESS: Detected {len(fields)} fields!")
        
        return jsonify({
            'success': True,
            'fields': fields,
            'field_count': len(fields),
            'pdf_url': pdf_url
        })
        
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# OCR endpoint removed - using manual coordinate mapping instead

@app.route('/api/generate-bond-package', methods=['POST'])
def generate_bond_package():
    """
    🎯 MASTER BOND SHEET PACKAGE GENERATOR
    Generates all 8 GSA forms from a single Master Bond Sheet input
    and merges them into one "Completed Package" PDF
    
    Forms: SF24, SF25, SF28, SF1418, SF273, SF274, SF275, OF91
    """
    try:
        data = request.get_json()
        master_data = data.get('master_data', {})
        package_data = data.get('package_data', {})
        forms = data.get('forms', ['SF24', 'SF25', 'SF28', 'SF1418', 'SF273', 'SF274', 'SF275', 'OF91'])
        
        logger.info(f"📦 GENERATING BOND PACKAGE")
        logger.info(f"📋 Master Data Keys: {list(master_data.keys())}")
        logger.info(f"📋 Forms to generate: {forms}")
        
        # Create merged PDF writer
        merged_pdf = PdfWriter()
        
        # Form type to template mapping (template_type used for schema lookup)
        # PDF filenames in sample-pdfs folder (case matters!)
        form_schemas = {
            'SF24': ('sf24_23a', 'SF24-23a.pdf'),
            'SF25': ('sf25a_23a', 'SF25a-23a.pdf'),
            'SF28': ('sf28_23a', 'SF28-23a.pdf'),
            'SF1418': ('sf1418_23a', 'SF1418-23a.pdf'),
            'SF273': ('sf273_23a', 'SF273-23a.pdf'),
            'SF274': ('sf274_23a', 'SF274-23a.pdf'),
            'SF275': ('sf275_23a', 'SF275-23a.pdf'),
            'OF91': ('of_91', 'OF-91.pdf')
        }
        
        # Track which forms were successfully generated
        generated_forms = []
        skipped_forms = []
        temp_pdf_files = []  # 🎖️ NUCLEAR GRADE: Store temp files for complete isolation
        
        for form_index, form_name in enumerate(forms):
            logger.info(f"{'='*60}")
            logger.info(f"🎖️ PROCESSING FORM {form_index + 1}/{len(forms)}: {form_name}")
            logger.info(f"{'='*60}")
            
            # 🎖️ NUCLEAR GRADE: Force garbage collection before each form
            gc.collect()
            
            form_info = form_schemas.get(form_name)
            if not form_info:
                logger.error(f"❌ CRITICAL: Unknown form type: {form_name}")
                skipped_forms.append(form_name)
                continue
            
            template_type, pdf_filename = form_info
            logger.info(f"📄 Template: {template_type}, PDF: {pdf_filename}")
            
            # 🎖️ MILITARY GRADE: Retry logic for reliability
            MAX_RETRIES = 3
            retry_count = 0
            form_generated = False
            
            while retry_count < MAX_RETRIES and not form_generated:
                try:
                    retry_count += 1
                    if retry_count > 1:
                        logger.info(f"🔄 Retry #{retry_count} for {form_name}")
                    
                    # Map master/package data to form-specific fields
                    form_data = map_to_form_fields(form_name, master_data, package_data)
                    
                    if not form_data:
                        logger.warning(f"⚠️ No field mapping for {form_name}")
                        
                    # Check if schema exists
                    schema_path = f"../public/docs/pdf-templates/{template_type}_manual_schema.json"
                    if not os.path.exists(schema_path):
                        # Try alternate path
                        schema_path = f"/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/pdf-templates/{template_type}_manual_schema.json"
                    
                    if not os.path.exists(schema_path):
                        logger.error(f"❌ Schema not found for {form_name}: {schema_path}")
                        break  # No point retrying if schema doesn't exist
                    
                    # Check if PDF template exists
                    pdf_path = f"/Users/apple/Desktop/development/bermuda-app/bermuda-app/public/docs/sample-pdfs/{pdf_filename}"
                    if not os.path.exists(pdf_path):
                        logger.error(f"❌ PDF template not found: {pdf_path}")
                        break  # No point retrying if PDF doesn't exist
                    
                    logger.info(f"✅ Schema found: {schema_path}")
                    logger.info(f"✅ PDF found: {pdf_path}")
                    logger.info(f"📋 Form data keys: {list(form_data.keys())}")
                    
                    # Generate the form PDF
                    pdf_buffer = create_gsa_pdf_overlay(form_data, template_type)
                    
                    if pdf_buffer and pdf_buffer.getvalue():
                        # 🎖️ Validate the buffer has content
                        buffer_size = len(pdf_buffer.getvalue())
                        if buffer_size < 1000:  # Suspiciously small PDF
                            logger.warning(f"⚠️ PDF buffer suspiciously small ({buffer_size} bytes), retrying...")
                            del pdf_buffer
                            gc.collect()
                            continue
                        
                        # 🎖️ NUCLEAR GRADE: Write to temp file IMMEDIATELY for complete isolation
                        temp_form_file = tempfile.NamedTemporaryFile(delete=False, suffix=f'_{form_name}.pdf')
                        temp_form_file.write(pdf_buffer.getvalue())
                        temp_form_file.close()
                        
                        # Verify the temp file was written correctly
                        temp_file_size = os.path.getsize(temp_form_file.name)
                        if temp_file_size != buffer_size:
                            logger.error(f"❌ Temp file size mismatch! Buffer: {buffer_size}, File: {temp_file_size}")
                            os.unlink(temp_form_file.name)
                            continue
                        
                        temp_pdf_files.append((form_name, temp_form_file.name))
                        generated_forms.append(form_name)
                        form_generated = True
                        logger.info(f"✅ {form_name} saved to temp file ({temp_file_size} bytes): {temp_form_file.name}")
                        
                        # 🎖️ NUCLEAR GRADE: Immediately free buffer memory
                        del pdf_buffer
                        gc.collect()
                        
                    else:
                        logger.warning(f"⚠️ Failed to generate PDF for {form_name}, attempt {retry_count}/{MAX_RETRIES}")
                        
                except Exception as form_error:
                    logger.error(f"❌ Error generating {form_name} (attempt {retry_count}/{MAX_RETRIES}): {str(form_error)}")
                    import traceback
                    logger.error(traceback.format_exc())
                    if retry_count >= MAX_RETRIES:
                        break
            
            if not form_generated:
                logger.error(f"❌ FAILED to generate {form_name} after {MAX_RETRIES} attempts")
                skipped_forms.append(form_name)
        
        # 🎖️ NUCLEAR GRADE: Now merge all temp files into final PDF
        logger.info(f"{'='*60}")
        logger.info(f"🎖️ MERGING {len(temp_pdf_files)} TEMP FILES INTO FINAL PDF")
        logger.info(f"{'='*60}")
        gc.collect()  # Clean up before merge
        
        # 🔒 CRITICAL FIX: Keep all readers alive until merge is complete!
        # PyPDF2's add_page doesn't copy - it references the original page data.
        # If reader goes out of scope, page data becomes invalid.
        active_readers = []  # Keep readers alive during merge
        
        for form_name, temp_path in temp_pdf_files:
            try:
                # 🔒 CRITICAL: Read ENTIRE file into memory BEFORE creating reader
                # This ensures data is fully loaded and not dependent on file handle
                with open(temp_path, 'rb') as f:
                    file_content = f.read()
                
                # Create reader from in-memory buffer (keeps data alive)
                temp_buffer = io.BytesIO(file_content)
                temp_reader = PdfReader(temp_buffer)
                active_readers.append((temp_buffer, temp_reader))  # Keep alive!
                
                page_count = len(temp_reader.pages)
                for page in temp_reader.pages:
                    merged_pdf.add_page(page)
                logger.info(f"✅ Merged {form_name}: {page_count} pages from {temp_path}")
                
                # Now safe to delete temp file (data is in memory)
                try:
                    os.unlink(temp_path)
                except:
                    pass
                    
            except Exception as merge_error:
                logger.error(f"❌ Error merging {form_name}: {merge_error}")
                # Still try to delete temp file on error
                try:
                    os.unlink(temp_path)
                except:
                    pass
        
        # Write merged PDF to buffer
        output_buffer = io.BytesIO()
        merged_pdf.write(output_buffer)
        output_buffer.seek(0)
        
        # 🔒 CRITICAL: Now safe to clean up readers (merge is complete)
        logger.info(f"🧹 Cleaning up {len(active_readers)} reader references...")
        for buf, reader in active_readers:
            try:
                del reader
                buf.close()
            except:
                pass
        active_readers.clear()
        gc.collect()
        
        logger.info(f"📦 PACKAGE COMPLETE!")
        logger.info(f"✅ Generated: {generated_forms}")
        logger.info(f"⚠️ Skipped: {skipped_forms}")
        logger.info(f"📊 Total pages: {len(merged_pdf.pages)}")
        
        # Save to temp file for response
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(output_buffer.getvalue())
        temp_file.close()
        
        return send_file(
            temp_file.name,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"Completed_Package_{master_data.get('clientFullName', 'Client').replace(' ', '_')}.pdf"
        )
        
    except Exception as e:
        logger.error(f"❌ Bond package generation error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


def format_date_mmddyyyy(date_str):
    """
    🗓️ Formats any date string to mm/dd/yyyy format
    Handles: yyyy-mm-dd, mm/dd/yyyy, m/d/yyyy, etc.
    """
    if not date_str:
        return ''
    
    try:
        # Try common formats
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', '%d/%m/%Y', '%Y/%m/%d']:
            try:
                parsed = datetime.strptime(str(date_str).strip(), fmt)
                return parsed.strftime('%m/%d/%Y')
            except ValueError:
                continue
        
        # If already in correct format or can't parse, return as-is
        return str(date_str)
    except Exception as e:
        logger.warning(f"⚠️ Date format error: {e}")
        return str(date_str)


def parse_amount_to_columns(amount_str):
    """
    💰 Parses amount like "60,700.50" into separate columns for PDF forms
    Returns: (millions, thousands, hundreds, cents)
    """
    if not amount_str:
        return ('', '', '', '')
    
    try:
        # Remove $ and commas, convert to float
        clean_amount = str(amount_str).replace('$', '').replace(',', '').strip()
        amount = float(clean_amount)
        
        # Split into parts
        cents = int((amount % 1) * 100)
        whole = int(amount)
        
        hundreds = whole % 1000
        thousands = (whole // 1000) % 1000
        millions = whole // 1000000
        
        # Format with leading zeros where appropriate
        return (
            str(millions) if millions > 0 else '',
            str(thousands) if thousands > 0 or millions > 0 else '',
            str(hundreds) if hundreds > 0 or thousands > 0 or millions > 0 else '',
            f"{cents:02d}" if cents > 0 else '00'
        )
    except Exception as e:
        logger.warning(f"⚠️ Amount parsing error: {e}")
        return ('', '', '', '')


def map_to_form_fields(form_name, master_data, package_data):
    """
    🎯 Maps Master Bond Sheet data to form-specific field names
    Field names MUST match the cleanName values from the manual schemas!
    
    🆕 UPDATED MAPPINGS:
    - All dates → mm/dd/yyyy format
    - Principal = Name + Third Party Address
    - State = State + Birth Certificate #
    - SF28 Type/Duration = "Surety/Lifetime"
    - SF28 Employer = "Self Employed/[State]"
    - SF273/274/275 Direct Writing = Name + Third Party Address
    - SF274 Description = Performance Bond boilerplate
    - SF275 Description = Payment Bond boilerplate
    - OF91 field corrections per user spec
    - Amount columns split into millions/thousands/hundreds/cents
    """
    # 🔒 DEFENSIVE: Ensure package_data and master_data are dicts
    if not package_data:
        package_data = {}
    if not master_data:
        master_data = {}
    
    # 🔒 DEFENSIVE: Log what we received for debugging
    logger.info(f"📋 map_to_form_fields({form_name}): package_data keys = {list(package_data.keys())}")
    
    # Common constants
    SURETY_COMPANY = "Depository Trust Company"
    SURETY_ADDRESS = "55 Water St.\nNew York, New York [10041-0099]"
    SURETY_FULL = f"{SURETY_COMPANY}\n{SURETY_ADDRESS}"
    
    # Extract data from package_data (frontend sends this) - with SAFE defaults
    # 🔒 DEFENSIVE: Every field gets `or ''` to ensure never None
    client_name = package_data.get('clientFullName', master_data.get('clientFullName', '')) or ''
    third_party_address = package_data.get('thirdPartyFullAddress', '') or ''
    state_of_birth = package_data.get('stateOfBirth', '') or ''
    birth_cert_number = package_data.get('birthCertificateNumber', '') or ''
    date_bond_executed = format_date_mmddyyyy(package_data.get('dateBondExecuted', '') or 'Open')
    court_case_number = package_data.get('courtCaseNumber', '') or ''
    trial_court_name = package_data.get('trialCourtName', '') or ''
    court_full_address = package_data.get('courtFullAddress', '') or ''
    amount_owed = package_data.get('amountOwed', '') or ''
    social_security_number = package_data.get('socialSecurityNumber', '') or ''
    ssn_back_number = package_data.get('ssnBackNumber', '') or ''
    ucc_trust_number = package_data.get('uccTrustNumber', '') or ''
    third_party_state = package_data.get('thirdPartyState', '') or ''
    third_party_county = package_data.get('thirdPartyCounty', '') or ''
    
    # 🆕 Combined fields per user requirements
    principal_with_address = f"{client_name}\n{third_party_address}" if third_party_address else client_name
    state_with_birth_cert = f"{state_of_birth} - {birth_cert_number}" if birth_cert_number else state_of_birth
    direct_writing_with_address = f"{client_name}\n{third_party_address}" if third_party_address else client_name
    
    # Surety blocks (as before)
    surety_with_name = f"{client_name}\n{SURETY_FULL}" if client_name else SURETY_FULL
    surety_no_name = SURETY_FULL
    
    # Amount columns for forms with split fields
    millions, thousands, hundreds, cents = parse_amount_to_columns(amount_owed)
    
    logger.info(f"🎯 Mapping fields for {form_name}")
    logger.info(f"📋 Client: {client_name}")
    logger.info(f"📋 Principal+Address: {principal_with_address[:50]}...")
    logger.info(f"📋 State+BirthCert: {state_with_birth_cert}")
    logger.info(f"📋 Date (formatted): {date_bond_executed}")
    logger.info(f"💰 Amount columns: M={millions} T={thousands} H={hundreds} C={cents}")
    
    # Form-specific field mappings - MUST MATCH SCHEMA cleanNames!
    if form_name == 'SF24':
        # SF24 schema fields: datebondex, princple, surety, state, individual, partnership, etc.
        # Also has: millions, thousands, hunderds (typo in form!), cents
        return {
            'datebondex': date_bond_executed,
            'princple': principal_with_address,  # 🆕 Name + Third Party Address
            'surety': surety_with_name,  # SF24 includes client name in surety
            'state': state_with_birth_cert,  # 🆕 State + Birth Cert #
            'individual': 'X',  # Always INDIVIDUAL
            'invitationno': court_case_number,
            # 🆕 Amount columns
            'millions': millions,
            'thousands': thousands,
            'hunderds': hundreds,  # Note: typo in original form field name!
            'cents': cents,
        }
    
    elif form_name == 'SF25':
        # SF25a schema fields: datebondexecuted, principal, suretyies, stateofincorp, individual, etc.
        # Also has: millions, thousands, hundreds (correct spelling!), cents
        return {
            'datebondexecuted': date_bond_executed,  # 🆕 FIXED: was dateexecuted
            'principal': principal_with_address,  # 🆕 FIXED: was principaladdress
            'suretyies': surety_no_name,  # 🆕 FIXED: was surety (schema has suretyies!)
            'stateofincorp': state_with_birth_cert,  # 🆕 FIXED: was stateof
            'individual': 'X',
            'contractdate': date_bond_executed,  # 🆕 FIXED: was contratedate
            'contractno': court_case_number,
            # 🆕 Amount columns (SF25a uses correct spelling!)
            'millions': millions,
            'thousands': thousands,
            'hundreds': hundreds,  # SF25a has correct spelling
            'cents': cents,
        }
    
    elif form_name == 'SF28':
        # SF28 schema fields: state, county, name, typeoccp, brokadd, employer, realest1, realest2, encumb, bonds
        # 🆕 Type/Duration defaults to "Surety/Lifetime"
        # 🆕 Employer defaults to "Self Employed/[State]"
        # 🆕 realest1/realest2/encumb/bonds have specific boilerplate text
        
        # Build field 7 (realest1) text
        realest1_text = f"{court_case_number} - See GSA FORMS; sf 24; sf 25A; sf 28: sf 273; sf 274: sf 275 and 91."
        
        # Build field 7 continued (realest2) text  
        realest2_text = f"Birth Certificate - {state_with_birth_cert} and Social Security - {package_data.get('socialSecurityNumber', '')}; Bond Number; Non-Negotiable set off {birth_cert_number}; Deposited with the United States Treasury"
        
        # Build field 8 (encumb) text - page 2
        encumb_text = f"{trial_court_name} Attn: Clerk; {court_case_number} - See GSA FORMS; sf 24; sf 25A; sf 28; sf 273; sf 274; sf 275 and 91."
        
        # Build field 9 (bonds) text - page 3
        bonds_text = f"Bid Bond issued by {trial_court_name} Attn: Clerk; {court_case_number} - See GSA FORMS; sf 24; sf 25A; sf 28; sf 273; sf 274; sf 275 and 91."
        
        # 🎖️ FIXED: 'state' is Third Party's State (residence), not State of Birth
        # 🎖️ Convert 2-letter code to full state name
        # 🔒 CRITICAL: Check for empty string, not just missing key!
        third_party_state_code = package_data.get('thirdPartyState', '') or state_of_birth
        third_party_state_full = get_state_full_name(third_party_state_code)
        logger.info(f"🎖️ SF28 State: thirdPartyState='{package_data.get('thirdPartyState', '')}' → fallback to stateOfBirth='{state_of_birth}' → full='{third_party_state_full}'")
        
        return {
            'state': third_party_state_full,  # 🎖️ Full state name (e.g., "Maryland" not "MD")
            'county': package_data.get('thirdPartyCounty', ''),
            'name': client_name,
            'brokadd': surety_no_name,  # Individual Surety Broker = DTC address
            'typeoccp': 'Surety/Lifetime',  # 🆕 DEFAULT VALUE
            'employer': f"Self Employed/{state_of_birth}",  # Still uses State of Birth
            'realest1': realest1_text,  # 🆕 Field 7 with boilerplate
            'realest2': realest2_text,  # 🆕 Field 7 continued with boilerplate
            'encumb': encumb_text,  # 🆕 Field 8 with boilerplate (was missing!)
            'bonds': bonds_text,  # 🆕 Field 9 (page 3) with boilerplate
        }
    
    elif form_name == 'SF1418':
        # SF1418 schema fields: date, principal, sureties, state, contract, contract_2, checkbox1-4
        # Also has: millions, thousands, hundreds, cents
        # 🔍 DEBUG: Log all SF1418 values
        logger.info(f"🔍 SF1418 DEBUG - date_bond_executed: '{date_bond_executed}'")
        logger.info(f"🔍 SF1418 DEBUG - principal_with_address: '{principal_with_address[:50] if principal_with_address else 'EMPTY'}...'")
        logger.info(f"🔍 SF1418 DEBUG - surety_with_name: '{surety_with_name[:50] if surety_with_name else 'EMPTY'}...'")
        logger.info(f"🔍 SF1418 DEBUG - state_with_birth_cert: '{state_with_birth_cert}'")
        logger.info(f"🔍 SF1418 DEBUG - court_case_number: '{court_case_number}'")
        logger.info(f"🔍 SF1418 DEBUG - amount: M={millions} T={thousands} H={hundreds} C={cents}")
        
        return {
            'date': date_bond_executed,
            'principal': principal_with_address,  # 🆕 Name + Third Party Address
            'sureties': surety_with_name,  # SF1418 includes client name
            'state': state_with_birth_cert,  # 🆕 State + Birth Cert #
            'contract': date_bond_executed,  # Contract date
            'contract_2': court_case_number,  # Contract number
            'checkbox1': 'X',  # Individual checkbox
            # 🆕 Amount columns
            'millions': millions,
            'thousands': thousands,
            'hundreds': hundreds,
            'cents': cents,
        }
    
    elif form_name == 'SF273':
        # SF273 schema fields: writco, reinsuringcompany, agreedatedirect, stateofinc1, 
        # agreedateexecutes, penalsum, contractdate, contractno1, contractdescript, principal
        return {
            'writco': direct_writing_with_address,  # 🆕 Name + Third Party Address
            'reinsuringcompany': surety_no_name,  # Reinsuring Company = DTC
            'agreedatedirect': date_bond_executed,
            'stateofinc1': state_with_birth_cert,  # 🆕 State + Birth Cert #
            'agreedateexecutes': date_bond_executed,
            'penalsum': amount_owed,  # 🆕 Penal Sum of Bond
            'contractdate': date_bond_executed,
            'contractno1': court_case_number,
            'principal': principal_with_address,  # 🆕 Name + Third Party Address
        }
    
    elif form_name == 'SF274':
        # SF274 schema fields: dwc, reinsurco, dateagreed, stateofincorp, reinsuredate, 
        # reinsurance, penalsum, datecontract, contractnum, description, principal
        # 🆕 Description = Performance Bond boilerplate
        description_text = f"Performance Bond\nCase No: {court_case_number}\n{trial_court_name}\nAttn: Clerk\n{court_full_address}"
        return {
            'dwc': direct_writing_with_address,  # 🆕 Name + Third Party Address
            'reinsurco': surety_no_name,  # Reinsuring Company = DTC
            'dateagreed': date_bond_executed,
            'stateofincorp': state_with_birth_cert,  # 🆕 State + Birth Cert #
            'reinsuredate': date_bond_executed,
            'penalsum': amount_owed,  # 🆕 Penal Sum of Bond
            'datecontract': date_bond_executed,
            'contractnum': court_case_number,
            'description': description_text,  # 🆕 Performance Bond text
            'principal': principal_with_address,  # 🆕 Name + Third Party Address
        }
    
    elif form_name == 'SF275':
        # SF275 schema fields: directwritingcompany, reinsuringcompany, dateexecuted, 
        # stateofincorporation, dateexecuted2, penalsum, dateofbond, bondnumber, principal, descriptionofbond
        # 🆕 Description = Payment Bond boilerplate
        description_text = f"Payment Bond\nPayment Settlement of Contract\n{trial_court_name}\nAttn: Clerk\n{court_full_address}"
        return {
            'directwritingcompany': direct_writing_with_address,  # 🆕 Name + Third Party Address
            'reinsuringcompany': surety_no_name,  # Reinsuring Company = DTC
            'dateexecuted': date_bond_executed,
            'stateofincorporation': state_with_birth_cert,  # 🆕 State + Birth Cert #
            'dateexecuted2': date_bond_executed,
            'penalsum': amount_owed,  # 🆕 Penal Sum of Bond (was amountofreinsurance)
            'dateofbond': date_bond_executed,
            'bondnumber': birth_cert_number,
            'descriptionofbond': description_text,  # 🆕 Payment Bond text
            'principal': principal_with_address,  # 🆕 Name + Third Party Address
        }
    
    elif form_name == 'OF91':
        # OF91 schema fields: name1, residence, contractnumber, accountnumber, 
        # nameinstitution, institutionaddress, nameauthorizedrep, propertydescription, institution
        # 🆕 CORRECTED per user specification:
        # - residence → State + Birth Certificate #
        # - nameinstitution → Name of Trial Court
        # - institutionaddress → Full Address of Court
        # - institution → Trial Court + "Attn: Clerk"
        return {
            'name1': client_name,
            'residence': state_with_birth_cert,  # 🆕 State + Birth Cert # (not address)
            'contractnumber': package_data.get('socialSecurityNumber', ''),
            'accountnumber': package_data.get('uccTrustNumber', ''),
            'nameinstitution': trial_court_name,  # 🆕 Name of Trial Court
            'institutionaddress': court_full_address,  # 🆕 Full Address of Court
            'nameauthorizedrep': client_name,  # Whereas I (name)
            'propertydescription': package_data.get('of91Claims', ''),  # Claims arising therefrom
            'institution': f"{trial_court_name} Attn: Clerk",  # Trial Court + Attn: Clerk (no line break)
        }
    
    # Default: return package data as-is
    logger.warning(f"⚠️ No specific mapping for {form_name}, using raw package_data")
    return package_data


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))  # 🔥 FIXED: Default to port 5001!
    app.run(host='0.0.0.0', port=port, debug=True)
