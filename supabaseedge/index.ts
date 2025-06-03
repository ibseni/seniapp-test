import { createClient } from '@supabase/supabase-js'

// This function runs on Supabase's Edge Functions platform
export const handler = async (event: any, context: any) => {
  const { user, type } = event.data;

  // Only proceed if this is a new sign-in event
  if (type === 'INSERT' && user) {
    try {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL ?? '',
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Insert or update user in our users table
      const { error } = await supabaseAdmin.from('users').upsert({
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      return { statusCode: 200, body: JSON.stringify({ message: 'User synchronized successfully' }) }
    } catch (error) {
      console.error('Error synchronizing user:', error)
      return { statusCode: 400, body: JSON.stringify({ error: 'Error synchronizing user' }) }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'No action required' }) }
} 