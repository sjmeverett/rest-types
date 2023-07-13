import { Schema } from "zod";

// didn't want to clog this example up by implementing all of these
// but it's an easy fix
type HttpMethod = "get" | "post";

/**
 * Represents the definition of an API method.
 */
export interface ApiMethodSpec<Input, Output> {
  input: Schema<Input>;
  output: Schema<Output>;
  handler: (input: Input) => Promise<Output>;
}

/**
 * Represents a whole API. This is what you'd export from your api server package.
 */
type AnyApi = Record<HttpMethod, Record<string, ApiMethodSpec<any, any>>>;

type MergeApi<
  Api extends AnyApi,
  Method extends HttpMethod,
  Path extends string,
  Spec extends ApiMethodSpec<any, any>
> = {
  [K in keyof Api]: K extends Method ? Record<Path, Spec> & Api[K] : Api[K];
};

/**
 * Non-exported class for building a typed API definition.
 */
class RestApi<Api extends AnyApi> {
  constructor(public definition: Api) {}

  /**
   * Adds a get method to the API.
   * @param path the path of the method to add
   * @param spec the specification of the method
   */
  get<Path extends string, Id extends string, Output>(
    path: `${Path}/:${Id}`,
    spec: ApiMethodSpec<{}, Output>
  ): RestApi<
    MergeApi<Api, "get", `${Path}/${string}`, ApiMethodSpec<{}, Output>>
  >;
  /**
   * Adds a get method with an path param to the API.
   * @param path the path, including a path param at the end (':foo')
   * @param spec the specification of the method to add
   */
  get<Path extends string, Output>(
    path: Path,
    spec: ApiMethodSpec<{}, Output>
  ): RestApi<MergeApi<Api, "get", Path, ApiMethodSpec<{}, Output>>>;
  get<Path extends string, Input, Output>(
    path: Path,
    spec: ApiMethodSpec<Input, Output>
  ) {
    return this.route("get", path, spec);
  }

  /**
   * Adds a post method to the API.
   * @param path the path of the method to add
   * @param spec the specification of the method
   * @returns
   */
  post<Path extends string, Input, Output>(
    path: Path,
    spec: ApiMethodSpec<Input, Output>
  ) {
    return this.route("post", path, spec);
  }

  private route<Method extends HttpMethod, Path extends string, Input, Output>(
    method: Method,
    path: Path,
    spec: ApiMethodSpec<Input, Output>
  ) {
    return new RestApi<
      MergeApi<Api, Method, Path, ApiMethodSpec<Input, Output>>
    >({
      ...this.definition,
      [method]: {
        ...this.definition[method],
        [path]: spec,
      },
    } as any);
  }
}

export function createApi() {
  return new RestApi({ get: {}, post: {} });
}

/**
 * Given the output from createApi().get(...).post(...) etc, returns the type
 * that represents the API definition.
 */
export type inferApiType<Api extends RestApi<any>> = Api extends RestApi<
  infer R
>
  ? R
  : never;

/**
 * Get the input type for a given API method.
 */
export type inferInputType<
  Api extends AnyApi,
  Method extends HttpMethod,
  Path extends keyof Api[Method]
> = Api[Method][Path] extends ApiMethodSpec<infer R, any> ? R : never;

/**
 * Gets the output type for a given API method.
 */
export type inferOutputType<
  Api extends AnyApi,
  Method extends HttpMethod,
  Path extends keyof Api[Method]
> = Api[Method][Path] extends ApiMethodSpec<any, infer R> ? R : never;

/**
 * A typed client for a RESTful API.
 */
export class ApiClient<Api extends AnyApi> {
  constructor(private baseUrl: string) {}

  async get<Path extends keyof Api["get"] & string>(
    url: Path
  ): Promise<inferOutputType<Api, "get", Path>> {
    return this.request("get", url);
  }

  async post<Path extends keyof Api["post"] & string>(
    url: Path,
    input: inferInputType<Api, "post", Path>
  ): Promise<inferOutputType<Api, "post", Path>> {
    return this.request("post", url, input);
  }

  private async request(method: string, url: string, input?: any) {
    const request: RequestInit = {
      method,
      headers: {
        "Content-type": "application/json",
      },
    };

    if (input) {
      request.body = JSON.stringify(input);
    }

    const response = await fetch(this.baseUrl + url, request);

    return await response.json();
  }
}
