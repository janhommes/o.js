import { OBatch } from "./OBatch";
import { OdataConfig } from "./OdataConfig";
import { OdataQuery } from "./OdataQuery";
import { ORequest } from "./ORequest";

type BodyType = Blob | BufferSource | FormData | URLSearchParams | string | object;

export class OHandler {
  private requests: ORequest[] = [];

  constructor(public config: OdataConfig) {}

  /**
   * Does a fetch request to the given endpoint and request
   * all resources in sequent. Tries to parse the result logical
   * so that no further processing is used. If the result is only one
   * entity a object is returned, otherwise a array of objects.
   *
   * @example
   * ```typescript
   *  const russell = await o('https://services.odata.org/TripPinRESTierService/')
   *  .get('People('russellwhyte')
   *  .query();
   *
   *  console.log(russell); // shows: { FirstName: "Russell", LastName: "Whyte" [...] }
   * ```
   *
   * If the request fails with an error code higher then 400 it throws the
   * Response:
   *
   * @example
   * ```typescript
   *  try {
   *    const unknown = await o('https://services.odata.org/TripPinRESTierService/')
   *      .get('People('unknown')
   *      .query();
   *  } catch(res) { // Response
   *    console.log(res.status); // 404
   *  }
   * ```
   *
   * @param query The URLSearchParams that are added to the question mark on the url.
   *              That are usually the odata queries like $filter, $top, etc...
   * @returns Either an array or a object with the given entities. If multiple
   *          resources are fetched, this method returns a array of array/object. If there
   *          is no content (e.g. for delete) this method returns the Response
   */
  public async query(query?: OdataQuery) {
    try {
      this.config.onStart(this);
      const response: Response[] = await this.getFetch(query);
      const json = await Promise.all(
        response.map(
          async (res) => {
            if (res.status >= 400) {
              this.config.onError(this, res);
              throw res;
            } else if (res.ok && res.json) {
              try {
                this.config.onFinish(this, res);
                const data = await res.json();
                return data[this.config.fragment] || data;
              } catch (ex) {
                return res;
              }
            } else {
              return await res.text();
            }
          },
        ),
      );
      return json.length > 1 ? json : json[0];
    } catch (ex) {
      throw ex;
    } finally {
      this.requests = [];
    }
  }

  /**
   * Request all requests in sequent. Does simply return a Response or Response[]
   * without any data parsing applied.
   *
   * @param query The URLSearchParams that are added to the question mark on the url.
   *              That are usually the odata queries like $filter, $top, etc...
   */
  public async fetch(query?: OdataQuery) {
    try {
      this.config.onStart(this);
      const fetch = await this.getFetch(query);
      return fetch.length === 1 ? fetch[0] : fetch;
    } catch (ex) {
      this.config.onError(this, ex);
      throw ex;
    } finally {
      this.config.onFinish(this);
      this.requests = [];
    }
  }

  /**
   * Does a batch http-batch request. All request in that sequent are send via one
   * physically request and afterwards parsed to separate data chunks.
   *
   * @param query The URLSearchParams that are added to the question mark on the url.
   *              That are usually the odata queries like $filter, $top, etc...
   */
  public async batch(query?: OdataQuery) {
    try {
      const batch = new OBatch(this.requests, this.config, query);
      const url = this.getUrl(this.config.batch.endpoint);
      const data = await batch.fetch(url);
      return data;
    } catch (ex) {
      throw ex;
    } finally {
      this.requests = [];
    }
  }

  /**
   * Gets the data from the endpoint + resource url.
   *
   * @param resource The resource to request e.g. People/$value.
   */
  public get(resource: string = "") {
    const url = this.getUrl(resource);
    const request = new ORequest(url, { ...this.config, method: "GET" });
    this.requests.push(request);
    return this;
  }

  /**
   * Post data to an endpoint + resource.
   *
   * @param resource The resource to post to.
   * @param body The data to post.
   */
  public post(resource: string = "", body: BodyType) {
    const url = this.getUrl(resource);
    const request = new ORequest(url, { ...this.config, method: "POST", body: this.getBody(body) });
    this.requests.push(request);
    return this;
  }

  /**
   * Put data to an endpoint + resource.
   *
   * @param resource The resource to put to.
   * @param body The data to put.
   */
  public put(resource: string = "", body: BodyType) {
    const url = this.getUrl(resource);
    const request = new ORequest(url, { ...this.config, method: "PUT", body: this.getBody(body) });
    this.requests.push(request);
    return this;
  }

  /**
   * Patch data to an endpoint + resource.
   *
   * @param resource The resource to patch to.
   * @param body The data to patch.
   */
  public patch(resource: string = "", body: BodyType) {
    const url = this.getUrl(resource);
    const request = new ORequest(url, {
      ...this.config,
      body: this.getBody(body),
      method: "PATCH",
    });
    this.requests.push(request);
    return this;
  }

  /**
   * Deletes a resource from the endpoint.
   *
   * @param resource The resource to delete e.g. People/1
   */
  public delete(resource = "") {
    const url = this.getUrl(resource);
    const request = new ORequest(url, { ...this.config, method: "DELETE" });
    this.requests.push(request);
    return this;
  }

  /**
   * Use that method to add any kind of request (e.g. a head request) to
   * the execution list.
   *
   * @example
   * ```typescript
   *   const req = new ORequest('http://full.url/healt', { method: 'HEAD'});
   *   const res = await o('http://another.url').request(req).fetch();
   *   console.log(res.status); // e.g. 200 from http://full.url/healt
   * ```
   * @param req The request to add.
   */
  public request(req: ORequest) {
    this.requests.push(req);
  }

  /**
   * Determines how many request are outstanding.
   */
  public get pending() {
    return this.requests.length;
  }

  /**
   * Returns a URL based on the rootURL + the given resource
   * @param resource The resource to join.
   */
  public getUrl(resource: string) {
    return new URL(resource, this.config.rootUrl);
  }

  private async getFetch(query: OdataQuery) {
    if (this.pending > 1) {
      const result: Response[] = [];
      for (const req of this.requests) {
        req.applyQuery({ ...this.config.query, ...query });
        const request = await req.fetch;
        result.push(request);
      }
      return result;
    } else {
      this.requests[0].applyQuery({ ...this.config.query, ...query });
      return [await this.requests[0].fetch];
    }
  }

  private getBody(body: BodyType): any {
    if (typeof body === "object") {
      return JSON.stringify(body);
    }
    return body;
  }
}
