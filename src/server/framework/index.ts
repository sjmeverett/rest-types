import { Schema, ZodTypeDef } from 'zod';

/**
 * Handlers are as pure as possible, so that server types don't end up in
 * the client types. Context should be dealt with using a AsyncLocalStorage.
 */
export type ApiRouteHandler<Input = any, Output = any> = (
  input: Input,
) => Promise<Output>;

/**
 * Represents the definition of an API method.
 */
export interface ApiRouteSpec<
  Method extends string = string,
  Path extends string = string,
  InputIn = any,
  InputOut = InputIn,
  OutputIn = any,
  OutputOut = OutputIn,
> {
  method: Method;
  path: Path;
  input: Schema<InputOut, ZodTypeDef, InputIn>;
  output: Schema<OutputOut, ZodTypeDef, OutputIn>;
}

export interface ApiRoute<
  Method extends string = string,
  Path extends string = string,
  Input = any,
  Output = any,
> {
  method: Method;
  path: Path;
  handler: ApiRouteHandler<Input, Output>;
}

/**
 * We need to specify the handler separately from the ApiRouteSpec so that
 * the Input and Output types get locked to the validator types rather than
 * the actual return type of the handler (which might be your DB object
 * for example) -- so we have route() return a handler() function that allows
 * you to specify the handler.
 */
interface RouteResult<
  Method extends string,
  Path extends string,
  InputIn = any,
  InputOut = InputIn,
  OutputIn = any,
  OutputOut = OutputIn,
> {
  handler(
    handler: ApiRouteHandler<InputOut, OutputIn>,
  ): ApiRoute<Method, Path, InputIn, OutputOut>;
}

export interface ValidationIssue {
  code: string;
  message: string;
  path: (string | number)[];
}

export class ValidationError extends Error {
  public readonly statusCode: number;

  constructor(
    source: 'input' | 'output',
    public readonly issues: ValidationIssue[],
  ) {
    super(`There was a validation issue with the ${source}`);
    this.statusCode = source === 'input' ? 400 : 500;
  }
}

export function route<
  Path extends string,
  ParamName extends string,
  InputIn,
  InputOut extends Record<ParamName, any>,
  OutputIn,
  OutputOut,
>(
  route: ApiRouteSpec<
    'get',
    `${Path}/:${ParamName}`,
    InputIn,
    InputOut,
    OutputIn,
    OutputOut
  >,
): RouteResult<
  'get',
  `${Path}/${string}`,
  InputIn,
  InputOut,
  OutputIn,
  OutputOut
>;
export function route<
  Method extends string,
  Path extends string,
  InputIn,
  InputOut,
  OutputIn,
  OutputOut,
>(
  route: ApiRouteSpec<Method, Path, InputIn, InputOut, OutputIn, OutputOut>,
): RouteResult<Method, Path, InputIn, InputOut, OutputIn, OutputOut>;
export function route<
  Method extends string,
  Path extends string,
  InputIn,
  InputOut,
  OutputIn,
  OutputOut,
>(route: ApiRouteSpec<Method, Path, InputIn, InputOut, OutputIn, OutputOut>) {
  return {
    handler(handler: ApiRouteHandler) {
      return {
        method: route.method,
        path: route.path,

        async handler(input: unknown) {
          const inputValidation = route.input.safeParse(input);

          if (!inputValidation.success) {
            throw new ValidationError('input', inputValidation.error.errors);
          }

          const output = await handler(inputValidation.data);

          // validate the output
          const outputValidation = route.output.safeParse(output);

          if (!outputValidation.success) {
            throw new ValidationError('output', outputValidation.error.errors);
          }

          return outputValidation.data;
        },
      };
    },
  };
}

export type inferRoutes<Routes extends readonly ApiRoute[]> = Routes[number];
