import { FastifyRequest as OriginalRequest } from 'fastify';

declare module 'fastify' {
  export interface FastifyRequest extends OriginalRequest {
    cookies: {
      sessionId?: string;
      [key: string]: string | undefined;
    };
  }
}
