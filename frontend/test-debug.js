const { execSync } = require('child_process');

console.log('Clearing Vitest cache...');
try {
  execSync('npx vitest --clearCache', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.log('Cache clear done or not needed');
}

console.log('Running BoardCard tests...');
try {
  execSync('npx vitest run src/components/__tests__/BoardCard.test.jsx --reporter=verbose', { 
    stdio: 'inherit', 
    cwd: __dirname 
  });
} catch (e) {
  console.log('Test run completed');
}
