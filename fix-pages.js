const fs = require('fs');
const path = require('path');
const pages = [
  'app/admin/page.tsx',
  'app/super-admin/page.tsx',
  'app/dashboard/page.tsx',
  'app/dashboard/grabar-cv/page.tsx',
  'app/dashboard/grabar-pitch/page.tsx',
  'app/empresa/dashboard/page.tsx',
];
pages.forEach(p => {
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('force-dynamic')) {
    fs.writeFileSync(p, "export const dynamic = 'force-dynamic';\n" + content);
    console.log('Fixed:', p);
  }
});
