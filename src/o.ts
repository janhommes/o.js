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
export function o(rootUrl: string | URL, config: Partial<OdataConfig> = {}) {
  // set the default configuration values
  const defaultConfigValues: OdataConfig = {
    batch: {
      boundaryPrefix: "batch_",
      changsetBoundaryPrefix: "changset_",
      endpoint: "$batch",
      headers: new Headers({
        "Content-Type": "multipart/mixed",
      }),
      useChangset: false,
      useRelativeURLs: false,
    },
    credentials: "omit",
    fragment: "value",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    mode: "cors",
    redirect: "follow",
    referrer: typeof window === "undefined" ? undefined : "client",
    onStart: () => null,
    onError: () => null,
    onFinish: () => null,
  };

  const mergedConfig: OdataConfig = { ...defaultConfigValues, ...config };
  if (typeof rootUrl === "string") {
    try {
      // we assuming a resource
      const configUrl = (mergedConfig.rootUrl ||
        window.location.href) as string;
      rootUrl = new URL(
        rootUrl,
        configUrl.endsWith("/") ? configUrl : `${configUrl}/`
      );
    } catch (ex) {
      // no window?!
      rootUrl = new URL(rootUrl as string, mergedConfig.rootUrl);
    }
  }
  mergedConfig.rootUrl = rootUrl;
  return new OHandler(mergedConfig);
}

/**
 * Default exports
 */
export * from "./OBatch";
export * from "./OdataConfig";
export * from "./OdataQuery";
export * from "./OHandler";
export * from "./ORequest";
