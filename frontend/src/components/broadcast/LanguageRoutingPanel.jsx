import { useState } from 'react';
import { 
  Languages, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  ToggleLeft,
  ToggleRight,
  Signal,
  Plus,
  ChevronDown,
  Check
} from 'lucide-react';
import clsx from 'clsx';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'sw', name: 'Kiswahili', flag: 'SW' },
  { code: 'fr', name: 'French', flag: 'FR' },
  { code: 'es', name: 'Spanish', flag: 'ES' },
  { code: 'ar', name: 'Arabic', flag: 'AR' },
  { code: 'zh', name: 'Chinese', flag: 'ZH' }
];

function LanguageFeed({ 
  language, 
  isSource = false, 
  isActive = true, 
  isTranslating = false,
  audioLevel = 0,
  onToggle,
  onMute,
  isMuted = false,
  latestText = '',
  confidence = 0.95
}) {
  return (
    <div className={clsx(
      "broadcast-panel rounded overflow-hidden",
      isActive && "border-[hsl(var(--primary))]"
    )}>
      {/* Header */}
      <div className={clsx(
        "broadcast-panel-header flex items-center justify-between",
        isSource && "bg-[hsl(var(--primary))]/10"
      )}>
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
            isSource 
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              : isTranslating
                ? "bg-amber-500/20 text-amber-400"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          )}>
            {language.flag}
          </div>
          <span className="text-[hsl(var(--foreground))]">{language.name}</span>
          {isSource && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]">
              SOURCE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Audio Level Mini Indicator */}
          <div className="flex items-center gap-0.5 h-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-1 rounded-full transition-all",
                  audioLevel > i * 20 
                    ? "bg-[hsl(var(--primary))]" 
                    : "bg-[hsl(var(--border))]"
                )}
                style={{ height: `${4 + i * 2}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Latest Caption Preview */}
        <div className="min-h-[48px] text-sm text-[hsl(var(--foreground))] leading-relaxed">
          {latestText || (
            <span className="text-[hsl(var(--muted-foreground))] italic">
              Waiting for input...
            </span>
          )}
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <div className={clsx(
              "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
              isActive 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            )}>
              <Signal className="w-2.5 h-2.5" />
              {isActive ? 'ACTIVE' : 'IDLE'}
            </div>

            {/* Confidence */}
            {!isSource && (
              <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                {(confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onMute}
              className={clsx(
                "p-1.5 rounded transition-colors",
                isMuted 
                  ? "bg-red-500/20 text-red-400" 
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggle}
              className={clsx(
                "p-1.5 rounded transition-colors",
                isActive
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))]"
              )}
            >
              {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LanguageRoutingPanel({
  sourceLanguage = AVAILABLE_LANGUAGES[0],
  targetLanguages = [AVAILABLE_LANGUAGES[1]],
  activeLanguages = ['en', 'sw'],
  translateEnabled = true,
  onToggleTranslation,
  englishText = '',
  swahiliText = '',
  audioLevel = 0,
  className
}) {
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [mutedLanguages, setMutedLanguages] = useState([]);

  const toggleMute = (code) => {
    setMutedLanguages(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div className={clsx(
      "h-full flex flex-col bg-[hsl(var(--background))]",
      className
    )}>
      {/* Panel Header */}
      <div className="broadcast-panel-header flex items-center justify-between rounded-t">
        <div className="flex items-center gap-2">
          <Languages className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          <span>Language Routing</span>
        </div>
        <button
          onClick={onToggleTranslation}
          className={clsx(
            "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors",
            translateEnabled
              ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          )}
        >
          {translateEnabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
          {translateEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Feeds */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Source Feed - English */}
        <LanguageFeed
          language={sourceLanguage}
          isSource={true}
          isActive={activeLanguages.includes(sourceLanguage.code)}
          audioLevel={audioLevel}
          latestText={englishText}
          isMuted={mutedLanguages.includes(sourceLanguage.code)}
          onMute={() => toggleMute(sourceLanguage.code)}
          onToggle={() => {}}
        />

        {/* Routing Arrow */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <div className="h-px w-8 bg-[hsl(var(--border))]" />
            <ArrowRight className="w-4 h-4" />
            <div className="h-px w-8 bg-[hsl(var(--border))]" />
          </div>
        </div>

        {/* Target Feeds */}
        {targetLanguages.map((lang, idx) => (
          <LanguageFeed
            key={lang.code}
            language={lang}
            isSource={false}
            isActive={translateEnabled && activeLanguages.includes(lang.code)}
            isTranslating={translateEnabled}
            audioLevel={translateEnabled ? audioLevel * 0.8 : 0}
            latestText={lang.code === 'sw' ? swahiliText : ''}
            confidence={0.92 + Math.random() * 0.06}
            isMuted={mutedLanguages.includes(lang.code)}
            onMute={() => toggleMute(lang.code)}
            onToggle={() => {}}
          />
        ))}

        {/* Add Language Slot */}
        <div className="relative">
          <button
            onClick={() => setShowAddLanguage(!showAddLanguage)}
            className={clsx(
              "w-full p-3 rounded border border-dashed border-[hsl(var(--border))]",
              "flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]",
              "hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            Add Language Output
          </button>

          {/* Dropdown */}
          {showAddLanguage && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg">
              {AVAILABLE_LANGUAGES
                .filter(l => l.code !== 'en' && !targetLanguages.find(t => t.code === l.code))
                .map(lang => (
                  <button
                    key={lang.code}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                    onClick={() => setShowAddLanguage(false)}
                  >
                    <span className="w-6 h-6 rounded bg-[hsl(var(--muted))] flex items-center justify-center text-[10px] font-bold">
                      {lang.flag}
                    </span>
                    {lang.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Routing Summary */}
      <div className="p-2 border-t border-[hsl(var(--border))]">
        <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
          <span>Active Routes: {activeLanguages.length}</span>
          <span>Outputs: {targetLanguages.length + 1}</span>
        </div>
      </div>
    </div>
  );
}
