import { useState, useEffect, useRef, useCallback } from 'react';
import CameraCapture from '../../components/CameraCapture';
import useGPS from '../../hooks/useGPS';
import { useAuth } from '../../context/AuthContext';
import { addRecord, updateRecord, getAllRecords, saveImageBlob, STORES } from '../../utils/db';

function todayStr() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function fmtDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default function TasksPage() {
    const { user } = useAuth();
    const { latitude, longitude, refresh: refreshGPS } = useGPS();
    const [tasks, setTasks] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle | before | running | after | done
    const [selectedArea, setSelectedArea] = useState('');
    const timerRef = useRef(null);

    const areas = user?.assignedAreas?.length ? user.assignedAreas : ['Lobby', 'Restroom A', 'Restroom B', 'Corridor', 'Cafeteria'];

    // Load today's tasks
    const loadTasks = useCallback(async () => {
        const all = await getAllRecords(STORES.TASKS);
        setTasks(all.filter((t) => t.date === todayStr()));
    }, []);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    // Timer
    useEffect(() => {
        if (phase === 'running' && activeTask) {
            timerRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - new Date(activeTask.startedAt).getTime()) / 1000));
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, activeTask]);

    // Before photo captured → start task
    const handleBeforePhoto = async (blob) => {
        refreshGPS();
        const startedAt = new Date().toISOString();
        const id = await addRecord(STORES.TASKS, {
            area: selectedArea,
            startedAt,
            status: 'in_progress',
            date: todayStr(),
            beforeGps: { latitude, longitude },
            deviceTimestamp: startedAt,
        });
        await saveImageBlob(blob, STORES.TASKS, id, 'beforePhoto');
        const record = { id, area: selectedArea, startedAt, status: 'in_progress', date: todayStr() };
        setActiveTask(record);
        setPhase('running');
        setElapsed(0);
    };

    // After photo captured → complete task
    const handleAfterPhoto = async (blob) => {
        refreshGPS();
        const completedAt = new Date().toISOString();
        const durationSeconds = Math.floor((new Date(completedAt) - new Date(activeTask.startedAt)) / 1000);

        const all = await getAllRecords(STORES.TASKS);
        const existing = all.find((t) => t.id === activeTask.id);
        if (existing) {
            await updateRecord(STORES.TASKS, {
                ...existing,
                completedAt,
                durationSeconds,
                status: 'completed',
                afterGps: { latitude, longitude },
                deviceTimestamp: completedAt,
            });
            await saveImageBlob(blob, STORES.TASKS, activeTask.id, 'afterPhoto');
        }

        clearInterval(timerRef.current);
        setPhase('done');
        await loadTasks();
    };

    const resetTask = () => {
        setActiveTask(null);
        setPhase('idle');
        setSelectedArea('');
        setElapsed(0);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Cleaning Tasks</h1>
                <p className="text-slate-400 text-sm mt-1">Record Before & After with timer proof</p>
            </div>

            {phase === 'idle' && (
                <>
                    {/* Area Selection */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <h3 className="text-white font-medium text-sm">Select Area</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {areas.map((area) => (
                                <button
                                    key={area}
                                    onClick={() => setSelectedArea(area)}
                                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedArea === area
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border border-slate-700'
                                        }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                        {selectedArea && (
                            <button
                                onClick={() => setPhase('before')}
                                className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Start Task — {selectedArea}
                            </button>
                        )}
                    </div>

                    {/* Today's Tasks */}
                    {tasks.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-white font-medium text-sm">Today's Tasks</h3>
                            {tasks.map((t) => (
                                <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">{t.area}</p>
                                        <p className="text-slate-500 text-xs">
                                            {t.durationSeconds ? fmtDuration(t.durationSeconds) : 'In progress...'}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {t.status === 'completed' ? '✓ Done' : '⏱ Active'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {phase === 'before' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-white font-medium mb-1">Before Photo — {selectedArea}</h3>
                    <p className="text-slate-400 text-xs mb-3">Take a photo of the area before cleaning</p>
                    <CameraCapture onCapture={handleBeforePhoto} label="Take Before Photo" facingMode="environment" />
                </div>
            )}

            {phase === 'running' && (
                <div className="bg-slate-900/60 border border-blue-500/30 rounded-2xl p-6 text-center space-y-4">
                    <p className="text-slate-400 text-sm">Cleaning in progress</p>
                    <h2 className="text-white font-bold text-lg">{activeTask?.area}</h2>
                    <div className="text-5xl font-mono font-bold text-blue-400 tabular-nums">
                        {fmtDuration(elapsed)}
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                    <button
                        onClick={() => { refreshGPS(); setPhase('after'); }}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        ✓ Complete Task
                    </button>
                </div>
            )}

            {phase === 'after' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-white font-medium mb-1">After Photo — {activeTask?.area}</h3>
                    <p className="text-slate-400 text-xs mb-3">Take a photo of the cleaned area</p>
                    <CameraCapture onCapture={handleAfterPhoto} label="Take After Photo" facingMode="environment" />
                </div>
            )}

            {phase === 'done' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                    <div className="text-4xl">🎉</div>
                    <h2 className="text-lg font-semibold text-emerald-400">Task Completed!</h2>
                    <p className="text-slate-400 text-sm">{activeTask?.area} — {fmtDuration(elapsed)}</p>
                    <button onClick={resetTask} className="py-2.5 px-6 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">
                        Start Another Task
                    </button>
                </div>
            )}
        </div>
    );
}
