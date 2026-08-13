export interface ParsedUA {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(uaString: string): ParsedUA {
  if (!uaString) {
    return { browser: 'Unknown Browser', os: 'Unknown OS', device: 'Desktop' };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Device
  if (/mobile/i.test(uaString)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(uaString)) {
    device = 'Tablet';
  }

  // OS
  if (/macintosh|mac os x/i.test(uaString)) {
    os = 'macOS';
  } else if (/windows/i.test(uaString)) {
    os = 'Windows';
  } else if (/android/i.test(uaString)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    os = 'iOS';
  } else if (/linux/i.test(uaString)) {
    os = 'Linux';
  }

  // Browser
  if (/edg/i.test(uaString)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(uaString) && !/edg/i.test(uaString)) {
    browser = 'Google Chrome';
  } else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Mozilla Firefox';
  }

  return { browser, os, device };
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  return '127.0.0.1';
}
