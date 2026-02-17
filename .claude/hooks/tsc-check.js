// Hook: Run TypeScript type checking after edits (runs async — won't block editing)
const { execSync } = require('child_process');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || '';

    // Only check TypeScript files
    if (!/\.(ts|tsx)$/.test(filePath)) {
      process.exit(0);
      return;
    }

    // Skip node_modules
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('node_modules/')) {
      process.exit(0);
      return;
    }

    try {
      execSync('npx tsc --noEmit 2>&1', {
        encoding: 'utf8',
        timeout: 60000,
        stdio: 'pipe',
      });
    } catch (e) {
      // tsc exits non-zero when there are type errors
      const lines = (e.stdout || '').split('\n').slice(0, 20);
      const output = lines.join('\n');
      if (output.trim()) {
        process.stderr.write(`TypeScript errors:\n${output}`);
      }
    }
  } catch {
    // Parse error — don't block
  }
  process.exit(0);
});
