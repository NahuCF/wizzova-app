import type { Page, BroadcastItem, BroadcastOverview, BroadcastNumber } from '~/types'
import Http from '~/config/http'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockBroadcastNumbers: BroadcastNumber[] = [
    {
        id: 'number-1',
        number: '+1234567890',
        name: 'Main WhatsApp Number'
    },
    {
        id: 'number-2',
        number: '+0987654321',
        name: 'Secondary Number'
    }
]

const mockBroadcastOverview: BroadcastOverview = {
    recipients: 5000,
    sent: { count: 4500, percentage: 90 },
    received: { count: 4300, percentage: 86 },
    read: { count: 4000, percentage: 80 },
    responded: { count: 3500, percentage: 70 },
    failed: { count: 500, percentage: 10 }
}

const createMockBroadcasts = (page: number, perPage: number): Page<BroadcastItem> => ({
    data: Array.from({ length: perPage }, (_, index) => ({
        id: `broadcast-${(page - 1) * perPage + index + 1}`,
        name: `Test Broadcast ${(page - 1) * perPage + index + 1}`,
        user: {
            id: `user-${index + 1}`,
            name: `User ${index + 1}`,
            email: `user${index + 1}@example.com`,
            cellphone_number: `1234567${index}`,
            cellphone_prefix: '+1',
            cellphone: `+11234567${index}`,
            role: {
                id: 1,
                name: '',
                is_internal: false
            },
            permission_names: [],
            status: 'ACTIVE',
            is_deleted: false
        },
        recipients_count: 1000 + index,
        sent_count: 800 + index,
        received_count: 750 + index,
        read_count: 700 + index,
        failed_count: 50 + index,
        status: index % 3 === 0 ? 'SCHEDULED' : index % 3 === 1 ? 'PROCESSING' : 'COMPLETED',
        created_at: new Date().toISOString()
    })),
    links: {
        first: '/broadcasts?page=1',
        last: '/broadcasts?page=5',
        prev: page > 1 ? `/broadcasts?page=${page - 1}` : null,
        next: page < 5 ? `/broadcasts?page=${page + 1}` : null
    },
    meta: {
        current_page: page,
        from: (page - 1) * perPage + 1,
        last_page: 5,
        links: [],
        path: '/broadcasts',
        per_page: perPage,
        to: page * perPage,
        total: 50
    }
})

export default {
    async index(
        page: number = 1,
        perPage: number = 10,
        search: string = ''
    ) {
        const params: Record<string, number | string> = {
            page,
            rows_per_page: perPage,
            ...(search && { search })
        }

        const data = createMockBroadcasts(page, perPage)

        await delay(500)
        return Promise.resolve({ data }) as ReturnType<typeof Http.get<Page<BroadcastItem>>>
    },
    async overview() {
        await delay(500)
        return Promise.resolve({ data: mockBroadcastOverview }) as ReturnType<typeof Http.get<BroadcastOverview>>
    },
    async broadcastNumbers() {
        await delay(500)
        return Promise.resolve({ data: mockBroadcastNumbers }) as ReturnType<typeof Http.get<BroadcastNumber[]>>
    }
}
