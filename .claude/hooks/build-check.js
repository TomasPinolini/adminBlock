// Hook: Validate build before Claude stops — prevents leaving the project broken
// Only runs when code was actually changed during the session
const { execSync } = require('child_process');
const fs = require('fs');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Prevent infinite loop — if we already blocked once and Claude re-tried, let it through
    if (data.stop_hook_active) {
      process.exit(0);
      return;
    }

    // Only run if code was actually changed (check transcript for Edit/Write tool uses)
    const transcriptPath = data.transcript_path;
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      const hasCodeChanges =
        (content.includes('"Edit"') || content.includes('"Write"')) &&
        content.includes('file_path');

      if (!hasCodeChanges) {
        process.exit(0);
        return;
      }
    } else {
      // No transcript — skip build check
      process.exit(0);
      return;
    }

    // Run the build
    try {
      execSync('npm run build 2>&1', {
        encoding: 'utf8',
        timeout: 120000,
        stdio: 'pipe',
      });
      // Build succeeded
      process.exit(0);
    } catch (e) {
      const output = (e.stdout || e.stderr || 'Unknown build error').slice(-2000);
      console.log(JSON.stringify({
        decision: 'block',
        reason: `Build failed. Fix the errors before finishing:\n${output}`,
      }));
    }
  } catch {
    // On any error, don't block
    process.exit(0);
  }
});
