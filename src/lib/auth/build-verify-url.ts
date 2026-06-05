export type AuthEmailActionType =
    | 'signup'
    | 'recovery'
    | 'invite'
    | 'magiclink'
    | 'email_change'
    | 'email_change_new'
    | 'reauthentication';

export type AuthEmailData = {
    token_hash: string;
    email_action_type: AuthEmailActionType | string;
    redirect_to: string;
};

function normalizeSupabaseOrigin(supabaseUrl: string): string {
    const trimmed = supabaseUrl.trim();

    if (!trimmed) {
        throw new Error(
            'NEXT_PUBLIC_SUPABASE_URL is empty. Expected https://<project>.supabase.co'
        );
    }

    try {
        const parsed = new URL(trimmed);

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('Supabase URL must use http or https');
        }

        return parsed.origin;
    } catch {
        throw new Error(
            `Invalid NEXT_PUBLIC_SUPABASE_URL "${trimmed}". Expected https://<project>.supabase.co`
        );
    }
}

export function buildSupabaseAuthVerifyUrl(
    supabaseUrl: string,
    emailData: AuthEmailData
) {
    const baseUrl = new URL(
        '/auth/v1/verify',
        normalizeSupabaseOrigin(supabaseUrl)
    );
    baseUrl.searchParams.set('token', emailData.token_hash);
    baseUrl.searchParams.set('type', emailData.email_action_type);
    baseUrl.searchParams.set('redirect_to', emailData.redirect_to);

    return baseUrl.toString();
}
