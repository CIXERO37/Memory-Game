import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
	const url = new URL(req.url)

	// Pretty join URL: /join/ABC123 → internally rewrite to /join?room=ABC123
	if (url.pathname.startsWith('/join/')) {
		const parts = url.pathname.split('/').filter(Boolean)
		const code = parts[1]
		if (code) {
			return NextResponse.rewrite(new URL(`/join?room=${code}`, req.url))
		}
	}

	// Redirect old lobby route with search param to the new path-based route
	if (url.pathname === '/lobby') {
		const code = url.searchParams.get('roomCode')
		if (code) {
			return NextResponse.redirect(new URL(`/host/${code}`, req.url))
		}
	}

	// Redirect old monitor route with search param to the new path-based route
	if (url.pathname === '/monitor') {
		const code = url.searchParams.get('roomCode')
		if (code) {
			return NextResponse.redirect(new URL(`/host/${code}/monitor`, req.url))
		}
	}

	// Redirect old leaderboard route with search param to the new host path
	if (url.pathname === '/leaderboard') {
		const code = url.searchParams.get('roomCode')
		if (code) {
			return NextResponse.redirect(new URL(`/host/leaderboad`, req.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/join/:path*', '/lobby', '/monitor', '/leaderboard'],
}


