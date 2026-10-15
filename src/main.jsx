
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

  // Keep radio volume synchronized with the slider.
  useEffect(() => {
    if (musicAudioRef.current) {
      setAudioElementVolume(musicAudioRef.current, musicVolume / 100);
    }
  }, [musicVolume, trackIndex]);

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
      resumeAudioContext();
      setAudioElementVolume(audio, musicVolume / 100);
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

    resumeAudioContext();

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
    const nextVolume = Number(value);
    resumeAudioContext();

    if (musicAudioRef.current) {
      setAudioElementVolume(musicAudioRef.current, nextVolume / 100);
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
          <span className="brand-icon">☕</span>
          <span>
            <strong>kattankappi</strong>
            <small>ഒരു കാപ്പി, കുറച്ചു സമാധാനം</small>
          </span>
        </a>

        <span className="topbar-note">
          <span className="status-dot" /> YOUR LITTLE ESCAPE
        </span>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">THE SOUND OF KERALA</span>

          <h1>
            ഒരു കട്ടൻ കാപ്പി.
            <br />
            <em>കുറച്ച് സമാധാനം.</em>
          </h1>

          <p>
            മഴയുടെ ശബ്ദവും മനോഹരമായ ഓർമ്മകളും.
            <br />
            നിങ്ങളുടെ സ്വന്തം ചെറിയ കേരളം.
          </p>

          <span className="hero-caption">
            മഴ · കാപ്പി · ഓർമ്മകൾ
          </span>
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
                  position: "relative",
                  overflow: "hidden",
                  isolation: "isolate",
                  minHeight: "160px",
                  padding: "20px",
                  borderRadius: "18px",
                  border: isSelected
                    ? `1px solid ${look.accent}`
                    : "1px solid rgba(239, 231, 211, 0.22)",
                  background: look.background,
                  color: "#f8f2e5",
                  textAlign: "left",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${look.glow}, 0 12px 30px rgba(0, 0, 0, 0.18)`
                    : "0 8px 22px rgba(0, 0, 0, 0.12)",
                  transform: isSelected ? "translateY(-3px)" : "translateY(0)",
                  transition:
                    "transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: -1,
                    pointerEvents: "none",
                    opacity: isSelected ? 0.9 : 0.65,
                    background:
                      "linear-gradient(115deg, transparent 10%, rgba(255,255,255,0.08) 48%, transparent 72%)",
                    backgroundSize: "220% 100%",
                    animation: "presetShimmer 7s ease-in-out infinite",
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    right: "-38px",
                    top: "-44px",
                    background: look.glow,
                    filter: "blur(20px)",
                    pointerEvents: "none",
                    zIndex: -1,
                  }}
                  className="preset-glow-orb"
                />
                <span
                  className="preset-emoji"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    marginBottom: "16px",
                    borderRadius: "15px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: `0 0 24px ${look.glow}`,
                    fontSize: "25px",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {preset.emoji}
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "17px",
                    letterSpacing: "0.01em",
                    lineHeight: 1.25,
                    color: "#fffaf0",
                  }}
                >
                  {preset.name}
                </strong>
                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "rgba(255, 250, 240, 0.76)",
                  }}
                >
                  {preset.subtitle}
                </small>

                {isSelected && (
                  <span
                    className="checkmark"
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: look.accent,
                      color: "#20372c",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                    aria-label="Selected preset"
                  >
                    ✓
                  </span>
                )}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: isSelected ? "3px" : "1px",
                    background: look.accent,
                    opacity: isSelected ? 1 : 0.42,
                    transition: "height 260ms ease, opacity 260ms ease",
                  }}
                />
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
                  style={{
                    transform: playlistOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease, color 0.3s ease",
                  }}
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
                setAudioElementVolume(event.currentTarget, musicVolume / 100);
                setMusicError(false);
              }}
              onCanPlay={() => {
                if (shouldAutoplayRef.current) {
                  startSelectedTrack();
                }
              }}
              onTimeUpdate={(event) =>
                setMusicTime(event.currentTarget.currentTime || 0)
              }
              onPlay={() => setMusicPlaying(true)}
              onPause={() => setMusicPlaying(false)}
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

const presetMotionStyles = `
@keyframes presetShimmer {
  0%, 100% { background-position: 130% 0; }
  50% { background-position: -30% 0; }
}
@keyframes presetGlowPulse {
  0%, 100% { opacity: .45; transform: scale(.92); }
  50% { opacity: .9; transform: scale(1.08); }
}
@keyframes presetClickRipple {
  0% { transform: scale(.15); opacity: .55; }
  100% { transform: scale(2.8); opacity: 0; }
}
.preset-card-dynamic {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform-origin: center;
  transition:
    transform 280ms cubic-bezier(.2,.8,.2,1),
    box-shadow 280ms ease,
    border-color 280ms ease,
    filter 280ms ease;
}
.preset-card-dynamic::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(115deg, transparent 18%, rgba(255,255,255,.18) 48%, transparent 78%);
  transform: translateX(-115%);
  transition: opacity 250ms ease;
}
.preset-card-dynamic:hover {
  transform: translateY(-7px) scale(1.018) !important;
  filter: saturate(1.12) brightness(1.06);
  box-shadow: 0 18px 38px rgba(0,0,0,.24), 0 0 0 1px rgba(235,211,153,.22) !important;
}
.preset-card-dynamic:hover::before {
  opacity: 1;
  animation: presetCardSweep 850ms ease forwards;
}
.preset-card-dynamic:active {
  transform: translateY(-1px) scale(.975) !important;
  filter: brightness(.98);
  transition-duration: 100ms;
}
.preset-card-dynamic:focus-visible {
  outline: 2px solid #e4c27e;
  outline-offset: 4px;
}
.preset-card-dynamic.selected {
  animation: presetSelectedPop 420ms cubic-bezier(.2,.8,.2,1);
}
.preset-card-dynamic .preset-emoji {
  transition: transform 300ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease;
}
.preset-card-dynamic:hover .preset-emoji {
  transform: translateY(-3px) rotate(-5deg) scale(1.09);
  box-shadow: 0 0 30px rgba(235,211,153,.32);
}
.preset-card-dynamic.selected .preset-emoji {
  animation: presetEmojiPop 480ms cubic-bezier(.2,.8,.2,1);
}
.preset-card-dynamic .checkmark {
  animation: presetCheckIn 300ms cubic-bezier(.2,.8,.2,1) both;
}
.preset-card-dynamic .preset-glow-orb {
  animation: presetGlowPulse 5s ease-in-out infinite;
}
@keyframes presetCardSweep {
  from { transform: translateX(-115%); }
  to { transform: translateX(115%); }
}
@keyframes presetSelectedPop {
  0% { transform: translateY(0) scale(.98); }
  55% { transform: translateY(-5px) scale(1.025); }
  100% { transform: translateY(-3px) scale(1); }
}
@keyframes presetEmojiPop {
  0% { transform: scale(.82) rotate(-8deg); }
  60% { transform: scale(1.16) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes presetCheckIn {
  from { opacity: 0; transform: scale(.55) rotate(-35deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}
@media (hover: none) {
  .preset-card-dynamic:active {
    transform: scale(.97) !important;
    filter: brightness(1.08);
  }
}
.sound-card-atmospheric {
  -webkit-tap-highlight-color: transparent;
  transform-origin: center;
}
.sound-card-atmospheric:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 34px rgba(0,0,0,.22), 0 0 0 1px rgba(235,211,153,.16) !important;
}
.sound-card-atmospheric:active {
  transform: scale(.985);
}
.sound-card-atmospheric .sound-card-motif {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 3px;
  text-align: right;
  text-shadow: 0 0 18px currentColor;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-rain {
  animation: soundRainDrift 1.8s linear infinite;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-steam {
  animation: soundSteamFloat 2.6s ease-in-out infinite;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-crickets {
  animation: soundCricketPulse 1.6s ease-in-out infinite;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-wind {
  animation: soundWindSweep 2.2s ease-in-out infinite;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-talk {
  animation: soundTalkPulse 1.4s ease-in-out infinite;
}
.sound-card-atmospheric.sound-card-on .sound-card-motif-storm {
  animation: soundStormFlash 2.8s ease-in-out infinite;
}
@keyframes soundRainDrift {
  from { transform: translateY(-3px); opacity: .5; }
  50% { opacity: 1; }
  to { transform: translateY(7px); opacity: .6; }
}
@keyframes soundSteamFloat {
  0%, 100% { transform: translateY(3px); opacity: .55; }
  50% { transform: translateY(-6px); opacity: 1; }
}
@keyframes soundCricketPulse {
  0%, 100% { transform: scale(.94); opacity: .5; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes soundWindSweep {
  0%, 100% { transform: translateX(-4px); opacity: .5; }
  50% { transform: translateX(5px); opacity: 1; }
}
@keyframes soundTalkPulse {
  0%, 100% { transform: scale(.94); opacity: .48; }
  50% { transform: scale(1.04); opacity: .95; }
}
@keyframes soundStormFlash {
  0%, 88%, 100% { opacity: .45; filter: brightness(1); }
  90% { opacity: 1; filter: brightness(1.7); }
  94% { opacity: .6; filter: brightness(1.1); }
}
.sound-card-atmospheric .sound-toggle:hover {
  transform: scale(1.08);
}
.sound-card-atmospheric .sound-toggle:active {
  transform: scale(.92);
}
.sound-card-atmospheric input[type="range"] {
  min-height: 24px;
}
@media (prefers-reduced-motion: reduce) {
  .preset-card-dynamic,
  .preset-card-dynamic *,
  .preset-card-dynamic::before,
  .sound-card-atmospheric,
  .sound-card-atmospheric * {
    animation: none !important;
    transition: none !important;
  }
}
`;

if (typeof document !== "undefined" && !document.getElementById("preset-motion-styles")) {
  const style = document.createElement("style");
  style.id = "preset-motion-styles";
  style.textContent = presetMotionStyles;
  document.head.appendChild(style);
}


const cleanSoundCardStyles = `
.sound-grid-clean { align-items: start !important; grid-auto-rows: max-content; }
.sound-grid-clean > .sound-card-clean { align-self: start !important; height: fit-content; min-height: 0; }
.sound-card-clean {
  --card-accent: #c6aa70;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-width: 0;
  padding: clamp(17px, 2.1vw, 23px) !important;
  border: 1px solid rgba(211, 194, 151, .18) !important;
  border-radius: 18px !important;
  background: linear-gradient(145deg, rgba(35, 52, 40, .96), rgba(23, 35, 28, .98)) !important;
  box-shadow: 0 7px 22px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.035) !important;
  color: #f3efe3;
  transition: transform .32s cubic-bezier(.2,.8,.2,1), border-color .32s ease, box-shadow .32s ease, background .32s ease !important;
  animation: cleanSoundEnter .55s both;
}
.sound-card-clean:nth-child(2) { animation-delay: .04s; }
.sound-card-clean:nth-child(3) { animation-delay: .08s; }
.sound-card-clean:nth-child(4) { animation-delay: .12s; }
.sound-card-clean:nth-child(5) { animation-delay: .16s; }
.sound-card-clean:nth-child(6) { animation-delay: .20s; }
.sound-card-clean::before {
  content: ""; position: absolute; z-index: -1; width: 150px; height: 150px; right: -78px; top: -84px;
  border-radius: 50%; background: var(--card-accent); opacity: .045; filter: blur(2px);
  transition: transform .55s ease, opacity .4s ease;
}
.sound-card-clean::after {
  content: ""; position: absolute; left: 18px; right: 18px; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--card-accent), transparent); opacity: 0;
  transform: scaleX(.5); transition: opacity .35s ease, transform .45s ease;
}
.sound-card-clean:hover { transform: translateY(-4px); border-color: rgba(211,194,151,.38) !important; box-shadow: 0 15px 32px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.055) !important; }
.sound-card-clean:hover::before, .sound-card-clean.is-playing::before { transform: scale(1.5); opacity: .09; }
.sound-card-clean.is-playing { border-color: color-mix(in srgb, var(--card-accent) 55%, transparent) !important; box-shadow: 0 9px 27px rgba(0,0,0,.15), 0 0 0 1px rgba(198,170,112,.05), inset 0 1px 0 rgba(255,255,255,.045) !important; }
.sound-card-clean.is-playing::after { opacity: .7; transform: scaleX(1); }
.clean-card-topline { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.clean-sound-icon { display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; font-size:22px; background:rgba(246,240,220,.055); border:1px solid rgba(246,240,220,.075); box-shadow:inset 0 1px 0 rgba(255,255,255,.04); transition: transform .35s cubic-bezier(.2,.8,.2,1), background .35s ease, border-color .35s ease; }
.sound-card-clean:hover .clean-sound-icon { transform: translateY(-2px) rotate(-3deg); background:rgba(246,240,220,.085); }
.sound-card-clean.is-playing .clean-sound-icon { border-color:color-mix(in srgb, var(--card-accent) 35%, transparent); animation: cleanIconBreath 3s ease-in-out infinite; }
.clean-icon-0 { --card-accent:#8fc8c2; } .clean-icon-1 { --card-accent:#d8ad75; } .clean-icon-2 { --card-accent:#b4c88c; } .clean-icon-3 { --card-accent:#a5c7a7; } .clean-icon-4 { --card-accent:#d5bd88; } .clean-icon-5 { --card-accent:#9daee0; }
.clean-sound-toggle { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; flex:0 0 36px; padding:0; border:1px solid rgba(242,235,215,.18); border-radius:50%; color:#d7d1bf; background:rgba(255,255,255,.025); cursor:pointer; transition:transform .22s ease, background .25s ease, color .25s ease, border-color .25s ease, box-shadow .25s ease; }
.clean-sound-toggle svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.clean-sound-toggle:hover { transform:scale(1.07); border-color:rgba(211,194,151,.55); }
.clean-sound-toggle:active { transform:scale(.9); }
.clean-sound-toggle.is-on { color:#1d2d22; background:#d5c18f; border-color:#d5c18f; box-shadow:0 0 0 4px rgba(213,193,143,.08); animation: cleanToggleIn .28s ease both; }
.clean-sound-copy { margin-top:18px; }
.clean-sound-copy h3 { margin:0; color:#f3efe3; font-size:clamp(16px,1.3vw,18px); font-weight:600; letter-spacing:-.035em; }
.clean-sound-copy .malayalam-label { margin:5px 0 0; color:rgba(232,226,207,.56); font-size:13px; }
.clean-volume-row { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:24px; margin-bottom:8px; color:rgba(232,226,207,.48); font-size:10px; font-weight:650; letter-spacing:.15em; }
.clean-volume-row strong { color:var(--card-accent); font-size:13px; letter-spacing:0; font-variant-numeric:tabular-nums; }
.clean-volume-row small { margin-left:2px; font-size:10px; opacity:.75; }
.clean-volume-slider { display:block; width:100%; height:4px; margin:0; border-radius:20px; outline:none; accent-color:var(--card-accent); cursor:pointer; touch-action:pan-y; }
.clean-volume-slider::-webkit-slider-runnable-track { height:4px; border-radius:20px; background:rgba(242,235,215,.14); }
.clean-volume-slider::-webkit-slider-thumb { width:13px; height:13px; margin-top:-4.5px; border:2px solid #213529; border-radius:50%; background:var(--card-accent); box-shadow:0 0 0 3px rgba(213,193,143,.10); transition:transform .2s ease, box-shadow .2s ease; }
.clean-volume-slider:hover::-webkit-slider-thumb { transform:scale(1.16); box-shadow:0 0 0 5px rgba(213,193,143,.12); }
@keyframes cleanSoundEnter { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
@keyframes cleanIconBreath { 0%,100% { box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 rgba(213,193,143,0); } 50% { box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 0 16px rgba(213,193,143,.07); } }
@keyframes cleanToggleIn { from { transform:scale(.82); } 65% { transform:scale(1.08); } to { transform:scale(1); } }
@media (max-width:600px) { .sound-card-clean { padding:16px !important; border-radius:16px !important; } .clean-sound-icon { width:42px; height:42px; border-radius:12px; } .clean-sound-copy { margin-top:15px; } .clean-volume-row { margin-top:20px; } }
@media (prefers-reduced-motion:reduce) { .sound-card-clean, .sound-card-clean *, .sound-card-clean::before, .sound-card-clean::after { animation:none !important; transition:none !important; } }

/* Kattankappi Radio — premium glassmorphism */
/* Keep the collapsed music player compact like an ambience card. */
.radio-player.playlist-collapsed {
  height: 200px !important;
  min-height: 200px !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  gap: 7px !important;
  padding: 16px 18px !important;
}
.radio-player.playlist-collapsed .radio-top { gap: 10px !important; }
.radio-player.playlist-collapsed .radio-art { width: 42px !important; height: 42px !important; flex: 0 0 42px !important; }
.radio-player.playlist-collapsed .radio-track-info h3 { font-size: clamp(13px, 1.1vw, 16px) !important; margin: 3px 0 !important; }
.radio-player.playlist-collapsed .radio-track-info p { font-size: 11px !important; margin: 2px 0 0 !important; }
.radio-player.playlist-collapsed .radio-controls { margin: 0 !important; gap: 10px !important; }
.radio-player.playlist-collapsed .radio-main-play { width: 38px !important; height: 38px !important; }
.radio-player.playlist-collapsed .radio-skip-button { width: 32px !important; height: 32px !important; }
.radio-player.playlist-collapsed .radio-progress { margin: 0 !important; }
.radio-player.playlist-collapsed .radio-time { margin: 0 !important; font-size: 10px !important; }
.radio-player.playlist-collapsed .radio-playlist-heading { display: none !important; }
.radio-player.playlist-open { height: auto !important; min-height: 0 !important; }
@media (max-width: 600px) {
  .radio-player.playlist-collapsed { height: 200px !important; min-height: 200px !important; padding: 15px !important; }
}

.radio-player {
  position: relative !important; isolation: isolate; overflow: hidden;
  color: #f5f0e4 !important;
  background: linear-gradient(135deg, rgba(245,241,226,.105), rgba(245,241,226,.025) 48%, rgba(194,166,105,.055)), rgba(23,43,32,.76) !important;
  border: 1px solid rgba(239,232,210,.19) !important;
  border-radius: 24px !important;
  box-shadow: 0 18px 50px rgba(5,14,9,.22), inset 0 1px 0 rgba(255,255,255,.12) !important;
  -webkit-backdrop-filter: blur(22px) saturate(125%); backdrop-filter: blur(22px) saturate(125%);
  transition: transform .35s cubic-bezier(.2,.8,.2,1), border-color .35s ease, box-shadow .35s ease !important;
  animation: radioGlassEnter .7s cubic-bezier(.2,.8,.2,1) both;
}
.radio-player::before { content:""; position:absolute; z-index:-1; width:230px; height:230px; right:-95px; top:-125px; border-radius:50%; background:radial-gradient(circle,rgba(203,183,127,.19),rgba(203,183,127,0) 70%); pointer-events:none; animation: radioGlowDrift 9s ease-in-out infinite alternate; }
.radio-player::after { content:""; position:absolute; z-index:-1; inset:0; border-radius:inherit; padding:1px; background:linear-gradient(130deg,rgba(255,255,255,.16),transparent 36%,rgba(201,177,118,.10)); -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
.radio-player:hover { transform:translateY(-3px); border-color:rgba(220,202,153,.34) !important; box-shadow:0 24px 58px rgba(5,14,9,.29),inset 0 1px 0 rgba(255,255,255,.15) !important; }
.radio-player .radio-art { border:1px solid rgba(240,231,207,.20) !important; background:linear-gradient(145deg,rgba(255,255,255,.13),rgba(255,255,255,.035)) !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 8px 24px rgba(0,0,0,.12); -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px); transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease; }
.radio-player:hover .radio-art { transform:rotate(-4deg) scale(1.035); box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 12px 30px rgba(0,0,0,.18); }
.radio-player .radio-skip-button { display:inline-flex !important; align-items:center !important; justify-content:center !important; }
.radio-player .radio-skip-button .radio-skip-icon { display:block !important; width:21px !important; height:21px !important; flex:0 0 21px !important; fill:currentColor !important; stroke:none !important; opacity:1 !important; visibility:visible !important; }
.radio-player .radio-queue-button,.radio-player .radio-skip-button { border:1px solid rgba(239,232,210,.16) !important; background:rgba(255,255,255,.055) !important; color:#eee8d8 !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.07); transition:transform .22s ease,background .25s ease,border-color .25s ease,box-shadow .25s ease !important; }
.radio-player .radio-queue-button:hover,.radio-player .radio-skip-button:hover { transform:translateY(-2px); background:rgba(255,255,255,.105) !important; border-color:rgba(220,202,153,.35) !important; box-shadow:0 6px 18px rgba(0,0,0,.12); }
.radio-player .radio-main-play { border:1px solid rgba(255,255,255,.34) !important; background:linear-gradient(145deg,#e5d4a5,#bca36c) !important; color:#203528 !important; box-shadow:0 7px 22px rgba(191,164,102,.23),inset 0 1px 0 rgba(255,255,255,.45) !important; transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease !important; }
.radio-player .radio-main-play:hover { transform:scale(1.07); box-shadow:0 10px 28px rgba(191,164,102,.32),inset 0 1px 0 rgba(255,255,255,.55) !important; }
.radio-player .radio-main-play:active,.radio-player .radio-skip-button:active { transform:scale(.94); }
.radio-player .radio-progress,.radio-player .radio-volume-slider { accent-color:#cbb57b; }
.radio-player .radio-progress { filter:drop-shadow(0 0 5px rgba(203,181,123,.18)); }
.radio-player .radio-playlist-collapse { transition:max-height .45s cubic-bezier(.2,.8,.2,1),opacity .3s ease,transform .35s ease !important; }
.radio-player .radio-song { border-radius:12px !important; transition:background .22s ease,transform .22s ease,border-color .22s ease !important; }
.radio-player .radio-song:hover { background:rgba(255,255,255,.065) !important; transform:translateX(3px); }
.radio-player .radio-song-active { background:rgba(203,181,123,.11) !important; box-shadow:inset 2px 0 0 #cbb57b; }
.radio-player .radio-control-visualizer { filter:drop-shadow(0 0 7px rgba(203,181,123,.22)); }
@keyframes radioGlassEnter { from { opacity:0; transform:translateY(12px) scale(.99); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes radioGlowDrift { from { transform:translate(-8px,0) scale(.92); opacity:.65; } to { transform:translate(8px,14px) scale(1.08); opacity:1; } }
@media (max-width:600px) { .radio-player { border-radius:19px !important; -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px); } .radio-player:hover { transform:none; } }
@media (prefers-reduced-motion:reduce) { .radio-player,.radio-player *,.radio-player::before,.radio-player::after { animation:none !important; transition:none !important; } }
`;
if (typeof document !== "undefined" && !document.getElementById("clean-sound-card-styles")) {
  const style = document.createElement("style");
  style.id = "clean-sound-card-styles";
  style.textContent = cleanSoundCardStyles;
  document.head.appendChild(style);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
