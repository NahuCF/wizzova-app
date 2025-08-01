import Http from "~/config/http"
import type { PermissionList, RoleCreate, RoleItem } from "~/types"

export default {
	index() {
		return Http.get<{ data: RoleItem[] }>('/roles')
	},
	async create(role: RoleCreate) {
        return Http.post<{ data: RoleItem }>('/roles', role)
    },
    async update(role: RoleCreate) {
        return Http.put<{ data: RoleItem }>(`/roles/${role.id}`, role)
    },
    async delete(id: string) {
        return Http.delete(`/roles/${id}`)
    },
    permissions() {
        return Http.get<PermissionList>(`/permissions`)
    }
}