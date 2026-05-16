const fs = require('fs');
const p = 'app/dashboard/grabar-taller/page.tsx';
let content = fs.readFileSync(p, 'utf8');
if (!content.includes('force-dynamic')) {
  fs.writeFileSync(p, "export const dynamic = 'force-dynamic';\n" + content);
  console.log('Fixed:', p);
}
