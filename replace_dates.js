import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace new Date().toLocaleDateString('sv-SE') with formatDateISO()
  // Replace variables like today.toLocaleDateString('sv-SE') with formatDateISO(today)
  
  const regex = /(\w+(?:\.\w+)*|\bnew\s+Date\(\))\s*\.\s*toLocaleDateString\s*\(\s*['"]sv-SE['"]\s*\)/g;
  
  const newContent = content.replace(regex, (match, p1) => {
    if (p1 === 'new Date()') {
      return 'formatDateISO()';
    } else {
      return `formatDateISO(${p1})`;
    }
  });

  if (content !== newContent) {
    // Add import if not present
    let finalContent = newContent;
    if (!finalContent.includes('formatDateISO')) {
        // Not needed, already checked by if (content !== newContent) but maybe we need the import statement
        console.log(`Replacing in ${filePath}, but import needs to be added manually or automatically.`);
    }
    
    // Add import statement at the top
    if (!finalContent.includes("import { formatDateISO } from")) {
      const importLine = `import { formatDateISO } from '@/lib/utils/date';\n`;
      // Find last import
      const lastImportIndex = finalContent.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextNewline = finalContent.indexOf('\n', lastImportIndex);
        finalContent = finalContent.slice(0, nextNewline + 1) + importLine + finalContent.slice(nextNewline + 1);
      } else {
        finalContent = importLine + finalContent;
      }
    }

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'src/app/dashboard/DashboardHome.tsx',
  'src/services/db.ts'
];

for (const file of files) {
  replaceInFile(path.join(process.cwd(), file));
}
