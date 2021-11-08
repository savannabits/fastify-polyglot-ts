import path from 'path';
import { Dirent, readdirSync } from 'fs';
import fp from 'fastify-plugin';
import Polyglot from 'node-polyglot';
import { ERR_MISSING_DICTIONARY_FOR_DEFAULT_LOCALE } from './errors';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from 'fastify';

export interface MyPluginOptions extends FastifyPluginOptions {
  defaultLocale: string;
  localesPath?: string;
  locales?: Record<string, any>;
}

export declare class FastifyPolyglot extends Polyglot {
  locales?: Record<string, any>;
  defaultLocale?: string;
}

declare module 'fastify' {
  export interface FastifyInstance {
    i18n: FastifyPolyglot;
  }
}

const ACCEPTED_EXTENSIONS = ['.js', '.ts', '.json'];

const plugin: FastifyPluginAsync<MyPluginOptions> = async (
  fastify: FastifyInstance,
  opts: MyPluginOptions
) => {
  try {
    const getLocales = (basepath: string) => {
      let contents: Array<Dirent> = [];
      try {
        contents = readdirSync(basepath, { withFileTypes: true });
      } catch (err) {
        fastify.log.warn(err);
      }
      return contents
        .filter(entry => {
          const ext = path.extname(entry.name);
          return entry.isFile() && ACCEPTED_EXTENSIONS.indexOf(ext) !== -1;
        })
        .reduce((locales, entry) => {
          const name = entry.name.replace(/\.[^/.]+$/, '');
          const pathname = path.join(basepath, name);
          locales[name] = require(pathname);
          return locales;
        }, {});
    };

    const mergeLocales = (a = {}, b = {}) => {
      const locales = { ...a };
      Object.keys(b).forEach(key => {
        locales[key] = {
          ...a[key],
          ...b[key],
        };
      });
      return locales;
    };

    const defaultLocale: string = opts.defaultLocale || 'en';
    const localesPath: string = opts.localesPath || './locales';
    const loadedLocales = getLocales(localesPath);
    const locales = mergeLocales(opts.locales, loadedLocales);

    if (Object.keys(locales).indexOf(defaultLocale) === -1) {
      throw new Error(ERR_MISSING_DICTIONARY_FOR_DEFAULT_LOCALE);
    }

    const i18n: FastifyPolyglot = new Polyglot({
      phrases: locales[defaultLocale],
      locale: defaultLocale,
    });

    i18n.locales = locales;
    i18n.defaultLocale = defaultLocale;

    fastify.decorate('i18n', i18n);
  } catch (error: any) {
    fastify.log.error(error);
  }
};
export default fp(plugin);
