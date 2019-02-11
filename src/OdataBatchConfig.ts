export interface OdataBatchConfig {
  endpoint?: string;
  headers?: Headers;
  boundaryPrefix?: string;
  useChangset: boolean;
  changsetBoundaryPrefix?: string;
}
