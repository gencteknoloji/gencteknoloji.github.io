import fs from 'fs';
const db = fs.readFileSync('src/services/db.ts', 'utf8');

// match pattern: db.run( `query`, [params] )
const regex = /(?:db\.run|db\.get|db\.all)[\s\S]*?`([\s\S]*?)`\s*,\s*\[(.*?)\]/g;
let match;
let errs = 0;

while ((match = regex.exec(db)) !== null) {
  const query = match[1];
  const paramsStr = match[2];
  const qCount = (query.match(/\?/g) || []).length;
  // This is a naive split by comma. But it will show obvious mismatches.
  let pCount = 0;
  if (paramsStr.trim() !== '') {
    // split by comma but avoid splitting inside nested structures if possible. 
    // Just a simple split by comma outside quotes? Too hard. Let's just do split(',').
    pCount = paramsStr.split(',').length;
  }
  
  if (qCount !== pCount && paramsStr.trim() !== '') {
    // Let's print out to manually inspect because split(',') is naive
    console.log('Mismatch potential at query:', query.substring(0, 80).replace(/\n/g, ' '));
    console.log('  ? count:', qCount, '| Param commas+1:', pCount);
    console.log('  Params:', paramsStr);
    console.log('---------------------------------');
    errs++;
  }
}

if (errs === 0) console.log('All db parameters match natively!');
