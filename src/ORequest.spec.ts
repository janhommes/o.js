import { ORequest } from "./ORequest";
import buildQuery from "odata-query";

describe("applyQuery", () => {
  it('does not use "application/x-www-form-urlencoded" encoding', () => {
    expect(
      new ORequest(new URL("https://example.com"), {}).applyQuery({
        $top: 4,
        $filter: "foo eq bar or startsWith(foo, 'baz')",
      }).url.href
    )
      // Space is encoded as "%20" and not "+"
      .toBe(
        "https://example.com/?%24top=4&%24filter=foo%20eq%20bar%20or%20startsWith%28foo%2C%20%27baz%27%29"
      );
  });

  it("considers existing query parameters, overwrites with entries from queries", () => {
    expect(
      new ORequest(
        new URL(
          "https://example.com?$top=5&$orderby=Some+Field&$search=some%20term"
        ),
        {}
      ).applyQuery({
        $top: 4,
        $filter: "foo eq bar or startsWith(foo, 'baz')",
      }).url.href
    ).toBe(
      "https://example.com/?%24top=4&%24filter=foo%20eq%20bar%20or%20startsWith%28foo%2C%20%27baz%27%29&%24orderby=Some%20Field&%24search=some%20term"
    );
  });

  it("Apply query accepts a string as URL parameters", () => {
    const filter = {
      not: {
        and: [{ SomeProp: 1 }, { AnotherProp: 2 }],
      },
    };
    expect(
      new ORequest(new URL("https://example.com"), {}).applyStringQuery(
        buildQuery({ filter }), {}
      ).url.href
    ).toBe(
      "https://example.com/?%24filter=not%28%28%28SomeProp%20eq%201%29%20and%20%28AnotherProp%20eq%202%29%29%29"
    );
  });
});
