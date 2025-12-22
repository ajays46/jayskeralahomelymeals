export default {
  apps: [{
    name: 'jayskeralahm-server',
    script: 'src/App.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
      AI_ROUTE_API: 'https://api.jayskeralainnovations.com/flask1',
      AI_ROUTE_API_SECOND: 'https://api.jayskeralainnovations.com/flask2',
      AI_ROUTE_API_THIRD: 'https://api.jayskeralainnovations.com/flask3'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      AI_ROUTE_API: process.env.AI_ROUTE_API || 'https://api.jayskeralainnovations.com/flask1',
      AI_ROUTE_API_SECOND: process.env.AI_ROUTE_API_SECOND || 'https://api.jayskeralainnovations.com/flask2',
      AI_ROUTE_API_THIRD: process.env.AI_ROUTE_API_THIRD || 'https://api.jayskeralainnovations.com/flask3'
    }
  }]
};
