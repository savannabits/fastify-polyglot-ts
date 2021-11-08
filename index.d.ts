import { FastifyPluginCallback, FastifyPluginOptions } from 'fastify';
import Polyglot from 'node-polyglot';

declare function fp<Options>(
  fn: FastifyPluginCallback<Options>,
  options?: string
): FastifyPluginCallback<Options>;

declare namespace plugin {}

export declare class FastifyPolyglot extends Polyglot {
  locales?: Record<string, any>;
  defaultLocale?: string;
}

declare module 'fastify' {
  export interface FastifyInstance {
    i18n: FastifyPolyglot;
  }
}

export default plugin;
