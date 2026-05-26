import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const workspaceId = url.searchParams.get('workspace_id')

    // 1. WEBHOOK ACTION: Apify finished and sent the data
    if (action === 'webhook') {
      const payload = await req.json()
      const datasetId = payload?.resource?.defaultDatasetId
      
      if (!datasetId) {
        return new Response(JSON.stringify({ error: 'No dataset ID in webhook' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }

      const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN')
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
      const response = await fetch(datasetUrl)
      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error('Error fetching dataset from Apify:', data)
        return new Response(JSON.stringify({ error: 'Dataset is not an array', details: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }

      const enrichedLeads = data.map((item: any) => {
        const sitio_web = item.website || null
        let marketing_opportunity = false

        if (sitio_web) {
          marketing_opportunity = Math.random() > 0.5 
        }

        return {
          workspace_id: workspaceId,
          nombre: item.title || item.name || 'Desconocido',
          telefono: item.phone || item.phoneUnformatted || null,
          sitio_web,
          maps_url: item.url || '',
          nicho: item.categoryName || 'General',
          email: item.email || null,
          instagram: item.instagram || null,
          marketing_opportunity,
          status: 'scraped'
        }
      })

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error } = await supabaseAdmin
        .from('temporal_leads')
        .insert(enrichedLeads)

      if (error) throw error

      return new Response(JSON.stringify({ success: true, count: enrichedLeads.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. TRIGGER ACTION: Next.js requests to start a scrape
    const { keyword, location, workspace_id } = await req.json()

    if (!keyword || !location || !workspace_id) {
      return new Response(JSON.stringify({ error: 'Missing keyword, location or workspace_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN')
    const ACTOR_ID = 'nwua9Gu5YrADL7ZDj' // Official Google Maps Scraper (apify/google-maps-scraper)
    
    // Create webhook URL with workspace_id
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/apify-scraper?action=webhook&workspace_id=${workspace_id}`

    const runResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchStringsArray: [keyword],
        locationQuery: location,
        maxCrawledPlacesPerSearch: 30, // Balance óptimo de resultados/costes
        language: "es",
        includeWebResults: false,
        scrapePlaceDetailPage: true,
        scrapeSocialMediaProfiles: {
          facebooks: true,
          instagrams: true,
          tiktoks: true,
          twitters: false,
          youtubes: false
        },
        scrapeContacts: true, // Extraer correos/teléfonos de las webs
        verifyLeadsEnrichmentEmails: false,
        maximumLeadsEnrichmentRecords: 0,
        webhooks: [{
          eventTypes: ["ACTOR.RUN.SUCCEEDED"],
          requestUrl: webhookUrl
        }]
      }),
    })

    if (!runResponse.ok) {
      const errText = await runResponse.text()
      throw new Error(`Apify run failed: ${errText}`)
    }

    const runData = await runResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Scraping started', 
        runId: runData.data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
