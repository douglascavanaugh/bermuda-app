#!/usr/bin/env python3
"""
GSA PDF Coordinate Mapper Tool
MEASURE EXACT coordinates for form fields!
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import red, blue, green
import io
import requests
from PyPDF2 import PdfReader, PdfWriter

def create_coordinate_grid_overlay():
    """
    Create a coordinate grid overlay to help measure positions
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter  # 612 x 792 points
    
    # Set thin line width
    c.setLineWidth(0.5)
    
    # Draw vertical grid lines every 50 points
    c.setStrokeColor(blue)
    for x in range(0, int(width), 50):
        c.line(x, 0, x, height)
        # Add coordinate labels
        c.setFont("Helvetica", 6)
        c.drawString(x + 2, height - 10, str(x))
    
    # Draw horizontal grid lines every 50 points  
    for y in range(0, int(height), 50):
        c.line(0, y, width, y)
        # Add coordinate labels
        c.setFont("Helvetica", 6)
        c.drawString(5, y + 2, str(y))
    
    # Draw major grid lines every 100 points
    c.setStrokeColor(red)
    c.setLineWidth(1)
    for x in range(0, int(width), 100):
        c.line(x, 0, x, height)
    for y in range(0, int(height), 100):
        c.line(0, y, width, y)
    
    # Add field position markers for testing
    test_positions = [
        (125, height - 77, "principal_name_address"),
        (475, height - 77, "state_of_incorporation"), 
        (125, height - 147, "surety_name_address"),
        (300, height - 215, "org_corporation"),
        (125, height - 275, "percent_of_bid_price"),
        (125, height - 375, "bid_date"),
        (235, height - 375, "invitation_number"),
        (365, height - 375, "for_construction_of"),
    ]
    
    c.setFillColor(green)
    c.setFont("Helvetica", 8)
    for x, y, field_name in test_positions:
        # Draw a small circle at the position
        c.circle(x, y, 3, fill=1)
        # Add field name label
        c.drawString(x + 5, y - 3, f"{field_name} ({x},{int(height-y)})")
    
    c.save()
    buffer.seek(0)
    return buffer

def create_measurement_pdf():
    """
    Create a PDF with the GSA form and coordinate grid overlay
    """
    try:
        # Load the GSA PDF
        gsa_pdf_url = "https://raw.githubusercontent.com/douglascavanaugh/bermuda-app/main/public/docs/sample-pdfs/SF24-23a.pdf"
        print(f"Loading GSA PDF from: {gsa_pdf_url}")
        
        response = requests.get(gsa_pdf_url, timeout=30)
        
        if response.status_code == 200:
            # Load the GSA PDF
            gsa_pdf_buffer = io.BytesIO(response.content)
            reader = PdfReader(gsa_pdf_buffer)
            writer = PdfWriter()
            
            # Get the first page
            page = reader.pages[0]
            
            # Create coordinate grid overlay
            grid_overlay = create_coordinate_grid_overlay()
            grid_pdf = PdfReader(grid_overlay)
            grid_page = grid_pdf.pages[0]
            
            # Merge grid onto GSA form
            page.merge_page(grid_page)
            writer.add_page(page)
            
            # Save the result
            with open('gsa_coordinate_mapper.pdf', 'wb') as output_file:
                writer.write(output_file)
            
            print("✅ Created: gsa_coordinate_mapper.pdf")
            print("📐 This PDF shows:")
            print("   - Blue grid lines every 50 points")
            print("   - Red major grid lines every 100 points") 
            print("   - Green circles at current field positions")
            print("   - Coordinate labels on the edges")
            print("")
            print("🎯 Use this to measure EXACT coordinates for form fields!")
            print("📏 PDF coordinate system: (0,0) is bottom-left corner")
            print("📄 Letter size: 612 x 792 points")
            
        else:
            print(f"❌ Failed to load GSA PDF: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    create_measurement_pdf()
