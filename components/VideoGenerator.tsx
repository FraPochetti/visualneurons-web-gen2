// components/VideoGenerator.tsx
"use client";
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

interface VideoGeneratorProps {
    /** If provided, skips the URL input and uses this image */
    initialPromptImage?: string;
}

export default function VideoGenerator({ initialPromptImage }: VideoGeneratorProps) {
    const client = generateClient<Schema>();

    const [promptImage, setPromptImage] = useState('');
    const [promptText, setPromptText] = useState('');
    const [duration, setDuration] = useState<5 | 10>(10);
    const [ratio, setRatio] = useState<
        | "1280:720"
        | "720:1280"
        | "1104:832"
        | "832:1104"
        | "960:960"
        | "1584:672"
        | "1280:768"
        | "768:1280"
    >("1280:720");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Seed the promptImage from the prop, if given
    useEffect(() => {
        if (initialPromptImage) {
            setPromptImage(initialPromptImage);
        }
    }, [initialPromptImage]);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setVideoUrl(null);

        try {
            // 1️⃣ Kick off video generation and get back the taskId immediately
            console.log('[VideoGenerator] starting generateVideo mutation');
            const genRes = await client.mutations.generateVideo({
                promptImage,
                promptText,
                duration,
                ratio,
                provider: 'runway',
                operation: 'generateVideo',
            });
            if (genRes.errors?.length) {
                throw new Error(genRes.errors[0].message);
            }
            if (!genRes.data) {
                throw new Error("No taskId returned from generateVideo");
            }
            const taskId: string = genRes.data;
            console.log(`[VideoGenerator] received taskId=${taskId}`);

            // 2️⃣ Poll status every 3s until the task moves out of PENDING/RUNNING
            let statusResp!: { status: string; output: string };

            do {
                console.log(`[VideoGenerator] polling status for taskId=${taskId}`);
                // wait 3 seconds between polls
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => setTimeout(r, 3000));

                const pollRes = await client.queries.getVideoStatus({
                    taskId,
                    provider: 'runway',
                });
                if (pollRes.errors?.length) {
                    throw new Error(pollRes.errors[0].message);
                }
                if (!pollRes.data) {
                    throw new Error('Empty response from getVideoStatus');
                }
                statusResp = pollRes.data as { status: string; output: string };
                console.log(
                    `[VideoGenerator] status for ${taskId}: ${statusResp.status}`
                );
            } while (
                statusResp.status === 'PENDING' ||
                statusResp.status === 'RUNNING'
            );

            // 3️⃣ Check final status
            if (statusResp.status === 'SUCCEEDED') {
                console.log(
                    `[VideoGenerator] task ${taskId} SUCCEEDED, output URL=`,
                    statusResp.output
                );
                setVideoUrl(statusResp.output);
            } else {
                console.warn(
                    `[VideoGenerator] task ${taskId} ended with status=${statusResp.status}`
                );
                setError(`Video generation ${statusResp.status.toLowerCase()}`);
            }
        } catch (err: any) {
            console.error('[VideoGenerator] error during generate/poll', err);
            setError(err.message || 'Video generation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="video-inputs">
            {!initialPromptImage && (
                <input
                    type="text"
                    placeholder="Image URL or data URI"
                    value={promptImage}
                    onChange={(e) => setPromptImage(e.target.value)}
                />
            )}

            <textarea
                placeholder="Describe the video…"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
            />

            <div>
                <label>
                    Duration:
                    <select
                        value={duration}
                        onChange={(e) =>
                            setDuration(e.target.value === '5' ? 5 : 10)
                        }
                    >
                        {[5, 10].map((n) => (
                            <option key={n} value={n}>
                                {n}s
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Ratio:
                    <select
                        value={ratio}
                        onChange={(e) =>
                            setRatio(
                                [
                                    "1280:720",
                                    "720:1280",
                                    "1104:832",
                                    "832:1104",
                                    "960:960",
                                    "1584:672",
                                    "1280:768",
                                    "768:1280",
                                ].includes(e.target.value)
                                    ? (e.target.value as any)
                                    : "1280:720"
                            )
                        }
                    >
                        {[
                            "1280:720",
                            "720:1280",
                            "1104:832",
                            "832:1104",
                            "960:960",
                            "1584:672",
                            "1280:768",
                            "768:1280",
                        ].map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <button
                className="button"
                onClick={handleGenerate}
                disabled={loading || !promptImage || !promptText}
            >
                {loading ? 'Generating…' : 'Generate Video'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {videoUrl && (
                <video
                    src={videoUrl}
                    controls
                    style={{ maxWidth: '100%', marginTop: '1rem' }}
                />
            )}
        </div>
    );
}
