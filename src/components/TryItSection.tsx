import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ModelWidget from './ModelWidget';
import type { ModelViewConfig } from './ModelWidget';

type DemoModel = {
  title: string;
  modelPath: string;
  keywords: string[];
};

type DemoState = 'idle' | 'thinking' | 'rendering' | 'done';

const THINKING_DELAY_MS = 600;
const REVEAL_DELAY_MS = 3200;

const PRESET_MODELS: DemoModel[] = [
  { title: 'Astronaut', modelPath: '/models/astronautV2_shaded.glb', keywords: ['space', 'astronaut', 'moon', 'nasa'] },
  { title: 'Batman', modelPath: '/models/batmanV2.glb', keywords: ['batman', 'hero', 'dark', 'gotham', 'superhero'] },
  { title: 'Firefighter', modelPath: '/models/firefighterV2.glb', keywords: ['fire', 'firefighter', 'rescue'] },
  { title: 'Geisha', modelPath: '/models/geisha.glb', keywords: ['geisha', 'japan', 'traditional', 'kimono'] },
  { title: 'Knight', modelPath: '/models/knightV2.glb', keywords: ['knight', 'medieval', 'armor', 'sword'] },
  { title: 'Military', modelPath: '/models/military.glb', keywords: ['military', 'soldier', 'army', 'combat'] },
  { title: 'Minecraft', modelPath: '/models/minecraftV2.glb', keywords: ['minecraft', 'blocky', 'voxel', 'cube'] },
  { title: 'Pikachu', modelPath: '/models/pikachuV2.glb', keywords: ['pikachu', 'pokemon', 'electric', 'cute'] },
  { title: 'Pirate', modelPath: '/models/pirateV2.glb', keywords: ['pirate', 'ship', 'captain', 'ocean'] },
  { title: 'Spiderman', modelPath: '/models/spiderman.glb', keywords: ['spiderman', 'spider', 'marvel', 'web'] },
  { title: 'Superman', modelPath: '/models/supermanV2.glb', keywords: ['superman', 'krypton', 'cape', 'dc'] },
  { title: 'Wizard', modelPath: '/models/wizardV2.glb', keywords: ['wizard', 'magic', 'mage', 'spell'] },
];

const TRY_IT_VIEW: ModelViewConfig = {
  autoFit: true,
  cameraPosition: [0, 1.4, 8],
  target: [0, 1, 0],
  boundsMargin: 1.2,
  modelRotation: [0, 0, 0],
  minDistance: 2.5,
  maxDistance: 40,
};

const PROMPT_SUGGESTIONS = [
  'A futuristic space explorer',
  'A medieval warrior with armor',
  'A comic superhero with a cape',
  'A magical fantasy character',
];

function hashToIndex(value: string, max: number) {
  if (max <= 0) {
    return 0;
  }

  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }

  return Math.abs(hash) % max;
}

function pickPresetModel(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase().trim();

  let bestScore = 0;
  let bestModel: DemoModel | null = null;

  PRESET_MODELS.forEach((model) => {
    const score = model.keywords.reduce((total, keyword) => {
      return normalizedPrompt.includes(keyword) ? total + 1 : total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
    }
  });

  if (bestModel) {
    return bestModel;
  }

  const fallbackIndex = hashToIndex(normalizedPrompt, PRESET_MODELS.length);
  return PRESET_MODELS[fallbackIndex];
}

function TryItSection() {
  const [prompt, setPrompt] = useState('A friendly superhero in red and blue');
  const [state, setState] = useState<DemoState>('idle');
  const [selectedModel, setSelectedModel] = useState<DemoModel | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);
  const renderTimerRef = useRef<number | null>(null);

  const statusLabel = useMemo(() => {
    if (state === 'thinking') {
      return 'Interpreting prompt...';
    }

    if (state === 'rendering') {
      return 'Building 3D preview...';
    }

    if (state === 'done') {
      return 'Preview ready';
    }

    return 'Type a prompt and click Try It';
  }, [state]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current !== null) {
        window.clearTimeout(thinkingTimerRef.current);
      }

      if (renderTimerRef.current !== null) {
        window.clearTimeout(renderTimerRef.current);
      }
    };
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      return;
    }

    setState('thinking');
    setSelectedModel(null);

    const chosenModel = pickPresetModel(cleanPrompt);

    if (thinkingTimerRef.current !== null) {
      window.clearTimeout(thinkingTimerRef.current);
    }

    if (renderTimerRef.current !== null) {
      window.clearTimeout(renderTimerRef.current);
    }

    thinkingTimerRef.current = window.setTimeout(() => {
      setState('rendering');
    }, THINKING_DELAY_MS);

    renderTimerRef.current = window.setTimeout(() => {
      setSelectedModel(chosenModel);
      setState('done');
    }, REVEAL_DELAY_MS);
  };

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-8 md:px-16">
        <div className="mb-16 md:mb-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-1 bg-[#FF6B35]" />
            <span className="mono text-[11px] tracking-widest text-white/40 uppercase">Interactive Demo</span>
          </div>
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.95] tracking-tighter text-white">
            GENERATE<br />PROTOTYPE
          </h2>
        </div>

        <div className="border border-white/5 bg-[#0a0a0a]">
          <div className="grid lg:grid-cols-2">
            <div className="border-b lg:border-b-0 lg:border-r border-white/5 p-8 md:p-12">
              <form onSubmit={onSubmit} className="space-y-8">
                <div>
                  <label htmlFor="try-it-prompt" className="mono text-[10px] tracking-widest text-white/40 uppercase mb-4 block">
                    Input Prompt
                  </label>
                  <textarea
                    id="try-it-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-none text-white mono text-sm leading-relaxed outline-none resize-none pb-4 border-b border-white/10 focus:border-[#FF6B35]/40 transition-colors placeholder:text-white/20"
                    placeholder="Enter character description..."
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="submit"
                    className="group relative bg-[#FF6B35] text-black mono text-xs tracking-wider px-8 py-3 font-semibold transition-all hover:bg-white"
                  >
                    EXECUTE
                  </button>

                  <div className="mono text-[10px] text-white/30">
                    {statusLabel}
                  </div>
                </div>
              </form>

              <div className="mt-12 pt-8 border-t border-white/5">
                <div className="mono text-[10px] tracking-widest text-white/40 uppercase mb-4">Quick Select</div>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setPrompt(suggestion)}
                      className="mono text-[10px] border border-white/10 px-3 py-1.5 text-white/40 transition-colors hover:border-[#FF6B35]/40 hover:text-white/60"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 min-h-[500px] flex items-center justify-center">
              {(state === 'thinking' || state === 'rendering') && !selectedModel ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="relative w-16 h-16 mb-8">
                    <div className="absolute inset-0 border border-white/10" />
                    <div className="absolute inset-0 border-t border-[#FF6B35] animate-spin" />
                  </div>
                  <p className="mono text-xs text-white/60 mb-2">
                    {state === 'thinking' ? 'PROCESSING INPUT' : 'GENERATING MODEL'}
                  </p>
                  <div className="w-64 h-[1px] bg-white/5 relative overflow-hidden mt-4">
                    <div
                      className="absolute h-full bg-[#FF6B35] transition-all duration-500"
                      style={{ width: state === 'thinking' ? '33%' : '80%' }}
                    />
                  </div>
                </div>
              ) : selectedModel ? (
                <div className="w-full">
                  <ModelWidget
                    title={selectedModel.title}
                    modelPath={selectedModel.modelPath}
                    caption="Preset library selection"
                    view={TRY_IT_VIEW}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 border border-dashed border-white/10 mx-auto mb-4" />
                  <p className="mono text-xs text-white/30">
                    AWAITING INPUT
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TryItSection;
