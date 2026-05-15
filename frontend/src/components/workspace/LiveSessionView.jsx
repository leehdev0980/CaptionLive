import LiveCaptionDisplay from './LiveCaptionDisplay';
import TranscriptHistory from './TranscriptHistory';
import AudioControls from './AudioControls';
import QuickStats from './QuickStats';

export default function LiveSessionView({
  captions = [],
  isRecording = false,
  translateEnabled = false,
  onToggleRecording,
  onToggleTranslate,
  isLive = true
}) {
  const latest = captions.length > 0 ? captions[captions.length - 1] : null;

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <QuickStats captions={captions} sessionDuration="00:45:32" />

      {/* Audio Controls */}
      <AudioControls
        isRecording={isRecording}
        translateEnabled={translateEnabled}
        onToggleRecording={onToggleRecording}
        onToggleTranslate={onToggleTranslate}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Live Caption Display */}
        <LiveCaptionDisplay
          primaryText={latest?.english || ""}
          translatedText={latest?.swahili || ""}
          timestamp={latest?.timestamp || ""}
          isLive={isLive}
          placeholder="Start speaking to see live captions..."
        />

        {/* Transcript History */}
        <TranscriptHistory captions={captions} />
      </div>
    </div>
  );
}
