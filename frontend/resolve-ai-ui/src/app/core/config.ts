const env = (import.meta as unknown as {
    env: Record<string, string | undefined>;
}).env;

export const config = {
    apiUrl: env['NG_APP_API_URL'] ?? 'http://localhost:8000/api/v1',
    supabaseUrl: env['NG_APP_SUPABASE_URL'] ?? '',
    supabasePublishableKey: env['NG_APP_SUPABASE_PUBLISHABLE_KEY'] ?? ''
};