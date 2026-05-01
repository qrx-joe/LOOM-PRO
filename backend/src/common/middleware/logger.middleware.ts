import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const originalUrl = req.originalUrl;
    const ip = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - start;
      const logLevel = statusCode >= 400 ? 'error' : 'log';
      this.logger[logLevel](
        `${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
