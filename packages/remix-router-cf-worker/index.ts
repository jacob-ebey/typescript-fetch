import {
  isRouteErrorResponse,
  unstable_createStaticHandler,
  type AgnosticNonIndexRouteObject,
  type Params,
} from "@remix-run/router";
import { json, TypedRequest, TypedResponse } from "typescript-fetch";

export * from "typescript-fetch";

export type DataFunctionArgs<
  Request extends globalThis.Request,
  RequestContext = unknown
> = {
  context: RequestContext;
  params: Params;
  request: Request;
};
export type DataFunction<
  Request extends TypedRequest<any, any>,
  Response extends globalThis.Response,
  RequestContext = unknown
> = (args: DataFunctionArgs<Request, RequestContext>) => Promise<Response>;

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

export type inferServiceType<Config extends RouteConfig<any, any, any>> = {
  fetch<Request extends TypedRequest<any, any>>(
    request: Request
  ): Promise<
    inferTypedResponseFromDataFuncs<
      inferDataFunctionsFromRouteConfig<Config>,
      Request
    >
  >;
};

type inferActionHandlerConfig<
  Config extends RouteConfig<any, any, any>,
  RequestContext
> = Config extends { action: infer DataFunc }
  ? DataFunc extends DataFunction<infer Request, infer Response, any>
    ? Handler<Request, Response, RequestContext>
    : Handler<any, any, any>
  : Handler<any, any, any>;
type inferLoaderHandlerConfig<
  Config extends RouteConfig<any, any, any>,
  RequestContext
> = Config extends { loader: infer DataFunc }
  ? DataFunc extends DataFunction<infer Request, infer Response, any>
    ? Handler<Request, Response, RequestContext>
    : Handler<any, any, any>
  : Handler<any, any, any>;
type inferHandlerFromConfig<
  Config extends RouteConfig<any, any, any>,
  RequestContext
> =
  | inferActionHandlerConfig<Config, RequestContext>
  | inferLoaderHandlerConfig<Config, RequestContext>;

type inferHandler<
  Config extends RouteConfig<any, any, RequestContext>,
  RequestContext
> = inferHandlerFromConfig<Config, RequestContext>;

class Hidden {}

export type Matches<T, S> = [T] extends [S]
  ? [S] extends [T]
    ? [Hidden] extends [T]
      ? [Hidden] extends [S]
        ? true // For <any, any>
        : false // For <any, S>
      : [Hidden] extends [S]
      ? false // For <T, any>
      : true // For <T === S>
    : false // For <T sub S>
  : false; // For <T !== S> or <S sub T>

type Handler<
  Request extends TypedRequest<any, any>,
  Response extends TypedResponse<any>,
  RequestContext
> = <T extends globalThis.Request>(
  request: T,
  requestContext?: RequestContext
) => Matches<typeof request, Request> extends true ? Promise<Response> : never;

export function createHandler<
  Config extends RouteConfig<any, any, RequestContext>,
  RequestContext = unknown
>(routes: Config[]): inferHandler<Config, RequestContext> {
  const handler = unstable_createStaticHandler(routes);

  const wrappedHandler = async (
    request: globalThis.Request,
    requestContext?: unknown
  ) => {
    try {
      const context = await handler.queryRoute(request, {
        requestContext,
      });

      return context as any;
    } catch (reason) {
      if (isResponse(reason)) {
        return reason as any;
      }
      if (isRouteErrorResponse(reason)) {
        return json(reason.data, {
          status: reason.status,
        }) as any;
      }
      throw reason;
    }
  };

  return wrappedHandler as inferHandler<Config, RequestContext>;
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
