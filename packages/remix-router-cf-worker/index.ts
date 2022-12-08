import {
  unstable_createStaticHandler,
  type AgnosticNonIndexRouteObject,
} from "@remix-run/router";
import { TypedRequest } from "typescript-fetch";

export type DataFunctionArgs<Request extends globalThis.Request> = {
  request: Request;
};
export type DataFunction<
  Request extends globalThis.Request,
  Response extends globalThis.Response
> = (args: DataFunctionArgs<Request>) => Promise<Response>;

type ValidateShape<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

type inferTypedResponseFromDataFuncs<
  DataFunc extends DataFunction<any, any>,
  Request extends TypedRequest<any, any>
> = Request extends TypedRequest<infer Method, infer Pathname>
  ? DataFunc extends DataFunction<infer DataRequest, infer Response>
    ? DataRequest extends TypedRequest<Method, Pathname>
      ? Response
      : never
    : never
  : never;

export type RouteConfig<
  Action extends DataFunction<any, any> | undefined,
  Loader extends DataFunction<any, any> | undefined
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

type inferActionFunctionFromConfig<Config extends RouteConfig<any, any>> =
  Config extends { action: infer DataFunc }
    ? DataFunc extends DataFunction<any, any>
      ? DataFunc
      : never
    : never;
type inferLoaderFunctionFromConfig<Config extends RouteConfig<any, any>> =
  Config extends { loader: infer DataFunc }
    ? DataFunc extends DataFunction<any, any>
      ? DataFunc
      : never
    : never;

type inferDataFunctionsFromRouteConfig<Config extends RouteConfig<any, any>> =
  | inferActionFunctionFromConfig<Config>
  | inferLoaderFunctionFromConfig<Config>;

export function createHandler<Config extends RouteConfig<any, any>>(
  routes: Config[]
) {
  type DataFuncs = inferDataFunctionsFromRouteConfig<Config>;

  // TODO: Implement the handler
  const handler = unstable_createStaticHandler(
    routes.map(({ action, loader, ...rest }) => ({
      ...rest,
    }))
  );

  return <Request extends TypedRequest<any, any>>(
    request: Request
  ): inferTypedResponseFromDataFuncs<DataFuncs, Request> => {
    type InferredType = inferTypedResponseFromDataFuncs<DataFuncs, Request>;

    return null as unknown as InferredType;
  };
}
