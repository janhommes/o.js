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
       `multipart/mixed; boundary=${this.batchUid}`,
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
    if(!changeset){
      (this.batchConfig.headers as Headers).set(
        "Content-Type",
        `multipart/mixed;boundary=${this.batchUid}`,
      );
    }
  }

  public async fetch(url: URL) {
    const req = new ORequest(url, {
      ...this.batchConfig,
      body: this.batchBody,
      method: "POST",
    });
    const res: Response = await req.fetch;
    if (res.ok) {
      const data = await res.text();
      return this.parseResponse(data, res.headers.get("Content-Type"));
    } else {
      throw res;
    }
  }

  public parseResponse(responseData: string, contentTypeHeader: string): any {
    const headers = contentTypeHeader.split("boundary=");
    const boundary = headers[headers.length - 1];
    const splitData = responseData.split(`--${boundary}`);
    splitData.shift();
    splitData.pop();
    let wasWithChangesetresponse = false;
    const parsedData = splitData.map((data) => {
      const dataSegments = data.trim().split("\r\n\r\n");
      if (dataSegments.length === 0) {
        // we are unable to parse -> return all
        return data;
      } else if (dataSegments.length > 3) {
        const header = dataSegments.find(
            (x) => x.startsWith("Content-Type: ") && x.includes("boundary=changesetresponse_"));
        if (!header) {
          return data;
        }
        dataSegments.shift();
        wasWithChangesetresponse = true;
        return this.parseResponse(dataSegments.join("\r\n\r\n"), header);
      } else {
        var contentIdHeader = dataSegments[0].split("\r\n").find(function (x) { return x.startsWith("Content-ID: "); });
        if (contentIdHeader) {
          try {
            var contentId = parseInt(contentIdHeader.substring(12), 10);
          } catch (ex) {
          }
        }
        var status = +dataSegments[1].split(" ")[1];
        if (dataSegments.length === 3) {
          // if length == 3 we have a body, try to parse if JSON and return that!
          var body;
          try {
            const parsed = JSON.parse(dataSegments[2]);
            const hasFragment = parsed[this.batchConfig.fragment];
            body = hasFragment || parsed;
          } catch (ex) {
            body = dataSegments[2];
          }
        }
        return { contentId, status, body };
      }
    });
    if (wasWithChangesetresponse) {
        return parsedData[0];
    }
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
    href = href.replace((this.batchConfig.rootUrl as URL).href, "");
  }
  return href;
  }
}
