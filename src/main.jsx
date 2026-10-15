
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

  const currentTrack = musicTracks[trackIndex];

  function formatMusicTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }

  // Keep music volume synchronized with the slider.
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume, trackIndex]);

  function syncAudio(levels, shouldPlay) {
    audioRefs.current.forEach((audio, index) => {
      if (!audio) return;

      audio.volume = Math.max(
        0,
        Math.min(1, (levels[index] ?? 0) / 100)
      );

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

    const minutes = Math.min(720, Math.max(1, Number(sleepMinutes) || 1));
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
      audio.volume = musicVolume / 100;
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
    setPresetIndex(index);
    setVolumes([...presets[index].volumes]);
    setVibe(true);
    setPlaying(true);
  }

  function updateVolume(index, value) {
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
          {presets.map((preset, index) => (
            <button
              key={preset.name}
              className={`preset-card ${
                presetIndex === index ? "selected" : ""
              }`}
              onClick={() => choosePreset(index)}
            >
              <span className="preset-emoji">{preset.emoji}</span>
              <strong>{preset.name}</strong>
              <small>{preset.subtitle}</small>

              {presetIndex === index && (
                <span className="checkmark">✓</span>
              )}
            </button>
          ))}
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
                      setSleepMinutes(value === "" ? "" : Math.min(720, Math.max(1, Number(value))));
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
                <div className="sleep-timer-presets" aria-label="Quick sleep timer presets">
                  {[15, 30, 60, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`sleep-timer-preset ${Number(sleepMinutes) === minutes ? "selected" : ""}`}
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

        <div className="sound-grid">
          {soundList.map((sound, index) => (
            <article className="sound-card" key={sound.name}>
              <div className="sound-card-header">
                <span className="sound-emoji">{sound.emoji}</span>

                <button
                  className={`sound-toggle ${
                    volumes[index] > 0 ? "enabled" : ""
                  }`}
                  onClick={() => toggleSound(index)}
                  aria-label={`Toggle ${sound.name}`}
                >
                  {volumes[index] > 0 ? "●" : "○"}
                </button>
              </div>

              <h3>{sound.name}</h3>
              <p className="malayalam-label">{sound.malayalam}</p>

              <div className="volume-label">
                <span>VOLUME</span>
                <strong>{volumes[index]}%</strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={volumes[index]}
                aria-label={`${sound.name} volume`}
                onChange={(event) =>
                  updateVolume(index, Number(event.target.value))
                }
              />
            </article>
          ))}

          {/* Kattankappi Radio */}
          <article className="sound-card radio-player">
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
                <span className="radio-queue-arrow" aria-hidden="true">
                  {playlistOpen ? "⌃" : "⌄"}
                </span>
              </button>
            </div>

            <audio
              ref={musicAudioRef}
              src={getMusicUrl(currentTrack.file)}
              preload="auto"
              onLoadedMetadata={(event) => {
                setMusicDuration(event.currentTarget.duration || 0);
                event.currentTarget.volume = musicVolume / 100;
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
                onClick={() =>
                  changeTrack(
                    (trackIndex - 1 + musicTracks.length) %
                      musicTracks.length
                  )
                }
                aria-label="Previous song"
                title="Previous song"
              >
                |◀
              </button>

              <button
                className="radio-main-play"
                onClick={toggleMusicPlayback}
                aria-label={musicPlaying ? "Pause music" : "Play music"}
                title={musicPlaying ? "Pause" : "Play"}
              >
                {musicPlaying ? "Ⅱ" : "▶"}
              </button>

              <button
                onClick={() =>
                  changeTrack((trackIndex + 1) % musicTracks.length)
                }
                aria-label="Next song"
                title="Next song"
              >
                ▶|
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
                  value={musicVolume}
                  aria-label="Music volume"
                  onChange={(event) =>
                    setMusicVolume(Number(event.target.value))
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
              onChange={(event) => {
                const time = Number(event.target.value);

                if (musicAudioRef.current) {
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
              YOUR PLAYLIST · 8 SONGS
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
        <a
          className="footer-instagram"
          href="https://www.instagram.com/a.shwi.n._/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit a.shwi.n._ on Instagram"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className="instagram-icon-dot" cx="17.5" cy="6.5" r="1" />
          </svg>
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
