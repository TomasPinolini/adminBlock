-- Check what's blocking the tables
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    query_start
FROM pg_stat_activity 
WHERE datname = current_database()
AND state != 'idle'
ORDER BY query_start;

-- Check locks on clients table
SELECT 
    l.locktype,
    l.mode,
    l.granted,
    a.usename,
    a.query,
    a.application_name
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation = 'clients'::regclass;

-- Check locks on orders table
SELECT 
    l.locktype,
    l.mode,
    l.granted,
    a.usename,
    a.query,
    a.application_name
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation = 'orders'::regclass;
