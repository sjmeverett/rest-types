import { Schema } from 'zod';

export interface HandlerContext {
  status: number;
}

export type ApiRouteHandler<Input = any, Output = any> = (
  ctx: HandlerContext,
  input: Input,
) => Promise<Output>;

/**
 * Represents the definition of an API method.
 */
export interface ApiRoute<
  Method extends string = string,
  Path extends string = string,
  Input = any,
  Output = any,
> {
  method: Method;
  path: Path;
  input: Schema<Input>;
  output: Schema<Output>;
}

export interface ApiRouteWithHandler<
  Method extends string = string,
  Path extends string = string,
  Input = any,
  Output = any,
> extends ApiRoute<Method, Path, Input, Output> {
  handler: ApiRouteHandler<Input, Output>;
}

interface RouteResult<
  Method extends string,
  Path extends string,
  Input,
  Output,
> {
  handler(
    handler: ApiRouteHandler<Input, Output>,
  ): ApiRouteWithHandler<Method, Path, Input, Output>;
}

export function route<
  Path extends string,
  ParamName extends string,
  Input extends Record<ParamName, any>,
  Output,
>(
  route: ApiRoute<'get', `${Path}/:${ParamName}`, Input, Output>,
): RouteResult<'get', `${Path}/${string}`, Input, Output>;
export function route<
  Method extends string,
  Path extends string,
  Input,
  Output,
>(
  route: ApiRoute<Method, Path, Input, Output>,
): RouteResult<Method, Path, Input, Output>;
export function route(route: ApiRoute) {
  return {
    handler(handler: ApiRouteHandler) {
      return { ...route, handler } as any;
    },
  };
}

export type inferRoutes<Routes extends readonly ApiRoute[]> =
  Routes extends readonly (infer R)[] ? R : never;
