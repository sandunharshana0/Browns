import { PrismaClient } from '../src/generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Data seeding පටන් ගත්තා...');

  const csvFilePath = path.join(__dirname, 'employees.csv');
  const csvData = fs.readFileSync(csvFilePath, 'utf8');
  
  // CSV එක පේළියෙන් පේළියට වෙන් කරගැනීම
  const rows = csvData.split('\n').slice(1); // Header පේළිය අත්හැරීමට

  for (const row of rows) {
    if (!row.trim()) continue;
    
    // Comma වලින් දත්ත වෙන් කරගැනීම
    const [empNo, category, teamName, region, nameWithInitials, fullName, position, designation, idNo, contactNo, status, projectCode] = row.split(',');

    if (empNo) {
      await prisma.employee.upsert({
        where: { empNo: empNo.trim() },
        update: {},
        create: {
          empNo: empNo.trim(),
          category: category?.trim() || 'General',
          teamName: teamName?.trim() || null,
          region: region?.trim() || 'Default',
          nameWithInitials: nameWithInitials?.trim() || '',
          fullName: fullName?.trim() || '',
          projectPosition: position?.trim() || '',
          designation: designation?.trim() || '',
          idNo: idNo?.trim() || empNo.trim(), // NIC එක නැත්නම් Emp No එකම දේවි
          contactNo: contactNo?.trim() || '',
          status: status?.trim() || 'Active',
          projectCode: projectCode?.trim() || 'General',
          appointmentDate: new Date(), // වර්තමාන දිනය දේවි
          emergencyName: 'N/A',
          emergencyPhone: 'N/A'
        },
      });
    }
  }

  console.log('✅ Excel දත්ත ඔක්කොම Database එකට සාර්ථකව වැටුණා!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
