const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://server:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Remove /api prefix when forwarding
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.path} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ message: 'Proxy error', error: err.message });
      },
    })
  );
};
