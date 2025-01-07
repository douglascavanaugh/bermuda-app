import sys
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from datetime import datetime
from functools import partial

# Custom page layout with numbers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.setFont("Helvetica", 9)
        self.drawRightString(
            8.5 * inch - 50,
            0.5 * inch,
            f"Page {self._pageNumber} of {page_count}"
        )

def create_styled_table(data, colWidths, style='default'):
    """Create a table with predefined styles"""
    table = Table(data, colWidths=colWidths)
    
    # Use the same style for all tables now
    table_style = [
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),  # Gray background for left column
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),  # Bold text for left column
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),       # Regular text for right column
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]

    table.setStyle(TableStyle(table_style))
    return table

def format_long_text(text, max_length=50):
    """Format long text fields with proper wrapping"""
    if not text:
        return ''
    
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word)
        if current_length + word_length + 1 <= max_length:
            current_line.append(word)
            current_length += word_length + 1
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
            current_length = word_length
            
    if current_line:
        lines.append(' '.join(current_line))
        
    return '\n'.join(lines)

def add_separator_line(elements):
    """Add a light gray separator line"""
    separator_style = TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#cccccc')),
        ('TOPPADDING', (0, 0), (-1, 0), 0),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 0),
    ])
    separator = Table([['']], colWidths=[7.5*inch])  # Adjust width as needed
    separator.setStyle(separator_style)
    elements.append(Spacer(1, 15))  # Space before line
    elements.append(separator)
    elements.append(Spacer(1, 15))  # Space after line

def log_info(message):
    """Write info messages to stderr"""
    print(f"Info: {message}", file=sys.stderr)

def log_error(message):
    """Write error messages to stderr"""
    print(f"Error: {message}", file=sys.stderr)


def generatePDF(formData):
    try:
        firstName = formData.get('firstName', '')
        lastName = formData.get('lastName', '')
        pdf_path = f"hawaii-form-{lastName}-{firstName}.pdf"
        
        log_info(f"Generating PDF for {firstName} {lastName}")
        
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # Styles
        styles = getSampleStyleSheet()
        
        # Custom styles for header section
        company_name_style = ParagraphStyle(
            'CompanyName',
            parent=styles['Normal'],
            fontSize=17,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT,
            textColor=colors.black
        )

        # Add address style
        address_style = ParagraphStyle(
            'Address',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_LEFT
        )

        # Add phone style
        phone_style = ParagraphStyle(
            'Phone',
            parent=styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            alignment=TA_RIGHT,
            textColor=colors.black
        )

        # Add confidential style
        confidential_style = ParagraphStyle(
            'Confidential',
            parent=styles['Normal'],
            fontSize=16,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            textColor=colors.HexColor('#cc0000'),
            spaceBefore=10,
            spaceAfter=10
        )

        # Add stack trace style
        stack_trace_style = ParagraphStyle(
            'StackTrace',
            parent=styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            textColor=colors.HexColor('#000000'),
            spaceAfter=30
        )

        # Add section header style
        section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=13,
            spaceBefore=10,
            spaceAfter=10,
            textColor=colors.HexColor('#1a237e'),
            leading=15
        )

        # Add how to use questionaire style
        questionaire_header_style = ParagraphStyle(
            'QuestionaireHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
        )

        # Add how to use questionaire style
        questionaire_style = ParagraphStyle(
            'Questionaire',
            parent=styles['Normal'],
            fontSize=9,
            leading=14,
            spaceBefore=10,
            spaceAfter=5,
            alignment=TA_LEFT
        )

        # Add documentation notice style
        doc_notice_style = ParagraphStyle(
            'DocNotice',
            parent=styles['Normal'],
            fontSize=9,
            leading=14,
            spaceBefore=5,
            spaceAfter=5,
            alignment=TA_LEFT
        )

        faq_style = ParagraphStyle(
            'FAQ',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            spaceBefore=6,
            spaceAfter=6,
            alignment=TA_LEFT
        )

        # Content elements
        elements = []

        # Header section with company info and phone
        header_table = Table([
            [
                Paragraph("<b>Global Solutions Limited LLC</b>", company_name_style),
                Paragraph("Tel: (239) 234-1107", phone_style)
            ]
        ], colWidths=[4.5*inch, 3*inch])  # Adjust these widths to match your needs

        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),    # Left align company name
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),   # Right align phone number
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top align all content
            ('LEFTPADDING', (0, 0), (-1, -1), 0), # Remove left padding
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),# Remove right padding
            ('TOPPADDING', (0, 0), (-1, -1), 0),  # Remove top padding
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),# Remove bottom padding
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 12))

        # Address (now properly aligned under company name)
        address_table = Table([
            [Paragraph("12221 Towne Lake Drive Ste A #164", address_style)],
            [Paragraph("Ft. Myers Florida [33913]", address_style)]
        ], colWidths=[7.5*inch])  # Full width to match header table

        address_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(address_table)

        # Separator line
        elements.append(Spacer(1, 5))
        add_separator_line(elements)
        elements.append(Spacer(1, 5))

        # Confidential and Stack Trace
        elements.append(Paragraph("CONFIDENTIAL", confidential_style))
        elements.append(Paragraph("STACK TRACE", stack_trace_style))
        # elements.append(Spacer(1, 10))

        # Create a table for the questionaire table
        questionaire_header_table = Table([
            [Paragraph(
                "HOW TO USE THIS QUESTIONAIRE",
                questionaire_header_style
            )]
        ], colWidths=[7.5*inch])

        questionaire_header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        questionaire_table = Table([
            [Paragraph(
                "This questionaire is a guideline to assist you with some of the information we will require. You have the option of using this form to "
                "email back to us, or you may use this as a guide to assist you when you dictate your letter of instructions to us. Please feel free to "
                "contact us by telephone should you wish to speak to an investigator directly. Complete this form based on the information you have "
                "available. We don't expect this form to be 100% completed. The minimum information we require is the subject's <b>FIRST</b> and <b>LAST</b> <b>NAME</b> and "
                "the <b>LAST KNOWN ADDRESS</b>. Correct spelling of the subject's <b>FIRST</b> and <b>LAST</b> <b>NAME</b> is of the utmost importance.",
                questionaire_style
            )]
        ], colWidths=[7.5*inch])

        questionaire_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        elements.append(questionaire_header_table)
        elements.append(Spacer(1, 10))
        elements.append(questionaire_table)
        elements.append(Spacer(1, 30))

        def create_section_header(text, elements):
            """Create a section header with consistent width"""
            header_table = Table([
                [Paragraph(text, section_header_style)]
            ], colWidths=[7.5*inch])
            
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(header_table)

        # For FAQs, create a similar wrapper
        def create_faq_item(question, answer, elements):
            """Create FAQ items with consistent width"""
            faq_table = Table([
                [Paragraph(f'<b>Q: {question}</b>', faq_style)],
                [Paragraph(f'A: {answer}', faq_style)]
            ], colWidths=[7.5*inch])
            
            faq_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(faq_table)
            elements.append(Spacer(1, 8))

        # Subject's Information
        create_section_header("SUBJECT'S INFORMATION", elements)
        elements.append(Spacer(1, 5))

        subject_data = [
            ["Name:", f"{formData.get('firstName', '')} {formData.get('lastName', '')}"],
            ["Date of Birth:", formData.get('dateOfBirth', '')],
            ["SSN:", formData.get('socialInsuranceNumber', '')],
            ["Address:", format_long_text(formData.get('address', ''))],
            ["City/State/ZIP:", f"{formData.get('city', '')}, {formData.get('state', '')} {formData.get('zip', '')}"],
            ["Date Last at Address:", formData.get('dateLastAtAddress', '')],
            ["Phone:", formData.get('primaryPhoneNumber', '')],
            ["Driver License:", formData.get('driverLicenseNo', '')],
            ["License Plate:", formData.get('licensePlateNumbers', '')],
            ["Vehicle Description:", format_long_text(formData.get('vehicleDescription', ''))]
        ]
        elements.append(create_styled_table(subject_data, [2.5*inch, 5*inch]))
        elements.append(Spacer(1, 15))

        # Subject's Employment Information
        elements.append(Spacer(1, 10))
        create_section_header("SUBJECT'S EMPLOYMENT INFORMATION", elements)
        elements.append(Spacer(1, 5))

        subjects_employment_data = [
            ["Employer:", formData.get('lastEmployerName', '')],
            ["Address:", format_long_text(formData.get('employerAddress', ''))],
            ["City/State/ZIP:", f"{formData.get('employerCity', '')}, {formData.get('employerState', '')} {formData.get('employerZip', '')}"],
            ["Phone:", formData.get('lastEmployerPhone', '')],
            ["Position:", formData.get('positionAtLastEmployer', '')],
            ["Trade/Profession:", formData.get('tradeOrProfession', '')]
        ]
        elements.append(create_styled_table(subjects_employment_data, [2.5*inch, 5*inch]))
        
        # Separator line
        elements.append(Spacer(1, 20))
        add_separator_line(elements)

        # Spouse Information
        create_section_header("SPOUSE'S INFORMATION", elements)
        elements.append(Spacer(1, 5))

        spouse_data = [
            ["Marital Status:", formData.get('spouseMaritalStatus', '')],
            ["Name:", f"{formData.get('spouseFirstName', '')} {formData.get('spouseLastName', '')}"],
            ["Date of Birth:", formData.get('spouseDateOfBirth', '')],
            ["SSN:", formData.get('spouseSocialInsuranceNumber', '')],
            ["Address Type:", formData.get('spouseAddressType', '')],
            ["Address:", format_long_text(formData.get('spouseAddress', ''))],
            ["City/State/ZIP:", f"{formData.get('spouseCity', '')}, {formData.get('spouseState', '')} {formData.get('spouseZip', '')}"],
            ["Date Last at Address:", formData.get('spouseDateLastAtAddress', '')],
            ["Phone:", formData.get('spousePrimaryPhone', '')],
            ["Driver License:", formData.get('spouseDriverLicense', '')],
            ["License Plate:", formData.get('spouseLicensePlate', '')]
        ]
        elements.append(create_styled_table(spouse_data, [2.5*inch, 5*inch]))
        elements.append(Spacer(1, 15))

        # Spouse's Employment Information
        elements.append(Spacer(1, 30))
        create_section_header("SPOUSE'S EMPLOYMENT INFORMATION", elements)
        elements.append(Spacer(1, 5))

        spouses_employment_data = [
            ["Spouse's Employer:", formData.get('spouseLastEmployer', '')],
            ["Spouse's Employer Address:", format_long_text(formData.get('spouseEmployerAddress', ''))],
            ["City/State/ZIP:", f"{formData.get('spouseEmployerState', '')} {formData.get('spouseEmployerZip', '')}"],
            ["Spouse's Employer Phone:", formData.get('spouseLastEmployerPhone', '')],
            ["Spouse's Position:", formData.get('spousePosition', '')],
            ["Spouse's Trade/Profession:", formData.get('spouseTrade', '')]
        ]
        elements.append(create_styled_table(spouses_employment_data, [2.5*inch, 5*inch]))
        
        # Separator line
        elements.append(Spacer(1, 20))
        add_separator_line(elements)

        # General Information
        create_section_header("GENERAL INFORMATION", elements)
        elements.append(Spacer(1, 5))

        general_information_data = [
            ["Friends/Relatives Info:", format_long_text(formData.get('friendsRelativesInfo', ''), 60)],
            ["Business Credit Refs:", format_long_text(formData.get('businessCreditRefs', ''), 60)],
            ["Has Judgement:", formData.get('hasJudgement', '')],
            ["Judgement Details:", format_long_text(formData.get('judgementDetails', ''), 60)],
            ["Has Consent:", formData.get('hasConsent', '')],
            ["Consent Details:", format_long_text(formData.get('consentDetails', ''), 60)],
            ["Trace Explanation:", format_long_text(formData.get('traceExplanation', ''), 60)]
        ]
        elements.append(create_styled_table(general_information_data, [2.5*inch, 5*inch]))
        elements.append(Spacer(1, 15))

        # Create a table for the documentation notice
        doc_notice_table = Table([
            [Paragraph(
                "If you have any of the following documentation, please put a check by the document name and email a copy to our office "
                "(proceeds4u@gmail.com). Please do not mail any original documentation as we will not be returning them to you.",
                doc_notice_style
            )]
        ], colWidths=[7.5*inch])

        doc_notice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        elements.append(doc_notice_table)
        elements.append(Spacer(1, 10))

        # Create documentation checklist
        doc_data = [
            ["Credit Searches:", "Yes" if formData.get('creditSearches') else "No"],
            ["Driver License Searches:", "Yes" if formData.get('driverLicenseSearches') else "No"],
            ["Applications:", "Yes" if formData.get('applications') else "No"],
            ["Articles of Incorporation:", "Yes" if formData.get('articlesOfIncorporation') else "No"],
            ["Accident Reports:", "Yes" if formData.get('accidentReports') else "No"],
            ["PPSA:", "Yes" if formData.get('ppsa') else "No"],
            ["NSF Cheques:", "Yes" if formData.get('nsfCheques') else "No"],
            ["Vehicle Registration:", "Yes" if formData.get('vehicleRegistration') else "No"]
        ]
        elements.append(create_styled_table(doc_data, [2.5*inch, 5*inch]))
        
        # Separator line
        elements.append(Spacer(1, 10))
        add_separator_line(elements)

        # FAQ Section
        # elements.append(PageBreak())
        create_section_header("FREQUENTLY ASKED QUESTIONS", elements)
        elements.append(Spacer(1, 10))

        # Define FAQs
        faq1 = ('What are your turnaround times?',
                'Turnaround times vary based on volume and difficulty. We work towards an average of two weeks or less. We will ultimately send you a close out memo of our efforts if the trace fails.')
        faq2 = ('Can we call your office to get the status?',
                'Please do not call our office seeking to know the status. You are welcome to email us at proceeds4u@gmail.com.')
        faq3 = ('Can we get status reports?',
                'We do not send status reports at any point. Either we have the subject located or we don\'t. We will ultimately report one way or another.')
        faq4 = ('Do you offer other services such as employment only or bank account only investigations?',
                'This form is to be used for Skip Tracing exclusively. Global Solutions Limited LLC does not offer the service of "employment only" or "bank account only" investigations. We do however offer full asset investigations, email us at proceeds4u@gmail.com for more information.')

        faqs = [faq1, faq2, faq3, faq4]

        # for question, answer in faqs:
        #     elements.append(Paragraph(f'<b>Q: {question}</b>', faq_style))
        #     elements.append(Paragraph(f'A: {answer}', faq_style))
        for question, answer in faqs:
            create_faq_item(question, answer, elements)
            elements.append(Spacer(1, 8))

        # Timestamp
        elements.append(Spacer(1, 30))
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elements.append(Paragraph(f"Generated: {timestamp}", styles['Normal']))

        # Build the PDF with page numbers
        doc.build(elements, canvasmaker=NumberedCanvas)
        
        log_info(f"Successfully generated PDF: {pdf_path}")
        return pdf_path

    except Exception as e:
        log_error(f"Failed to generate PDF: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        form_data = json.loads(sys.argv[1])
        log_info(f"Starting PDF generation for: {form_data.get('firstName', '')} {form_data.get('lastName', '')}")
        pdf_path = generatePDF(form_data)
        print(pdf_path)
    except json.JSONDecodeError as e:
        log_error(f"Invalid JSON data received: {str(e)}")
        sys.exit(1)
    except IndexError:
        log_error("No form data provided")
        sys.exit(1)
    except Exception as e:
        log_error(f"Unexpected error: {str(e)}")
        sys.exit(1)
