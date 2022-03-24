import { OdataQuery } from "./OdataQuery";
import { ORequest } from "./ORequest";

describe("applyQuery", () => {
  it('uses "application/x-www-form-urlencoded" encoding by default', () => {
    expect(new ORequest(new URL("https://example.com"), {}).applyQuery({
      $top: 4,
      $filter: "foo eq bar or startsWith(foo, 'baz')",
    }).url.href).toBe("https://example.com/?%24top=4&%24filter=foo+eq+bar+or+startsWith%28foo%2C+%27baz%27%29");
  });

  it("uses specifc applyQuery function", () => {
    const encodeComponent =
      (str: string) => encodeURIComponent(str)
        .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

    // custom applyQuery will encode spaces in query parameters as "%20" instead of "+"
    const applyQuery = (url: URL, query: OdataQuery) => {
      url.search = Object.entries(query)
        .map(([key, value]) => `${encodeComponent(key)}=${encodeComponent(value)}`).join("&");
      return url;
    };

    expect(new ORequest(new URL("https://example.com"), {}).applyQuery({
      $top: 4,
      $filter: "foo eq bar or startsWith(foo, 'baz')",
    }, applyQuery).url.href)
      .toBe("https://example.com/?%24top=4&%24filter=foo%20eq%20bar%20or%20startsWith%28foo%2C%20%27baz%27%29");
  });
});
