/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像ドメイン設定
  images: {
    domains: ["localhost", "0.0.0.0"],
  },

  // 開発環境でのエラー抑制
  onDemandEntries: {
    // 開発時のメモリ使用量を制限
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Webpack設定
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // React DevTools のサポート
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-dom$": "react-dom/profiling",
        "scheduler/tracing": "scheduler/tracing-profiling",
      };
    }

    // ブラウザ拡張機能によるエラーを無視
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Module not found: Can't resolve 'fs'/,
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },

  // 環境変数の設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // リダイレクト設定
  async redirects() {
    return [];
  },

  // ヘッダー設定
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
