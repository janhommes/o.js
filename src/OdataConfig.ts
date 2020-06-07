import { OHandler } from "./OHandler";

export interface OdataBatchConfig {
  endpoint?: string;
  headers?: Headers;
  boundaryPrefix?: string;
  useChangset: boolean;
  changsetBoundaryPrefix?: string;
  /**
   * When truthy, relative URL's will be used in batch elements
   */
  useRelativeURLs: boolean;
}

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

  /**
   * A function which is called on each start of a request
   */
  onStart: (oHandler: OHandler) => void;

  /**
   * A function which is called when a request has finished
   */
  onFinish: (oHandler: OHandler, res?: Response) => void;


  /**
   * A function which is called when a request has a error
   */
  onError: (oHandler: OHandler, res: Response) => void;
};
