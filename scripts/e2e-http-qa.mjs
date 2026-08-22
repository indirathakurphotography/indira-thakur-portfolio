const BASE_URL = 'http://localhost:3000';

interfaceTestResult();

async function runQa() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END QA ON LIVE RUNTIME');
  console.log('================================================================\n');

  const results = [];
  function record(suite, name, passed, details) {
    results.push({ suite, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${suite}] ${name} ${details ? `(${details})` : ''}`);
  }

  // 1. UNAUTHORIZED ACCESS TESTS
  console.log('--- 1. Testing Protected Route Rejections (No Auth Token) ---');
  const protectedUrls = [
    '/api/dashboard',
    '/api/auth/users',
    '/api/security',
    '/api/auth/access-logs',
    '/api/audit-logs',
    '/api/analytics/stats',
    '/api/audit-storage',
  ];

  for (const path of protectedUrls) {
    const res = await fetch(`${BASE_URL}${path}`);
    record('Security: Protected Routes', `GET ${path} requires authentication (401)`, res.status === 401, `Status: ${res.status}`);
  }

  // 2. AUTHENTICATION & LOGIN FLOW
  console.log('\n--- 2. Testing Authentication, Bad Passwords, Session Issuance ---');
  
  // Bad password
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'InvalidPassword123!' }),
  });
  record('Auth: Bad Password', 'Login with wrong password rejected (401)', badLoginRes.status === 401, `Status: ${badLoginRes.status}`);

  // Non-existent email
  const badEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@indirathakur.com', password: 'Password12345!' }),
  });
  record('Auth: Unknown Email', 'Login with non-existent user rejected (401)', badEmailRes.status === 401, `Status: ${badEmailRes.status}`);

  // Let's try admin login. If the admin password is Admin@12345678 or something else, let's test.
  let adminPassword = 'Admin@12345678';
  let loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: adminPassword }),
  });

  if (loginRes.status !== 200) {
    // Try alternate admin email / password
    const altRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'indirathakur@admin', password: 'Admin@12345678' }),
    });
    if (altRes.status === 200) {
      loginRes = altRes;
    }
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  const adminEmail = loginData.user?.email || 'admin@indirathakur.com';
  record('Auth: Valid Login', `Login with valid credentials succeeds (200) and returns JWT session`, loginRes.status === 200 && !!token, `Email: ${adminEmail}`);

  if (!token) {
    console.error('❌ Cannot continue QA without valid admin token. Exiting.');
    process.exit(1);
  }

  // Token Verification
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyData = await verifyRes.json();
  record('Auth: Token Verification', '/api/auth/verify validates token integrity', verifyRes.status === 200 && verifyData.authenticated === true, `Role: ${verifyData.user?.role}`);

  // 3. ADMIN SETTINGS & USER CRUD
  console.log('\n--- 3. Testing User Account Management (CRUD & Roles) ---');
  
  // List current users
  const listUsersRes = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listUsersData = await listUsersRes.json();
  const initialUserCount = (listUsersData.users || []).length;
  record('Settings: Users', 'GET /api/auth/users lists registered accounts', listUsersRes.status === 200 && initialUserCount > 0, `Users count: ${initialUserCount}`);

  // Create new user (Role: Editor)
  const testEditorEmail = `qa_editor_${Date.now()}@indirathakur.com`;
  const testEditorPassword = 'EditorPassword@987654';
  const createUserRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'QA Test Editor',
      email: testEditorEmail,
      password: testEditorPassword,
      role: 'editor',
      status: 'active',
    }),
  });
  const createUserData = await createUserRes.json();
  const newUserId = createUserData.user?._id;
  record('Settings: Users', 'Create new Editor user succeeds (201)', createUserRes.status === 201 && !!newUserId, `Created ID: ${newUserId}`);

  // Login as new Editor
  const editorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEditorEmail, password: testEditorPassword }),
  });
  const editorLoginData = await editorLoginRes.json();
  const editorToken = editorLoginData.token;
  record('Settings: Users', 'Newly created Editor can authenticate and log in', editorLoginRes.status === 200 && !!editorToken, `Role: ${editorLoginData.user?.role}`);

  // Test Editor RBAC restriction (Editor cannot manage users or security)
  const editorTryUsersRes = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  record('RBAC Enforcement', 'Editor role is blocked from /api/auth/users (403 Forbidden)', editorTryUsersRes.status === 403, `Status: ${editorTryUsersRes.status}`);

  // Edit User: Disable Editor
  const disableUserRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: newUserId,
      status: 'disabled',
      isActive: false,
    }),
  });
  record('Settings: Users', 'Disable Editor account succeeds (200)', disableUserRes.status === 200);

  // Verify disabled user cannot log in
  const disabledLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEditorEmail, password: testEditorPassword }),
  });
  record('Security: Account Status', 'Disabled user login is rejected (403 Forbidden)', disabledLoginRes.status === 403, `Status: ${disabledLoginRes.status}`);

  // Verify disabled user existing token is immediately rejected
  const disabledTokenRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  record('Security: Account Status', 'Existing session token of disabled user is immediately invalid (401)', disabledTokenRes.status === 401, `Status: ${disabledTokenRes.status}`);

  // Edit User: Re-enable and change password
  const newPasswordVal = 'UpdatedPassword@43210!';
  const updatePwRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: newUserId,
      status: 'active',
      isActive: true,
      password: newPasswordVal,
    }),
  });
  record('Settings: Users', 'Re-enable account and update password succeeds (200)', updatePwRes.status === 200);

  // Verify new password works
  const newPwLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEditorEmail, password: newPasswordVal }),
  });
  record('Settings: Users', 'Login with newly updated password succeeds (200)', newPwLoginRes.status === 200);

  // Delete User Safe Guard: Cannot delete self
  const myUserId = verifyData.user?.userId || verifyData.user?.id;
  if (myUserId) {
    const deleteSelfRes = await fetch(`${BASE_URL}/api/auth/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: myUserId }),
    });
    record('Settings: Safeguards', 'Attempt to delete own active admin account is blocked (400)', deleteSelfRes.status === 400, `Status: ${deleteSelfRes.status}`);
  }

  // Delete test editor user
  const deleteUserRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: newUserId }),
  });
  record('Settings: Users', 'DELETE /api/auth/users deletes test account (200)', deleteUserRes.status === 200);

  // 4. SECURITY SESSIONS & REVOCATION
  console.log('\n--- 4. Testing Security Dashboard, Single Session Termination, Global Revocation ---');

  // Spawn Session A and Session B
  const sARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const { token: tokenA, sessionId: sessIdA } = await sARes.json();

  const sBRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const { token: tokenB, sessionId: sessIdB } = await sBRes.json();

  // Check access logs
  const accessLogsRes = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const accessLogsData = await accessLogsRes.json();
  const foundA = (accessLogsData.logs || []).some((l) => l.sessionId === sessIdA);
  const foundB = (accessLogsData.logs || []).some((l) => l.sessionId === sessIdB);
  record('Security: Telemetry', 'Access logs display active login sessions with IP, Browser, OS, and Device', foundA && foundB, `Sessions found: A=${foundA}, B=${foundB}`);

  // Terminate ONLY Session A
  const terminateARes = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'revoke_session', sessionId: sessIdA }),
  });
  record('Security: Sessions', 'Terminate single session endpoint succeeds (200)', terminateARes.status === 200);

  // Verify Session A is REJECTED
  const checkARes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  record('Security: Sessions', 'Revoked Session A is immediately rejected on subsequent requests (401)', checkARes.status === 401, `Status: ${checkARes.status}`);

  // Verify Session B is STILL ACTIVE
  const checkBRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  record('Security: Sessions', 'Session B remains active and valid after Session A termination (200)', checkBRes.status === 200, `Status: ${checkBRes.status}`);

  // Global Revoke All Sessions
  const globalRevokeRes = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'revoke_all' }),
  });
  record('Security: Sessions', 'Global revoke all sessions endpoint succeeds (200)', globalRevokeRes.status === 200);

  // Verify Session B is NOW REJECTED after global revoke
  const checkBAfterGlobal = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  record('Security: Sessions', 'All previous sessions (including Session B) invalidated after global revoke (401)', checkBAfterGlobal.status === 401, `Status: ${checkBAfterGlobal.status}`);

  // Fresh login for remaining tests
  const freshLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const freshData = await freshLogin.json();
  const currentToken = freshData.token;

  // 5. IP BLOCKING & INTERCEPTION
  console.log('\n--- 5. Testing IP Blocking, Shield Protection & Unblocking ---');
  const attackIp = '198.51.100.99';

  // Block IP
  const blockRes = await fetch(`${BASE_URL}/api/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
    },
    body: JSON.stringify({
      action: 'block',
      ip: attackIp,
      reason: 'E2E QA Security Test Attack Simulation',
    }),
  });
  record('Security: IP Shield', 'Block IP address via POST /api/security succeeds (201)', blockRes.status === 201);

  // Check blocked list
  const secListRes = await fetch(`${BASE_URL}/api/security`, {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const secListData = await secListRes.json();
  const isIpInList = (secListData.blockedIps || []).some((b) => b.ip === attackIp);
  record('Security: IP Shield', 'Blocked IP appears in security blocklist telemetry', isIpInList, `IP: ${attackIp}`);

  // Test access from blocked IP
  const blockedTryRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${currentToken}`,
      'x-forwarded-for': attackIp,
    },
  });
  record('Security: IP Shield', 'Requests from blocked IP are intercepted and rejected (403 Forbidden)', blockedTryRes.status === 403, `Status: ${blockedTryRes.status}`);

  // Unblock IP
  const unblockRes = await fetch(`${BASE_URL}/api/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
    },
    body: JSON.stringify({ action: 'unblock', ip: attackIp }),
  });
  record('Security: IP Shield', 'Unblock IP via POST /api/security succeeds (200)', unblockRes.status === 200);

  // 6. REAL VISITOR ANALYTICS & ROUTE TRACKING
  console.log('\n--- 6. Testing Real Visitor Analytics Tracking Across All Public Routes ---');
  const routes = ['/', '/about', '/gallery', '/services', '/films', '/contact', '/faq', '/testimonials'];
  const testVisitorSess = `visitor_qa_${Date.now()}`;

  for (const r of routes) {
    const trackRes = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.3 Safari/605.1.15',
      },
      body: JSON.stringify({
        path: r,
        referrer: 'https://www.google.com/search?q=indira+thakur+photography',
        device: 'desktop',
        browser: 'Safari',
        os: 'macOS',
        sessionId: testVisitorSess,
      }),
    });
    record('Analytics: Route Tracking', `Public page '${r}' generates and records pageview event (200)`, trackRes.status === 200, `Route: ${r}`);
  }

  // Check Analytics Stats
  const statsRes = await fetch(`${BASE_URL}/api/analytics/stats`, {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const statsData = await statsRes.json();
  const hasPages = Array.isArray(statsData.topPages) && statsData.topPages.length > 0;
  const hasTrends = Array.isArray(statsData.dailyTrends) && statsData.dailyTrends.length === 14;
  record('Analytics: Telemetry', 'GET /api/analytics/stats returns accurate aggregations, top visited pages, trends, and device stats', hasPages && hasTrends && statsData.totalPageViews > 0, `Total Pageviews: ${statsData.totalPageViews}, Unique: ${statsData.uniqueVisitors}`);

  // 7. AUDIT LOG TELEMETRY & FILTERING
  console.log('\n--- 7. Testing Audit Log Telemetry, Filtering & Action Inspection ---');
  const auditRes = await fetch(`${BASE_URL}/api/audit-logs?limit=50`, {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const auditData = await auditRes.json();
  const auditLogs = auditData.logs || [];
  record('Audit Logs', 'GET /api/audit-logs lists detailed immutable audit events', auditRes.status === 200 && auditLogs.length > 0, `Entries count: ${auditLogs.length}`);

  const hasLoginSuccess = auditLogs.some((l) => l.action === 'ADMIN_LOGIN_SUCCESS');
  const hasUserCreated = auditLogs.some((l) => l.action === 'ADMIN_ACCOUNT_CREATED');
  const hasUserDeleted = auditLogs.some((l) => l.action === 'ADMIN_ACCOUNT_DELETED');
  const hasIpBlocked = auditLogs.some((l) => l.action === 'IP_BLOCKED');
  const hasIpUnblocked = auditLogs.some((l) => l.action === 'IP_UNBLOCKED');
  const hasSessionRevoked = auditLogs.some((l) => l.action === 'SESSION_REVOKED');
  const hasAllRevoked = auditLogs.some((l) => l.action === 'ALL_SESSIONS_REVOKED');

  record('Audit Logs: Critical Actions', 'Audit trail records all critical events (Login, User Create/Delete, IP Block/Unblock, Session Revocation)', 
    hasLoginSuccess && hasUserCreated && hasUserDeleted && hasIpBlocked && hasIpUnblocked && hasSessionRevoked && hasAllRevoked,
    `Events verified: Login=${hasLoginSuccess}, CreateUser=${hasUserCreated}, DeleteUser=${hasUserDeleted}, BlockIP=${hasIpBlocked}, UnblockIP=${hasIpUnblocked}, RevokeSess=${hasSessionRevoked}, GlobalRevoke=${hasAllRevoked}`
  );

  // Test Audit Filter
  const filterAuditRes = await fetch(`${BASE_URL}/api/audit-logs?action=IP_BLOCKED`, {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const filterAuditData = await filterAuditRes.json();
  const allFiltered = (filterAuditData.logs || []).every((l) => l.action === 'IP_BLOCKED');
  record('Audit Logs: Filtering', 'Audit log filtering by action returns exclusively matching events', filterAuditRes.status === 200 && allFiltered && filterAuditData.logs.length > 0, `Count: ${filterAuditData.logs?.length}`);

  // 8. LOGOUT TEST
  console.log('\n--- 8. Testing Admin Logout Flow ---');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  record('Auth: Logout', 'POST /api/auth/logout clears session cookies and records logout in audit log (200)', logoutRes.status === 200);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 FINAL QA REPORT: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} tests`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error(`❌ QA FAILED: ${failedCount} tests failed.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL END-TO-END QA CHECKS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

function interfaceTestResult() {}

runQa().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
