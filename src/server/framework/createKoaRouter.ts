import Router, { RouterParamContext } from '@koa/router';
import {
  DefaultContext,
  DefaultState,
  Middleware,
  ParameterizedContext,
} from 'koa';
import bodyParser from '@koa/bodyparser';
import { AsyncLocalStorage } from 'async_hooks';
import { ApiRoute } from '.';

export type HandlerContext = ParameterizedContext<
  DefaultState,
  DefaultContext & RouterParamContext<DefaultState, DefaultContext>,
  any
>;

const asyncLocalStorage = new AsyncLocalStorage<HandlerContext>();

export function createKoaRouter(routes: readonly ApiRoute[]) {
  const router = new Router();
  // bodyParser parses incoming JSON request bodies
  // and puts them in ctx.request.body
  router.use(bodyParser());

  for (const route of routes) {
    router.register(route.path, [route.method], wrapHandler(route));
  }

  return router;
}

function wrapHandler(
  route: ApiRoute,
): Middleware<DefaultState, DefaultContext & RouterParamContext> {
  return async (ctx) => {
    await asyncLocalStorage.run(ctx, async () => {
      ctx.body = await route.handler({
        ...ctx.params,
        ...ctx.request.body,
      });
    });
  };
}

/**
 * Gets the koa request context for the current request. If you are getting the
 * "Could not find handler context" error, the async context is getting lost somehow,
 * and you should move the `getContext` call to the top of the handler.
 * @returns the koa request context for the current request
 */
export function getContext(): HandlerContext {
  const context = asyncLocalStorage.getStore();

  if (!context) {
    throw new Error('Could not find handler context');
  }

  return context;
}
