import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, date } = await req.json()
    
    const CHATWOOT_BASE_URL = Deno.env.get('CHATWOOT_BASE_URL')
    const CHATWOOT_API_TOKEN = Deno.env.get('CHATWOOT_API_TOKEN')
    const CHATWOOT_ACCOUNT_ID = Deno.env.get('CHATWOOT_ACCOUNT_ID')

    if (!CHATWOOT_BASE_URL || !CHATWOOT_API_TOKEN || !CHATWOOT_ACCOUNT_ID) {
      throw new Error('Missing Chatwoot configuration')
    }

    const labels = [
      'comprobante_enviado',
      'factura_enviada',
      'soporte',
      'cobrador',
      'devolucion_producto',
      'servicio_tecnico',
      'consulto_saldo',
      'resuelto'
    ]

    const metrics: any = {}

    for (const label of labels) {
      let url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?labels[]=${label}&status=all&page=1`
      
      // Add date filters for day-by-day view
      if (type === 'day' && date) {
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const since = Math.floor(targetDate.getTime() / 1000)
        
        targetDate.setHours(23, 59, 59, 999)
        const until = Math.floor(targetDate.getTime() / 1000)
        
        url += `&since=${since}&until=${until}`
      }

      const response = await fetch(url, {
        headers: {
          'api_access_token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        metrics[label] = data.data?.meta?.all_count || 0
      } else {
        console.error(`Error fetching label ${label}:`, await response.text())
        metrics[label] = 0
      }
    }

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
