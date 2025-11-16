import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export const createServer = () => {
  const app = express();

  if (env.SENTRY_DSN) {
    Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate: 1.0 });
    app.use(Sentry.Handlers.requestHandler());
  }

  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS === '*' ? true : env.ALLOWED_ORIGINS_LIST,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('combined'));

  app.use('/api', apiRouter);

  if (env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
  app.use(errorHandler);

  return app;
};
