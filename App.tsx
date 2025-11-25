
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { generatePrayer } from './services/geminiService';
import { savePrayerToHistory, getPrayersFromHistory, deletePrayerFromHistory, updatePrayerInHistory } from './services/storageService';
import { Language, PrayerEntry, PrayerResponse, Screen, User, PrayerStyle, Denomination, SocialTemplate } from './types';
import { BookIcon, GoogleIcon, HeartIcon, ArrowLeftIcon, PenIcon, TrashIcon, CheckIcon, SunIcon, ShareIcon, DownloadIcon, InstagramIcon, TelegramIcon, WhatsAppIcon, GearIcon, WindIcon, RainIcon, LightningIcon, MoonIcon, SpiralIcon, PrayingHandsIcon } from './components/Icons';

// --- Types for Mood ---
type Mood = 'calm' | 'hopeful';

// --- Constants ---
const MOODS = [
  { id: 'anxiety', label: 'Anxiety', icon: WindIcon, ru: 'Тревога', color: 'text-stone-500' },
  { id: 'sadness', label: 'Sadness', icon: RainIcon, ru: 'Грусть', color: 'text-blue-400' },
  { id: 'anger', label: 'Anger', icon: LightningIcon, ru: 'Гнев', color: 'text-red-400' },
  { id: 'tired', label: 'Tired', icon: MoonIcon, ru: 'Усталость', color: 'text-indigo-400' },
  { id: 'confused', label: 'Confused', icon: SpiralIcon, ru: 'Смятение', color: 'text-orange-400' },
  { id: 'grateful', label: 'Grateful', icon: PrayingHandsIcon, ru: 'Благодарность', color: 'text-green-500' },
];

const TEMPLATES = [
  { id: 'minimal', label: 'Minimal', color: 'bg-stone-100' },
  { id: 'atmospheric', label: 'Atmosphere', color: 'bg-indigo-900' },
  { id: 'classic', label: 'Classic', color: 'bg-amber-100' },
];

// --- Utility: Text Wrapping for Canvas ---
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const width = ctx.measureText(currentLine + " " + words[i]).width;
    if (width < maxWidth) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
};

// --- Utility: Canvas Image Generator (Templates) ---
const generateSocialImage = (verse: string, reference: string, template: SocialTemplate): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject('No Canvas');

    // Instagram Post Size (High Res)
    const width = 1080;
    const height = 1920; // Stories size
    canvas.width = width;
    canvas.height = height;

    // Reset styles
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (template === 'minimal') {
       // --- MINIMAL THEME ---
       // Background
       ctx.fillStyle = '#f7f5f0'; // Off-white
       ctx.fillRect(0, 0, width, height);
       
       // Branding
       ctx.fillStyle = '#1c1917';
       ctx.font = '500 32px "Inter", sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText("SOULSCRIBE", width / 2, 120);

       // Text
       ctx.fillStyle = '#1c1917';
       ctx.font = '400 80px "Merriweather", serif'; // Larger font
       const lines = wrapText(ctx, verse, width - 200);
       
       let startY = (height - (lines.length * 110)) / 2;
       lines.forEach(line => {
         ctx.fillText(line, width / 2, startY);
         startY += 110;
       });

       // Reference
       ctx.font = 'italic 500 40px "Merriweather", serif';
       ctx.fillStyle = '#57534e';
       ctx.fillText(reference, width / 2, startY + 60);

    } else if (template === 'atmospheric') {
       // --- ATMOSPHERIC THEME ---
       // Gradient Background: Night to Dawn (Deep Blue -> Gold)
       const grad = ctx.createLinearGradient(0, 0, 0, height);
       grad.addColorStop(0, '#0f172a'); // Deep Midnight Blue
       grad.addColorStop(0.5, '#312e81'); // Indigo
       grad.addColorStop(1, '#b45309'); // Warm Amber/Gold (Sunrise)
       ctx.fillStyle = grad;
       ctx.fillRect(0, 0, width, height);

       // "Glass" Card effect
       ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
       ctx.roundRect(100, height/2 - 400, width - 200, 800, 40);
       ctx.fill();
       // Border for glass
       ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
       ctx.lineWidth = 2;
       ctx.stroke();

       // Text
       ctx.fillStyle = '#ffffff';
       ctx.shadowColor = 'rgba(0,0,0,0.3)';
       ctx.shadowBlur = 15;
       ctx.textAlign = 'center';
       
       // Italic for dynamic feel
       ctx.font = 'italic 500 74px "Merriweather", serif';
       const lines = wrapText(ctx, verse, width - 300);
       let startY = height/2 - ((lines.length * 90) / 2);
       
       lines.forEach(line => {
         ctx.fillText(line, width / 2, startY);
         startY += 90;
       });

       // Reference
       ctx.font = '600 30px "Inter", sans-serif';
       ctx.fillStyle = 'rgba(255,255,255,0.9)';
       ctx.shadowBlur = 0;
       ctx.fillText(reference.toUpperCase(), width / 2, startY + 80);

       // Branding
       ctx.font = '400 24px "Inter", sans-serif';
       ctx.fillStyle = 'rgba(255,255,255,0.5)';
       ctx.fillText("SoulScribe App", width / 2, height - 100);

    } else {
       // --- CLASSIC THEME ---
       // Parchment color
       ctx.fillStyle = '#f5f5f4';
       ctx.fillRect(0, 0, width, height);
       
       // Texture noise (simulated)
       ctx.fillStyle = 'rgba(180, 148, 43, 0.05)';
       for(let i=0; i<5000; i++) {
           ctx.fillRect(Math.random()*width, Math.random()*height, 2, 2);
       }

       // Thin Gold Border
       ctx.strokeStyle = '#b4942b';
       ctx.lineWidth = 3;
       ctx.strokeRect(60, 60, width - 120, height - 120);
       ctx.lineWidth = 1;
       ctx.strokeRect(80, 80, width - 160, height - 160);

       // Text
       ctx.fillStyle = '#292524'; // Stone 800
       ctx.textAlign = 'center';
       
       ctx.font = '600 70px "Merriweather", serif';
       const lines = wrapText(ctx, verse, width - 260);
       let startY = (height - (lines.length * 100)) / 2;
       
       lines.forEach(line => {
         ctx.fillText(line, width / 2, startY);
         startY += 100;
       });

       // Reference with ornaments
       ctx.fillStyle = '#b4942b';
       ctx.font = '700 40px "Inter", sans-serif';
       ctx.fillText(`~ ${reference} ~`, width / 2, startY + 80);
       
       // Branding
       ctx.fillStyle = '#a8a29e';
       ctx.font = 'italic 24px "Merriweather", serif';
       ctx.fillText("SoulScribe", width / 2, height - 90);
    }

    resolve(canvas.toDataURL('image/png'));
  });
};


// --- Utility Components ---

const Button = ({ onClick, disabled, children, variant = 'primary', className = '' }: any) => {
  const baseStyle = "px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 z-10 relative";
  const variants = {
    primary: "bg-ink-900 text-cream-50 hover:bg-stone-800 shadow-md",
    secondary: "bg-cream-50/60 backdrop-blur-sm text-ink-900 border border-cream-200/50 hover:bg-cream-50 hover:border-cream-200",
    outline: "border border-ink-500/30 text-ink-700 hover:text-ink-900 hover:border-ink-500",
    ghost: "text-ink-500 hover:text-ink-900 hover:bg-cream-100/50 shadow-none px-4 py-2"
  };
  // @ts-ignore
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Background = ({ mood }: { mood: Mood }) => {
  return (
    <div className="fixed inset-0 z-0 transition-all duration-[2000ms] ease-in-out">
      {/* Calm/Anxious Background (Foggy/Twilight) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ${mood === 'calm' ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1485230905346-71acb9518d9c?q=80&w=2094&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-stone-500/30 backdrop-blur-[4px]"></div>
      </div>

      {/* Hopeful Background (Dawn/Light) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ${mood === 'hopeful' ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-amber-100/30 backdrop-blur-[3px]"></div>
      </div>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose,
  denomination,
  setDenomination,
  language
}: { 
  isOpen: boolean; 
  onClose: () => void;
  denomination: Denomination;
  setDenomination: (d: Denomination) => void;
  language: Language;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-cream-50 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border border-cream-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-500 hover:text-ink-900 bg-cream-100 rounded-full p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div className="text-center mb-6">
           <div className="w-12 h-12 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <GearIcon className="w-6 h-6 text-ink-700" />
           </div>
           <h3 className="text-xl font-serif font-bold text-ink-900">
             {language === 'ru' ? 'Настройки' : 'Settings'}
           </h3>
        </div>
        
        <div className="space-y-4">
             <div>
                <label className="text-ink-500 text-xs font-bold uppercase tracking-widest mb-3 block ml-1">
                   {language === 'ru' ? 'Традиция' : 'Tradition'}
                </label>
                <div className="flex flex-col gap-2">
                   {[
                      { id: 'general', label: language === 'ru' ? 'Общая' : 'General' },
                      { id: 'orthodox', label: language === 'ru' ? 'Православие' : 'Orthodox' },
                      { id: 'catholic', label: language === 'ru' ? 'Католичество' : 'Catholic' },
                      { id: 'protestant', label: language === 'ru' ? 'Протестантизм' : 'Protestant' },
                   ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setDenomination(item.id as Denomination)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                            denomination === item.id 
                            ? 'bg-ink-900 text-cream-50 shadow-md' 
                            : 'bg-white text-ink-900 hover:bg-cream-100 border border-cream-200'
                        }`}
                      >
                         {item.label}
                         {denomination === item.id && <CheckIcon className="w-4 h-4" />}
                      </button>
                   ))}
                </div>
             </div>
        </div>
        
        <div className="mt-8">
            <Button onClick={onClose} className="w-full">
              {language === 'ru' ? 'Готово' : 'Done'}
            </Button>
        </div>

      </div>
    </div>
  );
};

const ShareModal = ({ 
  isOpen, 
  onClose, 
  imageUrl,
  onTemplateChange,
  activeTemplate,
  isLoading
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string | null;
  onTemplateChange: (t: SocialTemplate) => void;
  activeTemplate: SocialTemplate;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  const handleNativeShare = async () => {
    if (imageUrl && navigator.share) {
        try {
            const blob = await (await fetch(imageUrl)).blob();
            const file = new File([blob], 'prayer-verse.png', { type: 'image/png' });
            await navigator.share({
                files: [file],
                title: 'SoulScribe Verse',
                text: 'A verse for you from SoulScribe.'
            });
        } catch (e) {
            console.log('Sharing failed', e);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-cream-50 rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all relative border border-cream-200 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-500 hover:text-ink-900 bg-cream-100 rounded-full p-2 z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h3 className="text-xl font-serif font-bold text-center mb-4 text-ink-900">Share Light ✨</h3>
        
        {/* Template Selector */}
        <div className="flex justify-center gap-3 mb-6">
            {TEMPLATES.map(t => (
                <button
                    key={t.id}
                    onClick={() => onTemplateChange(t.id as SocialTemplate)}
                    className={`flex flex-col items-center gap-1 group`}
                >
                    <div className={`w-12 h-12 rounded-lg border-2 shadow-sm transition-all ${activeTemplate === t.id ? 'border-ink-900 scale-105' : 'border-transparent opacity-70 group-hover:opacity-100'} ${t.id === 'minimal' ? 'bg-stone-100' : t.id === 'atmospheric' ? 'bg-indigo-900' : 'bg-amber-100'}`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTemplate === t.id ? 'text-ink-900' : 'text-ink-400'}`}>{t.label}</span>
                </button>
            ))}
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg mb-6 border border-cream-100 bg-gray-100 relative min-h-[300px] flex items-center justify-center">
           {isLoading ? (
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink-900"></div>
           ) : imageUrl ? (
               <img src={imageUrl} alt="Shareable Verse" className="w-full h-auto" />
           ) : null}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
            <button 
            onClick={handleNativeShare}
            className="w-full bg-ink-900 text-cream-50 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md"
            >
             <ShareIcon className="w-5 h-5" />
             Share Inspiration
            </button>
            
            <a 
            href={imageUrl || '#'} 
            download="soulscribe-verse.png"
            className="w-full bg-white border border-cream-200 text-ink-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-cream-50 transition-all"
            >
             <DownloadIcon className="w-5 h-5" />
             Save to Gallery
            </a>
        </div>

        {/* Direct Links (Visual Only/Deep Links) */}
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-cream-100">
            <button className="text-pink-600 hover:scale-110 transition-transform"><InstagramIcon className="w-6 h-6"/></button>
            <button className="text-blue-500 hover:scale-110 transition-transform"><TelegramIcon className="w-6 h-6"/></button>
            <button className="text-green-500 hover:scale-110 transition-transform"><WhatsAppIcon className="w-6 h-6"/></button>
        </div>
      </div>
    </div>
  );
};

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md bg-cream-50/80 bg-paper backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl text-center border border-white/40">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-cream-100/80 rounded-full shadow-inner ring-1 ring-cream-200">
            <PenIcon className="w-10 h-10 text-ink-700" />
          </div>
        </div>
        <h1 className="text-5xl font-serif font-bold text-ink-900 mb-4 tracking-tight">SoulScribe</h1>
        <p className="text-ink-500 mb-10 font-serif italic text-lg">"Cast all your anxiety on him because he cares for you."</p>
        
        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-white/60 border border-white/50 text-ink-700 font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/80 hover:shadow-lg transition-all shadow-sm"
          >
            {loading ? (
              <span className="animate-pulse text-ink-500">Connecting...</span>
            ) : (
              <>
                <GoogleIcon className="w-6 h-6" />
                <span className="text-lg">Sign in with Google</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-8 text-xs text-ink-500/50 uppercase tracking-widest">Secure & Private</p>
      </div>
    </div>
  );
};

const GeneratorScreen = ({ 
  user, 
  onNavigate,
  setMood
}: { 
  user: User; 
  onNavigate: (screen: Screen) => void;
  setMood: (mood: Mood) => void;
}) => {
  const [userInput, setUserInput] = useState('');
  const [language, setLanguage] = useState<Language>('ru');
  const [prayerStyle, setPrayerStyle] = useState<PrayerStyle>('classic');
  const [denomination, setDenomination] = useState<Denomination>('general');
  const [initialMood, setInitialMood] = useState<string | null>(null);
  const [reliefLevel, setReliefLevel] = useState<'none' | 'little' | 'much' | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrayerResponse | null>(null);
  const [saved, setSaved] = useState(false);
  
  // Sharing State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<SocialTemplate>('atmospheric');
  
  // Settings Modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Reset mood when user starts typing aggressively or clears content, 
  // but we keep 'hopeful' if they just view the result.
  useEffect(() => {
    if (!result) {
      setMood('calm');
    }
  }, [result, setMood]);

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    setResult(null);
    setSaved(false);
    setReliefLevel(null);
    
    // Scroll to top to prepare for new content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await generatePrayer(userInput, language, prayerStyle, denomination);
      setResult(data);
      setMood('hopeful'); // Switch background to hopeful/dawn
    } catch (e) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const entry: PrayerEntry = {
      ...result,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      userInput,
      language,
      style: prayerStyle,
      denomination: denomination,
      status: 'active',
      initialMood: initialMood || undefined,
      reliefLevel: reliefLevel || undefined
    };
    await savePrayerToHistory(entry);
    setSaved(true);
  };

  const handleShareClick = async () => {
    if (!result) return;
    setShareModalOpen(true);
    generateAndSetImage(activeTemplate);
  };

  const generateAndSetImage = async (template: SocialTemplate) => {
      if(!result) return;
      setGeneratingShare(true);
      try {
          const url = await generateSocialImage(result.verse, result.reference, template);
          setShareImageUrl(url);
      } catch (e) {
          console.error(e);
      } finally {
          setGeneratingShare(false);
      }
  };

  const handleTemplateChange = (template: SocialTemplate) => {
      setActiveTemplate(template);
      generateAndSetImage(template);
  };

  // Split prayer into sentences for the staggered animation
  const prayerSentences = useMemo(() => {
    if (!result) return [];
    // Split by punctuation that ends a sentence, keeping the punctuation
    return result.prayer.match(/[^.!?]+[.!?]+/g) || [result.prayer];
  }, [result]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32 relative z-10">
      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        denomination={denomination}
        setDenomination={setDenomination}
        language={language}
      />

      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        imageUrl={shareImageUrl} 
        onTemplateChange={handleTemplateChange}
        activeTemplate={activeTemplate}
        isLoading={generatingShare}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 
          className="text-xl font-serif font-bold text-white/90 flex items-center gap-2 drop-shadow-md cursor-pointer"
          onClick={() => { setResult(null); setUserInput(''); setInitialMood(null); }}
        >
          <PenIcon className="w-5 h-5 opacity-80" />
          SoulScribe
        </h2>
        <div className="flex gap-3">
          <div className="bg-cream-50/20 backdrop-blur-md rounded-xl p-1 border border-white/20 flex shadow-sm">
            <button 
              onClick={() => setLanguage('ru')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${language === 'ru' ? 'bg-cream-50/90 text-ink-900 shadow-sm' : 'text-cream-50/80 hover:text-white'}`}
            >
              RU
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${language === 'en' ? 'bg-cream-50/90 text-ink-900 shadow-sm' : 'text-cream-50/80 hover:text-white'}`}
            >
              EN
            </button>
          </div>
          <button 
             onClick={() => setSettingsOpen(true)}
             className="bg-cream-50/20 backdrop-blur-md text-white border border-white/20 hover:bg-cream-50/30 p-2 rounded-xl transition-colors"
          >
            <GearIcon className="w-6 h-6" />
          </button>
          <button 
             onClick={() => onNavigate('diary')}
             className="bg-cream-50/20 backdrop-blur-md text-white border border-white/20 hover:bg-cream-50/30 p-2 rounded-xl transition-colors"
          >
            <BookIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Input Area (Hidden when result is shown to focus on prayer) */}
      {!result && (
        <div className="space-y-4 animate-fade-in-up">
          
          {/* Mood Tracker (Minimal Icons) */}
          <div className="flex items-center justify-center gap-4 py-4 mb-2">
            {MOODS.map(m => {
                const Icon = m.icon;
                const isActive = initialMood === m.id;
                return (
                    <button
                        key={m.id}
                        onClick={() => setInitialMood(m.id)}
                        className={`flex flex-col items-center gap-2 group transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                        title={language === 'ru' ? m.ru : m.label}
                    >
                        <div className={`p-3 rounded-2xl transition-all ${isActive ? 'bg-cream-50 shadow-lg ' + m.color : 'bg-white/10 text-white'}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </button>
                )
            })}
          </div>

          <div className="relative group">
            {/* Input Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cream-200 to-white rounded-[2rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
            
            <div className="relative w-full rounded-[2rem] bg-cream-50/60 bg-paper backdrop-blur-xl shadow-xl overflow-hidden flex flex-col min-h-[340px] transition-all">
                <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={language === 'ru' ? "О чем болит ваше сердце сегодня? (Напишите своими словами...)" : "What is weighing on your heart today? (Write in your own words...)"}
                className="w-full flex-grow p-8 border-0 bg-transparent resize-none outline-none font-serif text-xl text-ink-700 leading-relaxed placeholder-ink-500/40"
                />
                
                {/* Embedded Style Selector (Chips) */}
                <div className="px-8 pb-6 flex flex-wrap gap-2">
                     {[
                      { id: 'classic', label: language === 'ru' ? 'Традиционный' : 'Classic' },
                      { id: 'modern', label: language === 'ru' ? 'Современный' : 'Modern' },
                      { id: 'short', label: language === 'ru' ? 'Краткий' : 'Short' },
                   ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPrayerStyle(item.id as PrayerStyle)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                            prayerStyle === item.id 
                            ? 'bg-ink-900 text-cream-50 shadow-sm' 
                            : 'bg-cream-100/50 text-ink-500 hover:bg-cream-200/50'
                        }`}
                      >
                         {item.label}
                      </button>
                   ))}
                </div>

                {userInput.length > 0 && (
                <button 
                    onClick={() => setUserInput('')}
                    className="absolute top-6 right-6 text-ink-500 hover:text-ink-900 transition-colors p-2"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                )}
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={loading || !userInput.trim()} 
            className="w-full text-lg shadow-lg py-4 bg-ink-900 hover:bg-black text-cream-50 rounded-2xl"
          >
            {loading ? (
               <span className="flex items-center gap-3">
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 {language === 'ru' ? "Слушаем сердце..." : "Listening..."}
               </span>
            ) : (
               <>
                  <HeartIcon className="w-5 h-5" />
                  {language === 'ru' ? "Преобразить в молитву" : "Transform into Prayer"}
               </>
            )}
          </Button>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="animate-fade-in-up">
           <div className="flex justify-start mb-6">
             <button 
               onClick={() => { setResult(null); setReliefLevel(null); }}
               className="text-white/90 hover:text-white flex items-center gap-2 font-medium backdrop-blur-md bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/20 shadow-sm"
             >
               <ArrowLeftIcon className="w-4 h-4" />
               {language === 'ru' ? "Написать новую" : "Write new"}
             </button>
           </div>

          <div className="bg-cream-50/85 bg-paper backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/30">
            {/* Title */}
            <div className="px-8 pt-12 pb-6 text-center">
              {/* Reduced font weight and size to not compete with drop cap */}
              <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ink-900 tracking-tight leading-tight">{result.title}</h3>
              {/* More subtle divider */}
              <div className="h-px w-16 bg-gold-500/40 mx-auto mt-6"></div>
            </div>
            
            {/* Prayer Text */}
            <div className="px-8 md:px-14 py-4">
              <div className="prose prose-lg mx-auto">
                {/* Changed to text-left for better readability */}
                <p className="text-xl md:text-2xl leading-[2.3] font-serif text-ink-700 drop-cap text-left tracking-wide">
                  {prayerSentences.map((sentence, index) => (
                    <span 
                      key={index} 
                      className="reveal-text inline"
                      style={{ animationDelay: `${index * 2.5}s` }} // Slow, staggered reveal
                    >
                      {sentence}{' '}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            {/* Bible Verse */}
            <div className="mx-6 md:mx-12 mb-10 mt-8 bg-cream-100/50 rounded-2xl p-8 border border-cream-200/50 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/30"></div>
               <div className="relative z-10">
                <p className="text-ink-700 font-serif italic text-lg md:text-xl leading-relaxed text-center mb-5">
                  "{result.verse}"
                </p>
                <div className="flex items-center justify-center gap-3">
                    <cite className="text-ink-500 font-sans text-sm font-bold tracking-widest uppercase not-italic">
                    — {result.reference}
                    </cite>
                    {/* Share Button (Text only) */}
                    <button 
                        onClick={handleShareClick}
                        className="text-gold-600 hover:text-gold-500 p-1 transition-colors"
                        title={language === 'ru' ? "Поделиться стихом" : "Share Verse"}
                    >
                        <ShareIcon className="w-4 h-4" />
                    </button>
                </div>
               </div>
            </div>

            {/* Post-Prayer Relief Tracker */}
            <div className="mx-6 md:mx-12 mb-8 bg-white/40 rounded-2xl p-4 flex flex-col items-center">
                 <p className="text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">
                     {language === 'ru' ? "Стало ли вам легче?" : "Do you feel better?"}
                 </p>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => setReliefLevel('much')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reliefLevel === 'much' ? 'bg-green-100 text-green-800 ring-1 ring-green-300' : 'bg-white text-ink-700 hover:bg-cream-100'}`}
                     >
                        {language === 'ru' ? "Да, намного" : "Yes, much"}
                     </button>
                     <button 
                        onClick={() => setReliefLevel('little')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reliefLevel === 'little' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' : 'bg-white text-ink-700 hover:bg-cream-100'}`}
                     >
                        {language === 'ru' ? "Немного" : "A little"}
                     </button>
                     <button 
                        onClick={() => setReliefLevel('none')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reliefLevel === 'none' ? 'bg-stone-200 text-stone-600 ring-1 ring-stone-300' : 'bg-white text-ink-700 hover:bg-cream-100'}`}
                     >
                        {language === 'ru' ? "Нет" : "No"}
                     </button>
                 </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-cream-100/40 border-t border-cream-200/50 flex flex-col md:flex-row items-center justify-center gap-4 pb-8">
              <Button 
                onClick={handleSave}
                disabled={saved}
                className={`w-full md:w-auto ${
                  saved 
                  ? 'bg-green-50/50 text-green-800 border border-green-200 cursor-default shadow-none' 
                  : 'bg-ink-900 text-cream-50 hover:shadow-xl hover:bg-black'
                }`}
              >
                {saved ? <CheckIcon className="w-5 h-5"/> : <BookIcon className="w-5 h-5"/>}
                {saved 
                  ? (language === 'ru' ? 'Сохранено' : 'Saved') 
                  : (language === 'ru' ? 'Сохранить в Дневник' : 'Save to Diary')
                }
              </Button>
              
              <Button
                variant="outline"
                onClick={handleShareClick}
                disabled={generatingShare}
                className="w-full md:w-auto"
              >
                {generatingShare ? (
                    <div className="w-4 h-4 border-2 border-ink-500 border-t-ink-900 rounded-full animate-spin"></div>
                ) : (
                    <ShareIcon className="w-5 h-5" />
                )}
                {language === 'ru' ? "Создать открытку" : "Create Card"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DiaryScreen = ({ onNavigate, setMood }: { onNavigate: (screen: Screen) => void, setMood: (mood: Mood) => void }) => {
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'gratitude'>('requests');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadPrayers();
  }, []);

  useEffect(() => {
    // Set mood based on tab
    setMood(activeTab === 'gratitude' ? 'hopeful' : 'calm');
  }, [activeTab, setMood]);

  const loadPrayers = async () => {
    const data = await getPrayersFromHistory();
    // Sort: newest first
    setPrayers(data.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this prayer?")) {
      await deletePrayerFromHistory(id);
      loadPrayers();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    // Close answering mode if switching items
    if (answeringId && answeringId !== id) {
        setAnsweringId(null);
        setAnswerText('');
    }
  };

  const startAnswering = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAnsweringId(id);
    setExpandedId(id); // Ensure expanded
  };

  const submitAnswer = async (id: string) => {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    const updatedPrayer: PrayerEntry = {
        ...prayer,
        status: 'answered',
        answerDate: Date.now(),
        answerNote: answerText
    };

    await updatePrayerInHistory(updatedPrayer);
    setAnsweringId(null);
    setAnswerText('');
    setActiveTab('gratitude'); // Move to gratitude tab to show success
    loadPrayers();
  };

  const activePrayers = prayers.filter(p => p.status !== 'answered');
  const answeredPrayers = prayers.filter(p => p.status === 'answered');
  const displayList = activeTab === 'requests' ? activePrayers : answeredPrayers;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative z-10 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="secondary" onClick={() => onNavigate('generator')} className="!rounded-full w-12 h-12 !p-0 bg-cream-50/20 text-cream-50 border-white/20 hover:bg-cream-50/40 hover:border-white/40">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h2 className="text-3xl font-serif font-bold text-cream-50 drop-shadow-md">Prayer Journal</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-xl backdrop-blur-md w-fit mx-auto md:mx-0 border border-white/10">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'requests' ? 'bg-cream-50/90 text-ink-900 shadow-md' : 'text-cream-50/80 hover:bg-white/10'}`}
        >
          Requests ({activePrayers.length})
        </button>
        <button
          onClick={() => setActiveTab('gratitude')}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'gratitude' ? 'bg-cream-50/90 text-ink-900 shadow-md' : 'text-cream-50/80 hover:bg-white/10'}`}
        >
          <SunIcon className="w-4 h-4" />
          Gratitude ({answeredPrayers.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white"></div>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-24 bg-cream-50/80 bg-paper backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/30 mx-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${activeTab === 'gratitude' ? 'bg-amber-100 text-amber-500' : 'bg-cream-100 text-ink-500'}`}>
             {activeTab === 'gratitude' ? <SunIcon className="w-8 h-8"/> : <BookIcon className="w-8 h-8"/>}
          </div>
          <p className="text-ink-500 font-medium text-lg mb-6">
            {activeTab === 'gratitude' ? "No answered prayers yet. Keep believing." : "Your journal is currently empty."}
          </p>
          {activeTab === 'requests' && (
            <button 
                onClick={() => onNavigate('generator')}
                className="text-ink-900 font-semibold hover:text-ink-700 border-b-2 border-cream-200 hover:border-ink-900 transition-all pb-1"
            >
                Start your first prayer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-24">
          {displayList.map((prayer) => (
            <div 
              key={prayer.id} 
              onClick={() => toggleExpand(prayer.id)}
              className={`
                bg-cream-50/85 bg-paper backdrop-blur-md rounded-[2rem] shadow-lg border border-white/40 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.01] hover:bg-cream-50/95
                ${expandedId === prayer.id ? 'ring-2 ring-ink-900/10' : ''}
                ${activeTab === 'gratitude' ? 'border-l-4 border-l-amber-400' : ''}
              `}
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className="text-xs font-bold text-ink-500 uppercase tracking-wider bg-cream-100/80 px-2 py-1 rounded-md">
                         {new Date(prayer.timestamp).toLocaleDateString()}
                       </span>
                       {activeTab === 'gratitude' && prayer.answerDate && (
                         <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-100 px-2 py-1 rounded-md flex items-center gap-1">
                            <CheckIcon className="w-3 h-3"/> Answered {new Date(prayer.answerDate).toLocaleDateString()}
                         </span>
                       )}
                       {/* Style badges */}
                       <span className="text-xs font-bold text-ink-500 uppercase tracking-wider bg-cream-100/80 px-2 py-1 rounded-md">
                         {prayer.style}
                       </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-ink-900 leading-tight">{prayer.title}</h3>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, prayer.id)}
                    className="text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all p-2 -mr-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {!expandedId && (
                  <p className="text-ink-500 line-clamp-2 font-serif text-lg leading-relaxed">
                    {prayer.prayer}
                  </p>
                )}

                {/* Expanded Content */}
                <div className={`grid transition-all duration-500 ease-in-out ${expandedId === prayer.id ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                     <p className="text-ink-700 font-serif leading-[2.2] whitespace-pre-wrap mb-8 text-lg">
                       {prayer.prayer}
                     </p>
                     
                     <div className="bg-cream-100/50 p-6 rounded-2xl border border-cream-200/50 mb-6">
                        <p className="text-ink-700 italic font-serif text-lg mb-2 text-center">"{prayer.verse}"</p>
                        <p className="text-ink-500 text-xs font-bold text-center uppercase tracking-widest">— {prayer.reference}</p>
                     </div>

                     <div className="pt-4 border-t border-cream-200/50">
                        <p className="text-xs text-ink-500 font-bold uppercase tracking-widest mb-1">Original Thought</p>
                        <p className="text-ink-500 italic font-serif mb-6">"{prayer.userInput}"</p>
                     </div>

                     {/* Gratitude/Answer Section */}
                     {activeTab === 'gratitude' && (
                        <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-100 mt-4 relative">
                            <SunIcon className="absolute top-4 right-4 text-amber-200 w-8 h-8 opacity-50" />
                            <h4 className="text-amber-800 font-bold font-serif mb-2 flex items-center gap-2">
                                Answer / Testimony
                            </h4>
                            <p className="text-ink-700 font-serif leading-relaxed italic">
                                "{prayer.answerNote}"
                            </p>
                        </div>
                     )}

                     {/* Mark as Answered Action */}
                     {activeTab === 'requests' && !answeringId && (
                         <div className="mt-8 flex justify-center">
                             <Button 
                                variant="outline" 
                                onClick={(e: any) => startAnswering(e, prayer.id)}
                                className="w-full md:w-auto border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                             >
                                <SunIcon className="w-5 h-5" />
                                {prayer.language === 'ru' ? 'Ситуация разрешилась?' : 'Has this been answered?'}
                             </Button>
                         </div>
                     )}

                     {/* Answering Form */}
                     {answeringId === prayer.id && (
                        <div className="mt-6 bg-cream-50 border border-cream-200 rounded-2xl p-6 shadow-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                            <h4 className="text-lg font-serif font-bold text-ink-900 mb-2">
                                {prayer.language === 'ru' ? 'Слава Богу! Расскажите, как это произошло:' : 'Praise God! Tell us how it happened:'}
                            </h4>
                            <textarea
                                value={answerText}
                                onChange={e => setAnswerText(e.target.value)}
                                className="w-full h-32 p-4 border border-cream-200 rounded-xl mb-4 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none font-serif text-ink-700 bg-white"
                                placeholder={prayer.language === 'ru' ? "Напишите здесь ваше свидетельство..." : "Write your testimony here..."}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setAnsweringId(null)}>Cancel</Button>
                                <Button 
                                    onClick={() => submitAnswer(prayer.id)}
                                    disabled={!answerText.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-amber-200"
                                >
                                    {prayer.language === 'ru' ? 'В Благодарности' : 'Move to Gratitude'}
                                </Button>
                            </div>
                        </div>
                     )}

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [mood, setMood] = useState<Mood>('calm');

  // Simple auth persistence mock
  useEffect(() => {
    const storedUser = localStorage.getItem('soulscribe_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentScreen('generator');
    }
  }, []);

  const handleLogin = () => {
    const mockUser: User = {
      id: '123',
      name: 'Test User',
      email: 'user@example.com'
    };
    setUser(mockUser);
    localStorage.setItem('soulscribe_user', JSON.stringify(mockUser));
    setCurrentScreen('generator');
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (screen === 'diary') {
        // Diary handles its own mood initially
    }
  };

  // Render Logic
  let content;
  if (!user || currentScreen === 'login') {
    content = <LoginScreen onLogin={handleLogin} />;
  } else if (currentScreen === 'generator') {
    content = <GeneratorScreen user={user} onNavigate={handleNavigate} setMood={setMood} />;
  } else if (currentScreen === 'diary') {
    content = <DiaryScreen onNavigate={handleNavigate} setMood={setMood} />;
  }

  return (
    <div className="min-h-screen text-ink-900 font-sans selection:bg-gold-500/30 selection:text-ink-900 relative">
      <Background mood={mood} />
      {content}
    </div>
  );
}
