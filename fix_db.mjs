import fs from 'fs';
let content = fs.readFileSync('src/services/db.ts', 'utf8');
content = content.replace("new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('sv-SE')", "formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))");
content = content.replace("new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('sv-SE')", "formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0))");
fs.writeFileSync('src/services/db.ts', content, 'utf8');
