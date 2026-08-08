import { useCallback, useState } from "react";

import { useOpusVadRecorder } from "@/hooks/useOpusVadRecorder";

export default function AudioRecorderPcm({
  onChunkReady,
}: {
  onChunkReady?: (blob: Blob) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChunkReady = useCallback(
    (blob: Blob) => {
      onChunkReady?.(blob);
    },
    [onChunkReady],
  );

  const { start, stop } = useOpusVadRecorder({
    onChunkReady: handleChunkReady,
    onError: (message) => setError(message),
    onRecordingStateChange: (recording) => {
      setIsRecording(recording);
    },
  });

  const handleStart = useCallback(() => {
    setError(null);
    void start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={isRecording}
          className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
        >
          Start mic
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={!isRecording}
          className="rounded bg-gray-200 px-3 py-1 text-gray-900 disabled:opacity-50"
        >
          Stop mic
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
