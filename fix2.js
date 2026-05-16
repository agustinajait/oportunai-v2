const fs = require('fs');
const pages = [
  'app/u/[slug]/cv/page.tsx',
  'app/u/[slug]/pitch/page.tsx',
];
pages.forEach(p => {
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('force-dynamic')) {
    fs.writeFileSync(p, "export const dynamic = 'force-dynamic';\n" + content);
    console.log('Fixed:', p);
  }
});
