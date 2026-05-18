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

export function buildSupabaseAuthVerifyUrl(
    supabaseUrl: string,
    emailData: AuthEmailData
) {
    const baseUrl = new URL('/auth/v1/verify', supabaseUrl);
    baseUrl.searchParams.set('token', emailData.token_hash);
    baseUrl.searchParams.set('type', emailData.email_action_type);
    baseUrl.searchParams.set('redirect_to', emailData.redirect_to);

    return baseUrl.toString();
}
