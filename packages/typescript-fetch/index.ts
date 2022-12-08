export type RequestMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

type inferPart<Part extends string> = Part extends `:${string}/${infer Rest}`
  ? `${string}/${_inferPath<Rest>}`
  : Part extends "*"
  ? `${string}`
  : Part extends `:${string}`
  ? `${string}`
  : Part;

type _inferPath<FullPath extends string> =
  FullPath extends `${infer Part}/${infer Rest}`
    ? `${inferPart<Part>}/${_inferPath<Rest>}`
    : inferPart<FullPath>;

export type inferPath<FullPath extends string> = FullPath extends "/"
  ? "/"
  : FullPath extends `/${string}`
  ? _inferPath<FullPath>
  : `/${_inferPath<FullPath>}`;

export type PathnameFormat = `/${string}` | `/`;

// TODO: Could be expanded to support things like `file:///` `file:///C:/` `hello:world`
export type URLFormat<Pathname extends PathnameFormat> =
  `${string}://${string}${Pathname}`;

export interface TypedRequest<
  Method extends RequestMethod,
  Pathname extends PathnameFormat
> extends globalThis.Request {
  method: Method;
  url: URLFormat<inferPath<Pathname>>;
}

export type TypedRequestInfo<Pathname extends PathnameFormat> =
  | URLFormat<Pathname>
  | Pathname;

export interface TypedRequestInit<Method extends RequestMethod | undefined>
  extends globalThis.RequestInit {
  method?: Method extends undefined ? "GET" : Method;
}

type inferMethod<RequestInit extends globalThis.RequestInit | undefined> =
  RequestInit extends undefined
    ? "GET"
    : RequestInit extends TypedRequestInit<infer Method>
    ? Method extends undefined
      ? "GET"
      : Method
    : "GET";

type inferPathnameFromRequestInfo<RequestInfo extends globalThis.RequestInfo> =
  RequestInfo extends `${"http" | "https"}://${string}/${infer Pathname}`
    ? `/${Pathname}`
    : RequestInfo extends URLFormat<infer Pathname>
    ? Pathname
    : RequestInfo extends PathnameFormat
    ? RequestInfo
    : PathnameFormat;

type inferRequestInfo<Request extends TypedRequest<any, any>> =
  Request extends TypedRequest<any, infer Pathname>
    ? Request["url"] | Pathname
    : Request["url"];

type inferRequestInit<Request extends TypedRequest<any, any>> =
  TypedRequestInit<Request["method"]>;

export function typeRequest<
  RequestInfo extends TypedRequestInfo<PathnameFormat>,
  RequestInit extends TypedRequestInit<RequestMethod> | undefined = undefined
>(
  input: RequestInfo,
  init?: RequestInit | undefined
): TypedRequest<
  inferMethod<RequestInit>,
  inferPathnameFromRequestInfo<RequestInfo>
> {
  return new Request(input, init) as TypedRequest<
    inferMethod<RequestInit>,
    inferPathnameFromRequestInfo<RequestInfo>
  >;
}

export function typedRequest<Request extends TypedRequest<any, any>>(
  input: inferRequestInfo<Request>,
  init?: inferRequestInit<Request>
): Request {
  return new Request(input, init) as Request &
    TypedRequest<
      inferMethod<RequestInit>,
      inferPathnameFromRequestInfo<RequestInfo>
    >;
}

export interface TypedResponse<Status extends number>
  extends Omit<globalThis.Response, "status"> {
  status: Status;
}
export interface TypedResponseJSON<Status extends number, JsonData>
  extends Omit<TypedResponse<Status>, "json"> {
  json(): Promise<JsonData>;
}
