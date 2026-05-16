const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.postinstall = 'prisma generate --no-engine';
pkg.scripts.build = 'prisma generate && next build';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Done');
