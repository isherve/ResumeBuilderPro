import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types';

export function unwrapApiData<T>(response: AxiosResponse<ApiResponse<T>> | undefined, fallback: T): T {
  return response?.data?.data ?? fallback;
}
