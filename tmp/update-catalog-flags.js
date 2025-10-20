const fs = require('fs');
const path = 'feedme.client/src/app/components/catalog/catalog.component.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/export const FLAG_SHORT[\s\S]*?} as const;\r?\n\r?\n/, '');
content = content.replace(/export const FLAG_FULL[\s\S]*?} as const;\r?\n\r?\n/, '');
fs.writeFileSync(path, content, 'utf8');
