// No imports — uses Supabase REST API and Gemini REST API directly via fetch.
// This avoids esm.sh import failures that cause BOOT_ERROR on Supabase Edge Functions.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')  ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const GEMINI_KEY   = Deno.env.get('GEMINI_API_KEY') ?? ''
const DAY_NAMES    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const cors         = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const JSON_HEADERS = { ...cors, 'Content-Type': 'application/json' }

function pad(n: number) { return String(n).padStart(2, '0') }

async function dbGet(path: string, jwt: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: jwt, Accept: 'application/json' },
  })
  return r.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const jwt = req.headers.get('Authorization') ?? ''
    if (!jwt) return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: JSON_HEADERS })

    // Resolve user ID from JWT
    const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: jwt },
    })
    const me = await meRes.json()
    if (!me?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS })
    const uid = me.id

    // Habits
    const habits = await dbGet(`habits?select=id,name,emoji,streak&user_id=eq.${uid}&order=created_at`, jwt)
    if (!Array.isArray(habits) || habits.length === 0) {
      return new Response(JSON.stringify({
        message: "You haven't added any habits yet. Stop procrastinating and add something worth tracking. Come back when you've got something to show me.",
      }), { headers: JSON_HEADERS })
    }

    // Last 30 days of completions
    const ago = new Date(); ago.setDate(ago.getDate() - 30)
    const from = `${ago.getFullYear()}-${pad(ago.getMonth() + 1)}-${pad(ago.getDate())}`
    const completions = await dbGet(
      `habit_completions?select=habit_id,completed_date&user_id=eq.${uid}&completed_date=gte.${from}`, jwt
    )
    const c: any[] = Array.isArray(completions) ? completions : []

    // Per-habit stats
    const habitStats = habits.map((h: any) => {
      const done = c.filter((x: any) => x.habit_id === h.id).length
      return { name: h.name, emoji: h.emoji, streak: h.streak, done, pct: Math.round((done / 30) * 100) }
    })

    // Day-of-week breakdown
    const dayCounts = Array(7).fill(0), dayOcc = Array(7).fill(0)
    c.forEach((x: any) => { dayCounts[new Date(x.completed_date + 'T00:00:00').getDay()]++ })
    for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); dayOcc[d.getDay()]++ }
    const dayStats = DAY_NAMES.map((name, i) => ({
      day: name, avg: dayOcc[i] > 0 ? +(dayCounts[i] / dayOcc[i]).toFixed(1) : 0,
    }))
    const best        = dayStats.reduce((a, b) => a.avg > b.avg ? a : b)
    const worst       = dayStats.reduce((a, b) => a.avg < b.avg ? a : b)
    const mostSkipped = habitStats.reduce((a: any, b: any) => a.pct < b.pct ? a : b)
    const bestHabit   = habitStats.reduce((a: any, b: any) => a.pct > b.pct ? a : b)

    const last7 = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      last7.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
    }
    const activeLast7 = new Set(
      c.filter((x: any) => last7.has(x.completed_date)).map((x: any) => x.completed_date)
    ).size

    // Pre-build the 5 sentence facts — filter null/empty names so join never produces "X and "
    const sortedByPct = [...habitStats].sort((a: any, b: any) => b.pct - a.pct)
    const topHabits = sortedByPct.slice(0, Math.max(1, Math.ceil(habitStats.length / 2)))
    const validTopNames = topHabits.map((h: any) => h.name).filter((n: any) => n && String(n).trim().length > 0)
    const topNames = validTopNames.length > 0 ? validTopNames.join(', ') : (habitStats[0]?.name ?? 'your habits')

    const validMostSkippedName = (mostSkipped.name && String(mostSkipped.name).trim().length > 0) ? mostSkipped.name : 'one of your habits'

    const fact1 = `This week you did a great job staying consistent with ${topNames}.`
    const fact2 = `${best.day} was your strongest day in the last 30 days, and ${worst.day} is the day when you struggle the most.`
    const fact3 = `${mostSkipped.emoji ?? ''} ${validMostSkippedName} is the habit that you skip most often.`.trim()
    const fact4 = `Your biggest win was completing at least one habit on ${activeLast7} out of 7 days.`
    const fact5 = `Next week, focus on just improving your ${worst.day} routine.`

    console.log('facts:', JSON.stringify({ fact1, fact2, fact3, fact4, fact5 }))

    const prompt = `You are a David Goggins-style AI coach. Rewrite the following 5 sentences in David Goggins' voice — intense, direct, zero excuses, brutally honest but acknowledging real wins. Keep every specific name, day, number, and emoji exactly as written. Output exactly 5 sentences separated by a single space, nothing else, no line breaks between them.

Sentence 1: ${fact1}
Sentence 2: ${fact2}
Sentence 3: ${fact3}
Sentence 4: ${fact4}
Sentence 5: ${fact5}`

    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.9,
            // gemini-2.5-flash enables "thinking" by default, which silently
            // consumes the token budget and truncates the answer. Disable it.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )
    const gData = await gRes.json()
    if (!gRes.ok) throw new Error(gData?.error?.message ?? 'Gemini error')
    const text: string = gData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return new Response(JSON.stringify({ message: text }), { headers: JSON_HEADERS })
  } catch (err) {
    console.error('ai-coach:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: JSON_HEADERS })
  }
})
