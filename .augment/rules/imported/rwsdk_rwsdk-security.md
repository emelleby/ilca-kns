---
type: "agent_requested"
---

# RedwoodSDK: Security Headers and Best Practices

You're an expert at web security, HTTP headers, Content Security Policy (CSP), and building secure web apps with RedwoodSDK. Generate high quality **security implementations** that adhere to the following best practices:

## Guidelines

1. Implement appropriate security headers to protect against common web vulnerabilities
2. Configure Content Security Policy (CSP) to prevent cross-site scripting (XSS) attacks
3. Use nonces for inline scripts when necessary
4. Set appropriate Permissions-Policy headers to control device access
5. Prevent clickjacking with X-Frame-Options
6. Implement CSRF protection for sensitive operations
7. Follow secure cookie practices

## Example Templates

### Basic Security Headers Setup

Set up essential security headers for your RedwoodSDK application:

```tsx
// src/app/headers.ts
export function getSecurityHeaders(request: Request): Headers {
  const headers = new Headers();
  
  // Generate a cryptographically secure nonce for CSP
  const nonce = crypto.randomUUID().replace(/-/g, '');
  
  // Content Security Policy (CSP)
  headers.set(
    "Content-Security-Policy",
    `default-src 'self'; 
     script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com; 
     style-src 'self' 'unsafe-inline'; 
     frame-src https://challenges.cloudflare.com; 
     object-src 'none';`
  );
  
  // Prevent browsers from incorrectly detecting non-scripts as scripts
  headers.set("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking by restricting framing to same origin
  headers.set("X-Frame-Options", "SAMEORIGIN");
  
  // Disable browser features that might be security-sensitive
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  
  // Enable browser's XSS protection
  headers.set("X-XSS-Protection", "1; mode=block");
  
  // Strict Transport Security (force HTTPS)
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  
  // Referrer Policy to control information sent in the Referer header
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Store the nonce in the headers for access in the Document component
  headers.set("X-Nonce", nonce);
  
  return headers;
}

// Usage in worker.tsx:
// import { getSecurityHeaders } from './app/headers';
// 
// const app = defineApp([
//   // Apply security headers to all requests
//   async (request, next) => {
//     const response = await next(request);
//     const securityHeaders = getSecurityHeaders(request);
//     
//     // Copy security headers to the response
//     securityHeaders.forEach((value, key) => {
//       response.headers.set(key, value);
//     });
//     
//     return response;
//   },
//   // Your routes here
// ]);
```

### Content Security Policy (CSP) Configuration

```tsx
// src/app/security/csp.ts
export interface CSPOptions {
  enableTrustedScripts?: boolean;
  enableAnalytics?: boolean;
  enableFonts?: boolean;
  enableImages?: boolean;
  enableFrames?: boolean;
  customDirectives?: Record<string, string>;
}

export function generateCSP(nonce: string, options: CSPOptions = {}): string {
  // Base CSP directives
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': [],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  
  // Add Cloudflare Turnstile if needed
  directives['script-src'].push('https://challenges.cloudflare.com');
  directives['frame-src'].push('https://challenges.cloudflare.com');
  
  // Add trusted scripts
  if (options.enableTrustedScripts) {
    directives['script-src'].push('https://trusted-scripts.example.com');
  }
  
  // Add analytics
  if (options.enableAnalytics) {
    directives['script-src'].push('https://www.google-analytics.com');
    directives['connect-src'].push('https://www.google-analytics.com');
  }
  
  // Add font providers
  if (options.enableFonts) {
    directives['font-src'].push('https://fonts.gstatic.com');
    directives['style-src'].push('https://fonts.googleapis.com');
  }
  
  // Add image providers
  if (options.enableImages) {
    directives['img-src'].push('https://images.example.com', 'data:');
  }
  
  // Add frame providers
  if (options.enableFrames) {
    directives['frame-src'].push('https://www.youtube.com', 'https://player.vimeo.com');
  }
  
  // Add custom directives
  if (options.customDirectives) {
    for (const [directive, value] of Object.entries(options.customDirectives)) {
      if (!directives[directive]) {
        directives[directive] = [];
      }
      directives[directive].push(value);
    }
  }
  
  // Build the CSP header string
  return Object.entries(directives)
    .filter(([_, values]) => values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

// Usage example:
// const csp = generateCSP(nonce, {
//   enableAnalytics: true,
//   enableFonts: true,
//   customDirectives: {
//     'connect-src': 'https://api.example.com'
//   }
// });
```

### Using Nonces with Inline Scripts

```tsx
// src/app/Document.tsx
export function Document({ rw, children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RedwoodSDK App</title>
      </head>
      <body>
        <div id="root">{children}</div>
        
        {/* Use the nonce for inline scripts */}
        <script nonce={rw.nonce}>
          {`
            // This inline script is allowed by CSP because it has a valid nonce
            console.log('App initialized');
            
            // Set up global error tracking
            window.addEventListener('error', function(event) {
              console.error('Global error:', event.error);
              // You could send this to your error tracking service
            });
          `}
        </script>
      </body>
    </html>
  );
}

// Usage in worker.tsx:
// import { Document } from './app/Document';
// 
// export default defineApp([
//   // ...
//   render(Document, [
//     // Your routes
//   ]),
// ]);
```

### Permissions Policy Configuration

```tsx
// src/app/security/permissions.ts
export interface PermissionsPolicyOptions {
  camera?: 'self' | 'none';
  microphone?: 'self' | 'none';
  geolocation?: 'self' | 'none';
  payment?: 'self' | 'none';
  usb?: 'self' | 'none';
  fullscreen?: 'self' | 'none';
  accelerometer?: 'self' | 'none';
  gyroscope?: 'self' | 'none';
  magnetometer?: 'self' | 'none';
  customPermissions?: Record<string, string>;
}

export function generatePermissionsPolicy(options: PermissionsPolicyOptions = {}): string {
  const defaultOptions: PermissionsPolicyOptions = {
    camera: 'none',
    microphone: 'none',
    geolocation: 'none',
    payment: 'none',
    usb: 'none',
    fullscreen: 'self',
    accelerometer: 'none',
    gyroscope: 'none',
    magnetometer: 'none',
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Build the permissions policy
  const directives = [];
  
  for (const [permission, value] of Object.entries(mergedOptions)) {
    if (permission === 'customPermissions') continue;
    
    if (value === 'none') {
      directives.push(`${permission}=()`);
    } else if (value === 'self') {
      directives.push(`${permission}=self`);
    }
  }
  
  // Add custom permissions
  if (mergedOptions.customPermissions) {
    for (const [permission, value] of Object.entries(mergedOptions.customPermissions)) {
      directives.push(`${permission}=${value}`);
    }
  }
  
  return directives.join(', ');
}

// Usage example:
// const permissionsPolicy = generatePermissionsPolicy({
//   camera: 'self',
//   microphone: 'self',
//   geolocation: 'self',
//   customPermissions: {
//     'display-capture': 'self'
//   }
// });
```

### CSRF Protection

```tsx
// src/app/security/csrf.ts
// CSRF token generation and validation

export interface CSRFOptions {
  cookieName?: string;
  headerName?: string;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  };
}

export class CSRFProtection {
  private options: CSRFOptions;
  
  constructor(options: CSRFOptions = {}) {
    this.options = {
      cookieName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 3600, // 1 hour
      },
      ...options,
    };
  }
  
  // Generate a new CSRF token
  generateToken(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Set CSRF token cookie in the response
  setTokenCookie(response: Response): string {
    const token = this.generateToken();
    const { cookieName, cookieOptions } = this.options;
    
    const cookieValue = `${cookieName}=${token}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}`;
    
    if (cookieOptions.httpOnly) {
      cookieValue += '; HttpOnly';
    }
    
    if (cookieOptions.secure) {
      cookieValue += '; Secure';
    }
    
    if (cookieOptions.sameSite) {
      cookieValue += `; SameSite=${cookieOptions.sameSite}`;
    }
    
    response.headers.append('Set-Cookie', cookieValue);
    
    return token;
  }
  
  // Extract CSRF token from cookies
  getTokenFromCookies(request: Request): string | null {
    const cookies = request.headers.get('Cookie') || '';
    const cookieName = this.options.cookieName;
    
    const match = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
  }
  
  // Validate CSRF token
  validateToken(request: Request): boolean {
    const cookieToken = this.getTokenFromCookies(request);
    const headerToken = request.headers.get(this.options.headerName);
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(cookieToken, headerToken);
  }
  
  // Constant-time string comparison to prevent timing attacks
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  // Middleware to protect routes against CSRF
  middleware = async (request: Request, next: (request: Request) => Promise<Response>) => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    
    if (safeMethod) {
      const response = await next(request);
      
      // Set a new CSRF token for GET requests
      if (request.method === 'GET') {
        this.setTokenCookie(response);
      }
      
      return response;
    }
    
    // For unsafe methods, validate the CSRF token
    if (!this.validateToken(request)) {
      return new Response('CSRF token validation failed', { status: 403 });
    }
    
    // Token is valid, proceed with the request
    return next(request);
  };
}

// Usage example:
// const csrfProtection = new CSRFProtection();
// 
// export default defineApp([
//   // Apply CSRF protection middleware
//   csrfProtection.middleware,
//   // Your routes here
// ]);
```

### Secure Cookie Handling

```tsx
// src/app/security/cookies.ts
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
}

export class SecureCookies {
  // Set a secure cookie
  static set(
    response: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (mergedOptions.httpOnly) {
      cookieString += '; HttpOnly';
    }
    
    if (mergedOptions.secure) {
      cookieString += '; Secure';
    }
    
    if (mergedOptions.sameSite) {
      cookieString += `; SameSite=${mergedOptions.sameSite}`;
    }
    
    if (mergedOptions.path) {
      cookieString += `; Path=${mergedOptions.path}`;
    }
    
    if (mergedOptions.domain) {
      cookieString += `; Domain=${mergedOptions.domain}`;
    }
    
    if (mergedOptions.maxAge !== undefined) {
      cookieString += `; Max-Age=${mergedOptions.maxAge}`;
    }
    
    if (mergedOptions.expires) {
      cookieString += `; Expires=${mergedOptions.expires.toUTCString()}`;
    }
    
    response.headers.append('Set-Cookie', cookieString);
  }
  
  // Get a cookie value from request
  static get(request: Request, name: string): string | null {
    const cookies = request.headers.get('Cookie') || '';
    const match = cookies.match(new RegExp(`${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  
  // Delete a cookie
  static delete(response: Response, name: string, options: Omit<CookieOptions, 'maxAge' | 'expires'> = {}): void {
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Set an expired date to delete the cookie
    this.set(response, name, '', {
      ...mergedOptions,
      maxAge: 0,
      expires: new Date(0),
    });
  }
}

// Usage example:
// const response = new Response('Hello World');
// SecureCookies.set(response, 'session', sessionId, { maxAge: 3600 });
// 
// // To get a cookie
// const sessionId = SecureCookies.get(request, 'session');
// 
// // To delete a cookie
// SecureCookies.delete(response, 'session');
```

### Security Middleware

```tsx
// src/app/security/middleware.ts
import { getSecurityHeaders } from '../headers';
import { CSRFProtection } from './csrf';
import { SecureCookies } from './cookies';

// Create instances of security utilities
const csrfProtection = new CSRFProtection();

// Security middleware that combines multiple security features
export async function securityMiddleware(
  request: Request,
  next: (request: Request) => Promise<Response>
): Promise<Response> {
  // Skip for preflight requests
  if (request.method === 'OPTIONS') {
    return next(request);
  }
  
  // Apply CSRF protection for non-safe methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (!csrfProtection.validateToken(request)) {
      return new Response('CSRF token validation failed', { status: 403 });
    }
  }
  
  // Process the request
  const response = await next(request);
  
  // Apply security headers
  const securityHeaders = getSecurityHeaders(request);
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  // Set CSRF token for GET requests
  if (request.method === 'GET') {
    csrfProtection.setTokenCookie(response);
  }
  
  return response;
}

// Usage example:
// export default defineApp([
//   // Apply security middleware to all requests
//   securityMiddleware,
//   // Your routes here
// ]);
```

### XSS Protection Utilities

```tsx
// src/app/security/xss.ts
export class XSSProtection {
  // Sanitize user input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Sanitize URL to prevent javascript: protocol exploits
  static sanitizeUrl(url: string): string {
    // Check if URL is valid
    try {
      const parsedUrl = new URL(url);
      
      // Block javascript: protocol
      if (parsedUrl.protocol === 'javascript:') {
        return '#';
      }
      
      // Block data: protocol
      if (parsedUrl.protocol === 'data:') {
        return '#';
      }
      
      return url;
    } catch (e) {
      // If URL is invalid, return a safe default
      return '#';
    }
  }
  
  // Sanitize HTML content
  static sanitizeHtml(html: string): string {
    // This is a very basic implementation
    // For production, use a proper HTML sanitizer library
    
    // Remove script tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove on* attributes
    html = html.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
    
    // Remove javascript: URLs
    html = html.replace(/javascript:/gi, 'blocked:');
    
    return html;
  }
}

// Usage example:
// const userInput = '<script>alert("XSS")</script>';
// const sanitizedInput = XSSProtection.sanitizeInput(userInput);
// 
// const userUrl = 'javascript:alert("XSS")';
// const sanitizedUrl = XSSProtection.sanitizeUrl(userUrl);
// 
// const userHtml = '<div onmouseover="alert(\'XSS\')">Content</div>';
// const sanitizedHtml = XSSProtection.sanitizeHtml(userHtml);
```

### Security Headers for API Routes

```tsx
// src/app/routes/api.ts
import { route } from 'rwsdk/router';
import { getSecurityHeaders } from '../headers';

export default [
  // Route with specific security headers for API
  route('/api/data', async function handler({ request }) {
    try {
      // Process the request
      const data = { message: 'API response' };
      
      // Create the response
      const response = Response.json(data);
      
      // Apply security headers
      const securityHeaders = getSecurityHeaders(request);
      
      // Add API-specific headers
      securityHeaders.set('Cache-Control', 'no-store, max-age=0');
      securityHeaders.set('Pragma', 'no-cache');
      
      // Copy all headers to the response
      securityHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      console.error('API error:', error);
      
      // Create error response
      const errorResponse = Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      // Apply security headers to error response too
      const securityHeaders = getSecurityHeaders(request);
      securityHeaders.forEach((value, key) => {
        errorResponse.headers.set(key, value);
      });
      
      return errorResponse;
    }
  })
];
```

### Complete Security Configuration

```tsx
// src/app/security/index.ts
import { generateCSP } from './csp';
import { generatePermissionsPolicy } from './permissions';
import { CSRFProtection } from './csrf';
import { SecureCookies } from './cookies';
import { XSSProtection } from './xss';

export interface SecurityOptions {
  csp?: {
    enableTrustedScripts?: boolean;
    enableAnalytics?: boolean;
    enableFonts?: boolean;
    enableImages?: boolean;
    enableFrames?: boolean;
    customDirectives?: Record<string, string>;
  };
  permissions?: {
    camera?: 'self' | 'none';
    microphone?: 'self' | 'none';
    geolocation?: 'self' | 'none';
    payment?: 'self' | 'none';
    customPermissions?: Record<string, string>;
  };
  csrf?: {
    enabled?: boolean;
    cookieName?: string;
    headerName?: string;
  };
}

export function configureSecurityHeaders(
  request: Request,
  options: SecurityOptions = {}
): Headers {
  const headers = new Headers();
  
  // Generate a cryptographically secure nonce for CSP
  const nonce = crypto.randomUUID().replace(/-/g, '');
  
  // Content Security Policy (CSP)
  const csp = generateCSP(nonce, options.csp);
  headers.set("Content-Security-Policy", csp);
  
  // Permissions Policy
  const permissionsPolicy = generatePermissionsPolicy(options.permissions);
  headers.set("Permissions-Policy", permissionsPolicy);
  
  // Standard security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Store the nonce in the headers for access in the Document component
  headers.set("X-Nonce", nonce);
  
  return headers;
}

// Export all security utilities
export {
  generateCSP,
  generatePermissionsPolicy,
  CSRFProtection,
  SecureCookies,
  XSSProtection
};

// Usage example:
// import { configureSecurityHeaders } from './app/security';
// 
// export default defineApp([
//   // Apply security headers to all requests
//   async (request, next) => {
//     const response = await next(request);
//     const securityHeaders = configureSecurityHeaders(request, {
//       csp: {
//         enableAnalytics: true,
//         enableFonts: true
//       },
//       permissions: {
//         camera: 'self',
//         microphone: 'self'
//       }
//     });
//     
//     // Copy security headers to the response
//     securityHeaders.forEach((value, key) => {
//       response.headers.set(key, value);
//     });
//     
//     return response;
//   },
//   // Your routes here
// ]);
```
