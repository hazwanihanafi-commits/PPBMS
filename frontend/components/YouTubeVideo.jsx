import { useEffect, useRef, useState } from "react";

export default function YouTubeVideo({ videoId, threshold = 0.9, onCompleted }) {
  const playerRef = useRef(null);
  const [state, setState] = useState("not_started");
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!videoId) return;
    let player;
    let timer;
    const create = () => {
      player = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: e => {
            if (e.data === window.YT.PlayerState.PLAYING) setState("watching");
            if (e.data === window.YT.PlayerState.PAUSED) setState("paused");
            if (e.data === window.YT.PlayerState.ENDED) {
              setPercent(100); setState("completed"); onCompleted?.(100);
            }
          }
        }
      });
      timer = setInterval(() => {
        if (!player?.getDuration) return;
        const d = player.getDuration();
        const c = player.getCurrentTime();
        if (d > 0) {
          const p = Math.min(1, c / d);
          setPercent(Math.round(p * 100));
          if (p >= threshold) onCompleted?.(Math.round(p * 100));
        }
      }, 1000);
    };
    if (window.YT?.Player) create();
    else {
      const old = document.getElementById("youtube-iframe-api");
      if (!old) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api"; script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); create(); };
    }
    return () => { if (timer) clearInterval(timer); try { player?.destroy(); } catch {} };
  }, [videoId, threshold, onCompleted]);

  if (!videoId) return <div className="rounded-2xl bg-slate-100 border p-6 text-sm text-slate-600">No video has been configured for this module yet. Please use the module content and self-check.</div>;
  return <div className="space-y-3"><div className="aspect-video rounded-2xl overflow-hidden bg-black"><div ref={playerRef} className="w-full h-full" /></div><div className="flex items-center justify-between text-xs"><span>{state === "completed" ? "✓ Video requirement met" : `Watched ${percent}%`}</span><span>Required: {Math.round(threshold*100)}%</span></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-purple-600" style={{width:`${percent}%`}} /></div></div>;
}
