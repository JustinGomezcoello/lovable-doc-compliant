// Edge function to fetch Chatwoot metrics with date filtering
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
      // Fetch all pages of conversations for this label
      let allConversations: any[] = []
      let currentPage = 1
      let hasMorePages = true
      
      while (hasMorePages) {
        const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?labels[]=${label}&status=all&page=${currentPage}`
        
        console.log(`Fetching page ${currentPage} for ${label}: ${url}`)

        const response = await fetch(url, {
          headers: {
            'api_access_token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const conversations = data.data?.payload || []
          
          if (conversations.length === 0) {
            hasMorePages = false
          } else {
            allConversations = allConversations.concat(conversations)
            currentPage++
            
            // Limit to 10 pages to prevent infinite loops
            if (currentPage > 10) {
              hasMorePages = false
            }
          }
        } else {
          const errorText = await response.text()
          console.error(`Error fetching page ${currentPage} for label ${label}:`, errorText)
          hasMorePages = false
        }
      }
      
      console.log(`Total conversations fetched for ${label}: ${allConversations.length}`)
        
      // Filter conversations by date if date range is provided
      let filteredConversations = allConversations
        
        if (type === 'day' && date) {
          const targetDate = new Date(date)
          targetDate.setHours(0, 0, 0, 0)
          const since = Math.floor(targetDate.getTime() / 1000)
          
          targetDate.setHours(23, 59, 59, 999)
          const until = Math.floor(targetDate.getTime() / 1000)
          
          filteredConversations = allConversations.filter((conv: any) => {
            const createdAt = conv.created_at || 0
            return createdAt >= since && createdAt <= until
          })
          
          console.log(`Day filter for ${label}: ${filteredConversations.length} of ${allConversations.length} conversations`)
        } else if (type === 'range' && dateFrom && dateTo) {
          const fromDate = new Date(dateFrom + 'T00:00:00')
          const since = Math.floor(fromDate.getTime() / 1000)
          
          const toDate = new Date(dateTo + 'T23:59:59')
          const until = Math.floor(toDate.getTime() / 1000)
          
          filteredConversations = allConversations.filter((conv: any) => {
            const createdAt = conv.created_at || 0
            return createdAt >= since && createdAt <= until
          })
          
          console.log(`Range filter for ${label}: ${filteredConversations.length} of ${allConversations.length} conversations (${dateFrom} to ${dateTo})`)
        }
        
        metrics[label] = filteredConversations.length
        console.log(`Label ${label}: ${filteredConversations.length} conversations`)
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
