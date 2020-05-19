import { Router, Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';

import transactionsRouter from './transactions.routes';

const routes = Router();

routes.use('/transactions', transactionsRouter);

routes.use(
  (err: Error, request: Request, response: Response, _: NextFunction) => {
    if (err instanceof AppError) {
      return response
        .status(err.statusCode)
        .json({ message: err.message, status: 'error' });
    }
    return response
      .status(500)
      .json({ message: 'Internal server error.', status: 'error' });
  },
);

export default routes;
