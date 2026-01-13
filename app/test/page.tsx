"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
    supabasePlayers, sessionsApi, isPlayersSupabaseConfigured
} from "@/lib/supabase-players";
import { supabase } from "@/lib/supabase";
import { Play, Trash2, StopCircle } from "lucide-react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAdminGuard } from "@/lib/admin-guard";
import { BotInstance } from "@/components/test/BotInstance";

// Static local avatars (ava1-16.webp)
const LOCAL_AVATARS = Array.from({ length: 16 }, (_, i) => `/ava${i + 1}.webp`);

// Import Indonesian names from JSON
import indonesianNames from "@/data/indonesian-names.json";

// Helper to pick random from array
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Unique nickname generator class to avoid duplicates
class UniqueNicknameGenerator {
    private usedNames: Set<string> = new Set();
    private firstNames: string[];
    private middleNames: string[];
    private lastNames: string[];

    constructor() {
        this.firstNames = indonesianNames.firstNames;
        this.middleNames = indonesianNames.middleNames;
        this.lastNames = indonesianNames.lastNames;
    }

    generate(): string {
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            // Random format: 1-4 words
            const wordCount = Math.floor(Math.random() * 4) + 1;
            let nickname: string;

            if (wordCount === 1) {
                // Just first name
                nickname = pickRandom(this.firstNames);
            } else if (wordCount === 2) {
                // First + Last
                nickname = `${pickRandom(this.firstNames)} ${pickRandom(this.lastNames)}`;
            } else if (wordCount === 3) {
                // First + Middle + Last
                nickname = `${pickRandom(this.firstNames)} ${pickRandom(this.middleNames)} ${pickRandom(this.lastNames)}`;
            } else {
                // First + Middle1 + Middle2 + Last
                nickname = `${pickRandom(this.firstNames)} ${pickRandom(this.middleNames)} ${pickRandom(this.middleNames)} ${pickRandom(this.lastNames)}`;
            }

            if (!this.usedNames.has(nickname)) {
                this.usedNames.add(nickname);
                return nickname;
            }
            attempts++;
        }

        // Fallback: use full 4-word format for guaranteed uniqueness
        const fallback = `${pickRandom(this.firstNames)} ${pickRandom(this.middleNames)} ${pickRandom(this.middleNames)} ${pickRandom(this.lastNames)}`;
        this.usedNames.add(fallback);
        return fallback;
    }

    reset(): void {
        this.usedNames.clear();
    }
}

interface TestUser {
    id: string;
    nickname: string;
    currentQuestion: number;
    correctAnswers: number;
    score: number;
    completed: boolean;
}

interface SessionData {
    id: string;
    game_pin: string;
    status: string;
    settings: {
        questionCount: number;
        totalTimeLimit: number;
    };
    questions: any[];
}

export default function TestPage() {
    // Admin guard - only admins can access this page
    const { isAdmin, loading: adminLoading } = useAdminGuard();

    const [roomCode, setRoomCode] = useState("");
    const [userCount, setUserCount] = useState(100);
    const [isRunning, setIsRunning] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const [joinedCount, setJoinedCount] = useState(0);
    const [answeringCount, setAnsweringCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [gameEnded, setGameEnded] = useState(false);
    const [showCleanupDialog, setShowCleanupDialog] = useState(false);
    const [isCleaningUp, setIsCleaningUp] = useState(false);

    const stopRef = useRef(false);
    const usersRef = useRef<TestUser[]>([]);
    const sessionChannelRef = useRef<any>(null);
    const firstBotFinishedRef = useRef(false);
    const nicknameGeneratorRef = useRef(new UniqueNicknameGenerator());
    const gameStatusRef = useRef<string>("waiting");

    // State to control bot component rendering
    const [isTestActive, setIsTestActive] = useState(false);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 199)]);
    }, []);

    // Random delay between min and max milliseconds
    const randomDelayRange = (minMs: number, maxMs: number) =>
        new Promise(resolve => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));

    // Fetch session - try Supabase B first, create from Supabase A if needed
    const fetchSession = async (code: string): Promise<SessionData | null> => {
        if (!isPlayersSupabaseConfigured()) {
            addLog(`❌ Players Supabase not configured`);
            return null;
        }

        // Try Supabase B first
        let sessionB = await sessionsApi.getSession(code);

        if (sessionB) {
            // Don't log every time - only first time is logged by caller
            return {
                id: sessionB.id,
                game_pin: sessionB.game_pin,
                status: sessionB.status,
                settings: sessionB.settings,
                questions: sessionB.questions || []
            };
        }

        // Not found in Supabase B - try to get from Supabase A and create in B
        addLog(`⚠️ Session not in Supabase B, checking Supabase A...`);

        const { data: sessionA, error } = await supabase
            .from("game_sessions")
            .select("id, game_pin, host_id, quiz_id, quiz_detail, status, total_time_minutes, question_limit, current_questions")
            .eq("game_pin", code)
            .single();

        if (error || !sessionA) {
            addLog(`❌ Session not found in any database: ${code}`);
            return null;
        }

        addLog(`📋 Found session in Supabase A, creating in Supabase B...`);

        // Calculate settings
        const questionCount = sessionA.question_limit === 'all'
            ? (sessionA.current_questions?.length || 0)
            : parseInt(sessionA.question_limit || '10');

        // Create session in Supabase B
        const newSessionB = await sessionsApi.createSession({
            game_pin: sessionA.game_pin,
            host_id: sessionA.host_id,
            quiz_id: sessionA.quiz_id,
            quiz_title: sessionA.quiz_detail?.title || 'Quiz',
            settings: {
                questionCount,
                totalTimeLimit: (sessionA.total_time_minutes || 5) * 60
            },
            questions: sessionA.current_questions || []
        });

        if (!newSessionB) {
            addLog(`❌ Failed to create session in Supabase B`);
            return null;
        }

        // Update status if needed
        if (sessionA.status !== 'waiting') {
            await sessionsApi.updateStatus(sessionA.game_pin, sessionA.status as any);
        }

        addLog(`✅ Session synced to Supabase B`);
        return {
            id: newSessionB.id,
            game_pin: newSessionB.game_pin,
            status: sessionA.status,
            settings: newSessionB.settings,
            questions: newSessionB.questions || []
        };
    };

    // Subscribe to session changes (detect game end)
    const subscribeToSession = (gamePin: string) => {
        sessionChannelRef.current = sessionsApi.subscribeToSession(gamePin, (sessionUpdate) => {
            if (!sessionUpdate) {
                addLog("🗑️ Session deleted by host!");
                setGameEnded(true);
                stopRef.current = true;
                gameStatusRef.current = "finished";
                setIsTestActive(false);
            } else if (sessionUpdate.status === "finished") {
                addLog("🛑 Host ended the game!");
                setGameEnded(true);
                stopRef.current = true;
                gameStatusRef.current = "finished";
                setIsTestActive(false);
            } else if (sessionUpdate.status === "active") {
                addLog("🎮 Game started by host!");
                gameStatusRef.current = "active";
            }
        });
    };

    // NOTE: Old procedural functions removed - now using BotInstance components

    // Main test runner - now just sets up session and enables bot rendering
    const startTest = async () => {
        if (!roomCode.trim()) {
            addLog("❌ Enter room code");
            return;
        }

        if (!isPlayersSupabaseConfigured()) {
            addLog("❌ Players Supabase not configured");
            return;
        }

        setIsRunning(true);
        setGameEnded(false);
        stopRef.current = false;
        firstBotFinishedRef.current = false;
        nicknameGeneratorRef.current.reset();
        gameStatusRef.current = "waiting";
        setLogs([]);
        setJoinedCount(0);
        setAnsweringCount(0);
        setCompletedCount(0);
        setErrorCount(0);
        usersRef.current = [];

        addLog(`🧪 Starting test: ${roomCode}`);

        const sess = await fetchSession(roomCode);
        if (!sess) {
            setIsRunning(false);
            return;
        }
        setSession(sess);
        gameStatusRef.current = sess.status;
        subscribeToSession(sess.game_pin);
        addLog(`✅ Session found: ${sess.status}`);
        addLog(`🤖 Spawning ${userCount} bots with IQ-based intelligence...`);

        // Enable bot component rendering (bots will join and answer autonomously)
        setIsTestActive(true);
    };

    const stopTest = () => {
        stopRef.current = true;
        setIsTestActive(false);
        setIsRunning(false);
        addLog("⛔ Test stopped");
    };

    const cleanupUsers = async () => {
        if (!session?.game_pin) return;
        setIsCleaningUp(true);
        addLog("🧹 Cleaning up bots...");

        // Delete non-host participants from Supabase B
        // This removes all bots created by test (they are not hosts)
        const botIds = usersRef.current.map(u => u.id);

        if (botIds.length > 0) {
            // Try to delete by IDs first (more precise)
            const { error } = await supabasePlayers
                .from("game_participants")
                .delete()
                .eq("game_pin", session.game_pin)
                .in("id", botIds);

            if (error) {
                addLog(`❌ Cleanup error: ${error.message}`);
            } else {
                addLog(`✅ Cleaned up ${botIds.length} bots`);
            }
        } else {
            // Fallback: delete all non-host participants
            const { error } = await supabasePlayers
                .from("game_participants")
                .delete()
                .eq("game_pin", session.game_pin)
                .eq("is_host", false);

            if (error) {
                addLog(`❌ Cleanup error: ${error.message}`);
            } else {
                addLog("✅ Cleanup complete");
            }
        }

        usersRef.current = [];
        setJoinedCount(0);
        setCompletedCount(0);
        setIsCleaningUp(false);
        setShowCleanupDialog(false);
    };

    // Show loading state while checking admin status
    if (adminLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // If not admin, useAdminGuard will redirect - this is just a fallback
    if (!isAdmin) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
                <div className="text-center">
                    <p className="text-red-400 text-lg">Access Denied</p>
                    <p className="text-gray-400 text-sm mt-2">Admin role required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden font-sans" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>

            {/* Pixel Grid Overlay */}
            <div className="absolute inset-0 opacity-20">
                <div className="pixel-grid"></div>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="absolute inset-0 overflow-y-auto z-10">
                {/* Header */}
                <div className="w-full px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/images/memoryquizv4.webp"
                            alt="Memory Quiz"
                            width={150}
                            height={50}
                            className="h-auto drop-shadow-xl hidden md:block"
                        />
                    </div>
                    <Image
                        src="/images/gameforsmartlogo.webp"
                        alt="GameForSmart Logo"
                        width={200}
                        height={70}
                        className="hidden md:block"
                    />
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto p-4 pt-0 space-y-4">
                    {/* Title */}
                    <div className="text-center">
                        <div className="inline-block pb-2">
                            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                                TEST
                            </h1>
                        </div>
                    </div>

                    {/* Control Panel */}
                    <Card className="bg-[#1a1a2e]/80 border-purple-500/50 backdrop-blur-sm">
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-cyan-400 font-medium">Room Code</label>
                                    <Input
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="XXXXXX"
                                        className="bg-[#0a0a1a] border-purple-500/50 text-white mt-1"
                                        disabled={isRunning}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-cyan-400 font-medium">
                                        Bots: <span className="text-purple-400">{userCount}</span>
                                    </label>
                                    <Slider
                                        value={[userCount]}
                                        onValueChange={([v]) => setUserCount(v)}
                                        min={100}
                                        max={1000}
                                        step={100}
                                        disabled={isRunning}
                                        className="mt-3"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!isRunning ? (
                                    <Button
                                        onClick={startTest}
                                        className="flex-1 bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/40"
                                    >
                                        <Play className="w-4 h-4 mr-2" /> Start
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={stopTest}
                                        className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/40"
                                    >
                                        <StopCircle className="w-4 h-4 mr-2" /> Stop
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setShowCleanupDialog(true)}
                                    className="bg-purple-500/20 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/40"
                                    disabled={isRunning || !session}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Cleanup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-[#1a1a2e]/80 border-cyan-500/50 py-3">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-cyan-400">{joinedCount}</div>
                                <div className="text-xs text-cyan-400/70">Joined</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-purple-500/50 py-3">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-purple-400">{answeringCount}</div>
                                <div className="text-xs text-purple-400/70">Question</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-green-500/50 py-3">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-green-400">{completedCount}</div>
                                <div className="text-xs text-green-400/70">Completed</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-red-500/50 py-3">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-red-400">{errorCount}</div>
                                <div className="text-xs text-red-400/70">Errors</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logs */}
                    <Card className="bg-[#1a1a2e]/80 border-purple-500/30 gap-3">
                        <CardHeader>
                            <CardTitle className="text-sm text-purple-400">📜 Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 overflow-y-auto bg-black/60 rounded-lg p-3 font-mono text-xs space-y-0.5 border border-purple-500/20 custom-scrollbar">
                                {logs.length === 0 ? (
                                    <div className="text-gray-500">Waiting for test to start...</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div
                                            key={i}
                                            className={`${log.includes("✓") || log.includes("✅") ? "text-green-400" :
                                                log.includes("❌") ? "text-red-400" :
                                                    log.includes("🏁") ? "text-yellow-400" :
                                                        log.includes("🎮") ? "text-purple-400" :
                                                            log.includes("🧠") ? "text-blue-400" :
                                                                "text-gray-300"
                                                }`}
                                        >
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bot Components - Rendered when test is active (no UI, just logic) */}
            {isTestActive && session && Array.from({ length: userCount }, (_, i) => (
                <BotInstance
                    key={`bot-${i}-${session.game_pin}`}
                    botId={i}
                    gamePin={session.game_pin}
                    sessionId={session.id}
                    avatarOptions={LOCAL_AVATARS}
                    nicknameGenerator={nicknameGeneratorRef.current}
                    onJoined={(name) => {
                        setJoinedCount(c => c + 1);
                        addLog(`✅ ${name} joined`);
                    }}
                    onAnswered={(name, q, isCorrect) => {
                        setAnsweringCount(prev => Math.max(prev, q));
                        if (q % 5 === 0 || isCorrect) {
                            addLog(`${name}: Q${q}${isCorrect ? ' ✓' : ''}`);
                        }
                    }}
                    onCompleted={(name) => {
                        setCompletedCount(c => c + 1);
                        // First bot to complete triggers game end
                        if (!firstBotFinishedRef.current) {
                            firstBotFinishedRef.current = true;
                            addLog(`🏁 ${name} finished first!`);
                            // End game for all bots
                            stopRef.current = true;
                            setCompletedCount(userCount); // All are "completed"
                            setGameEnded(true);
                            setIsTestActive(false);
                            setIsRunning(false);
                            // Update session status
                            sessionsApi.updateStatus(session.game_pin, 'finished');
                            addLog(`🎉 Test completed!`);
                        }
                    }}
                    onError={(name, err) => {
                        setErrorCount(c => c + 1);
                        addLog(`❌ ${name}: ${err}`);
                    }}
                    stopSignal={stopRef}
                    gameStatus={gameStatusRef}
                />
            ))}

            {/* Cleanup Confirmation Dialog */}
            <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
                <DialogOverlay className="bg-black/70 backdrop-blur-sm fixed inset-0 z-50" />
                <DialogContent className="bg-[#1a1a2e]/95 border-2 border-purple-500 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-purple-400 text-center">
                            🗑️ Cleanup Bots
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-300 text-sm mt-4">
                            Are you sure you want to delete all bots from this session?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowCleanupDialog(false)}
                            disabled={isCleaningUp}
                            className="flex-1 bg-[#0a0a0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={cleanupUsers}
                            disabled={isCleaningUp}
                            className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/40"
                        >
                            {isCleaningUp ? "Cleaning..." : "Delete All"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
