import { ApplyQuery } from "./OdataConfig";
import { OdataQuery } from "./OdataQuery";

const defaultApplyQuery: ApplyQuery = (url, query) => {
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      if (url.searchParams.get(key)) {
        url.searchParams.set(key, query[key]);
      } else {
        url.searchParams.append(key, query[key]);
      }
    }
  }

  return url;
};

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

  public applyQuery(query: OdataQuery, applyQueryFn = defaultApplyQuery) {
    applyQueryFn(this.url, query);
    return this;
  }
}
