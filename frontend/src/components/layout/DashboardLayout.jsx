import { useState } from 'react';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';
import UtilityPanel from './UtilityPanel';
import StatusBar from './StatusBar';

export default function DashboardLayout({ children }) {
  const [activeRoute, setActiveRoute] = useState('live-session');
  const [showUtilityPanel, setShowUtilityPanel] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [isRecording, setIsRecording] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))] overflow-hidden">
      {/* Top Navigation */}
      <TopNavBar
        sessionTitle="Live Broadcast Session"
        isLive={isLive}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeRoute={activeRoute}
          onRouteChange={setActiveRoute}
        />

        {/* Main Workspace */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Right Utility Panel */}
        <UtilityPanel
          isOpen={showUtilityPanel}
          onClose={() => setShowUtilityPanel(false)}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        connectionState="connected"
        isRecording={isRecording}
        languagePair="EN → SW"
        audioState="active"
        streamHealth="healthy"
        latency="45ms"
      />
    </div>
  );
}
