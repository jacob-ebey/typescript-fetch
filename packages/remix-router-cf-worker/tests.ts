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
      id: "test",
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
      id: "test",
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
      id: "test",
      path: ":param",
      loader: null as unknown as DataFunction<
        TypedRequest<"GET", ":param">,
        TypedResponseJSON<204, { test: string }>
      >,
    },
  ];

  const handler = createHandler(routes);

  assertResponse<TypedResponse<200>>(await handler(typeRequest("/")));
  assertResponse<TypedResponse<201>>(await handler(typeRequest("/test")));
  assertResponse<TypedResponse<202>>(
    await handler(
      typedRequest<TypedRequest<"GET", "/test/:param">>("/test/fdsa")
    )
  );
  assertResponse<TypedResponse<203>>(
    await handler(
      typedRequest<TypedRequest<"POST", "/test/:param">>("/test/fdsa", {
        method: "POST",
      })
    )
  );
  // TODO: Figure out why this is falling into the `/` case
  // assertResponse<TypedResponseJSON<204, { test: string }>>(
  //   handler(typedRequest<TypedRequest<"GET", ":param">>("/json"))
  // );
}
