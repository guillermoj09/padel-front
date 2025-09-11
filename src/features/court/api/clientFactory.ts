import { DataSource, CourtApi } from './types';
import { mockClient } from './mockClient';
import { httpClient } from './httpClient';

export function getCourtApi(source?: DataSource): CourtApi {
  const env = (process.env.NEXT_PUBLIC_DATA_SOURCE as DataSource) || 'mock';
  const pick = source ?? env;
  return pick === 'api' ? httpClient : mockClient;
}
