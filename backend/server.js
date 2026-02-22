const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`API: http://localhost:${config.port}/api/health`);
});
