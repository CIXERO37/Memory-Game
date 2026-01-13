"use client";

import { useEffect, useRef } from "react";
import { supabasePlayers, participantsApi, sessionsApi } from "@/lib/supabase-players";

// ========== BOT BRAIN (IQ-based intelligence) ==========
class BotBrain {
    iq: number;

    constructor() {
        // Bell curve distribution: mean=100, stddev=15, range 70-130
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        this.iq = Math.max(70, Math.min(130, Math.round(100 + z * 15)));
    }

    // Join delay: IQ 70 → 8-10s, IQ 130 → 1-3s
    getJoinDelay(): number {
        const factor = (130 - this.iq) / 60; // 0 for IQ 130, 1 for IQ 70
        const min = 1000 + factor * 7000;    // 1s to 8s
        const max = 3000 + factor * 7000;    // 3s to 10s
        return min + Math.random() * (max - min);
    }

    // Answer delay: IQ 70 → 8-15s, IQ 130 → 3-6s
    getAnswerDelay(): number {
        const factor = (130 - this.iq) / 60;
        const min = 3000 + factor * 5000;    // 3s to 8s
        const max = 6000 + factor * 9000;    // 6s to 15s
        return min + Math.random() * (max - min);
    }

    // Accuracy: IQ 70 → 40%, IQ 130 → 95%
    getAccuracy(): number {
        return 0.4 + ((this.iq - 70) / 60) * 0.55;
    }

    // Decide answer: correct with probability = accuracy, else random
    chooseAnswer(correctIndex: number, totalOptions: number = 4): number {
        if (Math.random() < this.getAccuracy()) {
            return correctIndex;
        }
        // Pick random wrong answer
        let wrong = Math.floor(Math.random() * totalOptions);
        while (wrong === correctIndex && totalOptions > 1) {
            wrong = Math.floor(Math.random() * totalOptions);
        }
        return wrong;
    }
}

// ========== HELPER ==========
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== TYPES ==========
export interface BotInstanceProps {
    botId: number;
    gamePin: string;
    sessionId: string;
    avatarOptions: string[];
    nicknameGenerator: { generate: () => string };
    onJoined: (nickname: string) => void;
    onAnswered: (nickname: string, questionIndex: number, isCorrect: boolean) => void;
    onCompleted: (nickname: string) => void;
    onError: (nickname: string, error: string) => void;
    stopSignal: React.MutableRefObject<boolean>;
    gameStatus: React.MutableRefObject<string>;
}

// ========== BOT INSTANCE COMPONENT ==========
export function BotInstance({
    botId,
    gamePin,
    sessionId,
    avatarOptions,
    nicknameGenerator,
    onJoined,
    onAnswered,
    onCompleted,
    onError,
    stopSignal,
    gameStatus,
}: BotInstanceProps) {
    // Store all props in refs to avoid stale closure issues
    const propsRef = useRef({
        botId,
        gamePin,
        sessionId,
        avatarOptions,
        nicknameGenerator,
        onJoined,
        onAnswered,
        onCompleted,
        onError,
        stopSignal,
        gameStatus,
    });

    // Update refs when props change
    propsRef.current = {
        botId,
        gamePin,
        sessionId,
        avatarOptions,
        nicknameGenerator,
        onJoined,
        onAnswered,
        onCompleted,
        onError,
        stopSignal,
        gameStatus,
    };

    // Bot state refs
    const participantIdRef = useRef<string | null>(null);
    const nicknameRef = useRef("");
    const brainRef = useRef<BotBrain | null>(null);

    useEffect(() => {
        // Generate new brain and ID for each mount
        participantIdRef.current = participantsApi.generatePlayerId();
        brainRef.current = new BotBrain();

        const brain = brainRef.current;
        const participantId = participantIdRef.current;

        console.log(`[Bot ${botId}] Mounted with IQ ${brain.iq}`);

        let mounted = true;

        const runBot = async () => {
            const props = propsRef.current;

            try {
                // ========== PHASE 1: JOIN ==========
                const joinDelay = brain.getJoinDelay();
                console.log(`[Bot ${botId}] Waiting ${Math.round(joinDelay / 1000)}s to join...`);

                await delay(joinDelay);

                if (!mounted || props.stopSignal.current) {
                    console.log(`[Bot ${botId}] Stopped before joining`);
                    return;
                }

                // Generate nickname and avatar
                nicknameRef.current = props.nicknameGenerator.generate();
                const avatar = props.avatarOptions[Math.floor(Math.random() * props.avatarOptions.length)];

                console.log(`[Bot ${botId}] Joining as "${nicknameRef.current}"...`);

                // Direct insert to Supabase B (faster than wrapper)
                const { error: joinError } = await supabasePlayers
                    .from("game_participants")
                    .insert({
                        id: participantId,
                        session_id: props.sessionId,
                        game_pin: props.gamePin,
                        nickname: nicknameRef.current,
                        avatar,
                        is_host: false,
                        score: 0,
                        questions_answered: 0,
                        started: null,
                        ended: null,
                    });

                if (joinError) {
                    console.error(`[Bot ${botId}] Join error:`, joinError);
                    props.onError(nicknameRef.current || `Bot#${botId}`, joinError.message);
                    return;
                }

                console.log(`[Bot ${botId}] Joined!`);
                props.onJoined(nicknameRef.current);

                // ========== PHASE 2: WAIT FOR GAME TO START ==========
                while (props.gameStatus.current !== "active" && !props.stopSignal.current && mounted) {
                    await delay(500);
                }

                if (!mounted || props.stopSignal.current) return;

                // Wait a bit for questions to be loaded
                await delay(2000);
                if (!mounted || props.stopSignal.current) return;

                // ========== PHASE 3: FETCH QUESTIONS (with retry) ==========
                let questions: any[] = [];
                let retries = 0;
                const maxRetries = 5;

                while (questions.length === 0 && retries < maxRetries && mounted && !props.stopSignal.current) {
                    const session = await sessionsApi.getSession(props.gamePin);
                    if (session?.questions?.length) {
                        questions = session.questions;
                    } else {
                        retries++;
                        console.log(`[Bot ${botId}] No questions yet, retry ${retries}/${maxRetries}`);
                        await delay(1000);
                    }
                }

                if (questions.length === 0) {
                    props.onError(nicknameRef.current, "No questions available after retries");
                    return;
                }

                const totalQuestions = questions.length;
                const scorePerQuestion = Math.max(1, Math.floor(100 / totalQuestions));

                console.log(`[Bot ${botId}] Starting quiz: ${totalQuestions} questions`);

                // ========== PHASE 4: ANSWER QUESTIONS ==========
                let totalScore = 0;
                let correctAnswers = 0;

                for (let qIndex = 0; qIndex < totalQuestions; qIndex++) {
                    if (!mounted || props.stopSignal.current) break;

                    // Wait before answering (IQ-based delay)
                    await delay(brain.getAnswerDelay());
                    if (!mounted || props.stopSignal.current) break;

                    const question = questions[qIndex];
                    const correctIndex = parseInt(question.correct || "0", 10);
                    const optionsCount = question.options?.length || 4;
                    const chosenAnswer = brain.chooseAnswer(correctIndex, optionsCount);
                    const isCorrect = chosenAnswer === correctIndex;

                    if (isCorrect) {
                        correctAnswers++;
                        totalScore = Math.round((correctAnswers / totalQuestions) * 100);
                    }

                    // Build answer data
                    const answerData = {
                        question_id: String(question.id || qIndex + 1),
                        answer_id: String(chosenAnswer),
                        is_correct: isCorrect,
                        points_earned: isCorrect ? scorePerQuestion : 0,
                    };

                    try {
                        // Add answer to participant's answers array
                        await participantsApi.addAnswer(props.gamePin, participantId, answerData);
                        if (!mounted || props.stopSignal.current) break;

                        // Update score
                        await participantsApi.updateScore(
                            props.gamePin,
                            participantId,
                            totalScore,
                            qIndex + 1
                        );
                        if (!mounted || props.stopSignal.current) break;

                        props.onAnswered(nicknameRef.current, qIndex + 1, isCorrect);

                        // Check if completed
                        if (qIndex === totalQuestions - 1) {
                            console.log(`[Bot ${botId}] Completed! Score: ${totalScore}`);
                            props.onCompleted(nicknameRef.current);
                        }
                    } catch (err: any) {
                        if (!props.stopSignal.current) {
                            props.onError(nicknameRef.current, err.message || "Answer failed");
                        }
                    }
                }
            } catch (err: any) {
                console.error(`[Bot ${botId}] Error:`, err);
                propsRef.current.onError(nicknameRef.current || `Bot#${botId}`, err.message || "Unknown error");
            }
        };

        runBot();

        return () => {
            console.log(`[Bot ${botId}] Unmounting...`);
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - runs once on mount

    // No UI rendered
    return null;
}
