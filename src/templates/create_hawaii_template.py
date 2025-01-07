import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter

def create_hawaii_template():
    # Create workbook and sheets
    wb = openpyxl.Workbook()
    data_entry = wb.active
    data_entry.title = "Data Entry"
    sample_data = wb.create_sheet("Sample Data")
    validation_rules = wb.create_sheet("Validation Rules")
    instructions = wb.create_sheet("Instructions")
    lookup_tables = wb.create_sheet("Lookup Tables")

    # Define colors
    required_fill = PatternFill(start_color="FFE6E6", end_color="FFE6E6", fill_type="solid")
    conditional_fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
    optional_fill = PatternFill(start_color="E6FFE6", end_color="E6FFE6", fill_type="solid")
    formatted_fill = PatternFill(start_color="E6F3FF", end_color="E6F3FF", fill_type="solid")

    # Define headers and their properties
    headers = [
        # (header_name, required, conditional, formatted)
        ("First Name", True, False, False),
        ("Last Name", True, False, False),
        ("Date of Birth", True, False, True),
        ("SSN", True, False, True),
        ("Address", True, False, False),
        ("City", True, False, False),
        ("State", True, False, True),
        ("ZIP", True, False, True),
        ("Date Last at Address", True, False, True),
        ("Primary Phone", True, False, True),
        ("Driver License", True, False, False),
        ("License Plate", True, False, False),
        ("Vehicle Description", True, False, False),
        ("Last Employer", True, False, False),
        ("Employer Address", True, False, False),
        ("Employer City", True, False, False),
        ("Employer State", True, False, True),
        ("Employer ZIP", True, False, True),
        ("Employer Phone", True, False, True),
        ("Position", True, False, False),
        ("Trade", True, False, False),
        ("Spouse Marital Status", True, False, False),
        ("Spouse First Name", True, False, False),
        ("Spouse Last Name", True, False, False),
        ("Spouse DOB", True, False, True),
        ("Spouse SSN", True, False, True),
        ("Spouse Address Type", True, False, False),
        ("Spouse Address", True, False, False),
        ("Spouse City", True, False, False),
        ("Spouse State", True, False, True),
        ("Spouse ZIP", True, False, True),
        ("Spouse Date Last at Address", True, False, True),
        ("Spouse Phone", True, False, True),
        ("Spouse Driver License", True, False, False),
        ("Spouse License Plate", True, False, False),
        ("Spouse Last Employer", True, False, False),
        ("Spouse Employer Address", True, False, False),
        ("Spouse Employer City", True, False, False),
        ("Spouse Employer State", True, False, True),
        ("Spouse Employer ZIP", True, False, True),
        ("Spouse Employer Phone", True, False, True),
        ("Spouse Position", True, False, False),
        ("Spouse Trade", True, False, False),
        ("Friends Relatives Info", True, False, False),
        ("Business Credit Refs", True, False, False),
        ("Has Judgement", True, False, False),
        ("Judgement Details", False, True, False),
        ("Has Consent", True, False, False),
        ("Consent Details", False, True, False),
        ("Trace Explanation", True, False, False),
    ]

    # Set column headers and formatting
    for col, (header, required, conditional, formatted) in enumerate(headers, start=1):
        cell = data_entry.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')
        
        # Apply background colors
        if formatted:
            cell.fill = formatted_fill
        elif conditional:
            cell.fill = conditional_fill
        elif required:
            cell.fill = required_fill
        else:
            cell.fill = optional_fill

    # Add Validation Rules content
    validation_rules.append([
        "Field Type", "Validation Rule", "Example", "Notes"
    ])
    validation_rules.append([
        "Dates", "MM/DD/YYYY format", "01/01/2023", "Must use forward slashes"
    ])
    validation_rules.append([
        "Phone Numbers", "(000) 000-0000 format", "(555) 555-5555", "Include area code and parentheses"
    ])
    validation_rules.append([
        "SSN", "000-00-0000 format", "123-45-6789", "Must include hyphens"
    ])
    validation_rules.append([
        "State", "Two-letter code", "CA", "Must be valid US state"
    ])
    validation_rules.append([
        "ZIP", "5 digits or [00000]", "12345 or [96307]", "Military ZIP uses brackets"
    ])

    # Format validation rules
    for row in validation_rules['A1:D5']:
        for cell in row:
            cell.font = Font(bold=True if cell.row == 1 else False)
            cell.alignment = Alignment(wrap_text=True)
    
    # Add Instructions content
    instructions.append([
        "HAWAII FORM INSTRUCTIONS"
    ])
    instructions.append([
        "Color Coding:"
    ])
    instructions.append([
        "Red: Required fields"
    ])
    instructions.append([
        "Yellow: Conditional fields (required based on other answers)"
    ])
    instructions.append([
        "Green: Optional fields"
    ])
    instructions.append([
        "Blue: Fields with specific format requirements"
    ])
    instructions.append([
        ""
    ])
    instructions.append([
        "Data Entry Guidelines:"
    ])
    instructions.append([
        "1. All dates must be in MM/DD/YYYY format"
    ])
    instructions.append([
        "2. Phone numbers must include area code: (555) 555-5555"
    ])
    instructions.append([
        "3. SSNs must include hyphens: 123-45-6789"
    ])
    instructions.append([
        "4. State codes must be two letters: CA, NY, etc."
    ])
    instructions.append([
        "5. ZIP codes must be 5 digits or [00000] for military"
    ])

    # Format instructions
    instructions.column_dimensions['A'].width = 100
    instructions['A1'].font = Font(bold=True, size=14)
    
    # Add Lookup Tables content
    lookup_tables.append([
        "State Codes"
    ])
    state_codes = [
        ["State", "Code"],
        ["Alabama", "AL"],
        ["Alaska", "AK"],
        ["Arizona", "AZ"],
        # ... (add all states)
        ["Wyoming", "WY"]
    ]
    
    for row in state_codes:
        lookup_tables.append(row)

    lookup_tables.append([])
    lookup_tables.append([
        "Marital Status Options"
    ])
    marital_status = [
        ["Married"],
        ["Divorced"],
        ["Separated"],
        ["Common Law"]
    ]
    
    for row in marital_status:
        lookup_tables.append(row)

    # Format lookup tables
    lookup_tables['A1'].font = Font(bold=True)
    lookup_tables['A2'].font = Font(bold=True)
    lookup_tables['B2'].font = Font(bold=True)

    # Add data validations
    # Date validation
    date_validation = DataValidation(
        type="date",
        operator="between",
        formula1="1900-01-01",
        formula2="2100-12-31",
        allow_blank=True
    )

    # Phone validation
    phone_validation = DataValidation(
        type="custom",
        formula1='=AND(LEN(A1)=14,MID(A1,1,1)="(",MID(A1,5,1)=")",MID(A1,6,1)=" ",MID(A1,10,1)="-")',
        allow_blank=True
    )

    # SSN validation
    ssn_validation = DataValidation(
        type="custom",
        formula1='=AND(LEN(A1)=11,MID(A1,4,1)="-",MID(A1,7,1)="-")',
        allow_blank=True
    )

    # State validation
    state_validation = DataValidation(
        type="list",
        formula1='"AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY"',
        allow_blank=True
    )

    # ZIP validation
    zip_validation = DataValidation(
        type="custom",
        formula1='=OR(AND(LEN(A1)=5,ISNUMBER(--A1)),AND(LEFT(A1,1)="[",RIGHT(A1,1)="]",LEN(A1)=7))',
        allow_blank=True
    )

    # Add validations to worksheet
    data_entry.add_data_validation(date_validation)
    data_entry.add_data_validation(phone_validation)
    data_entry.add_data_validation(ssn_validation)
    data_entry.add_data_validation(state_validation)
    data_entry.add_data_validation(zip_validation)

    # Apply validations to relevant columns
    for col, (header, _, _, formatted) in enumerate(headers, start=1):
        col_letter = get_column_letter(col)
        range_string = f"{col_letter}2:{col_letter}1000"  # Apply to 1000 rows
        
        if "Date" in header or "DOB" in header:
            date_validation.add(range_string)
        elif "Phone" in header:
            phone_validation.add(range_string)
        elif "SSN" in header:
            ssn_validation.add(range_string)
        elif "State" in header:
            state_validation.add(range_string)
        elif "ZIP" in header:
            zip_validation.add(range_string)

    # Set column widths
    for col in range(1, len(headers) + 1):
        data_entry.column_dimensions[get_column_letter(col)].width = 15

    # Freeze top row
    data_entry.freeze_panes = "A2"

    # Add sample data
        # Add sample data
    sample_data_rows = [
        # Standard Case
        ["John", "Doe", "01/01/1980", "123-45-6789", "123 Main St", "Anytown", "CA", "12345", 
         "01/01/2023", "(555) 555-5555", "DL123456", "ABC123", "2020 BLUE HONDA CIVIC", 
         "ACME Inc", "456 Work St", "Worktown", "CA", "54321", "(555) 999-9999", "Manager", 
         "Sales", "Married", "Jane", "Doe", "02/02/1982", "987-65-4321", "same", "", "", "", 
         "", "01/01/2023", "(555) 777-7777", "DL654321", "XYZ789", "XYZ Corp", "789 Work Ave", 
         "Jobville", "CA", "98765", "(555) 888-8888", "Director", "Marketing", 
         "Friend: Bob Smith (555) 111-1111", "Bank of America", "No", "", "Yes", 
         "Loan application", "Skip trace needed"],

        # Military Address Case
        ["James", "Miller", "04/15/1979", "234-56-7890", "[PSC 123 Box 456]", "APO", "AP", "[96307]",
         "05/01/2023", "(555) 111-2233", "USMC789", "NVY456", "2022 GREEN JEEP WRANGLER",
         "US MARINES", "CAMP PENDLETON", "OCEANSIDE", "CA", "92055", "(555) 222-3344", "Sergeant",
         "Military", "Married", "Emily", "Miller", "06/18/1981", "345-67-8901", "same", "", "", "",
         "", "05/01/2023", "(555) 333-4455", "CA789012", "USMC123", "DOD CONTRACTOR", "CAMP PENDLETON",
         "OCEANSIDE", "CA", "92055", "(555) 444-5566", "Analyst", "Defense",
         "Sister: Sarah Miller (555) 666-7788", "USAA", "No", "", "Yes", "Security clearance",
         "Verify deployment status"],

        # Multiple Judgements Case
        ["Thomas", "Anderson", "08/22/1976", "456-78-9012", "555 Matrix Rd", "Digital", "CA", "90210",
         "06/15/2023", "(555) 777-8899", "CA234567", "NEO789", "2021 BLACK TESLA MODEL 3",
         "Tech Solutions", "888 Code Ave", "Silicon", "CA", "94022", "(555) 888-9900", "Developer",
         "Software", "Divorced", "Trinity", "Anderson", "09/30/1978", "567-89-0123", "different",
         "777 Reality St", "Zion", "CA", "90211", "06/15/2023", "(555) 999-0011", "CA345678",
         "TRIN456", "AI Corp", "999 Neural St", "Digital", "CA", "90210", "(555) 000-1122",
         "Engineer", "AI", "Brother: Tank (555) 111-2233", "Silicon Bank", "Yes",
         "Multiple: 1) 2020 tax lien $10000, 2) 2021 civil judgment $5000", "No", "",
         "Complex skip trace needed"],

        # Complex Family Case
        ["Sarah", "Thompson-Jones", "11/30/1982", "890-12-3456", "444 Family Ct", "Blended", "TX", "75001",
         "08/15/2023", "(555) 666-7788", "TX123456", "FMLY789", "2020 GREY HONDA ODYSSEY",
         "Family Services", "777 Care Ave", "Support", "TX", "75002", "(555) 777-8899", "Counselor",
         "Social Work", "Remarried", "Michael", "Jones", "12/15/1980", "901-23-4567", "different",
         "555 Step St", "Blended", "TX", "75001", "08/15/2023", "(555) 888-9900", "TX234567",
         "STEP456", "Child Support Services", "888 Support Rd", "Family", "TX", "75002",
         "(555) 999-0011", "Mediator", "Family Services",
         "Complex family: 1) Ex: John Thompson (555) 000-1122, 2) Step-children's mother: Lisa Brown (555) 111-2233",
         "Family First CU", "Yes", "2019 custody settlement payments", "Yes", "Joint custody agreement",
         "Verify current family status"],

        # Self-Employed Case
        ["Alex", "Chen", "07/08/1988", "012-34-5678", "666 Freelance Ave", "Gig City", "CA", "94105",
         "09/01/2023", "(555) 123-4567", "CA567890", "FREE789", "2022 BLUE BMW X5",
         "Self Employed", "Same as Home", "Gig City", "CA", "94105", "(555) 234-5678", "Owner",
         "Tech Consultant", "Single", "", "", "", "", "", "", "", "", "", "", "", "", "",
         "Multiple Clients LLC", "999 Contract Dr", "Tech Valley", "CA", "94106", "(555) 345-6789",
         "Consultant", "Technology", "Business References: 1) Tech Corp (555) 456-7890, 2) Start-Up Inc (555) 567-8901",
         "Silicon Valley Bank", "No", "", "Yes", "Business loan application", "Verify contract income"]
    ]

    # Add headers and sample data to Sample Data sheet
    for col, (header, _, _, _) in enumerate(headers, start=1):
        sample_data.cell(row=1, column=col, value=header)
    
    for row_idx, row_data in enumerate(sample_data_rows, start=2):
        for col_idx, value in enumerate(row_data, start=1):
            sample_data.cell(row=row_idx, column=col_idx, value=value)

    # Save the workbook
    wb.save('hawaii_template.xlsx')

if __name__ == "__main__":
    create_hawaii_template()