import { ORequest } from "./ORequest";

describe("applyQuery", () => {
  it('does not use "application/x-www-form-urlencoded" encoding', () => {
    expect(new ORequest(new URL("https://example.com"), {}).applyQuery({
      $top: 4,
      $filter: "foo eq bar or startsWith(foo, 'baz')",
    }).url.href)
      // Space is encoded as "%20" and not "+"
      .toBe("https://example.com/?%24top=4&%24filter=foo%20eq%20bar%20or%20startsWith%28foo%2C%20%27baz%27%29");
  });

  it("considers existing query parameters, overwrites with entries from queries", () => {
    expect(new ORequest(new URL("https://example.com?$top=5&$orderby=Some+Field&$search=some%20term"), {}).applyQuery({
      $top: 4,
      $filter: "foo eq bar or startsWith(foo, 'baz')",
    }).url.href)
      .toBe("https://example.com/?%24top=4&%24filter=foo%20eq%20bar%20or%20startsWith%28foo%2C%20%27baz%27%29&%24orderby=Some%20Field&%24search=some%20term");
  });
});
