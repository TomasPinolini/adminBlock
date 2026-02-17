// Hook: Remind to generate a migration when the database schema is modified
// This is informational only — it does NOT block the edit
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = (data.tool_input?.file_path || '').replace(/\\/g, '/');

    if (filePath.endsWith('lib/db/schema.ts')) {
      process.stderr.write(
        'REMINDER: You are modifying the database schema. ' +
        'After finishing all schema changes, run "npm run db:generate" to create a migration file.'
      );
    }
  } catch {
    // Parse error — don't block
  }
  process.exit(0);
});
