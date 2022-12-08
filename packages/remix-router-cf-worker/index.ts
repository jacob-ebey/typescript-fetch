import {
  unstable_createStaticHandler,
  type AgnosticNonIndexRouteObject,
} from "@remix-run/router";
import { TypedRequest } from "typescript-fetch";

export * from "typescript-fetch";

export type DataFunctionArgs<
  Request extends globalThis.Request,
  RequestContext = unknown
> = {
  context: RequestContext;
  request: Request;
};
export type DataFunction<
  Request extends globalThis.Request,
  Response extends globalThis.Response,
  RequestContext = unknown
> = (args: DataFunctionArgs<Request, RequestContext>) => Promise<Response>;

type ValidateShape<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

type inferTypedResponseFromDataFuncs<
  DataFunc extends DataFunction<any, any, any>,
  Request extends TypedRequest<any, any>
> = Request extends TypedRequest<infer Method, infer Pathname>
  ? DataFunc extends DataFunction<infer DataRequest, infer Response, any>
    ? DataRequest extends TypedRequest<Method, Pathname>
      ? Response
      : never
    : never
  : never;

export type RouteConfig<
  Action extends DataFunction<any, any, RequestContext> | undefined,
  Loader extends DataFunction<any, any, RequestContext> | undefined,
  RequestContext
> = Omit<
  AgnosticNonIndexRouteObject,
  | "children"
  | "index"
  | "hasErrorBoundary"
  | "shouldRevalidate"
  | "handle"
  | "loader"
  | "action"
  | "path"
> & {
  path: string;
  action?: Action;
  loader?: Loader;
};

type inferActionFunctionFromConfig<Config extends RouteConfig<any, any, any>> =
  Config extends { action: infer DataFunc }
    ? DataFunc extends DataFunction<any, any, any>
      ? DataFunc
      : never
    : never;
type inferLoaderFunctionFromConfig<Config extends RouteConfig<any, any, any>> =
  Config extends { loader: infer DataFunc }
    ? DataFunc extends DataFunction<any, any, any>
      ? DataFunc
      : never
    : never;

type inferDataFunctionsFromRouteConfig<
  Config extends RouteConfig<any, any, any>
> =
  | inferActionFunctionFromConfig<Config>
  | inferLoaderFunctionFromConfig<Config>;

export function createHandler<
  Config extends RouteConfig<any, any, RequestContext>,
  RequestContext
>(routes: Config[], requestContext?: RequestContext) {
  type DataFuncs = inferDataFunctionsFromRouteConfig<Config>;

  // TODO: Implement the handler
  const handler = unstable_createStaticHandler(routes);

  return async <Request extends TypedRequest<any, any>>(
    request: Request,
    requestContext?: RequestContext
  ): Promise<inferTypedResponseFromDataFuncs<DataFuncs, Request>> => {
    type InferredType = inferTypedResponseFromDataFuncs<DataFuncs, Request>;

    const context = await handler.queryRoute(request, {
      requestContext,
    });

    if (isResponse(context)) {
      return context as InferredType;
    }

    throw context;
  };
}

function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}
