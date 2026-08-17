import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`\n🏭 Metal & Aluminum Backend running at http://localhost:${port}`);
    console.log(`   Health check: http://localhost:${port}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
