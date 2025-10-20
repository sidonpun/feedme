const fs = require('fs');
const path = 'feedme.client/src/app/components/catalog-new-product-popup/catalog-new-product-popup.component.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/readonly ALL_FLAGS[\s\S]*?];\r?\n/, "  readonly flagOptions = CATALOG_FLAG_DEFINITIONS;\n" +
  "  private readonly flagDefinitionMap = new Map<CatalogFlagCode, CatalogFlagDefinition>(\n" +
  "    CATALOG_FLAG_DEFINITIONS.map((definition) => [definition.code, definition])\n" +
  "  );\n" +
  "  readonly maxVisibleFlags = 3;\n");
content = content.replace(/readonly FLAG_SHORT[\s\S]*?};\r?\n/, '');
content = content.replace(/readonly FLAG_FULL[\s\S]*?};\r?\n/, '');
fs.writeFileSync(path, content, 'utf8');
