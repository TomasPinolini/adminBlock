// Hook: Auto-fix ESLint issues after file edits
// Runs eslint --fix on modified .ts/.tsx/.js/.jsx files
const { execSync } = require('child_process');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || '';

    // Only lint JS/TS files
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(filePath)) {
      process.exit(0);
      return;
    }

    // Skip node_modules and build output
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('node_modules/') || normalized.includes('.next/')) {
      process.exit(0);
      return;
    }

    try {
      execSync(`npx eslint --fix "${filePath}" 2>&1`, {
        encoding: 'utf8',
        timeout: 15000,
        stdio: 'pipe',
      });
    } catch (e) {
      // eslint exits non-zero when there are unfixable errors
      const output = (e.stdout || '').slice(0, 1000);
      if (output.trim()) {
        process.stderr.write(`ESLint issues (auto-fixed what possible):\n${output}`);
      }
    }
  } catch {
    // Parse error — don't block
  }
  process.exit(0);
});
