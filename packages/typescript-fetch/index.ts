import { Jsonifiable, Jsonify } from "type-fest";

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
type URLFormat<Pathname extends PathnameFormat> =
  `${string}://${string}${Pathname}`;

export interface TypedURLSearchParams<Key extends string>
  extends globalThis.URLSearchParams {
  append(name: Key, value: string): void;
  delete(name: Key): void;
  get(name: Key): string | null;
  getAll(name: Key): string[];
  has(name: Key): boolean;
  set(name: Key, value: string): void;
}

export interface TypedURL<
  Pathname extends PathnameFormat,
  SearchParamKeys extends string
> {
  href: URLFormat<Pathname>;
  searchParams: TypedURLSearchParams<SearchParamKeys>;
}

export function typedURL<Request extends TypedRequest<any, any>>(
  request: Request
) {
  return new URL(request.url) as Request extends TypedRequest<
    any,
    infer Pathname,
    infer SearchParamKeys
  >
    ? TypedURL<inferPath<Pathname>, SearchParamKeys>
    : unknown;
}

export interface TypedFormData<Key extends string> extends globalThis.FormData {
  append(key: Key, value: FormDataEntryValue, fileName?: string): void;
  delete(key: Key): void;
  get(key: Key): FormDataEntryValue | null;
  getAll(key: Key): FormDataEntryValue[];
  has(key: Key): boolean;
  set(key: Key, value: FormDataEntryValue, fileName?: string): void;
}

export interface TypedRequest<
  Method extends RequestMethod,
  Pathname extends string,
  _SearchParamKeys extends string = string,
  FormDataKeys extends string = string
> extends globalThis.Request {
  method: Method;
  url: URLFormat<inferPath<Pathname>>;
  formData(): Promise<TypedFormData<FormDataKeys>>;
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
    : RequestInfo extends URLFormat<inferPath<infer Pathname>>
    ? Pathname
    : RequestInfo extends PathnameFormat
    ? RequestInfo
    : PathnameFormat;

type inferRequestInfo<Request extends TypedRequest<any, any>> =
  Request extends TypedRequest<any, infer Pathname>
    ? Request["url"] | inferPath<Pathname>
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

export interface TypedResponseInit<Status extends number>
  extends globalThis.ResponseInit {
  status?: Status;
}

export function json<Data extends Jsonifiable, Status extends number>(
  data: Data,
  init: Status
): TypedResponseJSON<Status, Jsonify<Data>>;
export function json<Data extends Jsonifiable, Status extends number>(
  data: Data,
  init: TypedResponseInit<Status>
): TypedResponseJSON<Status, Jsonify<Data>>;
export function json<Data extends Jsonifiable, Status extends 200>(
  data: Data,
  init?: never
): TypedResponseJSON<Status, Jsonify<Data>>;
export function json<Data extends Jsonifiable, Status extends number>(
  data: Data,
  init?: globalThis.ResponseInit | Status
): TypedResponseJSON<Status, Jsonify<Data>> {
  init = (typeof init === "number" ? { status: init } : init) || {};
  const headers = new Headers(init?.headers);
  init.headers = headers;
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), init) as TypedResponseJSON<
    Status,
    Jsonify<Data>
  >;
}
