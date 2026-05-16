const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f === 'route.ts') {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('force-dynamic')) {
        fs.writeFileSync(full, "export const dynamic = 'force-dynamic';\n" + content);
        console.log('Fixed:', full);
      }
    }
  });
}
walk('app/api');
