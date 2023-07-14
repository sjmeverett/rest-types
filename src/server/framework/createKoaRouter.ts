import Router, { RouterParamContext } from '@koa/router';
import { DefaultContext, DefaultState, Middleware } from 'koa';
import bodyParser from '@koa/bodyparser';
import { ApiRouteWithHandler, HandlerContext } from './index';

export function createKoaRouter(routes: readonly ApiRouteWithHandler[]) {
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
  route: ApiRouteWithHandler,
): Middleware<DefaultState, DefaultContext & RouterParamContext> {
  return async (ctx) => {
    ctx.body = await callRoute(ctx, route, {
      ...ctx.params,
      ...ctx.request.body,
    });
  };
}

export async function callRoute(
  ctx: HandlerContext,
  route: ApiRouteWithHandler,
  input: any,
) {
  // validate the input
  const inputValidation = route.input.safeParse(input);

  if (!inputValidation.success) {
    throw new Error(
      'Input validation failed: ' + inputValidation.error.message,
    );
  }

  const output = await route.handler(ctx, inputValidation.data);

  // validate the output
  const outputValidation = route.output.safeParse(output);

  if (!outputValidation.success) {
    throw new Error(
      'Output validation failed: ' + outputValidation.error.message,
    );
  }

  return outputValidation.data;
}
