import { apiRequest } from '../../shared/api/baseApi'
import type { StatsResponse } from '../../shared/types/api'

export function getStats() {
  return apiRequest<StatsResponse>('/admin/stats')
}
