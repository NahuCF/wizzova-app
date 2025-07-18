import Http from "~/config/http"
import type { UserItem } from "~/types/User"

export default {
  index() {
    return Http.get<{ data: UserItem[] }>('/users')
  },
}
