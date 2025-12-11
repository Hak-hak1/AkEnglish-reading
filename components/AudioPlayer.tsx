import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Volume2, Loader2, X } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

// Helper to write string to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper to convert raw PCM to WAV
const createWavUrl = (pcmData: Uint8Array, sampleRate: number): string => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const numChannels = 1;

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  const wavBytes = new Uint8Array(header.byteLength + pcmData.length);
  wavBytes.set(new Uint8Array(header), 0);
  wavBytes.set(pcmData, header.byteLength);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const loadAudio = async () => {
    if (audioUrl) {
      if (audioRef.current) {
          audioRef.current.play().catch(e => console.error("Play failed", e));
      }
      return;
    }

    setIsLoading(true);
    const base64 = await generateSpeech(text);
    setIsLoading(false);

    if (base64) {
      try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Gemini TTS uses 24000Hz Sample Rate
        const url = createWavUrl(bytes, 24000);
        setAudioUrl(url);
        
        // Small timeout to allow element to update
        setTimeout(() => {
          if(audioRef.current) {
              audioRef.current.playbackRate = playbackRate;
              audioRef.current.play().catch(e => console.error("Auto-play failed", e));
          }
        }, 100);
      } catch (err) {
        console.error("Error processing audio data", err);
        alert("Failed to process audio.");
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current && !audioUrl) {
      loadAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  };

  const handleEnded = () => setIsPlaying(false);
  
  const changeSpeed = () => {
    const rates = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = playbackRate;
      }
  }, [playbackRate, audioUrl]);

  return (
    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm border border-slate-200">
      <button 
        onClick={togglePlay}
        disabled={isLoading}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 text-white transition disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="h-6 w-px bg-slate-200 mx-1"></div>

      <button 
        onClick={changeSpeed}
        className="text-xs font-medium text-slate-600 hover:text-brand-600 w-10 text-center"
      >
        {playbackRate}x
      </button>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onError={(e) => console.error("Audio Element Error", e)}
          hidden
        />
      )}
    </div>
  );
};

export default AudioPlayer;