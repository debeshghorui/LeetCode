import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null
let auth: SupabaseClient | null = null

const clientOpts = {
    auth: { autoRefreshToken: false, persistSession: false },
}

function env(name: string) {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`${name} is missing. Add it to .env and restart Expo.`)
        
    return value
}

function getAuthClient() {
    if (auth === undefined || auth === null) {
        auth = createClient(
            env('EXPO_PUBLIC_SUPABASE_URL'), 
            env('EXPO_PUBLIC_SUPABASE_KEY'), 
            clientOpts
        )
    }

    return auth
}

export function getSupabaseAdmin() {
    if (admin === undefined || admin === null) {
        admin = createClient(
            env('EXPO_PUBLIC_SUPABASE_URL'),
            env('SUPABASE_SERVICE_ROLE_KEY'),
            clientOpts
        )
    }

    return admin
}

export async function getUserFromRequest(request: Request) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim()
    if (!token) return null

    const { data } = await getAuthClient().auth.getUser(token)

    return data.user ?? null
}