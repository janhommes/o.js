import { OdataQuery } from "./OdataQuery";

const encodeURIComponentStrict = (str: string) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

export class ORequest {
  public url: URL;

  constructor(url: URL | string, public config: RequestInit) {
    if (typeof url === "string") {
      this.url = new URL(url);
    } else {
      this.url = url as URL;
    }
  }

  public get fetch() {
    const req = new Request(this.url.href, this.config);
    return fetch(req, this.config);
  }

  public applyStringQuery(query: string, configQuery: URLSearchParams | OdataQuery = {}) {
    const searchParams = new URLSearchParams(query);
    searchParams.forEach((value, key) => {
      if (!query.hasOwnProperty(key)) {
        configQuery[key] = value;
      }
    });
    return this.applyQuery(configQuery);
  }

  public applyQuery(query: OdataQuery = {}) {
    this.url.searchParams.forEach((value, key) => {
      if (!query.hasOwnProperty(key)) {
        query[key] = value;
      }
    });

    this.url.search = Object.entries(query)
      .map(
        ([key, value]) =>
          `${encodeURIComponentStrict(key)}=${encodeURIComponentStrict(value)}`
      )
      .join("&");
    return this;
  }
}
