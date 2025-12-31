"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
    supabasePlayers, participantsApi, sessionsApi, isPlayersSupabaseConfigured
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

// Avatar styles using DiceBear API (same as test-100-players.html)
const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'pixel-art', 'thumbs'];

// Generate random avatar URL using DiceBear API
const generateAvatarUrl = (seed: string) => {
    const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};

// Random name generators (same as test-100-players.html)
const adjectives = ['Happy', 'Swift', 'Brave', 'Clever', 'Mighty', 'Silent', 'Cosmic', 'Thunder', 'Shadow', 'Golden'];
const nouns = ['Tiger', 'Dragon', 'Phoenix', 'Wolf', 'Eagle', 'Lion', 'Hawk', 'Bear', 'Shark', 'Falcon'];

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

export default function StressTestPage() {
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

    // Answer interval settings (in seconds)
    const [answerIntervalMin, setAnswerIntervalMin] = useState(3);
    const [answerIntervalMax, setAnswerIntervalMax] = useState(10);

    const stopRef = useRef(false);
    const usersRef = useRef<TestUser[]>([]);
    const sessionChannelRef = useRef<any>(null);
    const firstBotFinishedRef = useRef(false);

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
            } else if (sessionUpdate.status === "finished") {
                addLog("🛑 Host ended the game!");
                setGameEnded(true);
                stopRef.current = true;
            } else if (sessionUpdate.status === "active") {
                addLog("🎮 Game started by host!");
            }
        });
    };

    // Phase 1: Join all users CONCURRENTLY with random delays (1-10s each)
    const joinUsersConcurrently = async (gamePin: string) => {
        addLog(`🚀 Joining ${userCount} users concurrently (1-10s delays)...`);

        const joinPromises = Array.from({ length: userCount }, async (_, i) => {
            // Each bot has random delay 1-10 seconds
            await randomDelayRange(1000, 10000);

            if (stopRef.current) return null;

            const playerId = participantsApi.generatePlayerId();
            // Generate random nickname like test-100-players.html
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const num = Math.floor(Math.random() * 1000);
            const nickname = `${adj}${noun}${num}`;
            const avatar = generateAvatarUrl(`bot-${playerId}`);

            const result = await participantsApi.addParticipant(
                gamePin,
                playerId,
                nickname,
                avatar,
                false // not host
            );

            if (!result) {
                setErrorCount(prev => prev + 1);
                addLog(`❌ ${nickname} failed to join`);
                return null;
            }

            setJoinedCount(prev => prev + 1);
            addLog(`✅ ${nickname} joined`);
            return {
                id: playerId,
                nickname,
                currentQuestion: 0,
                correctAnswers: 0,
                score: 0,
                completed: false
            } as TestUser;
        });

        const results = await Promise.all(joinPromises);
        const users = results.filter(Boolean) as TestUser[];
        usersRef.current = users;
        addLog(`📊 Total joined: ${users.length} users`);
    };

    // Phase 2: Lobby - Wait for game to start (silent polling)
    const waitForGameStart = async () => {
        addLog("⏳ Waiting for host to start game...");

        while (!stopRef.current) {
            // Silent check - don't log every poll
            const sess = await sessionsApi.getSession(roomCode);
            if (sess?.status === "active") {
                addLog("🎮 Game started! Bots will answer...");
                break;
            }
            // Check every 3 seconds
            await randomDelayRange(2500, 3500);
        }
    };

    // Phase 3: Each bot answers independently with configurable intervals
    const answerQuestionsIndependently = async (questions: any[]) => {
        const totalQuestions = questions.length;
        const scorePerQuestion = Math.max(1, Math.round(100 / totalQuestions));

        addLog(`📝 Starting quiz with ${totalQuestions} questions...`);
        addLog(`🤖 Each bot thinks independently (${answerIntervalMin}-${answerIntervalMax}s per answer)...`);

        // Each bot runs independently
        const botPromises = usersRef.current.map(async (user) => {
            let localCorrectAnswers = 0;
            let localScore = 0;

            for (let qIndex = 0; qIndex < totalQuestions; qIndex++) {
                if (stopRef.current || user.completed) break;

                // Random thinking time based on user settings
                await randomDelayRange(answerIntervalMin * 1000, answerIntervalMax * 1000);
                if (stopRef.current) break;

                const question = questions[qIndex];

                // Generate random answer (0-3 for 4 options, or based on options length)
                const optionsCount = question.options?.length || 4;
                const randomAnswer = Math.floor(Math.random() * optionsCount);

                // Determine if correct (50% chance for simulation)
                const isCorrect = Math.random() > 0.5;
                const pointsEarned = isCorrect ? scorePerQuestion : 0;

                if (isCorrect) {
                    localCorrectAnswers++;
                    localScore = Math.round((localCorrectAnswers / totalQuestions) * 100);
                }

                // Save answer to Supabase B
                const answerData = {
                    question_id: String(question.id || qIndex + 1),
                    answer_id: String(randomAnswer),
                    is_correct: isCorrect,
                    points_earned: pointsEarned
                };

                // Check if game already ended before submitting
                if (stopRef.current) break;

                try {
                    // Add answer to player's answers array
                    await participantsApi.addAnswer(
                        roomCode,
                        user.id,
                        answerData
                    );

                    // Check again after DB operation
                    if (stopRef.current) break;

                    // Update score (this updates questionsAnswered)
                    await participantsApi.updateScore(
                        roomCode,
                        user.id,
                        localScore,
                        qIndex + 1
                    );

                    // Check again - game might have ended
                    if (stopRef.current) break;

                    user.currentQuestion = qIndex + 1;
                    user.correctAnswers = localCorrectAnswers;
                    user.score = localScore;

                    // Only log every 5 answers or correct answers to reduce noise
                    if (isCorrect || (qIndex + 1) % 5 === 0 || qIndex === totalQuestions - 1) {
                        addLog(`${user.nickname}: Q${qIndex + 1}/${totalQuestions}${isCorrect ? ' ✓' : ''} (${localScore}pts)`);
                    }
                    setAnsweringCount(prev => Math.max(prev, qIndex + 1));

                    if (qIndex === totalQuestions - 1) {
                        user.completed = true;
                        setCompletedCount(prev => prev + 1);

                        // 🚀 TRIGGER GAME END: When first bot finishes, end game for all
                        if (!firstBotFinishedRef.current && !stopRef.current) {
                            firstBotFinishedRef.current = true;
                            stopRef.current = true; // Stop all other bots IMMEDIATELY
                            addLog(`🏁 ${user.nickname} finished first! Ending game...`);

                            try {
                                // Update game status to finished
                                await sessionsApi.updateStatus(roomCode, 'finished');
                                addLog(`🛑 Game ended`);

                                // 🚀 SET COMPLETED COUNT TO ALL JOINED USERS
                                // Since 1 finish = all finish, all joined users are "completed"
                                setCompletedCount(usersRef.current.length);

                                // 🚀 SYNC TO SUPABASE A: Forward final scores AND responses to main database
                                addLog(`📤 Syncing to main database...`);
                                const allParticipants = await participantsApi.getParticipants(roomCode);

                                // Get current session from Supabase A
                                const { data: sessionA } = await supabase
                                    .from("game_sessions")
                                    .select("participants, responses")
                                    .eq("game_pin", roomCode)
                                    .single();

                                // Merge bot scores into participants JSONB
                                const existingParticipants = Array.isArray(sessionA?.participants)
                                    ? [...sessionA.participants]
                                    : [];

                                // Existing responses (keep real user responses)
                                const existingResponses = Array.isArray(sessionA?.responses)
                                    ? [...sessionA.responses]
                                    : [];

                                // Update or add bot participants AND build responses
                                for (const bot of allParticipants) {
                                    // Skip host
                                    if (bot.is_host) continue;

                                    // Participant data
                                    const existingIndex = existingParticipants.findIndex(
                                        (p: any) => p.id === bot.id || p.nickname === bot.nickname
                                    );
                                    const botData = {
                                        id: bot.id,
                                        nickname: bot.nickname,
                                        avatar: bot.avatar,
                                        is_host: bot.is_host,
                                        is_ready: true,
                                        score: bot.score,
                                        questions_answered: bot.questions_answered,
                                        joined_at: bot.joined_at
                                    };
                                    if (existingIndex >= 0) {
                                        existingParticipants[existingIndex] = botData;
                                    } else {
                                        existingParticipants.push(botData);
                                    }

                                    // Response data (answers)
                                    const answers = Array.isArray(bot.answers) ? bot.answers : [];
                                    const correctCount = answers.filter((a: any) => a.is_correct).length;
                                    const responseData = {
                                        id: bot.id,
                                        participant: bot.id,
                                        nickname: bot.nickname,
                                        score: bot.score,
                                        answers: answers,
                                        correct: correctCount,
                                        accuracy: answers.length > 0
                                            ? ((correctCount / answers.length) * 100).toFixed(2)
                                            : "0.00",
                                        duration: 0,
                                        completion: true,
                                        total_question: answers.length
                                    };

                                    // Update or add response
                                    const responseIndex = existingResponses.findIndex(
                                        (r: any) => r.id === bot.id || r.participant === bot.id
                                    );
                                    if (responseIndex >= 0) {
                                        existingResponses[responseIndex] = responseData;
                                    } else {
                                        existingResponses.push(responseData);
                                    }
                                }

                                // Update Supabase A with participants AND responses
                                const { error: syncError } = await supabase
                                    .from("game_sessions")
                                    .update({
                                        participants: existingParticipants,
                                        responses: existingResponses,
                                        status: 'finished'
                                    })
                                    .eq("game_pin", roomCode);

                                if (syncError) {
                                    addLog(`⚠️ Sync warning: ${syncError.message}`);
                                } else {
                                    addLog(`✅ ${allParticipants.length} participants + responses synced`);
                                }

                                setGameEnded(true);
                            } catch (err) {
                                console.error('Error ending game:', err);
                                addLog(`❌ Error: ${err}`);
                            }
                        }
                    }
                } catch (err) {
                    if (!stopRef.current) {
                        setErrorCount(prev => prev + 1);
                        console.error(`Error for ${user.nickname}:`, err);
                    }
                }
            }
        });

        await Promise.all(botPromises);
        if (!firstBotFinishedRef.current) {
            addLog(`🎉 All bots completed!`);
        }
    };

    // Main test runner
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
        setLogs([]);
        setJoinedCount(0);
        setAnsweringCount(0);
        setCompletedCount(0);
        setErrorCount(0);
        usersRef.current = [];

        addLog(`🧪 Starting stress test: ${roomCode}`);

        const sess = await fetchSession(roomCode);
        if (!sess) {
            setIsRunning(false);
            return;
        }
        setSession(sess);
        subscribeToSession(sess.game_pin);
        addLog(`✅ Session found: ${sess.status}`);

        await joinUsersConcurrently(sess.game_pin);
        if (stopRef.current) { setIsRunning(false); return; }

        if (sess.status === "waiting") {
            await waitForGameStart();
        }
        if (stopRef.current) { setIsRunning(false); return; }

        // Refetch session to get latest questions
        const updatedSess = await fetchSession(roomCode);
        if (!updatedSess?.questions?.length) {
            addLog("❌ No questions found");
            setIsRunning(false);
            return;
        }

        await answerQuestionsIndependently(updatedSess.questions);

        setIsRunning(false);
        if (!stopRef.current) addLog("🎉 Test completed successfully!");
    };

    const stopTest = () => {
        stopRef.current = true;
        addLog("⛔ Test stopped");
    };

    const cleanupUsers = async () => {
        if (!session?.game_pin) return;
        setIsCleaningUp(true);
        addLog("🧹 Cleaning up bots...");

        // Delete non-host participants from Supabase B
        // This removes all bots created by stress test (they are not hosts)
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
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>

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
                                Stress Test
                            </h1>
                        </div>
                    </div>

                    {/* Control Panel */}
                    <Card className="bg-[#1a1a2e]/80 border-purple-500/50 backdrop-blur-sm">
                        <CardContent className="space-y-4 pt-6">
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
                                        min={50}
                                        max={500}
                                        step={50}
                                        disabled={isRunning}
                                        className="mt-3"
                                    />
                                </div>
                            </div>

                            {/* Answer Interval Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="text-sm text-cyan-400 font-medium">
                                        Min Interval: <span className="text-purple-400">{answerIntervalMin}s</span>
                                    </label>
                                    <Slider
                                        value={[answerIntervalMin]}
                                        onValueChange={([v]) => {
                                            setAnswerIntervalMin(v);
                                            if (v > answerIntervalMax) setAnswerIntervalMax(v);
                                        }}
                                        min={1}
                                        max={30}
                                        step={1}
                                        disabled={isRunning}
                                        className="mt-3"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-cyan-400 font-medium">
                                        Max Interval: <span className="text-purple-400">{answerIntervalMax}s</span>
                                    </label>
                                    <Slider
                                        value={[answerIntervalMax]}
                                        onValueChange={([v]) => {
                                            setAnswerIntervalMax(v);
                                            if (v < answerIntervalMin) setAnswerIntervalMin(v);
                                        }}
                                        min={1}
                                        max={60}
                                        step={1}
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
                                        <Play className="w-4 h-4 mr-2" /> Start Test
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
                        <Card className="bg-[#1a1a2e]/80 border-cyan-500/50">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-cyan-400">{joinedCount}</div>
                                <div className="text-xs text-cyan-400/70">Joined</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-purple-500/50">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-purple-400">{answeringCount}</div>
                                <div className="text-xs text-purple-400/70">Question</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-green-500/50">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-green-400">{completedCount}</div>
                                <div className="text-xs text-green-400/70">Completed</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1a1a2e]/80 border-red-500/50">
                            <CardContent className="p-3 text-center">
                                <div className="text-3xl font-bold text-red-400">{errorCount}</div>
                                <div className="text-xs text-red-400/70">Errors</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logs */}
                    <Card className="bg-[#1a1a2e]/80 border-purple-500/30 gap-3">
                        <CardHeader>
                            <CardTitle className="text-sm text-purple-400">📜 Live Logs</CardTitle>
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
