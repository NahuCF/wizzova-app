export interface LoginForm {
    email: string,
    password: string
}

export interface RegisterForm {
    name: string,
    cellphone: string,
    cellphone_prefix: string,
    work_email: string,
    password: string,
}

export interface LoginResponse {
    data: {
        id: string,
        name: string,
        email: string,
        verified_email: boolean,
        filled_basic_information: boolean,
    }
    meta: {
        token: string
    }
}

export interface RegisterResponse {
    data: {
        id: string,
        name: string,
        website?: string,
        email: string,
        business_name?: string,
        verified_email?: boolean,
        verified_whatsapp?: boolean,
        filled_basic_information: boolean
    }
}