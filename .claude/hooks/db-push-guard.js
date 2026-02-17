// Hook: Block drizzle-kit push — it applies schema directly to production without migrations
// Use "npm run db:generate" + "npm run db:migrate" instead
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cmd = data.tool_input?.command || '';

    if (/drizzle-kit\s+push|npm\s+run\s+db:push|npx\s+drizzle-kit\s+push/.test(cmd)) {
      process.stderr.write(
        'BLOCKED: db:push applies schema changes directly to production without creating a migration file.\n' +
        'Use "npm run db:generate" to create a migration, then "npm run db:migrate" to apply it safely.'
      );
      process.exit(2);
    }
  } catch {
    // Parse error — don't block
  }
  process.exit(0);
});
