import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const requiredPackages = [
  '@ngrx/store',
  '@ngrx/effects',
  '@ngrx/store-devtools',
];

function packageIsResolvable(packageName) {
  try {
    require.resolve(`${packageName}/package.json`);
    return true;
  } catch {
    return false;
  }
}

function ensureDependencies() {
  const missingPackages = requiredPackages.filter(
    packageName => !packageIsResolvable(packageName)
  );

  if (missingPackages.length === 0) {
    return;
  }

  const formattedList = missingPackages.map(name => `  • ${name}`).join('\n');
  const message = [
    'Не найдены обязательные зависимости Angular проекта:',
    formattedList,
    '',
    'Установите их командой:',
    '  npm install',
    '',
    'После установки повторите сборку.',
  ].join('\n');

  process.stderr.write(`${message}\n`);
  process.exit(1);
}

try {
  ensureDependencies();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
