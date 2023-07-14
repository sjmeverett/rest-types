import { ApiRoute } from '../server/framework';

type inferRoutesForMethod<
  Routes extends ApiRoute,
  Method extends string,
> = Extract<Routes, { method: Method }>;

export type inferRoute<
  Routes extends ApiRoute,
  Method extends string,
  Path extends string,
> = Extract<
  // this otherwise useless `extends any` guard causes the compiler to expand the union
  Routes extends any ? (Path extends Routes['path'] ? Routes : never) : never,
  { method: Method }
>;

/**
 * Get the input type for a given API route.
 */
export type inferInputType<
  Routes extends ApiRoute,
  Method extends string,
  Path extends string,
> = inferRoute<Routes, Method, Path> extends ApiRoute<any, any, infer R, any>
  ? R
  : never;

/**
 * Gets the output type for a given API route.
 */
export type inferOutputType<
  Routes extends ApiRoute,
  Method extends string,
  Path extends string,
> = inferRoute<Routes, Method, Path> extends ApiRoute<any, any, any, infer R>
  ? R
  : never;

/**
 * A typed client for a RESTful API.
 */
export class ApiClient<Routes extends ApiRoute> {
  constructor(private baseUrl: string) {}

  async get<Path extends inferRoutesForMethod<Routes, 'get'>['path']>(
    url: Path,
  ): Promise<inferOutputType<Routes, 'get', Path>> {
    return this.request('get', url);
  }

  async post<Path extends inferRoutesForMethod<Routes, 'post'>['path']>(
    url: Path,
    input: inferInputType<Routes, 'post', Path>,
  ): Promise<inferOutputType<Routes, 'post', Path>> {
    return this.request('post', url, input);
  }

  private async request(method: string, url: string, input?: any) {
    const request: RequestInit = {
      method,
      headers: {
        'Content-type': 'application/json',
      },
    };

    if (input) {
      request.body = JSON.stringify(input);
    }

    const response = await fetch(this.baseUrl + url, request);

    return await response.json();
  }
}
