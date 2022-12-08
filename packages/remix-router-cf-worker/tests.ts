import {
  typeRequest,
  typedRequest,
  type inferPath,
  type TypedRequest,
  type TypedResponse,
  type TypedResponseJSON,
} from "typescript-fetch";

import { createHandler, type DataFunction } from ".";

declare function assertResponse<
  TR extends TypedResponse<any>,
  TR2 extends TR = TR
>(_request: TR2): void;

export function handlerTests() {
  const routes = [
    {
      id: "test",
      path: "/",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", inferPath<"/">>,
        TypedResponse<200>
      >,
    },
    {
      id: "test",
      path: "test",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", inferPath<"test">>,
        TypedResponse<201>
      >,
    },
    {
      id: "test",
      path: "test/:param",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", inferPath<`test/:param`>>,
        TypedResponse<202>
      >,
      action: null as unknown as DataFunction<
        TypedRequest<"POST", inferPath<`test/:param`>>,
        TypedResponse<203>
      >,
    },
    {
      id: "test",
      path: ":param",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", inferPath<`:param`>>,
        TypedResponseJSON<204, { test: string }>
      >,
    },
  ];

  const handler = createHandler(routes);

  assertResponse<TypedResponse<200>>(handler(typeRequest("/")));
  assertResponse<TypedResponse<201>>(handler(typeRequest("/test")));
  assertResponse<TypedResponse<202>>(
    handler(
      typedRequest<TypedRequest<"GET", inferPath<`/test/:param`>>>("/test/fdsa")
    )
  );
  assertResponse<TypedResponse<203>>(
    handler(
      typedRequest<TypedRequest<"POST", inferPath<`/test/:param`>>>(
        "/test/fdsa",
        { method: "POST" }
      )
    )
  );
  // TODO: Figure out why this is falling into the `/` case
  // assertResponse<TypedResponseJSON<204, { test: string }>>(
  //   handler(typedRequest<TypedRequest<"GET", inferPath<`:param`>>>("/json"))
  // );
}
