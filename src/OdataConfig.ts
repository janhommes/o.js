import { OdataBatchConfig } from "./OdataBatchConfig";

export type OdataConfig = RequestInit & {
  /**
   * The URL to request data from
   */
  rootUrl: URL;

  /**
   * An default query
   */
  query?: URLSearchParams;

  /**
   * The fragment to parse data from 
   * Default is: value
   */
  fragment: string;

  /**
   * Batch configuration (experimental)
   */
  batch?: OdataBatchConfig;

  /**
   * Set to true to disable auto polyfilling
   */
  disablePolyfill: boolean;
};
