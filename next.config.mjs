const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ['192.168.50.102', '127.0.0.1', 'localhost'],
  async headers() {
    const cspParts = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://hcaptcha.com https://*.hcaptcha.com",
      "connect-src 'self' https://www.google.com https://www.gstatic.com https://hcaptcha.com https://*.hcaptcha.com",
      "frame-src https://www.google.com https://hcaptcha.com https://*.hcaptcha.com",
    ];

    if (!isDev) {
      cspParts.push("upgrade-insecure-requests");
    }

    const csp = cspParts.join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
