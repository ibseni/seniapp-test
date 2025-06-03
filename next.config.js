/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-specific configuration
      config.externals = [...config.externals, 'pdf-lib', 'canvas'];
    }
    // Ignore punycode warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ];
    return config;
  },
  serverExternalPackages: ['pdfkit', 'canvas'],
  images: {
    domains: ["lh3.googleusercontent.com","mimgagorkqncrvohwaly.supabase.co"]
  },
};

module.exports = nextConfig;
