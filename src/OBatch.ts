import { OdataConfig } from "./OdataConfig";
import { OdataQuery } from "./OdataQuery";
import { ORequest } from "./ORequest";

const CRLF = "\r\n";

export class OBatch {
  // "" here prevents 'undefined' at start of body under some conditions.
  private batchBody = "";
  private batchUid;
  private batchConfig: OdataConfig;

  constructor(
    resources: ORequest[],
    config: OdataConfig,
    query?: OdataQuery,
    private changeset: boolean = false,
  ) {
    this.batchConfig = { ...config, ...config.batch };
    this.batchUid = this.getUid();
    (this.batchConfig.headers as Headers).set(
      "Content-Type",
      `multipart/mixed;boundary=${this.batchUid}`,
    );

    if (this.batchConfig.batch.useChangset) {
      resources = this.checkForChangset(resources, query);
    } else {
      this.batchBody += `--${this.batchUid}`;
    }

    resources.forEach(
      (req) => req.config.method === "GET" && req.applyQuery(query),
    );
    let contentId = 0;
    this.batchBody += resources.map((req) => {
      contentId++;
      return [
        "",
        "Content-Type: application/http",
        "Content-Transfer-Encoding: binary",
        `Content-ID: ${contentId}`,
        "",
        `${req.config.method} ${this.getRequestURL(req)} HTTP/1.1`,
        `${this.getHeaders(req)}`,
        `${this.getBody(req)}`
      ].join(CRLF);
    }).join(`${CRLF}--${this.batchUid}`);

    this.batchBody += `${CRLF}--${this.batchUid}--${CRLF}`;
  }

  public async fetch(url: URL) {
    const req = new ORequest(url, {
      ...this.batchConfig,
      body: this.batchBody,
      method: "POST",
    });
    const res: Response = await req.fetch;
    if (res.status === 200) {
      const data = await res.text();
      return this.parseResponse(data, res.headers.get("Content-Type"));
    } else {
      // check if return is JSON
      try {
        const error = await res.json();
        throw { res, error };
      } catch (ex) {
        throw res;
      }
    }
  }

  public parseResponse(responseData: string, contentTypeHeader: string): any {
    const headers = contentTypeHeader.split("boundary=");
    const boundary = headers[headers.length - 1];
    const splitData = responseData.split(`--${boundary}`);
    splitData.shift();
    splitData.pop();
    const parsedData = splitData.map((data) => {
      const dataSegments = data.trim().split("\r\n\r\n");
      if (dataSegments.length === 0 || dataSegments.length > 3) {
        // we are unable to parse -> return all
        return data;
      } else if (dataSegments.length === 3) {
        // if length >= 3 we have a body, try to parse if JSON and return that!
        try {
          const parsed = JSON.parse(dataSegments[2]);
          const hasFragment = parsed[this.batchConfig.fragment];
          return hasFragment || parsed;
        } catch (ex) {
          return dataSegments[2];
        }
      } else {
        // it seems like we have no body, return the status code
        return +dataSegments[1].split(" ")[1];
      }
    });
    return parsedData;
  }

  /**
   * If we determine a changset (POST, PUT, PATCH) we initalize a new
   * OBatch instance for it.
   */
  private checkForChangset(resources: ORequest[], query: OdataQuery) {
    const changeRes = this.getChangeResources(resources);

    if (this.changeset) {
      this.batchBody += [
        "",
        `Content-Type: multipart/mixed;boundary=${this.batchUid}`,
        "",
        `--${this.batchUid}`
      ].join(CRLF);
    } else if (changeRes.length > 0) {
      this.batchBody = `--${this.batchUid}`;
      this.batchBody += new OBatch(
        changeRes,
        this.batchConfig,
        query,
        true,
      ).batchBody;
      resources = this.getGETResources(resources);
    } else {
      this.batchBody = `--${this.batchUid}`;
    }
    return resources;
  }

  private getGETResources(resources: ORequest[]): ORequest[] {
    return resources.filter((req) => req.config.method === "GET");
  }

  private getChangeResources(resources: ORequest[]): ORequest[] {
    return resources.filter((req) => req.config.method !== "GET");
  }

  private getBody(req: ORequest) {
    if (req.config.body) {
      return `${req.config.body}${CRLF}${CRLF}`;
    }
    return "";
  }

  private getUid() {
    let d = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x7) | 0x8).toString(16);
    });
    return `${
      this.changeset
        ? this.batchConfig.batch.changsetBoundaryPrefix
        : this.batchConfig.batch.boundaryPrefix
    }${uuid}`;
  }

  private getHeaders(req: ORequest): string {
    // Request headers can be Headers | string[][] | Record<string, string>.
    // A new Headers instance around them allows treatment of all three types
    // to be the same. This also applies security last two could bypass.
    const headers = new Headers(req.config.headers || undefined) as any;
    // Convert each header to single string.
    // Headers is iterable. Array.from is needed instead of Object.keys.
    const mapped = Array.from(headers).map(([k, v]) => `${k}: ${v}`);
    if (mapped.length) {
      // Need to ensure a blank line between HEADERS and BODY. When there are
      // headers, it must be added here. Otherwise blank is added in ctor.
      mapped.push("");
    }
    return mapped.join(CRLF);
  }

  private getRequestURL(req: ORequest): string {
    let href = req.url.href;
    if (this.batchConfig.batch.useRelativeURLs) {
      // Strip away matching root from request.
      href = href.replace(this.batchConfig.rootUrl.href, '');
    }
    return href;
  }
}
