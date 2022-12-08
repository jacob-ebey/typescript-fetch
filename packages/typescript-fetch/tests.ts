import { typedRequest, type TypedRequest, type inferPath } from ".";

declare function assertRequest<
  TR extends TypedRequest<any, any>,
  TR2 extends TR = TR
>(_request: TR2): void;

export function fetchTests() {
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
}
