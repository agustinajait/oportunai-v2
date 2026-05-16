const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f === 'route.ts') {
      let content = fs.readFileSync(full, 'utf8');
      // Eliminar TODOS los force-dynamic existentes
      while (content.includes("force-dynamic")) {
        content = content.replace(/export const dynamic = 'force-dynamic'[;\n]?\n?/g, '');
        content = content.replace(/\uFEFFexport const dynamic = 'force-dynamic'[;\n]?\n?/g, '');
      }
      // Agregar uno solo al principio
      content = "export const dynamic = 'force-dynamic';\n" + content.trimStart();
      fs.writeFileSync(full, content);
      console.log('Fixed:', full);
    }
  });
}
walk('app/api');
