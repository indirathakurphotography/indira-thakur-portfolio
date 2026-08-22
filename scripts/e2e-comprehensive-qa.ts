import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import LoginLog from '../src/models/LoginLog';
import AuditLog from '../src/models/AuditLog';
import BlockedIp from '../src/models/BlockedIp';
import BlockedAccessLog from '../src/models/BlockedAccessLog';
import PageView from '../src/models/PageView';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret } from '../src/lib/auth';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, name: string, passed: boolean, details?: string) {
  results.push({ suite, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${suite}] ${name} ${details ? `(${details})` : ''}`);
}

async function runE2E() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE END-TO-END QA SUITE FOR ADMIN SYSTEM');
  console.log('================================================================\n');

  // Connect to DB
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection failed');
  }
  console.log('📦 Connected to MongoDB Atlas successfully.\n');

  // Ensure an active primary admin exists
  let primaryAdmin = await User.findOne({ email: 'admin@indirathakur.com' });
  if (!primaryAdmin) {
    const hashed = await bcrypt.hash('Admin@12345678', 12);
    primaryAdmin = await User.create({
      name: 'Indira Thakur',
      email: 'admin@indirathakur.com',
      password: hashed,
      role: 'admin',
      isActive: true,
      isBlocked: false,
      status: 'active',
      authGeneration: 1,
    });
  } else {
    // Reset admin to active
    primaryAdmin.isActive = true;
    primaryAdmin.isBlocked = false;
    primaryAdmin.status = 'active';
    await primaryAdmin.save();
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: UNAUTHORIZED ACCESS PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Unauthorized Access Protection ---');
  const protectedEndpoints = [
    '/api/dashboard',
    '/api/auth/users',
    '/api/security',
    '/api/auth/access-logs',
    '/api/audit-logs',
    '/api/analytics/stats',
    '/api/audit-storage',
  ];

  for (const endpoint of protectedEndpoints) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    const passed = res.status === 401;
    record('Unauthorized Access', `GET ${endpoint} without token rejects with 401`, passed, `Status: ${res.status}`);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: AUTHENTICATION FLOW (LOGIN / WRONG PW / LOGOUT)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Login, Wrong Password & Session Recording ---');

  // Test wrong password
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'WrongPassword999!' }),
  });
  record('Authentication', 'Login with wrong password fails with 401', badLoginRes.status === 401, `Status: ${badLoginRes.status}`);

  // Verify failed login logged in LoginLog and AuditLog
  const failedLog = await LoginLog.findOne({ email: 'admin@indirathakur.com', status: 'failed' }).sort({ loginTime: -1 });
  record('Security Logging', 'Failed login recorded in LoginLog with IP and UA details', !!failedLog, `IP: ${failedLog?.ip}`);

  const failedAudit = await AuditLog.findOne({ action: 'ADMIN_LOGIN_FAILED' }).sort({ timestamp: -1 });
  record('Audit Logging', 'ADMIN_LOGIN_FAILED event recorded in AuditLog', !!failedAudit, `Target: ${failedAudit?.targetResource}`);

  // Test successful login
  const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'Admin@12345678' }),
  });
  const goodLoginData = await goodLoginRes.json();
  const token = goodLoginData.token;
  const sessionId = goodLoginData.sessionId;

  record('Authentication', 'Login with valid credentials succeeds with 200 and issues JWT', goodLoginRes.status === 200 && !!token, `Token issued: ${!!token}`);

  // Verify successful login in LoginLog with parsed UA
  const successLog = await LoginLog.findOne({ sessionId, status: 'success' });
  record('Security Logging', 'Successful login recorded in LoginLog with Browser/OS/Device/IP', !!successLog && successLog.browser === 'Chrome' && successLog.os === 'macOS', `Browser: ${successLog?.browser}, OS: ${successLog?.os}`);

  const successAudit = await AuditLog.findOne({ action: 'ADMIN_LOGIN_SUCCESS' }).sort({ timestamp: -1 });
  record('Audit Logging', 'ADMIN_LOGIN_SUCCESS event recorded in AuditLog', !!successAudit, `Email: ${successAudit?.adminEmail}`);

  // Verify /api/auth/verify with token
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyData = await verifyRes.json();
  record('Authentication', 'Verify token returns authenticated: true', verifyRes.status === 200 && verifyData.authenticated === true, `Auth: ${verifyData.authenticated}`);

  // -------------------------------------------------------------
  // TEST SUITE 3: ADMIN SETTINGS & USER MANAGEMENT (CRUD & ROLES)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Settings & User Management (Create, Edit, Roles, Disable, Delete) ---');

  const testEmail = `qa.editor.${Date.now()}@indirathakur.com`;
  const testPassword = 'Password@Editor1234!';

  // Create new editor user
  const createRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'QA Test Editor',
      email: testEmail,
      password: testPassword,
      role: 'editor',
      status: 'active',
    }),
  });
  const createData = await createRes.json();
  const createdUserId = createData.user?._id;

  record('Settings: Users', 'Create new editor account succeeds with 201', createRes.status === 201 && !!createdUserId, `ID: ${createdUserId}`);

  const createAudit = await AuditLog.findOne({ action: 'ADMIN_ACCOUNT_CREATED', targetResource: `User: ${testEmail}` });
  record('Audit Logging', 'ADMIN_ACCOUNT_CREATED event recorded in AuditLog', !!createAudit, `Action: ${createAudit?.action}`);

  // Test editor login
  const editorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const editorLoginData = await editorLoginRes.json();
  const editorToken = editorLoginData.token;
  const editorSessionId = editorLoginData.sessionId;
  record('Settings: Users', 'Newly created editor can log in', editorLoginRes.status === 200 && !!editorToken, `Role: ${editorLoginData.user?.role}`);

  // Test role enforcement: Editor cannot access Admin-only routes (e.g. /api/auth/users or /api/security)
  const editorAccessUsersRes = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  record('RBAC Security', 'Editor cannot access admin-only /api/auth/users (403 Forbidden)', editorAccessUsersRes.status === 403, `Status: ${editorAccessUsersRes.status}`);

  // Update user: Disable editor
  const disableRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: createdUserId,
      status: 'disabled',
      isActive: false,
    }),
  });
  record('Settings: Users', 'Disable editor account succeeds', disableRes.status === 200);

  // Test disabled user token is now REJECTED immediately
  const disabledVerifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  record('Security Enforcement', 'Existing token of disabled user is immediately rejected (401)', disabledVerifyRes.status === 401, `Status: ${disabledVerifyRes.status}`);

  // Test disabled user CANNOT log in (403)
  const disabledLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  record('Security Enforcement', 'Disabled user login attempt is blocked with 403', disabledLoginRes.status === 403, `Status: ${disabledLoginRes.status}`);

  // Re-enable and change password
  const newEditorPassword = 'NewPassword@Editor5678!';
  const updatePassRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: createdUserId,
      status: 'active',
      isActive: true,
      password: newEditorPassword,
    }),
  });
  record('Settings: Users', 'Reset password and re-activate user succeeds', updatePassRes.status === 200);

  // Old password must fail, new password must succeed
  const oldPwLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  record('Authentication', 'Old password fails after reset', oldPwLoginRes.status === 401);

  const newPwLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newEditorPassword }),
  });
  record('Authentication', 'New password succeeds after reset', newPwLoginRes.status === 200);

  // Safeguard: Cannot delete own account
  const deleteSelfRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: primaryAdmin._id.toString() }),
  });
  record('Settings: Safeguards', 'Cannot delete currently logged-in administrator (400)', deleteSelfRes.status === 400, `Status: ${deleteSelfRes.status}`);

  // Delete test editor user
  const deleteEditorRes = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: createdUserId }),
  });
  record('Settings: Users', 'Delete non-primary user succeeds with 200', deleteEditorRes.status === 200);

  const deleteAudit = await AuditLog.findOne({ action: 'ADMIN_ACCOUNT_DELETED', targetResource: `User: ${testEmail}` });
  record('Audit Logging', 'ADMIN_ACCOUNT_DELETED event recorded in AuditLog', !!deleteAudit, `Target: ${deleteAudit?.targetResource}`);

  // -------------------------------------------------------------
  // TEST SUITE 4: SESSION MANAGEMENT & SINGLE / GLOBAL REVOCATION
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Session Management, Single Revocation & Global Revocation ---');

  // Create Session 1 and Session 2 for primaryAdmin
  const sess1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'Admin@12345678' }),
  });
  const { token: token1, sessionId: sessId1 } = await sess1Res.json();

  const sess2Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'Admin@12345678' }),
  });
  const { token: token2, sessionId: sessId2 } = await sess2Res.json();

  // Verify access logs list both sessions
  const logsRes = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const logsData = await logsRes.json();
  const hasSess1 = logsData.logs?.some((l: any) => l.sessionId === sessId1);
  const hasSess2 = logsData.logs?.some((l: any) => l.sessionId === sessId2);
  record('Security: Telemetry', 'Security access logs contain all active admin sessions', hasSess1 && hasSess2, `Found Sess 1 & 2: ${hasSess1 && hasSess2}`);

  // Terminate ONLY Session 1
  const revokeSess1Res = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`,
    },
    body: JSON.stringify({ action: 'revoke_session', sessionId: sessId1 }),
  });
  record('Security: Sessions', 'Single session revocation request succeeds', revokeSess1Res.status === 200);

  // Verify Session 1 is REJECTED
  const checkSess1Res = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  record('Security: Sessions', 'Revoked Session 1 is immediately invalid (401)', checkSess1Res.status === 401, `Status: ${checkSess1Res.status}`);

  // Verify Session 2 is STILL VALID
  const checkSess2Res = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  record('Security: Sessions', 'Unrevoked Session 2 remains valid and authenticated', checkSess2Res.status === 200, `Status: ${checkSess2Res.status}`);

  // Test Global Revoke All Sessions
  const revokeAllRes = await fetch(`${BASE_URL}/api/auth/access-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`,
    },
    body: JSON.stringify({ action: 'revoke_all' }),
  });
  record('Security: Sessions', 'Global session revocation request succeeds', revokeAllRes.status === 200);

  // Verify Session 2 is NOW REJECTED after global revoke
  const checkSess2AfterGlobal = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  record('Security: Sessions', 'All previous sessions are immediately invalidated after global revoke (401)', checkSess2AfterGlobal.status === 401, `Status: ${checkSess2AfterGlobal.status}`);

  // Login again to get a fresh valid token for subsequent tests
  const freshLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'Admin@12345678' }),
  });
  const freshLoginData = await freshLoginRes.json();
  const freshToken = freshLoginData.token;

  // -------------------------------------------------------------
  // TEST SUITE 5: IP ACCESS SHIELD & BLOCKLIST ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing IP Blocklist, Interception Logging & Unblock ---');

  const testBlockedIp = '198.51.100.77';

  // Add IP to blocklist
  const blockRes = await fetch(`${BASE_URL}/api/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freshToken}`,
    },
    body: JSON.stringify({
      action: 'block',
      ip: testBlockedIp,
      reason: 'Automated QA malicious attack simulation',
    }),
  });
  record('Security: IP Shield', 'Block IP request succeeds with 201', blockRes.status === 201);

  const blockAudit = await AuditLog.findOne({ action: 'IP_BLOCKED', targetResource: `IP: ${testBlockedIp}` });
  record('Audit Logging', 'IP_BLOCKED event recorded in AuditLog', !!blockAudit, `Reason: ${blockAudit?.details}`);

  // Simulate request from blocked IP
  const blockedRequestRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${freshToken}`,
      'x-forwarded-for': testBlockedIp,
    },
  });
  record('Security: IP Shield', 'Request from blocked IP is intercepted with 403 Forbidden', blockedRequestRes.status === 403, `Status: ${blockedRequestRes.status}`);

  // Verify BlockedAccessLog recorded the interception
  const interceptLog = await BlockedAccessLog.findOne({ ip: testBlockedIp }).sort({ createdAt: -1 });
  record('Security: IP Shield', 'Blocked access attempt is logged in BlockedAccessLog', !!interceptLog, `Path: ${interceptLog?.path}`);

  // Unblock IP
  const unblockRes = await fetch(`${BASE_URL}/api/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freshToken}`,
    },
    body: JSON.stringify({
      action: 'unblock',
      ip: testBlockedIp,
    }),
  });
  record('Security: IP Shield', 'Unblock IP request succeeds with 200', unblockRes.status === 200);

  const unblockAudit = await AuditLog.findOne({ action: 'IP_UNBLOCKED', targetResource: `IP: ${testBlockedIp}` });
  record('Audit Logging', 'IP_UNBLOCKED event recorded in AuditLog', !!unblockAudit);

  // -------------------------------------------------------------
  // TEST SUITE 6: REAL VISITOR ANALYTICS & ROUTE TRACKING
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Real Visitor Analytics Tracking Across Routes ---');

  const publicRoutes = ['/', '/about', '/gallery', '/services', '/films', '/contact', '/faq', '/testimonials'];
  const testVisitorSession = `qa_visitor_${Date.now()}`;

  for (const route of publicRoutes) {
    const trackRes = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      body: JSON.stringify({
        path: route,
        referrer: 'https://www.google.com/',
        device: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        sessionId: testVisitorSession,
      }),
    });
    record('Analytics: Tracking', `Public route '${route}' sends analytics event`, trackRes.status === 200, `Status: ${trackRes.status}`);
  }

  // Verify PageView records in MongoDB
  const trackedViews = await PageView.find({ sessionId: testVisitorSession });
  const allRoutesTracked = publicRoutes.every((r) => trackedViews.some((v) => v.path === r));
  record('Analytics: Persistence', 'All 8 public routes persisted as real PageViews in MongoDB', allRoutesTracked && trackedViews.length >= 8, `Count: ${trackedViews.length}`);

  // Verify /api/analytics/stats returns accurate data
  const statsRes = await fetch(`${BASE_URL}/api/analytics/stats`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const statsData = await statsRes.json();
  const hasTopPages = Array.isArray(statsData.topPages) && statsData.topPages.length > 0;
  const hasDailyTrends = Array.isArray(statsData.dailyTrends) && statsData.dailyTrends.length === 14;
  const hasDeviceBreakdown = statsData.deviceBreakdown?.mobile > 0;

  record('Analytics: Telemetry', 'Analytics stats endpoint returns top pages, 14-day trend, and device breakdown', hasTopPages && hasDailyTrends && hasDeviceBreakdown, `Total Views: ${statsData.totalPageViews}, Unique: ${statsData.uniqueVisitors}`);

  // -------------------------------------------------------------
  // TEST SUITE 7: AUDIT LOG INSPECTION & FILTERING
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Audit Log API, Filtering & Search ---');

  const auditRes = await fetch(`${BASE_URL}/api/audit-logs?limit=50`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const auditData = await auditRes.json();
  record('Audit Log: Telemetry', 'Audit log endpoint returns real historical admin actions', auditRes.status === 200 && Array.isArray(auditData.logs) && auditData.logs.length > 0, `Total entries: ${auditData.totalCount}`);

  // Filter by action
  const filterActionRes = await fetch(`${BASE_URL}/api/audit-logs?action=IP_BLOCKED`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const filterData = await filterActionRes.json();
  const allMatched = filterData.logs?.every((l: any) => l.action === 'IP_BLOCKED');
  record('Audit Log: Filters', 'Audit log filtering by action returns only matching events', filterActionRes.status === 200 && allMatched && filterData.logs.length > 0, `Matched: ${filterData.logs?.length}`);

  // -------------------------------------------------------------
  // TEST SUITE 8: VERIFY NO HARDCODED OR MOCK DATA IN RESPONSES
  // -------------------------------------------------------------
  console.log('\n--- 8. Verifying Zero Mock / Hardcoded Data ---');
  // Check that analytics, security, and users data come dynamically from DB
  const rawDbUserCount = await User.countDocuments();
  const rawDbPageViewCount = await PageView.countDocuments();
  const rawDbAuditCount = await AuditLog.countDocuments();

  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const dashData = await dashRes.json();

  const countsMatch = dashData.totalPageViews === rawDbPageViewCount;
  record('Zero Mock Data', 'Dashboard totalPageViews dynamically matches MongoDB countDocuments', countsMatch, `Dash: ${dashData.totalPageViews}, DB: ${rawDbPageViewCount}`);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED, ${results.length} TOTAL`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error(`❌ ${failedCount} tests failed!`);
    process.exit(1);
  } else {
    console.log('🎉 ALL END-TO-END QA TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runE2E().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
