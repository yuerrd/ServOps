// 动态配置，支持Docker环境变量注入
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: '/api',
  SOCKET_URL: window.__BACKEND_HOST__ || 'http://localhost:3001'
};