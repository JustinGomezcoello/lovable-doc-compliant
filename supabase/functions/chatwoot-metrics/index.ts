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
    const { type, date, dateFrom, dateTo } = await req.json()
    
    console.log('Request params:', { type, date, dateFrom, dateTo })
    
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
        console.log(`Day filter for ${label}: since=${since}, until=${until}`)
      }

      // Add date range filters for general view (Ecuador timezone UTC-5)
      if (type === 'range' && dateFrom && dateTo) {
        // Ecuador está en UTC-5, por lo que debemos ajustar
        // Si la fecha es 2025-11-16 00:00:00 en Ecuador = 2025-11-16 05:00:00 UTC
        const fromDate = new Date(dateFrom + 'T00:00:00Z') // UTC
        const ecuadorOffsetSeconds = 5 * 60 * 60 // 5 horas en segundos
        const since = Math.floor(fromDate.getTime() / 1000) + ecuadorOffsetSeconds
        
        const toDate = new Date(dateTo + 'T23:59:59Z') // UTC
        const until = Math.floor(toDate.getTime() / 1000) + ecuadorOffsetSeconds
        
        url += `&since=${since}&until=${until}`
        console.log(`Range filter for ${label}: since=${since} (${dateFrom} 00:00:00 Ecuador), until=${until} (${dateTo} 23:59:59 Ecuador)`)
      }

      console.log(`Fetching: ${url}`)

      const response = await fetch(url, {
        headers: {
          'api_access_token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const count = data.data?.meta?.all_count || 0
        metrics[label] = count
        console.log(`Label ${label}: ${count} conversations`)
      } else {
        const errorText = await response.text()
        console.error(`Error fetching label ${label}:`, errorText)
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
