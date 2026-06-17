import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


import { useCaptionHub } from './hooks/useCaptionHub';

import Homepage from './pages/Homepage';
import ProcessingView from './pages/ProcessingView';
import Onboarding from './pages/Onboarding';

import LiveSessionView from './components/workspace/LiveSessionView';
import ImportWorkspace from './pages/ImportWorkspace';
import ImportPlaybackView from './pages/ImportPlaybackView';


import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { useHistory } from './hooks/useHistory';

function getApiBase() {
  const envBase = import.meta?.env?.VITE_API_BASE;
  if (envBase) return envBase;

  const candidates = ['http://localhost:5260', 'http://localhost:12761'];
  for (const base of candidates) {
    try {
      const u = new URL(base);
      if (u.hostname && u.port) return base;
    } catch {
      // ignore
    }
  }

  return window.location.origin;
}

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
  // flows:
  // - landing: name prompt + start session
  // - onboarding: user roles + input mode selection
  // - processing-import: file/url import progress
  // - live-workspace: mic/live captions
  // - import-workspace: imported media captions
  // - import-playback-workspace: imported media playback + caption timelapse
  const [flow, setFlow] = useState('landing');



  const [sessionPrompt, setSessionPrompt] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [sessionSource, setSessionSource] = useState('Live microphone');

  const [userTypes, setUserTypes] = useState([]);
  const [selectedInputModes, setSelectedInputModes] = useState([]);
  const [onboardingError, setOnboardingError] = useState('');

  // Stable after onboarding; used to decide which workspace to render
  // 'mic' | 'file' | 'url' | null
  const [currentInputMode, setCurrentInputMode] = useState(null);

  const [pendingAction, setPendingAction] = useState(null); // { type: 'mic'|'file'|'url', payload? }
  const [sessionStart, setSessionStart] = useState(null);

  const [latestCaption, setLatestCaption] = useState(null);

  const [translate, setTranslate] = useState(true);
  const [status, setStatus] = useState('idle');
  const [latency, setLatency] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [sessionNameError, setSessionNameError] = useState('');
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

  const translateRef = useRef(translate);
  const sendTimeRef = useRef(null);
  const pendingImportRef = useRef(null);

  const flowRef = useRef(flow);
  const sessionSourceRef = useRef(sessionSource);
  const sessionStartRef = useRef(sessionStart);
  const currentInputModeRef = useRef(currentInputMode);

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

  useEffect(() => {
    currentInputModeRef.current = currentInputMode;
  }, [currentInputMode]);

  const { history, addEntry, updateEntry, clearHistory } = useHistory();

  const inputModeToWorkspaceFlow = useCallback((mode) => {
    if (mode === 'mic') return 'live-workspace';
    // onboarding imports should land in the dedicated playback view
    if (mode === 'file' || mode === 'url') return 'import-playback-workspace';
    return 'landing';
  }, []);

  const setWorkspaceByInputMode = useCallback(() => {
    setFlow(inputModeToWorkspaceFlow(currentInputModeRef.current));
  }, [inputModeToWorkspaceFlow]);

  const handleReceiveCaption = useCallback(
    ({ english, swahili, metadata = {} }) => {
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
          quality.rejectionReason ||
            'Caption was suppressed because it looked like silence or noise.'
        );

        setWorkspaceByInputMode();
        return;
      }

      if (quality.status === 'review') {
        setReviewItems((items) => [{ ...entry, draft: entry.english || '' }, ...items].slice(0, 20));
      }

      setLatestCaption(entry);
      addEntry(entry);

      setStatus('ready');
      setErrorMessage('');
      setMicNotice({
        type: 'success',
        message: quality.status === 'review' ? 'Caption needs review' : 'Caption accepted'
      });

      setWorkspaceByInputMode();

      if (sendTimeRef.current) {
        setLatency(Math.round(performance.now() - sendTimeRef.current));
      }
    },
    [addEntry, setWorkspaceByInputMode]
  );

  const shouldConnectCaptionHub = useMemo(() => {
    return flow === 'live-workspace' || flow === 'import-playback-workspace' || flow === 'processing-import';
  }, [flow]);

  const { getConnectionId } = useCaptionHub({
    onReceiveCaption: handleReceiveCaption,
    enabled: shouldConnectCaptionHub
  });

  // live duration
  useEffect(() => {
    if (!sessionStart) return;

    const id = setInterval(() => {
      if (!sessionStartRef.current) return;
      const delta = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000);
      setSessionDurationSeconds(delta);
    }, 250);

    setSessionDurationSeconds(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
    return () => clearInterval(id);
  }, [sessionStart]);

  useEffect(() => {
    if (sessionStart == null) setSessionDurationSeconds(0);
  }, [sessionStart]);

  const handleChunkReady = useCallback(
    async (audioBlob) => {
      // Prevent live microphone chunk uploads during onboarding/import flows.
      // This avoids interfering with import playback navigation and import processing.
      if (flowRef.current !== 'live-workspace') return;

      setStatus('processing');
      setMicNotice({ type: 'success', message: 'Speech chunk sent' });
      sendTimeRef.current = performance.now();

      const formData = new FormData();
      formData.append('audio', audioBlob, `chunk_${Date.now()}.wav`);

      try {
        const response = await fetch(
          `${getApiBase()}/api/audio/upload?translate=${translateRef.current}`,
          {
            method: 'POST',
            headers: {
              'X-SignalR-ConnectionId': getConnectionId?.() || ''
            },
            body: formData
          }
        );

        if (!response.ok) throw new Error(await response.text());
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Audio upload failed.');
        setLatestCaption(null);
        setReviewItems([]);
        setMicNotice(null);
      }
    },
    [getConnectionId]
  );

  const {
    isRecording,
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
    onRecordingStateChange: (recording) => setStatus(recording ? 'listening' : 'ready'),
    chunkDurationMs: 4500,
    minSpeechMs: 650,
    fftSize: 256,
    smoothingTimeConstant: 0.8
  });

  const startSession = useCallback(
    (sourceLabel) => {
      clearHistory();

      const title = sessionPrompt.trim() || 'Untitled Session';
      setSessionTitle(title);
      setSessionSource(sourceLabel);

      const now = new Date();
      setSessionStart(now);
      setSessionDurationSeconds(0);

      setLatestCaption(null);
      setReviewItems([]);
      setLatency(null);
      setErrorMessage('');
      setMicNotice(null);
    },
    [clearHistory, sessionPrompt]
  );

  const isSessionNameValid = sessionPrompt.trim().length > 0;

  useEffect(() => {
    if (isSessionNameValid) setSessionNameError('');
  }, [sessionPrompt, isSessionNameValid]);

  const toggleInputMode = useCallback((modeId) => {
    setSelectedInputModes((prev) => {
      if (prev.includes(modeId)) return prev.filter((x) => x !== modeId);
      return [...prev, modeId];
    });
  }, []);

  const toggleUserType = useCallback((typeId) => {
    setUserTypes((prev) => {
      if (prev.includes(typeId)) return prev.filter((x) => x !== typeId);
      return [...prev, typeId];
    });
  }, []);

  const handleStartRecording = useCallback(() => {
    if (!isSessionNameValid) {
      setSessionNameError('Session name is required.');
      return;
    }

    setUserTypes([]);
    setSelectedInputModes([]);
    setOnboardingError('');
    setPendingAction({ type: 'mic' });
    setCurrentInputMode('mic');

    setFlow('onboarding');
  }, [isSessionNameValid]);

  const finishImport = useCallback((label, detail) => {
    setImportState({ status: 'complete', label, detail, progress: 100 });
    setTimeout(() => setWorkspaceByInputMode(), 350);
  }, [setWorkspaceByInputMode]);

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
      if (!isSessionNameValid) {
        setSessionNameError('Session name is required.');
        return;
      }

      if (isRecording) stopRecording();

      if (!isSupportedFile(file)) {
        setFileError(
          'Choose a supported audio or video file: .wav, .mp3, .webm, .mp4, .m4a, or .ogg.'
        );
        return;
      }

      setUserTypes([]);
      setSelectedInputModes([]);
      setOnboardingError('');
      setPendingAction({ type: 'file', payload: file });
      setCurrentInputMode('file');
      setFlow('onboarding');

      setImportState({
        status: 'processing',
        label: `Processing ${file.name}`,
        detail: 'Uploading media and creating captions.',
        progress: 35
      });

      pendingImportRef.current = { label: file.name };

      sendTimeRef.current = performance.now();

      const formData = new FormData();
      formData.append('media', file, file.name);

      try {
        const response = await fetch(`${getApiBase()}/api/audio/import-file?translate=${translateRef.current}`, {
          method: 'POST',
          headers: { 'X-SignalR-ConnectionId': getConnectionId?.() || '' },
          body: formData
        });

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
    [
      failImport,
      finishImport,
      getConnectionId,
      isRecording,
      isSessionNameValid,
      stopRecording
    ]
  );

  const importUrl = useCallback(
    async () => {
      if (!isSessionNameValid) {
        setSessionNameError('Session name is required.');
        return;
      }

      if (isRecording) stopRecording();

      const value = mediaUrl.trim();
      if (!isSupportedUrl(value)) {
        setUrlError(
          'Enter a direct media URL ending in .wav, .mp3, .webm, .mp4, .m4a, or .ogg.'
        );
        return;
      }

      setUserTypes([]);
      setSelectedInputModes([]);
      setOnboardingError('');
      setPendingAction({ type: 'url', payload: value });
      setCurrentInputMode('url');
      setFlow('onboarding');

      setImportState({
        status: 'processing',
        label: 'Processing direct media URL',
        detail: value,
        progress: 30
      });

      pendingImportRef.current = { label: value };

      sendTimeRef.current = performance.now();

      try {
        const response = await fetch(`${getApiBase()}/api/audio/import-url?translate=${translateRef.current}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SignalR-ConnectionId': getConnectionId?.() || ''
          },
          body: JSON.stringify({ url: value })
        });

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
    [
      failImport,
      finishImport,
      getConnectionId,
      isRecording,
      isSessionNameValid,
      mediaUrl,
      stopRecording
    ]
  );

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!sessionStart) {
      if (!isSessionNameValid) {
        setSessionNameError('Session name is required.');
        return;
      }
      startSession('Live microphone');
    }

    try {
      await startRecording(selectedDevice);
    } catch {
      setErrorMessage('Microphone access is required to start live recording.');
    }
  }, [
    isRecording,
    selectedDevice,
    sessionStart,
    startRecording,
    startSession,
    stopRecording,
    isSessionNameValid
  ]);

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

      if (item.status === 'suppressed') addEntry(approvedEntry);
      else updateEntry(id, approvedEntry);

      setLatestCaption(approvedEntry);
      setReviewItems((items) => items.filter((entry) => entry.id !== id));
    },
    [addEntry, reviewItems, updateEntry]
  );


  const handleBackToLanding = useCallback(() => {
    if (isRecording) stopRecording();
    setPendingAction(null);
    setCurrentInputMode(null);

    setUserTypes([]);
    setOnboardingError('');
    setFlow('landing');

    setStatus('idle');
    setErrorMessage('');
    setSessionNameError('');
    pendingImportRef.current = null;
  }, [isRecording, stopRecording]);

  const handleOnboardingContinue = useCallback(async () => {
    if (!userTypes.length) {
      setOnboardingError('Select at least one user type to continue.');
      return;
    }
    if (!selectedInputModes.length) {
      setOnboardingError('Select at least one input mode to continue.');
      return;
    }

    const action = pendingAction;
    setOnboardingError('');
    setPendingAction(null);

    if (!action) {
      setFlow('landing');
      return;
    }

    if (action.type === 'mic') {
      startSession('Live microphone');
      setFlow('live-workspace');
      setCurrentInputMode('mic');
      pendingImportRef.current = null;

      try {
        await startRecording(selectedDevice);
      } catch {
        setErrorMessage('Microphone access is required to start live recording.');
      }
      return;
    }

    if (action.type === 'file') {
      const file = action.payload;

      // Session + workspace
      startSession(file.name);
      setFlow('processing-import');
      setCurrentInputMode('file');

      if (isRecording) stopRecording();
      setFileError('');

      setImportState({
        status: 'processing',
        label: `Processing ${file.name}`,
        detail: 'Uploading media and creating captions.',
        progress: 35
      });

      pendingImportRef.current = { label: file.name };

      // kick import
      try {
        sendTimeRef.current = performance.now();
        const formData = new FormData();
        formData.append('media', file, file.name);

        const response = await fetch(
          `${getApiBase()}/api/audio/import-file?translate=${translateRef.current}`,
          {
            method: 'POST',
            headers: { 'X-SignalR-ConnectionId': getConnectionId?.() || '' },
            body: formData
          }
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
      return;
    }

    if (action.type === 'url') {
      const value = action.payload;

      startSession(value);
      setFlow('processing-import');
      setCurrentInputMode('url');

      if (isRecording) stopRecording();
      setUrlError('');

      setImportState({
        status: 'processing',
        label: 'Processing direct media URL',
        detail: value,
        progress: 30
      });

      pendingImportRef.current = { label: value };

      try {
        sendTimeRef.current = performance.now();

        const response = await fetch(
          `${getApiBase()}/api/audio/import-url?translate=${translateRef.current}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SignalR-ConnectionId': getConnectionId?.() || ''
            },
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
    }
  }, [
    failImport,
    finishImport,
    getConnectionId,
    isRecording,
    selectedDevice,
    selectedInputModes.length,
    startRecording,
    startSession,
    stopRecording,
    translateRef,
    userTypes.length,
    pendingAction
  ]);

  if (flow === 'onboarding') {
    return (
      <Onboarding
        sessionTitle={sessionPrompt.trim()}
        selectedUserTypes={userTypes}
        onToggleType={toggleUserType}
        selectedInputModes={selectedInputModes}
        onToggleInputMode={toggleInputMode}
        onBack={handleBackToLanding}
        onContinue={handleOnboardingContinue}
        error={onboardingError}
      />
    );
  }

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
        isSessionNameValid={isSessionNameValid}
        sessionNameError={sessionNameError}
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

  if (flow === 'import-playback-workspace') {
    return (
      <ImportPlaybackView
        sessionTitle={sessionTitle}
        importState={importState}
        captions={history}
        latestCaption={latestCaption}
        translateEnabled={translate}
        onBackToLanding={handleBackToLanding}
        onUploadFile={importFile}
        onUploadUrl={importUrl}
        onRetryImport={() => setFlow('landing')}
      />
    );
  }

  if (flow === 'live-workspace') {
    return (
      <LiveSessionView
        captions={history}
        isRecording={isRecording}
        translateEnabled={translate}
        onToggleRecording={handleToggleRecording}
        onToggleTranslate={() => setTranslate((value) => !value)}
        isLive={true}
      />
    );
  }

  return (
    <ImportWorkspace
      sessionTitle={sessionTitle}
      sessionSource={sessionSource}
      captions={history}
      latestCaption={latestCaption || history[0]}
      isRecording={isRecording}
      status={status}

      isConnected={true}
      translate={translate}
      audioLevel={audioLevel * 100}
      isSpeaking={isSpeaking}
      micNotice={micNotice}
      latency={latency}
      errorMessage={errorMessage}
      reviewItems={reviewItems}
      sessionDurationSeconds={sessionDurationSeconds}
      onToggleRecording={handleToggleRecording}
      onToggleTranslate={() => setTranslate((value) => !value)}
      onClearHistory={clearHistory}
      onApproveReview={handleApproveReview}
      onUpdateReview={handleUpdateReview}
      onDiscardReview={handleDiscardReview}
      onBackToLanding={handleBackToLanding}
    />
  );
}
