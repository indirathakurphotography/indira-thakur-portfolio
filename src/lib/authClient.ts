export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

export function getAuthHeaders(customHeaders: HeadersInit = {}): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};

  if (customHeaders instanceof Headers) {
    customHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(customHeaders)) {
    customHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else if (customHeaders && typeof customHeaders === 'object') {
    Object.assign(headers, customHeaders);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders(init.headers);
  return fetch(input, {
    ...init,
    headers: authHeaders,
    credentials: 'include',
  });
}
