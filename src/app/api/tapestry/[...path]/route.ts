import { NextRequest, NextResponse } from 'next/server'

const TAPESTRY_BASE = 'https://api.usetapestry.dev/api/v1'
const API_KEY = process.env.NEXT_PUBLIC_TAPESTRY_API_KEY

type Context = { params: Promise<{ path: string[] }> }

async function handler(request: NextRequest, { params }: Context) {
  const { path } = await params
  const pathStr = path.join('/')

  const upstreamUrl = new URL(`${TAPESTRY_BASE}/${pathStr}`)

  // Forward any query params from client, then inject the API key server-side
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'apiKey') upstreamUrl.searchParams.set(key, value)
  })
  upstreamUrl.searchParams.set('apiKey', API_KEY ?? '')

  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
    ? await request.text()
    : undefined

  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  })

  const text = await upstream.text()

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    data = { message: text }
  }

  return NextResponse.json(data, { status: upstream.status })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
