import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if user is authenticated and is Admin/Super_admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // We need service role client to manage users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Check caller's role
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('*, roles(name, is_super_admin)')
      .eq('id', user.id)
      .single()
    
    const callerRoleName = callerProfile?.roles?.name
    const isCallerSuperAdmin = callerProfile?.roles?.is_super_admin
    
    if (callerRoleName !== 'Admin' && !isCallerSuperAdmin) {
        throw new Error('Forbidden: Admin access required')
    }

    const { action, payload } = await req.json()

    if (action === 'create') {
        const { password, loginName, roleId, fullName } = payload
        const email = `${loginName}@inventory.local`
        
        // Validate inputs
        if (!loginName || !password || !roleId) {
            throw new Error('Missing required fields')
        }

        // Check if role is Super Admin
        const { data: targetRole } = await supabaseAdmin
            .from('roles')
            .select('is_super_admin')
            .eq('id', roleId)
            .single()
            
        if (targetRole?.is_super_admin && !isCallerSuperAdmin) {
             throw new Error('Forbidden: Only Super Admin can create Super Admin users')
        }

        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        })

        if (createError) throw createError

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authUser.user.id,
                login_name: loginName,
                role_id: roleId,
                full_name: fullName
            })
        
        if (profileError) {
            // Rollback auth user creation
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw profileError
        }

        return new Response(JSON.stringify(authUser), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
        const { userId } = payload
        
        // Check target user role
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('roles(is_super_admin)')
            .eq('id', userId)
            .single()
            
        if (targetProfile?.roles?.is_super_admin && !isCallerSuperAdmin) {
            throw new Error('Forbidden: Only Super Admin can delete Super Admin users')
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        
        // Profile cascade delete should handle it
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update') {
        const { userId, password, loginName, roleId, fullName } = payload
        
        // Check target user role
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('roles(is_super_admin)')
            .eq('id', userId)
            .single()
            
        if (targetProfile?.roles?.is_super_admin && !isCallerSuperAdmin) {
             throw new Error('Forbidden: Only Super Admin can edit Super Admin users')
        }
        
        // Check new role
        if (roleId) {
             const { data: targetRole } = await supabaseAdmin
                .from('roles')
                .select('is_super_admin')
                .eq('id', roleId)
                .single()
             
             if (targetRole?.is_super_admin && !isCallerSuperAdmin) {
                 throw new Error('Forbidden: Only Super Admin can promote to Super Admin')
             }
        }

        const updateData: any = { user_metadata: { full_name: fullName } }
        if (loginName) updateData.email = `${loginName}@inventory.local`
        if (password) updateData.password = password
        
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
        if (authError) throw authError
        
        const profileUpdates: any = { full_name: fullName }
        if (loginName) profileUpdates.login_name = loginName
        if (roleId) profileUpdates.role_id = roleId

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
            
        if (profileError) throw profileError

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
