"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Coffee,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FocusSessionProps {
  onViewChange: (view: string) => void;
}

type SessionType = "pomodoro" | "custom" | "break";
type SessionState = "idle" | "running" | "paused" | "completed";

interface Session {
  id: string;
  type: SessionType;
  duration: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  completed: boolean;
}

// Preset session types
const SESSION_PRESETS = {
  pomodoro: {
    duration: 25,
    name: "Pomodoro",
    icon: <Timer className="h-4 w-4" />,
  },
  shortBreak: {
    duration: 5,
    name: "Short Break",
    icon: <Coffee className="h-4 w-4" />,
  },
  longBreak: {
    duration: 15,
    name: "Long Break",
    icon: <Coffee className="h-4 w-4" />,
  },
  deepWork: {
    duration: 90,
    name: "Deep Work",
    icon: <Target className="h-4 w-4" />,
  },
};

export function FocusSession({ onViewChange }: FocusSessionProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [customDuration, setCustomDuration] = useState(25);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("timer");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("focusSessions");
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = (newSessions: Session[]) => {
    try {
      localStorage.setItem("focusSessions", JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error("Failed to save sessions:", error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (sessionState === "running" && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionState, timeRemaining]);

  // Start a session
  const startSession = (type: SessionType, duration: number) => {
    const session: Session = {
      id: Date.now().toString(),
      type,
      duration,
      startTime: new Date(),
      completed: false,
    };

    setCurrentSession(session);
    setTimeRemaining(duration * 60);
    setSessionState("running");
  };

  // Pause/resume session
  const toggleSession = () => {
    if (sessionState === "running") {
      setSessionState("paused");
    } else if (sessionState === "paused") {
      setSessionState("running");
    }
  };

  // Stop session
  const stopSession = () => {
    setSessionState("idle");
    setCurrentSession(null);
    setTimeRemaining(0);
  };

  // Complete session
  const completeSession = () => {
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        endTime: new Date(),
        completed: true,
      };

      const newSessions = [completedSession, ...sessions];
      saveSessions(newSessions);

      setSessionState("completed");

      // Play completion sound (if available)
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      // Show notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Focus Session Complete!", {
          body: `Your ${currentSession.duration}-minute session is finished.`,
          icon: "/icon.png",
        });
      }
    }
  };

  // Reset to start new session
  const resetSession = () => {
    setSessionState("idle");
    setCurrentSession(null);
    setTimeRemaining(0);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!currentSession) return 0;
    const totalSeconds = currentSession.duration * 60;
    const elapsed = totalSeconds - timeRemaining;
    return (elapsed / totalSeconds) * 100;
  };

  // Get today's completed sessions
  const getTodaysSessions = () => {
    const today = new Date().toDateString();
    return sessions.filter(
      (session) =>
        session.completed &&
        session.endTime &&
        new Date(session.endTime).toDateString() === today,
    );
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange("command")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h3 className="font-medium">Focus Session & Timer</h3>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="flex-1 flex flex-col p-4">
          {/* Main Timer Display */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {currentSession ? (
              <div className="text-center">
                <div className="mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">
                    {currentSession.type === "pomodoro"
                      ? "Pomodoro Session"
                      : currentSession.type === "break"
                        ? "Break Time"
                        : "Focus Session"}
                  </h2>
                  <div className="text-6xl font-mono font-bold mb-4">
                    {formatTime(timeRemaining)}
                  </div>
                  <Progress value={getProgress()} className="w-64 h-2" />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleSession}
                    size="lg"
                    className={cn(
                      "w-16 h-16 rounded-full",
                      sessionState === "running"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-green-500 hover:bg-green-600",
                    )}
                  >
                    {sessionState === "running" ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>

                  <Button
                    onClick={stopSession}
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 rounded-full"
                  >
                    <Square className="h-6 w-6" />
                  </Button>
                </div>

                {sessionState === "completed" && (
                  <div className="mt-6">
                    <p className="text-lg font-medium text-green-600 mb-4">
                      🎉 Session Complete!
                    </p>
                    <Button onClick={resetSession} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start New Session
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-medium mb-2">Ready to Focus?</h2>
                <p className="text-muted-foreground mb-6">
                  Choose a preset or set a custom timer
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <Input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-20 text-center"
                    min={1}
                    max={180}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <Button
                    onClick={() => startSession("custom", customDuration)}
                    className="ml-2"
                  >
                    Start Custom Timer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="presets" className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(SESSION_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() =>
                  startSession(key as SessionType, preset.duration)
                }
                disabled={sessionState !== "idle"}
              >
                {preset.icon}
                <div className="text-center">
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {preset.duration} min
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 p-4">
          <div className="space-y-6">
            {/* Today's Stats */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Today's Progress
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {getTodaysSessions().length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {getTodaysSessions().reduce(
                      (total, session) => total + session.duration,
                      0,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {
                      getTodaysSessions().filter((s) => s.type === "pomodoro")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Pomodoros</div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h3 className="font-medium mb-3">Recent Sessions</h3>

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-8 w-8 mx-auto mb-2" />
                  <p>No sessions completed yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            session.completed ? "bg-green-500" : "bg-gray-400",
                          )}
                        />
                        <div>
                          <div className="font-medium capitalize">
                            {session.type === "pomodoro"
                              ? "Pomodoro"
                              : session.type === "break"
                                ? "Break"
                                : "Focus Session"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.duration} minutes
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {session.endTime
                          ? new Date(session.endTime).toLocaleTimeString()
                          : "In progress"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden audio element for completion sound */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
          type="audio/wav"
        />
      </audio>
    </div>
  );
}
