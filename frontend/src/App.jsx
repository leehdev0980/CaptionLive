import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useSessionStore } from './stores/sessionStore';

import Homepage from './pages/Homepage';
import ProcessingView from './pages/ProcessingView';
import Workstation from './pages/Workstation';

import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

const API_BASE = 'http://localhost:5260';
const SUPPORTED_MEDIA_EXTENSIONS = ['.wav', '.mp3', '.webm', '.mp4', '.m4a', '.ogg'];

function isSupportedUrl(value) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return SUPPORTED_MEDIA_EXTENSIONS.some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}

function isSupportedFile(file) {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_MEDIA_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function metadataValue(metadata, camelName, pascalName, fallback = '') {
  if (!metadata) return fallback;
  return metadata[camelName] ?? metadata[pascalName] ?? fallback;
}

function normalizeMetadata(metadata = {}) {
  return {
    confidence: Number(metadataValue(metadata, 'confidence', 'Confidence', 0)) || 0,
    status: metadataValue(metadata, 'status', 'Status', 'accepted') || 'accepted',
    rejectionReason: metadataValue(metadata, 'rejectionReason', 'RejectionReason', ''),
    processingTimeSeconds:
      Number(metadataValue(metadata, 'processingTimeSeconds', 'ProcessingTimeSeconds', 0)) || 0,
    source: metadataValue(metadata, 'source', 'Source', '')
  };
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const {
    status,
    isRecording,
    isConnected,
    latency,
    history,
    setStatus,
    setIsRecording,
    setIsConnected,
    setLatency,
    addHistory,
    setTranscript,
    setTranslation,
    resetSession,
    toggleTranslate,
    clearHistory
  } = useSessionStore();

  const [flow, setFlow] = useState('landing');
  const [sessionPrompt, setSessionPrompt] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [sessionSource, setSessionSource] = useState('Live microphone');
  const [sessionStart, setSessionStart] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [micNotice, setMicNotice] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [reviewItems, setReviewItems] = useState([]);
  const [importState, setImportState] = useState({
    status: 'idle',
    label: 'Waiting',
    detail: '',
    progress: 0
  });

  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

  const translate = useSessionStore(state => state.translate);
  const translateRef = useRef(translate);
  const sendTimeRef = useRef(null);
  const pendingImportRef = useRef(null);
  const flowRef = useRef(flow);
  const sessionSourceRef = useRef(sessionSource);
  const sessionStartRef = useRef(sessionStart);

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  useEffect(() => {
    sessionSourceRef.current = sessionSource;
  }, [sessionSource]);

  useEffect(() => {
    sessionStartRef.current = sessionStart;
  }, [sessionStart]);

  // Live session duration
  useEffect(() => {
    if (!sessionStart) {
      setSessionDurationSeconds(0);
      return;
    }

    const id = setInterval(() => {
      if (!sessionStartRef.current) return;
      const delta = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000);
      setSessionDurationSeconds(delta);
    }, 250);

    setSessionDurationSeconds(Math.floor((Date.now() - sessionStart.getTime()) / 1000));

    return () => clearInterval(id);
  }, [sessionStart]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/captionHub`)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveCaption', (english, swahili, metadata = {}) => {
      const quality = normalizeMetadata(metadata);
      const now = new Date();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const entry = {
        id,
        english: english || '',
        swahili: swahili || '',
        timestamp: formatTime(now),
        source:
          quality.source ||
          pendingImportRef.current?.label ||
          (flowRef.current === 'landing' ? 'Live' : sessionSourceRef.current),
        sessionSeconds: sessionStartRef.current
          ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
          : 0,
        confidence: quality.confidence,
        status: quality.status,
        rejectionReason: quality.rejectionReason,
        processingTimeSeconds: quality.processingTimeSeconds
      };

      if (quality.status === 'suppressed') {
        setReviewItems((items) => [{ ...entry, draft: entry.english || '' }, ...items].slice(0, 20));
        setMicNotice({ type: 'warning', message: quality.rejectionReason || 'Likely silence/noise' });
        setStatus('suppressed');
        setErrorMessage(
          quality.rejectionReason || 'Caption was suppressed because it looked like silence or noise.'
        );
        setFlow('caption-workspace');
        return;
      }

      if (quality.status === 'review') {
        setReviewItems((items) => [{ ...entry, draft: entry.english || '' }, ...items].slice(0, 20));
      }

      setTranscript(english, now);
      setTranslation(swahili, now);
      addHistory(entry);
      setStatus('ready');
      setErrorMessage('');
      setMicNotice({
        type: 'success',
        message: quality.status === 'review' ? 'Caption needs review' : 'Caption accepted'
      });
      setFlow('caption-workspace');

      if (sendTimeRef.current) {
        setLatency(Math.round(performance.now() - sendTimeRef.current));
      }
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.start().then(() => setIsConnected(true)).catch(() => setIsConnected(false));

    return () => {
      connection.stop();
    };
  }, [addHistory, setStatus, setLatency, setTranscript, setTranslation, setIsConnected]);

  const handleChunkReady = useCallback(async (audioBlob) => {
    setStatus('processing');
    setMicNotice({ type: 'success', message: 'Speech chunk sent' });
    sendTimeRef.current = performance.now();

    const formData = new FormData();
    formData.append('audio', audioBlob, `chunk_${Date.now()}.wav`);

    try {
      const response = await fetch(`${API_BASE}/api/audio/upload?translate=${translateRef.current}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Audio upload failed.');
    }
  }, [setStatus]);

  const {
    audioLevel,
    isSpeaking,
    selectedDevice,
    start: startRecording,
    stop: stopRecording
  } = useAudioAnalyzer({
    onChunkReady: handleChunkReady,
    onChunkSkipped: ({ speechMs }) => {
      setMicNotice({
        type: 'warning',
        message: speechMs > 0 ? 'Too quiet / no speech sent' : 'No speech sent'
      });
      setStatus('listening');
    },
    onRecordingStateChange: (recording) => {
        setIsRecording(recording);
        setStatus(recording ? 'listening' : 'ready');
    },
    chunkDurationMs: 4500,
    minSpeechMs: 650,
    fftSize: 256,
    smoothingTimeConstant: 0.8
  });

  const startSession = useCallback(
    (sourceLabel) => {
      const title = sessionPrompt.trim() || 'Untitled Session';
      setSessionTitle(title);
      setSessionSource(sourceLabel);

      const now = new Date();
      setSessionStart(now);
      setSessionDurationSeconds(0);
      resetSession();
      setErrorMessage('');
      setMicNotice(null);
    },
    [sessionPrompt, resetSession]
  );

  const handleStartRecording = useCallback(async () => {
    startSession('Live microphone');
    setFlow('caption-workspace');
    pendingImportRef.current = null;

    try {
      await startRecording(selectedDevice);
    } catch {
      setErrorMessage('Microphone access is required to start live recording.');
    }
  }, [selectedDevice, startRecording, startSession]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!sessionStart) {
      startSession('Live microphone');
    }

    try {
      await startRecording(selectedDevice);
    } catch {
      setErrorMessage('Microphone access is required to start live recording.');
    }
  }, [isRecording, selectedDevice, sessionStart, startRecording, startSession, stopRecording]);

  const finishImport = useCallback((label, detail) => {
    setImportState({ status: 'complete', label, detail, progress: 100 });
    setTimeout(() => setFlow('caption-workspace'), 350);
  }, []);

  const failImport = useCallback((detail) => {
    setImportState({
      status: 'error',
      label: 'Import failed',
      detail,
      progress: 100
    });
    setErrorMessage(detail);
  }, []);

  const importFile = useCallback(
    async (file) => {
      if (!isSupportedFile(file)) {
        setFileError('Choose a supported audio or video file: .wav, .mp3, .webm, .mp4, .m4a, or .ogg.');
        return;
      }

      setFileError('');
      startSession(file.name);
      setFlow('processing-import');
      setErrorMessage('');
      pendingImportRef.current = { label: file.name };

      setImportState({
        status: 'processing',
        label: `Processing ${file.name}`,
        detail: 'Uploading media and creating captions.',
        progress: 35
      });

      sendTimeRef.current = performance.now();

      const formData = new FormData();
      formData.append('media', file, file.name);

      try {
        const response = await fetch(
          `${API_BASE}/api/audio/import-file?translate=${translateRef.current}`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error(await response.text());
        setImportState((current) => ({
          ...current,
          detail: 'Captions received. Opening workspace.',
          progress: 90
        }));
        finishImport('Import complete', file.name);
      } catch (error) {
        failImport(error instanceof Error ? error.message : 'File import failed.');
      }
    },
    [failImport, finishImport, startSession]
  );

  const importUrl = useCallback(
    async () => {
      const value = mediaUrl.trim();
      if (!isSupportedUrl(value)) {
        setUrlError('Enter a direct media URL ending in .wav, .mp3, .webm, .mp4, .m4a, or .ogg.');
        return;
      }

      setUrlError('');
      startSession(value);
      setFlow('processing-import');
      setErrorMessage('');
      pendingImportRef.current = { label: value };

      setImportState({
        status: 'processing',
        label: 'Processing direct media URL',
        detail: value,
        progress: 30
      });

      sendTimeRef.current = performance.now();

      try {
        const response = await fetch(
          `${API_BASE}/api/audio/import-url?translate=${translateRef.current}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: value })
          }
        );

        if (!response.ok) throw new Error(await response.text());
        setImportState((current) => ({
          ...current,
          detail: 'Captions received. Opening workspace.',
          progress: 90
        }));
        finishImport('Import complete', value);
      } catch (error) {
        failImport(error instanceof Error ? error.message : 'URL import failed.');
      }
    },
    [failImport, finishImport, mediaUrl, startSession]
  );

  const handleUpdateReview = useCallback((id, draft) => {
    setReviewItems((items) => items.map((item) => (item.id === id ? { ...item, draft } : item)));
  }, []);

  const handleDiscardReview = useCallback((id) => {
    setReviewItems((items) => items.filter((item) => item.id !== id));
  }, []);

  const handleApproveReview = useCallback(
    (id) => {
      const item = reviewItems.find((entry) => entry.id === id);
      if (!item) return;

      const approvedEntry = {
        ...item,
        english: item.draft.trim() || item.english,
        status: 'accepted',
        rejectionReason: '',
        source: `${item.source || 'Reviewed'} (approved)`
      };
      delete approvedEntry.draft;

      if (item.status === 'suppressed') {
        addHistory(approvedEntry);
      } else {
        // This is a simplified approach. A more robust solution would involve a unique ID.
        const newHistory = history.map(h => h.id === id ? approvedEntry : h);
        useSessionStore.setState({ history: newHistory });
      }

      setReviewItems((items) => items.filter((entry) => entry.id !== id));
    },
    [addHistory, reviewItems, history]
  );

  const handleBackToLanding = useCallback(() => {
    if (isRecording) stopRecording();
    setFlow('landing');
    setStatus('idle');
    setErrorMessage('');
    pendingImportRef.current = null;
  }, [isRecording, stopRecording, setStatus]);

  if (flow === 'landing') {
    return (
      <Homepage
        sessionPrompt={sessionPrompt}
        onPromptChange={setSessionPrompt}
        mediaUrl={mediaUrl}
        onMediaUrlChange={setMediaUrl}
        onStartRecording={handleStartRecording}
        onFileSelected={importFile}
        onUrlImport={importUrl}
        fileError={fileError}
        urlError={urlError}
      />
    );
  }

  if (flow === 'processing-import') {
    return (
      <ProcessingView
        sessionTitle={sessionTitle}
        importState={importState}
        onBack={handleBackToLanding}
        onRetry={() => setFlow('landing')}
      />
    );
  }

  return (
    <Workstation
      sessionTitle={sessionTitle}
      sessionSource={sessionSource}
      captions={history}
      latestCaption={history[history.length - 1]} // Corrected prop
      isRecording={isRecording}
      status={status}
      isConnected={isConnected}
      translate={translate}
      audioLevel={audioLevel * 100}
      isSpeaking={isSpeaking}
      micNotice={micNotice}
      latency={latency}
      errorMessage={errorMessage}
      reviewItems={reviewItems}
      sessionDurationSeconds={sessionDurationSeconds}
      onToggleRecording={handleToggleRecording}
      onToggleTranslate={toggleTranslate} // Use store action
      onClearHistory={clearHistory} // Use store action
      onApproveReview={handleApproveReview}
      onUpdateReview={handleUpdateReview}
      onDiscardReview={handleDiscardReview}
      onBackToLanding={handleBackToLanding}
    />
  );
}
