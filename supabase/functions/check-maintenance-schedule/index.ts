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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get maintenance schedule settings
    const { data: settings, error: fetchError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['maintenance_scheduled', 'maintenance_start_time', 'maintenance_end_time', 'maintenance_mode'])

    if (fetchError) {
      throw fetchError
    }

    const settingsMap: Record<string, any> = {}
    settings?.forEach(s => {
      settingsMap[s.key] = s.value
    })

    const isScheduled = settingsMap.maintenance_scheduled === true
    const startTime = settingsMap.maintenance_start_time
    const endTime = settingsMap.maintenance_end_time
    const currentMaintenanceMode = settingsMap.maintenance_mode === true

    if (!isScheduled || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ message: 'No scheduled maintenance', updated: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)

    let shouldBeInMaintenance = false
    let updated = false

    // Check if current time is within maintenance window
    if (now >= start && now <= end) {
      shouldBeInMaintenance = true
    }

    // Update maintenance_mode if needed
    if (shouldBeInMaintenance !== currentMaintenanceMode) {
      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ value: shouldBeInMaintenance, updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode')

      if (updateError) {
        throw updateError
      }
      updated = true

      // If maintenance ended, reset the schedule
      if (!shouldBeInMaintenance && now > end) {
        await supabase
          .from('system_settings')
          .update({ value: false, updated_at: new Date().toISOString() })
          .eq('key', 'maintenance_scheduled')
      }
    }

    return new Response(
      JSON.stringify({
        message: updated ? `Maintenance mode ${shouldBeInMaintenance ? 'activated' : 'deactivated'}` : 'No change needed',
        updated,
        currentTime: now.toISOString(),
        maintenanceActive: shouldBeInMaintenance,
        scheduleStart: start.toISOString(),
        scheduleEnd: end.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
