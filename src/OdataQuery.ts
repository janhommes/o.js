export interface OdataQuery {
  $filter?: string;
  $orderby?: string;
  $expand?: string;
  $select?: string;

  $skip?: number;
  $top?: number;
  $count?: boolean;
  $search?: string;
  $format?: string;
  $compute?: string;
  $index?: number;
  [key: string]: any;
}
