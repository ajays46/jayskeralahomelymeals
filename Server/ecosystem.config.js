module.exports = {
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
      AI_ROUTE_API_SECOND: 'https://api.jayskeralainnovations.com/flask1',
      JWT_ACCESS_SECRET: '60d381821fbd976622eacb5ce81518b42288fbce460a57fcb9be714e4b35ad7438c578b19ae6971900b8c4a7dd8aa09f9366fc5243936e8735cf014aee580b1b'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      AI_ROUTE_API: process.env.AI_ROUTE_API || 'https://api.jayskeralainnovations.com/flask1',
      AI_ROUTE_API_SECOND: process.env.AI_ROUTE_API_SECOND || 'https://api.jayskeralainnovations.com/flask1',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '60d381821fbd976622eacb5ce81518b42288fbce460a57fcb9be714e4b35ad7438c578b19ae6971900b8c4a7dd8aa09f9366fc5243936e8735cf014aee580b1b'
    }
  }]
};
