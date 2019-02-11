import { OdataQuery } from "./OdataQuery";

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

  public applyQuery(query?: OdataQuery) {
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        this.url.searchParams.append(key, query[key]);
      }
    }
  }
}
