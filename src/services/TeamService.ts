import Http from '~/config/http'
import type { TeamCreate, TeamItem } from '~/types'

export default {
  index() {
    return Http.get<{ data: TeamItem[] }>('/teams')
  },
  async create(team: TeamCreate) {
    return Http.post<{ data: TeamItem }>('/teams', team)
  },
  async update(team: TeamCreate) {
    return Http.put<{ data: TeamItem }>(`/teams/${team.id}`, team)
  },
  async delete(id: string) {
    return Http.delete(`/teams/${id}`)
  },
}
