const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
c = c.replace(/<span className="font-semibold text-muted tracking-wide text-lg">SyncInk <span className="font-light opacity-70">AI<\/span><\/span>/g, '<span className="font-semibold text-foreground tracking-wide text-lg">SyncInk <span className="font-light opacity-70">AI<\/span><\/span>');
fs.writeFileSync('src/app/page.tsx', c);
