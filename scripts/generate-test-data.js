// Generate massive test data for GSA form demo
const fs = require('fs');
const path = require('path');

// Sample data pools
const firstNames = [
  'John', 'Mary', 'Robert', 'Jennifer', 'Michael', 'Sarah', 'David', 'Lisa', 'Christopher', 'Amanda',
  'James', 'Karen', 'Daniel', 'Patricia', 'Mark', 'Nancy', 'Paul', 'Laura', 'Steven', 'Michelle',
  'Kevin', 'Deborah', 'Ryan', 'Angela', 'Timothy', 'Sandra', 'Joseph', 'Kimberly', 'Brian', 'Donna',
  'Gregory', 'Rachel', 'Jeffrey', 'Amy', 'Scott', 'Melissa', 'William', 'Stephanie', 'Jason', 'Heather',
  'Kenneth', 'Crystal', 'Antonio', 'Tammy', 'Marcus', 'Cynthia', 'Derek', 'Vanessa', 'Carl', 'Nicole'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Rodriguez', 'Lee',
  'Lopez', 'Hill', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez',
  'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez',
  'Morris', 'Rogers', 'Reed', 'Cook', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard'
];

const streets = [
  'Main Street', 'Oak Avenue', 'Pine Road', 'Elm Street', 'Maple Drive', 'Cedar Lane', 'Birch Court',
  'Spruce Way', 'Willow Street', 'Poplar Avenue', 'Hickory Drive', 'Ash Boulevard', 'Walnut Place',
  'Cherry Hill', 'Dogwood Trail', 'Magnolia Street', 'Sycamore Road', 'Cottonwood Lane', 'Redwood Circle',
  'Oakwood Drive', 'Pinewood Avenue', 'Cedarwood Court', 'Elmwood Place', 'Maplewood Street', 'Applewood Drive'
];

const cities = [
  'Washington', 'Arlington', 'Alexandria', 'Bethesda', 'Rockville', 'Silver Spring', 'Fairfax', 'Vienna',
  'McLean', 'Potomac', 'Gaithersburg', 'Germantown', 'Reston', 'Herndon', 'Ashburn', 'Leesburg',
  'Sterling', 'Great Falls', 'Falls Church', 'Annandale', 'Springfield', 'Burke', 'Lorton', 'Woodbridge'
];

const states = ['DC', 'VA', 'MD'];

const departments = [
  'General Services', 'Procurement', 'Technology', 'Finance', 'Personnel', 'Legal', 'Operations',
  'Public Affairs', 'Real Property', 'Human Resources', 'Acquisition', 'Information Technology',
  'Administration', 'Sustainability', 'Policy Development', 'Strategic Planning', 'Research & Development',
  'IT Operations', 'Contracting', 'Budget Office', 'Supply Chain', 'Communications', 'Occupational Safety'
];

const positions = [
  'Program Analyst', 'Contract Specialist', 'IT Specialist', 'Financial Analyst', 'Human Resources',
  'Legal Counsel', 'Project Manager', 'Budget Analyst', 'Security Officer', 'Communications',
  'Facilities Manager', 'Training Coordinator', 'Quality Assurance', 'Procurement Officer', 'Data Analyst',
  'Administrative Officer', 'Environmental Specialist', 'Policy Analyst', 'Program Manager', 'Research Analyst'
];

const clearances = ['Public Trust', 'Secret', 'Top Secret'];

// Generate random data
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSSN() {
  const area = Math.floor(Math.random() * 900) + 100;
  const group = Math.floor(Math.random() * 90) + 10;
  const serial = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${group}-${serial}`;
}

function generatePhone() {
  const area = Math.floor(Math.random() * 800) + 200;
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${exchange}-${number}`;
}

function generateDate() {
  const year = Math.floor(Math.random() * 30) + 1970;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
}

function generateZip() {
  return Math.floor(Math.random() * 90000) + 10000;
}

function generateAddress() {
  const number = Math.floor(Math.random() * 9999) + 1;
  const street = getRandomItem(streets);
  return `${number} ${street}`;
}

// Generate CSV data
function generateCSVData(count) {
  const headers = [
    'FORM_TYPE: SF24_23A',
    'First Name,Last Name,Date of Birth,SSN,Address,City,State,ZIP,Phone,Email,Position,Department,Supervisor,Start Date,Security Clearance'
  ];
  
  const rows = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const city = getRandomItem(cities);
    const state = getRandomItem(states);
    
    const row = [
      firstName,
      lastName,
      generateDate(),
      generateSSN(),
      generateAddress(),
      city,
      state,
      generateZip(),
      generatePhone(),
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gsa.gov`,
      getRandomItem(positions),
      getRandomItem(departments),
      `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
      generateDate(),
      getRandomItem(clearances)
    ].join(',');
    
    rows.push(row);
  }
  
  return headers.concat(rows).join('\n');
}

// Generate text data
function generateTextData(count) {
  const entries = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const city = getRandomItem(cities);
    const state = getRandomItem(states);
    
    const entry = [
      `${firstName} ${lastName}`,
      generateAddress(),
      `${city}, ${state} ${generateZip()}`,
      generateDate(),
      generateSSN(),
      generatePhone(),
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gsa.gov`,
      getRandomItem(positions),
      getRandomItem(departments),
      getRandomItem(clearances)
    ].join('\n');
    
    entries.push(entry);
  }
  
  return 'FORM_TYPE: SF24_23A\n\n' + entries.join('\n\n');
}

// Generate files
const outputDir = path.join(__dirname, '..', 'docs', 'email-data');

// Generate 1000 entries CSV
const csvData1000 = generateCSVData(1000);
fs.writeFileSync(path.join(outputDir, 'gsa-test-1000-entries.csv'), csvData1000);

// Generate 5000 entries CSV
const csvData5000 = generateCSVData(5000);
fs.writeFileSync(path.join(outputDir, 'gsa-test-5000-entries.csv'), csvData5000);

// Generate 1000 entries Text
const textData1000 = generateTextData(1000);
fs.writeFileSync(path.join(outputDir, 'gsa-test-1000-entries.txt'), textData1000);

// Generate 5000 entries Text
const textData5000 = generateTextData(5000);
fs.writeFileSync(path.join(outputDir, 'gsa-test-5000-entries.txt'), textData5000);

console.log('✅ Generated test data files:');
console.log('📄 gsa-test-1000-entries.csv (1,000 entries)');
console.log('📄 gsa-test-5000-entries.csv (5,000 entries)');
console.log('📄 gsa-test-1000-entries.txt (1,000 entries)');
console.log('📄 gsa-test-5000-entries.txt (5,000 entries)');
console.log('🔥 Ready for MASSIVE batch processing demo!');
