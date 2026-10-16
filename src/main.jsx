
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./animations.css";

const presets = [
  {
    name: "Mazha",
    malayalam: "മഴ",
    emoji: "🌧️",
    subtitle: "A rainy afternoon",
    volumes: [70, 10, 0, 20, 5, 35],
  },
  {
    name: "Chayakkada",
    malayalam: "ചായക്കട",
    emoji: "☕",
    subtitle: "A familiar tea shop",
    volumes: [10, 70, 10, 15, 65, 0],
  },
  {
    name: "Gramam",
    malayalam: "ഗ്രാമം",
    emoji: "🌴",
    subtitle: "The village in the evening",
    volumes: [10, 20, 65, 35, 25, 0],
  },
  {
    name: "Rathri",
    malayalam: "രാത്രി",
    emoji: "🌙",
    subtitle: "A quiet Kerala night",
    volumes: [25, 5, 70, 15, 5, 15],
  },
];

const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`;

const soundList = [
  {
    name: "Rain",
    malayalam: "മഴ",
    src: `${AUDIO_BASE}rain.mp3`,
    emoji: "🌧️",
  },
  {
    name: "Tea Shop",
    malayalam: "ചായക്കട",
    src: `${AUDIO_BASE}tea-shop.mp3`,
    emoji: "☕",
  },
  {
    name: "Crickets",
    malayalam: "ചീവീടുകൾ",
    src: `${AUDIO_BASE}crickets.mp3`,
    emoji: "🦗",
  },
  {
    name: "Wind",
    malayalam: "കാറ്റ്",
    src: `${AUDIO_BASE}wind.mp3`,
    emoji: "🍃",
  },
  {
    name: "Samsaaram",
    malayalam: "സംസാരം",
    src: `${AUDIO_BASE}samsaaram.mp3`,
    emoji: "💬",
  },
  {
    name: "Idi",
    malayalam: "ഇടി",
    src: `${AUDIO_BASE}idi.mp3`,
    emoji: "🌩️",
  },
];

const musicTracks = [
  {
    name: "Ariyathe Ariyathe",
    file: "Ariyathe Ariyathe (From _Ariyathe Ariyathe Duet_).mp3",
  },
  {
    name: "Pichavecha Naal",
    file: "Pichavecha Naal.mp3",
  },
  {
    name: "Mizhiyil",
    file: "Mizhiyil - From 'Mayaanadhi'.mp3",
  },
  {
    name: "Oru Mezhuthiriyude",
    file: "Oru Mezhuthiriyude.mp3",
  },
  {
    name: "Junile Nilamazhayil",
    file: "Junile Nilamazhayil.mp3",
  },
  {
    name: "Manju Pole",
    file: "Manju Pole.mp3",
  },
  {
    name: "Shyamambaram",
    file: "Shyamambaram.mp3",
  },
  {
    name: "Payye Veesum",
    file: "Payye Veesum.mp3",
  },
    {
    name: "Sneham Cherum Neram",
    file: "Sneham Cherum Neram.mp3",
  },
      {
    name: "Kathal Oviyam - From _Alaigal Oyvatillai_",
    file: "Kathal Oviyam - From _Alaigal Oyvatillai_.mp3",
  },
      {
    name: "Innum Konjam Neram",
    file: "Innum Konjam Neram.mp3",
  },
      {
    name: "Netru Illatha Maatram",
    file: "Netru Illatha Maatram.mp3",
  },
      {
    name: "Enna Vilai",
    file: "Enna Vilai.mp3",
  },
      {
    name: "Chinna Chinna Asai",
    file: "Chinna Chinna Asai.mp3",
  },
      {
    name: "Kaattrae En Vaasal - Wind",
    file: "Kaattrae En Vaasal - Wind.mp3",
  },
      {
    name: "Oru Kaathilola",
    file: "Oru Kaathilola.mp3",
  },
];

function getMusicUrl(filename) {
  // Use Vite's configured base URL so audio paths work in production too.
  // Encode each filename segment to safely handle spaces and punctuation.
  return (
    AUDIO_BASE +
    filename
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("kattankappi-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [presetIndex, setPresetIndex] = useState(null);
  const [volumes, setVolumes] = useState([0, 0, 0, 0, 0, 0]);
  const [playing, setPlaying] = useState(false);
  const [vibe, setVibe] = useState(false);

  // Customizable sleep timer (minutes) and countdown state.
  const [sleepMinutes, setSleepMinutes] = useState(30);
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const [sleepTimerEndAt, setSleepTimerEndAt] = useState(null);

  // Radio player state.
  const [trackIndex, setTrackIndex] = useState(5);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicTime, setMusicTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicVolume, setMusicVolume] = useState(70);
  const [musicError, setMusicError] = useState(false);

  // Start with the playlist collapsed.
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const audioRefs = useRef([]);
  const musicAudioRef = useRef(null);
  const shouldAutoplayRef = useRef(false);

  // Web Audio gain nodes provide reliable per-sound volume control on mobile Safari.
  const audioContextRef = useRef(null);
  const audioGraphRef = useRef(new WeakMap());

  const currentTrack = musicTracks[trackIndex];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("kattankappi-theme", theme);
    } catch {
      // The theme still works if browser storage is unavailable.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

  function formatMusicTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }

  function getAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    return audioContextRef.current;
  }

  function resumeAudioContext() {
    const context = getAudioContext();

    if (context && context.state === "suspended") {
      context.resume().catch((error) => {
        console.warn("Could not resume the audio context.", error);
      });
    }

    return context;
  }

  function setAudioElementVolume(audio, volume) {
    if (!audio) return;

    const level = Math.max(0, Math.min(1, Number(volume) || 0));
    const context = getAudioContext();

    if (context) {
      try {
        let graph = audioGraphRef.current.get(audio);

        if (!graph) {
          const source = context.createMediaElementSource(audio);
          const gain = context.createGain();

          source.connect(gain);
          gain.connect(context.destination);

          graph = { source, gain, context };
          audioGraphRef.current.set(audio, graph);
        }

        if (graph.context === context) {
          graph.gain.gain.setTargetAtTime(
            level,
            context.currentTime,
            0.015
          );
          return;
        }
      } catch (error) {
        // Fall back to the native volume property if Web Audio is unavailable.
        console.warn("Using native audio volume as a fallback.", error);
      }
    }

    audio.volume = level;
  }

  // Keep radio volume on the native HTMLAudioElement. Routing the music
  // player through Web Audio can cause iOS Safari to suspend playback when
  // the screen locks or the browser moves to the background.
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = Math.max(0, Math.min(1, musicVolume / 100));
    }
  }, [musicVolume, trackIndex]);

  // Register media-session metadata and lock-screen controls where supported.
  // This helps mobile browsers keep the track represented as active media.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return undefined;
    }

    const session = navigator.mediaSession;
    const track = musicTracks[trackIndex];

    if ("MediaMetadata" in window) {
      session.metadata = new window.MediaMetadata({
        title: track.name,
        artist: "Kattankappi Radio",
        album: "Malayalam melodies · Chaya-time playlist",
      });
    }

    const register = (action, handler) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Some browsers support only a subset of media-session actions.
      }
    };

    register("play", () => { void toggleMusicPlayback(); });
    register("pause", () => {
      const audio = musicAudioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
      }
    });
    register("previoustrack", () => changeTrack(trackIndex - 1));
    register("nexttrack", () => changeTrack(trackIndex + 1));
    register("seekbackward", (details) => {
      const audio = musicAudioRef.current;
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
    });
    register("seekforward", (details) => {
      const audio = musicAudioRef.current;
      if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10));
    });
    register("seekto", (details) => {
      const audio = musicAudioRef.current;
      if (audio && Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime;
    });

    return () => {
      ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"].forEach((action) => {
        try { session.setActionHandler(action, null); } catch { /* Unsupported action. */ }
      });
    };
  }, [trackIndex, musicPlaying]);

  function syncAudio(levels, shouldPlay) {
    audioRefs.current.forEach((audio, index) => {
      if (!audio) return;

      setAudioElementVolume(audio, (levels[index] ?? 0) / 100);

      if (shouldPlay && levels[index] > 0) {
        audio.play().catch((error) => {
          console.error(
            `Could not play ${soundList[index].name}. Check that ${soundList[index].src} exists.`,
            error
          );
        });
      } else {
        audio.pause();
      }
    });
  }

  function togglePlayback() {
    resumeAudioContext();

    if (playing) {
      syncAudio(volumes, false);
      setPlaying(false);
    } else {
      syncAudio(volumes, true);
      setPlaying(true);
    }
  }

  // Synchronize ambience playback with mixer controls.
  useEffect(() => {
    syncAudio(volumes, playing);
  }, [playing, volumes]);

  // When the sleep timer reaches zero, stop all ambience and radio audio.
  useEffect(() => {
    if (!sleepTimerActive || !sleepTimerEndAt) return undefined;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((sleepTimerEndAt - Date.now()) / 1000)
      );
      setSleepTimerRemaining(remaining);

      if (remaining === 0) {
        audioRefs.current.forEach((audio) => {
          if (audio) audio.pause();
        });

        if (musicAudioRef.current) musicAudioRef.current.pause();

        shouldAutoplayRef.current = false;
        setVolumes([0, 0, 0, 0, 0, 0]);
        setPlaying(false);
        setVibe(false);
        setMusicPlaying(false);
        setSleepTimerActive(false);
        setSleepTimerEndAt(null);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [sleepTimerActive, sleepTimerEndAt]);

  function toggleSleepTimer() {
    if (sleepTimerActive) {
      setSleepTimerActive(false);
      setSleepTimerEndAt(null);
      setSleepTimerRemaining(0);
      return;
    }

    const minutes = Math.min(
      720,
      Math.max(1, Number(sleepMinutes) || 1)
    );

    setSleepMinutes(minutes);
    setSleepTimerRemaining(minutes * 60);
    setSleepTimerEndAt(Date.now() + minutes * 60 * 1000);
    setSleepTimerActive(true);
  }

  function formatSleepTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  // Stop audio when leaving the page.
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });

      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
    };
  }, []);

  // Select a song and autoplay after the browser can play it.
  function changeTrack(index) {
    const nextIndex =
      (index + musicTracks.length) % musicTracks.length;

    const audio = musicAudioRef.current;
    shouldAutoplayRef.current = true;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setTrackIndex(nextIndex);
    setMusicTime(0);
    setMusicDuration(0);
    setMusicError(false);
    setMusicPlaying(true);
  }

  async function startSelectedTrack() {
    const audio = musicAudioRef.current;

    if (!audio || !shouldAutoplayRef.current) return;

    try {
      audio.volume = Math.max(0, Math.min(1, musicVolume / 100));
      await audio.play();

      shouldAutoplayRef.current = false;
      setMusicPlaying(true);
      setMusicError(false);
    } catch (error) {
      console.error("Could not play the selected music file.", error);

      shouldAutoplayRef.current = false;
      setMusicPlaying(false);
      setMusicError(true);
    }
  }

  async function toggleMusicPlayback() {
    const audio = musicAudioRef.current;
    if (!audio) return;

    // Do not connect the radio element to Web Audio: native media playback
    // is more reliable on mobile when the screen is locked/backgrounded.
    if (musicPlaying) {
      shouldAutoplayRef.current = false;
      audio.pause();
      setMusicPlaying(false);
      return;
    }

    shouldAutoplayRef.current = false;

    try {
      await audio.play();
      setMusicPlaying(true);
      setMusicError(false);
    } catch (error) {
      console.error("Could not play the music file.", error);
      setMusicPlaying(false);
      setMusicError(true);
    }
  }

  function handleMusicEnded() {
    changeTrack((trackIndex + 1) % musicTracks.length);
  }

  function choosePreset(index) {
    resumeAudioContext();
    setPresetIndex(index);
    setVolumes([...presets[index].volumes]);
    setVibe(true);
    setPlaying(true);
  }

  function updateVolume(index, value) {
    resumeAudioContext();
    const nextVolumes = volumes.map((volume, i) =>
      i === index ? Number(value) : volume
    );

    setVolumes(nextVolumes);

    if (nextVolumes.some((volume) => volume > 0)) {
      setPlaying(true);
      setVibe(true);
    } else {
      setPlaying(false);
      setVibe(false);
    }
  }

  function toggleSound(index) {
    resumeAudioContext();
    const isCurrentlyOn = volumes[index] > 0;

    if (isCurrentlyOn) {
      const nextVolumes = volumes.map((volume, i) =>
        i === index ? 0 : volume
      );

      setVolumes(nextVolumes);

      if (nextVolumes.every((volume) => volume === 0)) {
        setPlaying(false);
        setVibe(false);
      }
    } else {
      setVolumes((previous) =>
        previous.map((volume, i) =>
          i === index ? 40 : volume
        )
      );

      setPlaying(true);
      setVibe(true);
    }
  }

  function toggleVibe() {
    resumeAudioContext();

    if (vibe) {
      // Vibe off: stop all ambience sounds without changing the selected preset.
      setVolumes([0, 0, 0, 0, 0, 0]);
      setPlaying(false);
      setVibe(false);
      return;
    }

    // Vibe on: play only Rain; do not select or restore any preset.
    setVolumes([40, 0, 0, 0, 0, 0]);
    setPlaying(true);
    setVibe(true);
  }

  function togglePlaylist() {
    setPlaylistOpen((open) => !open);
  }

  function updateMusicVolume(value) {
    const nextVolume = Math.max(0, Math.min(100, Number(value) || 0));

    if (musicAudioRef.current) {
      // Use the native media volume for the radio so background playback
      // does not depend on a Web Audio context staying active on mobile.
      musicAudioRef.current.volume = nextVolume / 100;
    }

    setMusicVolume(nextVolume);
  }

  return (
    <div className="app-shell" id="home">
      {/* Ambience audio elements */}
      {soundList.map((sound, index) => (
        <audio
          key={sound.name}
          ref={(element) => {
            audioRefs.current[index] = element;
          }}
          src={sound.src}
          loop
          preload="none"
        />
      ))}

      <header className="topbar">
        <a className="brand" href="#home">
          <img className="brand-icon brand-logo" src={`${import.meta.env.BASE_URL}logo-kattankappi.png`} alt="Kattankappi logo" />
          <span>
            <strong>kattankappi</strong>
            <small>ഒരു കാപ്പി, കുറച്ചു സമാധാനം</small>
          </span>
        </a>

        <div className="topbar-actions">
          <span className="topbar-note">
            <span className="status-dot" /> YOUR LITTLE ESCAPE
          </span>
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
            <span className="theme-toggle-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      {/* Cinematic Kerala tea-shop banner. Image file: Public/home.png */}
      <section
        className="hero hero-image-banner"
        aria-label="Kattankappi home banner"
        style={{
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          backgroundColor: "#10251d",
        }}
      >
        <img
          className="hero-banner-image"
          src={`${import.meta.env.BASE_URL}home.png`}
          alt="A cozy Kerala tea shop on a rainy evening"
          fetchPriority="high"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <div
          className="hero-banner-overlay"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(5,20,15,.82) 0%, rgba(5,20,15,.64) 48%, rgba(5,20,15,.28) 100%), linear-gradient(0deg, rgba(5,20,15,.34), rgba(5,20,15,.06))",
          }}
        />
        <div
          className="hero-banner-content"
          style={{ position: "relative", zIndex: 2, width: "100%" }}
        >
          <p className="hero-banner-eyebrow">THE SOUND OF KERALA</p>
          <h1>
            ഒരു കട്ടൻ കാപ്പി.
            <br />
            <em style={{ color: "#e8c47b", fontStyle: "normal" }}>
              കുറച്ച് സമാധാനം.
            </em>
          </h1>
          <p className="hero-banner-subtitle">
            മഴയുടെ ശബ്ദവും മനോഹരമായ ഓർമ്മകളും.
            <br />
            നിങ്ങളുടെ സ്വന്തം ചെറിയ കേരളം.
          </p>
          <p className="hero-banner-caption">
            മഴ · കാപ്പി · ഓർമ്മകൾ
          </p>
        </div>
      </section>

      <section className="section">
        <span className="section-label">PICK YOUR MOMENT</span>
        <h2>ഇന്നത്തെ vibe എന്താണ്?</h2>

        <p className="section-description">
          ഒരു preset തിരഞ്ഞെടുക്കൂ. നിങ്ങളുടെ mood-ന് ചേരുന്ന ambience കണ്ടെത്തൂ.
        </p>

        <div className="preset-grid">
          {presets.map((preset, index) => {
            const presetLooks = [
              {
                background:
                  "radial-gradient(circle at 82% 18%, rgba(177, 211, 222, 0.38), transparent 34%), linear-gradient(145deg, #203f3c 0%, #315c55 52%, #172f31 100%)",
                accent: "#c5e4df",
                glow: "rgba(157, 220, 215, 0.38)",
                decoration: "rain",
              },
              {
                background:
                  "radial-gradient(circle at 84% 18%, rgba(231, 190, 115, 0.4), transparent 32%), linear-gradient(145deg, #5a3d2a 0%, #765239 52%, #342b24 100%)",
                accent: "#f0d09a",
                glow: "rgba(239, 197, 125, 0.38)",
                decoration: "steam",
              },
              {
                background:
                  "radial-gradient(circle at 82% 18%, rgba(166, 197, 126, 0.36), transparent 34%), linear-gradient(145deg, #254a37 0%, #3d6848 54%, #1b352b 100%)",
                accent: "#d1e4a8",
                glow: "rgba(180, 218, 132, 0.36)",
                decoration: "leaves",
              },
              {
                background:
                  "radial-gradient(circle at 82% 18%, rgba(156, 152, 211, 0.38), transparent 34%), linear-gradient(145deg, #272b48 0%, #3c4266 52%, #1b2038 100%)",
                accent: "#d4d1ff",
                glow: "rgba(174, 169, 255, 0.36)",
                decoration: "stars",
              },
            ];
            const look = presetLooks[index] || presetLooks[0];
            const isSelected = presetIndex === index;

            return (
              <button
                key={preset.name}
                className={`preset-card preset-card-dynamic ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => choosePreset(index)}
                aria-pressed={isSelected}
                style={{
                  "--preset-background": look.background,
                  "--preset-accent": look.accent,
                  "--preset-glow": look.glow,
                  "--preset-selected": isSelected ? 1 : 0,
                }}
              >
                <span className="preset-shimmer" aria-hidden="true" />
                <span aria-hidden="true" className="preset-glow-orb" />
                <span className="preset-emoji">
                  {preset.emoji}
                </span>
                <strong className="preset-title">
                  {preset.name}
                </strong>
                <small className="preset-subtitle">
                  {preset.subtitle}
                </small>

                {isSelected && (
                  <span className="checkmark" aria-label="Selected preset">
                    ✓
                  </span>
                )}
                <span className="preset-accent-line" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="section mixer-section" id="mixer">
        <div className="section-heading-row">
          <div>
            <span className="section-label">
              YOUR PERSONAL SOUNDSTAGE
            </span>

            <div className="mixer-title-row">
              <h2>Mix your ambience.</h2>

              <button
                className={`vibe-button ${vibe ? "active" : ""}`}
                onClick={toggleVibe}
              >
                ✦ {vibe ? "Vibe on" : "Vibe off"}
              </button>

              <div className={`sleep-timer ${sleepTimerActive ? "is-active" : ""}`}>
                <label htmlFor="sleep-timer-minutes">Sleep timer</label>

                <div className="sleep-timer-controls">
                  <input
                    id="sleep-timer-minutes"
                    type="number"
                    min="1"
                    max="720"
                    step="1"
                    value={sleepMinutes}
                    disabled={sleepTimerActive}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSleepMinutes(
                        value === ""
                          ? ""
                          : Math.min(720, Math.max(1, Number(value)))
                      );
                    }}
                    aria-label="Sleep timer duration in minutes"
                  />

                  <span>min</span>

                  <button
                    type="button"
                    className="sleep-timer-button"
                    onClick={toggleSleepTimer}
                  >
                    {sleepTimerActive ? "Cancel" : "Start"}
                  </button>
                </div>

                <div
                  className="sleep-timer-presets"
                  aria-label="Quick sleep timer presets"
                >
                  {[15, 30, 60, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`sleep-timer-preset ${
                        Number(sleepMinutes) === minutes ? "selected" : ""
                      }`}
                      onClick={() => setSleepMinutes(minutes)}
                      disabled={sleepTimerActive}
                      aria-pressed={Number(sleepMinutes) === minutes}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </button>
                  ))}
                </div>

                {sleepTimerActive && (
                  <span className="sleep-timer-countdown" role="status">
                    Stops in {formatSleepTime(sleepTimerRemaining)}
                  </span>
                )}
              </div>
            </div>

            <p className="section-description">
              ഓരോ ശബ്ദവും നിങ്ങൾക്ക് ഇഷ്ടമുള്ള പോലെ ക്രമീകരിക്കാം.
            </p>
          </div>
        </div>

        <div className="sound-grid sound-grid-clean">
          {soundList.map((sound, index) => {
            const isOn = volumes[index] > 0;
            return (
              <article className={`sound-card sound-card-clean ${isOn ? "is-playing" : ""}`} key={sound.name}>
                <div className="clean-card-topline">
                  <span className={`clean-sound-icon clean-icon-${index}`} aria-hidden="true">{sound.emoji}</span>
                  <button
                    type="button"
                    className={`clean-sound-toggle ${isOn ? "is-on" : ""}`}
                    onClick={() => toggleSound(index)}
                    aria-label={`${isOn ? "Turn off" : "Turn on"} ${sound.name}`}
                    aria-pressed={isOn}
                  >
                    {isOn ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    )}
                  </button>
                </div>
                <div className="clean-sound-copy">
                  <h3>{sound.name}</h3>
                  <p className="malayalam-label">{sound.malayalam}</p>
                </div>
                <div className="clean-volume-row">
                  <span>VOLUME</span>
                  <strong>{volumes[index]}<small>%</small></strong>
                </div>
                <input
                  className="clean-volume-slider"
                  type="range" min="0" max="100" step="1" value={volumes[index]}
                  aria-label={`${sound.name} volume`}
                  aria-valuetext={`${volumes[index]}%`}
                  onInput={(event) => updateVolume(index, Number(event.currentTarget.value))}
                  onChange={(event) => updateVolume(index, Number(event.currentTarget.value))}
                />
              </article>
            );
          })}

          {/* Kattankappi Radio */}
          <article className={`sound-card radio-player ${playlistOpen ? "playlist-open" : "playlist-collapsed"}`}>
            <div className="radio-top">
              <div className="radio-art">
                <span>◎</span>
              </div>

              <div className="radio-track-info">
                <span className="radio-eyebrow">
                  KATTANKAPPI RADIO
                </span>

                <h3 title={currentTrack.name}>
                  {currentTrack.name}
                </h3>

                <p>Malayalam melodies · Chaya-time playlist</p>
              </div>

              <button
                type="button"
                className={`radio-queue-button ${
                  playlistOpen ? "is-expanded" : ""
                }`}
                onClick={togglePlaylist}
                aria-label={
                  playlistOpen ? "Collapse playlist" : "Expand playlist"
                }
                aria-expanded={playlistOpen}
                aria-controls="radio-playlist-content"
                title={playlistOpen ? "Collapse playlist" : "Expand playlist"}
              >
                <svg
                  className="radio-queue-arrow"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"

                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            <audio
              ref={musicAudioRef}
              src={getMusicUrl(currentTrack.file)}
              preload="auto"
              onLoadedMetadata={(event) => {
                setMusicDuration(event.currentTarget.duration || 0);
                event.currentTarget.volume = Math.max(0, Math.min(1, musicVolume / 100));
                setMusicError(false);
              }}
              onCanPlay={() => {
                if (shouldAutoplayRef.current) {
                  startSelectedTrack();
                }
              }}
              onTimeUpdate={(event) => {
                const audio = event.currentTarget;
                setMusicTime(audio.currentTime || 0);
                if ("mediaSession" in navigator && typeof navigator.mediaSession.setPositionState === "function" && Number.isFinite(audio.duration) && audio.duration > 0) {
                  try {
                    navigator.mediaSession.setPositionState({
                      duration: audio.duration,
                      playbackRate: audio.playbackRate || 1,
                      position: Math.min(audio.currentTime || 0, audio.duration),
                    });
                  } catch {
                    // Position state is optional and not supported everywhere.
                  }
                }
              }}
              onPlay={() => {
                setMusicPlaying(true);
                if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
              }}
              onPause={() => {
                setMusicPlaying(false);
                if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
              }}
              onEnded={handleMusicEnded}
              onError={() => {
                shouldAutoplayRef.current = false;
                setMusicError(true);
                setMusicPlaying(false);
              }}
            />

            <div className="radio-controls">
              {/* Animated visualizer immediately before Previous */}
              <div
                className={`radio-control-visualizer ${
                  musicPlaying ? "is-playing" : ""
                }`}
                aria-label={musicPlaying ? "Music playing" : "Music paused"}
                role="status"
              >
                {Array.from({ length: 7 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>

              <button
                type="button"
                className="radio-skip-button"
                onClick={() =>
                  changeTrack(
                    (trackIndex - 1 + musicTracks.length) %
                      musicTracks.length
                  )
                }
                aria-label="Previous song"
                title="Previous song"
              >
                <svg className="radio-skip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="4" y="5" width="2.5" height="14" rx="0.7" />
                  <path d="M20 5.5v13a.8.8 0 0 1-1.2.7L7.5 12.7a.8.8 0 0 1 0-1.4l11.3-6.5a.8.8 0 0 1 1.2.7Z" />
                </svg>
              </button>

              <button
                type="button"
                className="radio-main-play"
                onClick={toggleMusicPlayback}
                aria-label={musicPlaying ? "Pause music" : "Play music"}
                title={musicPlaying ? "Pause" : "Play"}
              >
                {musicPlaying ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M8 5h3v14H8zM15 5h3v14h-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m8 5 11 7-11 7V5Z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="radio-skip-button"
                onClick={() =>
                  changeTrack((trackIndex + 1) % musicTracks.length)
                }
                aria-label="Next song"
                title="Next song"
              >
                <svg className="radio-skip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M4 5.5a.8.8 0 0 1 1.2-.7l11.3 6.5a.8.8 0 0 1 0 1.4L5.2 19.2a.8.8 0 0 1-1.2-.7v-13Z" />
                  <rect x="17.5" y="5" width="2.5" height="14" rx="0.7" />
                </svg>
              </button>

              <div className="radio-inline-volume">
                <span className="radio-volume-icon" aria-hidden="true">
                  {musicVolume === 0
                    ? "🔇"
                    : musicVolume < 50
                      ? "🔉"
                      : "🔊"}
                </span>

                <input
                  className="radio-volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={musicVolume}
                  aria-label={`Music volume ${musicVolume}%`}
                  aria-valuetext={`${musicVolume}%`}
                  onInput={(event) =>
                    updateMusicVolume(event.currentTarget.value)
                  }
                  onChange={(event) =>
                    updateMusicVolume(event.currentTarget.value)
                  }
                />
              </div>
            </div>

            <input
              className="radio-progress"
              type="range"
              min="0"
              max={musicDuration || 100}
              step="0.1"
              value={Math.min(musicTime, musicDuration || 100)}
              aria-label="Song progress"
              aria-valuetext={`${formatMusicTime(musicTime)} of ${formatMusicTime(musicDuration)}`}
              onInput={(event) => {
                const time = Number(event.currentTarget.value);

                if (musicAudioRef.current && Number.isFinite(time)) {
                  musicAudioRef.current.currentTime = time;
                  setMusicTime(time);
                }
              }}
              onChange={(event) => {
                const time = Number(event.currentTarget.value);

                if (musicAudioRef.current && Number.isFinite(time)) {
                  musicAudioRef.current.currentTime = time;
                  setMusicTime(time);
                }
              }}
            />

            <div className="radio-time">
              <span>{formatMusicTime(musicTime)}</span>
              <span>{formatMusicTime(musicDuration)}</span>
            </div>

            <div className="radio-playlist-heading">
              YOUR PLAYLIST · {musicTracks.length} SONGS
            </div>

            {/* Always mounted so the expand/collapse animation can run. */}
            <div
              id="radio-playlist-content"
              className={`radio-playlist-collapse ${
                playlistOpen ? "is-expanded" : ""
              }`}
              aria-hidden={!playlistOpen}
              inert={!playlistOpen}
            >
              <div className="radio-playlist-inner">
                <div className="radio-playlist">
                  {musicTracks.map((track, index) => (
                    <button
                      key={track.file}
                      className={`radio-song ${
                        index === trackIndex ? "radio-song-active" : ""
                      }`}
                      onClick={() => changeTrack(index)}
                      aria-current={
                        index === trackIndex ? "true" : undefined
                      }
                      tabIndex={playlistOpen ? 0 : -1}
                    >
                      <span className="radio-song-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="radio-song-name">
                        {track.name}
                      </span>

                      {index === trackIndex && musicPlaying && (
                        <span
                          className="radio-song-playing"
                          aria-label="Playing"
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {musicError && (
              <p className="radio-error" role="alert">
                Couldn't load this song. Check that the exact MP3 filename
                exists in Public/audio/ and is included in the Vercel deployment.
              </p>
            )}
          </article>
        </div>

        <p className="audio-disclaimer">
          Blend the sounds of Kerala into your own ambience.
        </p>
      </section>

      <footer className="footer">
        <strong>☕ KATTANKAPPI</strong>

        <span>നമ്മുടെ നാട്. നമ്മുടെ ശബ്ദങ്ങൾ.</span>

        {/* Instagram link with your name */}
        <a
          className="footer-instagram"
          href="https://www.instagram.com/a.shwi.n._/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ashwin Shaju on Instagram"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
              className="instagram-icon-dot"
              cx="17.5"
              cy="6.5"
              r="1"
            />
          </svg>

          <span>Ashwin Shaju</span>
        </a>

        <span>MADE WITH ♥ IN KERALA</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
