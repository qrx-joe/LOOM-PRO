import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: any, res: any, next: any) {
    const method = req.method;
    const originalUrl = req.originalUrl;
    const ip = req.ip || req.connection?.remoteAddress || '';
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
