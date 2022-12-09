import {
  typedRequest,
  typedURL,
  type TypedRequest,
  type TypedURL,
  type inferPath,
} from ".";

export function fetchTests() {
  function assertRequest<
    TR extends TypedRequest<any, any>,
    TR2 extends TR = TR
  >(_request: TR2) {}

  // Should be able to type basic Requests
  assertRequest<TypedRequest<"GET", "/test">>(typedRequest("https://.../test"));
  assertRequest<TypedRequest<"POST", "/test">>(
    typedRequest("https://.../test", { method: "POST" })
  );

  function assertPath<TP extends string>(_path: TP) {}

  assertPath<inferPath<"">>("/");
  assertPath<inferPath<"test">>("/test");
  assertPath<inferPath<":param">>("/...");
  assertPath<inferPath<":param/test">>("/.../test");
  assertPath<inferPath<"test/:param">>("/test/...");
  assertPath<inferPath<"/test/:param/test">>("/test/.../test");
  assertPath<inferPath<"/test/:param/test/:param2">>("/test/.../test/...");
  assertPath<inferPath<"*">>("/.../.../");
  assertPath<inferPath<"/">>("/");
  assertPath<inferPath<"/test">>("/test");
  assertPath<inferPath<"/:param">>("/...");
  assertPath<inferPath<"/:param/test">>("/.../test");
  assertPath<inferPath<"/test/:param">>("/test/...");
  assertPath<inferPath<"/test/:param/test">>("/test/.../test");
  assertPath<inferPath<"/test/:param/test/:param2">>("/test/.../test/...");
  assertPath<inferPath<"/*">>("/.../.../");

  function assertTypedURL<TU extends TypedURL<any, any>>(_url: TU) {}

  assertTypedURL<TypedURL<inferPath<"/">, never>>(
    typedURL(null as unknown as TypedRequest<"GET", "/">)
  );
  assertTypedURL<TypedURL<inferPath<"/">, "">>(
    typedURL(null as unknown as TypedRequest<"GET", "/">)
  );
  assertTypedURL<TypedURL<inferPath<"/">, "a">>(
    typedURL(null as unknown as TypedRequest<"GET", "/", "a">)
  );
  assertTypedURL<TypedURL<inferPath<"/">, "a" | "b">>(
    typedURL(null as unknown as TypedRequest<"GET", "/", "a" | "b">)
  );
}
