# Countdown Synchronization Flow Diagram

```mermaid
sequenceDiagram
    participant Host as Host Player
    participant Server as Game Server
    participant Player1 as Player 1 (Good Signal)
    participant Player2 as Player 2 (Poor Signal)

    Note over Host,Player2: Game Start Phase
    Host->>Server: POST /api/rooms/[code]/start-countdown
    Server->>Server: Set countdown_start_time = now()
    Server->>Server: Set countdown_duration = 10s
    Server->>Server: Update room status = "countdown"

    Note over Host,Player2: Countdown Phase
    Host->>Server: GET /api/rooms/[code]/countdown-state
    Server-->>Host: { countdownState: {remaining: 10}, serverTime: 1000 }

    Player1->>Server: GET /api/rooms/[code]/countdown-state
    Server-->>Player1: { countdownState: {remaining: 9}, serverTime: 2000 }

    Player2->>Server: GET /api/rooms/[code]/countdown-state
    Note over Player2: Network delay...
    Server-->>Player2: { countdownState: {remaining: 7}, serverTime: 4000 }

    Note over Host,Player2: Synchronization Process
    loop Every 1 second
        Host->>Server: GET countdown-state
        Server-->>Host: Server-synchronized countdown

        Player1->>Server: GET countdown-state
        Server-->>Player1: Server-synchronized countdown

        Player2->>Server: GET countdown-state
        alt Network OK
            Server-->>Player2: Server-synchronized countdown
        else Network Poor
            Note over Player2: Connection timeout
            Player2->>Player2: Show "RECONNECTING..."
            Player2->>Server: Retry after 2s
            Server-->>Player2: Server-synchronized countdown
        end
    end

    Note over Host,Player2: Heartbeat Monitoring
    loop Every 5 seconds
        Host->>Server: POST /api/rooms/[code]/heartbeat
        Player1->>Server: POST /api/rooms/[code]/heartbeat
        Player2->>Server: POST /api/rooms/[code]/heartbeat
        Server->>Server: Update last_heartbeat timestamps
    end

    Note over Host,Player2: Countdown Complete
    Server->>Server: countdownState.remaining = 0
    Host->>Server: GET countdown-state
    Server-->>Host: { countdownState: {remaining: 0, isActive: false} }
    Host->>Host: Redirect to quiz page

    Player1->>Server: GET countdown-state
    Server-->>Player1: { countdownState: {remaining: 0, isActive: false} }
    Player1->>Player1: Redirect to quiz page

    Player2->>Server: GET countdown-state
    Server-->>Player2: { countdownState: {remaining: 0, isActive: false} }
    Player2->>Player2: Redirect to quiz page
```

## Key Features Illustrated:

1. **Server Authority**: Server adalah sumber kebenaran tunggal untuk waktu countdown
2. **Network Resilience**: Player dengan sinyal jelek tetap mendapat countdown yang sinkron
3. **Automatic Reconnection**: Player2 otomatis reconnect jika koneksi terputus
4. **Heartbeat Monitoring**: Server memantau status koneksi semua player
5. **Synchronized Completion**: Semua player selesai countdown pada waktu yang sama

## Benefits:

- ✅ **Consistent Timing**: Semua player melihat countdown yang sama
- ✅ **Network Tolerance**: Bekerja meskipun ada masalah koneksi
- ✅ **Real-time Sync**: Update setiap detik dengan sinkronisasi server
- ✅ **User Feedback**: Indikator koneksi yang jelas
- ✅ **Auto Recovery**: Otomatis reconnect tanpa intervensi user
