import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { createServer } from './server.js';

const app = createServer();
const port = Number(process.env.PORT ?? env.PORT);

app.listen(port, () => {
  logger.info(`CaseFlow backend listening on port ${port}`);
});
