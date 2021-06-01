import { o, OBatch } from "./o";
import { OdataConfig } from "./OdataConfig";

describe("initialize a new oHandler", () => {
  test("url with string", () => {
    // given
    const url = "http://odata.org/";

    // when
    const when = o(url);

    // expect
    expect((when.config.rootUrl as URL).href).toEqual(url);
  });

  test("url with string and root config", () => {
    // given
    const url = "http://odata.org/";
    const config = { rootUrl: "http://a/" };

    // when
    const when = o(url, config);

    // expect
    expect((when.config.rootUrl as URL).href).toEqual(url);
  });

  test("only with rootUrl config", () => {
    // given
    const url = "";
    const config = { rootUrl: "http://a/" };

    // when
    const when = o(url, config);

    // expect
    expect((when.config.rootUrl as URL).href).toEqual(config.rootUrl);
  });

  test("only with rootUrl and a given url", () => {
    // given
    const url = "foo";
    const config = { rootUrl: "http://bar/" };

    // when
    const when = o(url, config);

    // expect
    expect((when.config.rootUrl as URL).href).toEqual(`${config.rootUrl}foo`);
  });

  test("no rootUrl given and url given not a valid url (should switch to window.location.href)", () => {
    // given
    const url = "foo";

    // when
    const when = o(url);

    // expect
    expect((when.config.rootUrl as URL).href).toEqual(`http://localhost/foo`);
  });

  test("config should be default if not given", () => {
    // given
    const url = "foo";

    // when
    const when = o(url);

    // expect
    expect(when.config).toBeDefined();
    expect(when.config).toMatchSnapshot();
  });

  test("config should be extended if something given.", () => {
    // given
    const url = "foo";
    const config: Partial<OdataConfig> = {
      mode: "no-cors",
      rootUrl: "http://bar.de/foo",
    };

    // when
    const when = o(url, config);

    // expect
    expect(when.config).toBeDefined();
    expect(when.config.mode).toBe("no-cors");
    expect(when.config.referrer).toBe("client");
    expect((when.config.rootUrl as URL).href).toBe("http://bar.de/foo/foo");
  });
});

describe("Instant request", () => {
  test("Request any thing that is put in the init request", async () => {
    // when
    const data = await o(
      "https://services.odata.org/V4/TripPinServiceRW/People?$top=2"
    )
      .get()
      .query();
    // expect
    expect(data.length).toBe(2);
  });

  test("Still allow chaining and multiple requests", async () => {
    // given
    const [resource1, resource2] = ["People", "Airlines"];
    // when
    const data = await o("https://services.odata.org/V4/TripPinServiceRW/")
      .get(resource1)
      .get(resource2)
      .query({ $top: 2 });
    // expect
    expect(data.length).toBe(2);
    expect(data[0].length).toBe(2);
    expect(data[1].length).toBe(2);
  });

  test("Attach the correct queries to the request", async () => {
    // when
    const data = await o(
      "https://services.odata.org/V4/TripPinServiceRW/People?$top=2",
      {
        query: { $top: 1, $filter: `FirstName eq 'john'` },
      }
    )
      .get()
      .fetch();

    // expect
    expect(decodeURIComponent((data as Response).url)).toContain(
      "People?$top=1&$filter=FirstName+eq+'john'"
    );
  });

  test("Check right URL Params override. query-parameter in fetch()/query() wins over query-config", async () => {
    // when
    const data = await o(
      "https://services.odata.org/V4/TripPinServiceRW/People",
      {
        query: { $top: 1 },
      }
    )
      .get()
      .fetch({ $top: 2 });

    // expect
    expect(decodeURIComponent((data as Response).url)).toContain(
      "People?$top=2"
    );
  });

  test("Check right URL Params override. query-parameter in fetch()/query() wins over baseUrl", async () => {
    // when
    const data = await o(
      "https://services.odata.org/V4/TripPinServiceRW/People?$top=1"
    )
      .get()
      .fetch({ $top: 2 });

    // expect
    expect(decodeURIComponent((data as Response).url)).toContain(
      "People?$top=2"
    );
  });

  test("Check right URL Params override. query-config wins over baseUrl", async () => {
    // when
    const data = await o(
      "https://services.odata.org/V4/TripPinServiceRW/People?$top=1",
      {
        query: { $top: 2 },
      }
    )
      .get()
      .fetch();

    // expect
    expect(decodeURIComponent((data as Response).url)).toContain(
      "People?$top=2"
    );
  });
});

describe("Request handling", () => {
  let oHandler;

  beforeEach(() => {
    oHandler = o("https://services.odata.org/V4/TripPinServiceRW/");
  });

  test("Queue requests", () => {
    // given
    const resource = "People";
    // when
    oHandler.get(resource);
    // expect
    expect(oHandler.pending).toBe(1);
    // when
    oHandler.get(resource).get(resource);
    // expect
    expect(oHandler.pending).toBe(3);
  });

  test("Clean queued request after query", async () => {
    // given
    const resource = "People";
    // when
    await oHandler.get(resource).get(resource).query();
    // expect
    expect(oHandler.pending).toBe(0);
  });

  test("Clean queued request after fetch", async () => {
    // given
    const resource = "People";
    // when
    await oHandler.get(resource).get(resource).fetch();
    // expect
    expect(oHandler.pending).toBe(0);
  });

  test("Clean queued request after batch", async () => {
    // given
    const resource = "People";
    // when
    try {
      await oHandler.get(resource).get(resource).batch();
    } catch (ex) {
      // intended empty
    }
    // expect
    expect(oHandler.pending).toBe(0);
  });

  test("Attach the correct queries to the request", async () => {
    // given
    const resource = "People";
    // when
    const requests = oHandler
      .get(resource)
      .get(resource)
      .fetch({ $top: 1, $filter: `FirstName eq 'john'` });

    const req = await requests;

    // expect
    expect(decodeURIComponent(req[0].url)).toContain(
      "People?$top=1&$filter=FirstName+eq+'john'"
    );
  });

  test("On request to one resource only, don't return an array", async () => {
    // given
    const resource = "People";
    // when
    const requests = oHandler.get(resource).fetch();

    const req = await requests;

    // expect
    expect(Array.isArray(req)).toBe(false);
  });
});

describe("GET request", () => {
  let oHandler;

  beforeAll(() => {
    oHandler = o("https://services.odata.org/V4/TripPinServiceRW/");
  });

  test("Request to a resource should return an array", async () => {
    // given
    const resource = "People";
    // when
    const data = await oHandler.get(resource).query({
      $top: 4,
    });

    // expect
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4);
  });

  test("Request to one entity should return a object", async () => {
    // given
    const resource = "People('russellwhyte')";
    // when
    const data = await oHandler.get(resource).query();

    // expect
    expect(Array.isArray(data)).toBe(false);
    expect(typeof data).toBe("object");
  });

  test("Request to $top=1 should return a array", async () => {
    // given
    const resource = "People";
    // when
    const data = await oHandler.get(resource).query({ $top: 1 });

    // expect
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });

  test("Request multiple resources or entities", async () => {
    // given
    const resource1 = "People('russellwhyte')";
    const resource2 = "People";
    // when
    const data = await oHandler.get(resource1).get(resource2).query();

    // expect
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(Array.isArray(data[0])).toBe(false);
    expect(Array.isArray(data)).toBe(true);
  });

  test("Request a entity that cannot be found", async () => {
    // given
    const resource = "People('foo')";
    // when
    try {
      await oHandler.get(resource).query();
    } catch (res) {
      // expect
      expect(res.status).toBe(404);
    }
  });

  test("If one request fails in a query sequent, throw all", async () => {
    // given
    const resource1 = "People('russellwhyte')";
    const resource2 = "People('unknown')";
    // when
    try {
      await oHandler.get(resource1).get(resource2).query();
    } catch (res) {
      // expect
      expect(res.status).toBe(404);
    }
  });
});

describe("Create, Update and Delete request", () => {
  let oHandler;

  beforeAll(async () => {
    oHandler = o('https://services.odata.org/V4/TripPinServiceRW/(S(ojstest))/', {
      headers: { "If-match": "*", "Content-Type": "application/json" },
    });
  });

  test("POST a person and request it afterwards", async () => {
    // given
    const resource = "People";
    const data = {
      FirstName: "Foo",
      LastName: "Bar",
      UserName: "barfoo" + Math.random(),
    };

    // when
    const response = await oHandler
      .post(resource, data)
      .get(`${resource}('${data.UserName}')`)
      .query();

    // expect
    expect(Array.isArray(response)).toBe(true);
    expect(Array.isArray(response[0])).toBe(false);
    expect(Array.isArray(response[1])).toBe(false);
    expect(response[0].FirstName).toBe(data.FirstName);
    expect(response[1].LastName).toBe(data.LastName);
    expect(response[1].UserName).toBe(data.UserName);
  });

  test("POST a person and DELETE it afterwards", async () => {
    // given
    const resource = "People";
    const data = {
      FirstName: "Bar",
      LastName: "Foo",
      UserName: "foobar" + Math.random(),
    };

    // when
    const response = await oHandler
      .post(resource, data)
      .delete(`${resource}('${data.UserName}')`)
      .query();

    // expect
    expect(Array.isArray(response)).toBe(true);
    expect(Array.isArray(response[0])).toBe(false);
    expect(Array.isArray(response[1])).toBe(false);
    expect(response[0].FirstName).toBe(data.FirstName);
    expect(response[0].LastName).toBe(data.LastName);
    expect(response[0].UserName).toBe(data.UserName);
    expect(response[1].status).toBe(204);
  });

  test("POST a person and PATCH it afterwards", async () => {
    // given
    const resource = "People";
    const data = {
      FirstName: "Bar",
      LastName: "Foo",
      UserName: "foobar" + Math.random(),
    };

    // when
    const response = await oHandler
      .post(resource, data)
      .patch(`${resource}('${data.UserName}')`, { FirstName: data.LastName })
      .get(`${resource}('${data.UserName}')`)
      .query();

    // expect
    expect(Array.isArray(response)).toBe(true);
    expect(Array.isArray(response[0])).toBe(false);
    expect(Array.isArray(response[1])).toBe(false);
    expect(response[0].FirstName).toBe(data.FirstName);
    expect(response[0].LastName).toBe(data.LastName);
    expect(response[1].status).toBe(204);
    expect(response[2].FirstName).toBe(data.LastName);
  });
});

describe("Batching", () => {
  let oHandler;

  beforeAll(async () => {
    // Use the non restier service as it has CORS enabled
    const response: Response = (await o(
      "https://services.odata.org/V4/TripPinServiceRW/"
    )
      .get()
      .fetch()) as Response;

    oHandler = o(response.url, {
      headers: { "If-match": "*", "Content-Type": "application/json" },
    });
  });

  test("Batch multiple GET requests", async () => {
    // given
    const [resource1, resource2] = ["People", "Airlines"];
    // when
    const data = await oHandler.get(resource1).get(resource2).batch();
    // expect
    expect(data.length).toBe(2);
    expect(data[0].body.length).toBeDefined();
  });

  test("Batch multiple GET requests and allow to add a query", async () => {
    // given
    const [resource1, resource2] = ["People", "Airlines"];
    // when
    const data = await oHandler
      .get(resource1)
      .get(resource2)
      .batch({ $top: 2 });
    // expect
    expect(data[0].body.length).toBe(2);
  });

  test("Batch multiple GET requests and patch something", async () => {
    // given
    const [resource1, resource2] = ["People", "Airlines('AA')"];
    // when
    const data = await oHandler
      .get(resource1)
      .patch(resource2, { Name: "New" })
      .get(resource2)
      .batch();
    // expect
    expect(data.length).toBe(3);
    expect(data[1].status).toBe(204);
    expect(data[2].body.Name).toBe("New");
  });

  test("Batch POST and PATCH with useChangeset=true", async () => {
    oHandler.config.batch.useChangset = true;

    // given
    const [resource1, resource2] = ["People", "Airlines('AA')"];
    const resouce1data = {
      FirstName: "Bar",
      LastName: "Foo is cool",
      UserName: "foobar" + Math.random(),
    };
    // when
    const request = oHandler
      .post(resource1, resouce1data)
      .patch(resource2, { Name: "New" });
    const batch = new OBatch(request.requests, request.config, null);
    const data = await request.batch();
    // expect
    expect(data.length).toBe(2);
    expect(data[0].body.LastName).toBe(resouce1data.LastName);
    expect(data[1].status).toBe(204);
  });

  // Content ID seems to have a problem in the test implementation (or I don't get the right implementation)
  // tested with postman and I always get Resource not found for the segment '$1'
  xtest("add something and directly patch it with Content-Id", async () => {
    // given
    oHandler.config.batch.useChangeset = true;
    const resource = "People";
    const data = {
      FirstName: "Bar",
      LastName: "Foo",
      UserName: "foobar" + Math.random(),
    };
    // when
    const result = await oHandler
      .post(resource, data)
      .patch("$1", { LastName: "Bar" })
      .get(`${resource}('${data.UserName}')`)
      .batch();
    // expect
    expect(result.length).toBe(3);
    expect(result[1].status).toBe(204);
    expect(result[2].body.LastName).toBe("Bar");
  });
});
