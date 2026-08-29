const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace backgrounds
content = content.replace(/bg-\[#020204\]/g, 'bg-background');
content = content.replace(/bg-\[#05050A\]/g, 'bg-background');

// Text colors
content = content.replace(/text-gray-100/g, 'text-foreground');
content = content.replace(/text-white(?![\w/])/g, 'text-foreground');
content = content.replace(/text-white\/(30|40|50|60|70|80|90)/g, 'text-muted');

// Surface backgrounds
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-surface');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-surface');
content = content.replace(/bg-white\/5/g, 'bg-surface');
content = content.replace(/bg-white\/10/g, 'bg-surface');

// Hover surfaces
content = content.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:bg-surface-hover');
content = content.replace(/hover:bg-white\/\[0\.05\]/g, 'hover:bg-surface-hover');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-surface-hover');
content = content.replace(/hover:bg-white\/20/g, 'hover:bg-surface-hover');

// Borders
content = content.replace(/border-white\/\[0\.05\]/g, 'border-border');
content = content.replace(/border-white\/5/g, 'border-border');
content = content.replace(/border-white\/10/g, 'border-border');
content = content.replace(/border-white\/20/g, 'border-border');

// Composer Glass
content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-glass');
content = content.replace(/focus-within:bg-white\/\[0\.06\]/g, 'focus-within:bg-glass-hover');

// Placeholder
content = content.replace(/placeholder-white\/40/g, 'placeholder:text-muted');

// Specific text-black to text-background for buttons
content = content.replace(/text-black/g, 'text-background');

// Gradients (to-transparent is fine, from-[#020204] needs to be from-background)
content = content.replace(/from-\[#020204\]/g, 'from-background');
content = content.replace(/via-\[#020204\]\/90/g, 'via-background/90');

// Fix Sidebar top padding
content = content.replace(/<div className="p-4 flex items-center/g, '<div className="p-4 pt-8 md:pt-6 flex items-center');

fs.writeFileSync('src/app/page.tsx', content);
console.log('Replacements complete');
