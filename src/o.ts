import { OdataConfig } from "./OdataConfig";
import { OHandler } from "./OHandler";

/**
 * Use the 'o'-function to initialize a request directly or use the returned
 * handler to store the settings.
 *
 * Use o() directly jquery like:
 * @example
 * ```typescript
 *  await o('https://rootUrl').get('resource').query();
 * ```
 *
 * Or with a handler:
 * @example
 * ```typescript
 *  const oHandler = o('https://rootUrl');
 *  await oHandler.get('resource').query({ $top: 2 });
 * ```
 *
 * @param rootUrl The url to query
 * @param config The odata and fetch configuration.
 */
export function o(rootUrl: string | URL, config?: OdataConfig | any) {

  // polyfill fetch if we have no fetch
  const env = typeof window !== "undefined" ? window : global;
  if (!("fetch" in env) && !config.disablePolyfill) {
    require("cross-fetch/polyfill");
  }
  if (!("URL" in env) && !config.disablePolyfill) {
    require("universal-url").shim();
  }

  // set the default configuration values
  const defaultConfigValues = {
    batch: {
      changsetBoundaryPrefix: "changset_",
      endpoint: "$batch",
      headers: new Headers({
        "Content-Type": "multipart/mixed",
      }),
      useChangset: false,
    },
    boundaryPrefix: "batch_",
    credentials: "omit",
    fragment: "value",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    mode: "cors",
    redirect: "follow",
    referrer: "client",
  };

  const mergedConfig = { ...defaultConfigValues, ...config };
  if (typeof rootUrl === "string") {
    try {
      // we assuming a resource
      const configUrl = mergedConfig.rootUrl || window.location.href;
      rootUrl = new URL(
        rootUrl,
        configUrl.endsWith("/") ? configUrl : `${configUrl}/`,
      );
    } catch (ex) {
      // no window?!
      rootUrl = new URL(rootUrl, mergedConfig.rootUrl);
    }
  }
  mergedConfig.rootUrl = rootUrl;
  return new OHandler(mergedConfig);
}

/**
 * Default exports
 */
export * from "./OBatch";
export * from "./OdataBatchConfig";
export * from "./OdataConfig";
export * from "./OdataQuery";
export * from "./OHandler";
export * from "./ORequest";
