import {
  typeRequest,
  typedRequest,
  type TypedRequest,
  type TypedResponse,
  type TypedResponseJSON,
} from "typescript-fetch";

import { createHandler, type DataFunction } from ".";

declare function assertResponse<
  TR extends TypedResponse<any>,
  TR2 extends TR = TR
>(_request: TR2): void;

export async function handlerTests() {
  const routes = [
    {
      id: "/",
      path: "/",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", "/">,
        TypedResponse<200>
      >,
    },
    {
      id: "test",
      path: "test",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", "test">,
        TypedResponse<201>
      >,
    },
    {
      id: "test/:param",
      path: "test/:param",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", "test/:param">,
        TypedResponse<202>
      >,
      action: null as unknown as DataFunction<
        TypedRequest<"POST", "test/:param">,
        TypedResponse<203>
      >,
    },
    {
      id: ":param",
      path: ":param",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", ":param">,
        TypedResponseJSON<204, { test: string }>
      >,
    },
  ];

  const handler = createHandler(routes);

  let a = await handler(typeRequest("/"));
  //  ^?
  assertResponse<TypedResponse<200>>(a);

  let b = await handler(typeRequest("/test"));
  //  ^?
  assertResponse<TypedResponse<201>>(b);

  let c = await handler(
    //^?
    typedRequest<TypedRequest<"GET", "/test/:param">>("/test/fdsa")
  );
  assertResponse<TypedResponse<202>>(c);

  let d = await handler(
    //^?
    typedRequest<TypedRequest<"POST", "/test/:param">>("/test/fdsa", {
      method: "POST",
    })
  );
  assertResponse<TypedResponse<203>>(d);

  let e = await handler(typedRequest<TypedRequest<"GET", ":param">>("/json"));
  //  ^?
  assertResponse<TypedResponseJSON<204, { test: string }>>(e);
}
