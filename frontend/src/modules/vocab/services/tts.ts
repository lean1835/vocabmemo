/**
 * Bulletproof TTS Accent & Voice Player
 * Handles async voice loading, smart accents/locales matching (UK -> US fallback),
 * and ensures utterance.voice matches utterance.lang to prevent silent playback.
 */
export const playVocabSpeech = (text: string, accent: "en-GB" | "en-US") => {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Speech Synthesis is not supported in this browser.");
      return;
    }

    // Cancel any active/queued speech to avoid stuttering or silence
    window.speechSynthesis.cancel();

    // Create Utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = 0.9; // Slightly slower rate for clearer learning pronunciation

    const voices = window.speechSynthesis.getVoices();

    const applyVoice = (voiceList: SpeechSynthesisVoice[]) => {
      const targetLang = accent.toLowerCase().replace("_", "-"); // "en-gb" or "en-us"
      
      // Score each voice based on suitability, compatibility and audio reliability
      const scoredVoices = voiceList.map(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase().replace("_", "-");
        
        let score = 0;
        
        const isTargetAccent = lang === targetLang || 
          (targetLang === "en-gb" && (lang.includes("gb") || name.includes("uk") || name.includes("united kingdom") || name.includes("british"))) ||
          (targetLang === "en-us" && (lang.includes("us") || name.includes("united states") || name.includes("america")));

        const isGoogleVoice = name.includes("google");
        const isNaturalVoice = name.includes("natural");
        
        // "Hazel" and legacy Windows "Desktop" voices are notoriously broken/silent in Chrome/Edge
        const isBrokenDesktopVoice = name.includes("desktop") || name.includes("hazel");

        if (isTargetAccent) {
          if (isGoogleVoice) {
            score = 100; // Rank 1: Perfect Google Target Accent Voice
          } else if (isNaturalVoice) {
            score = 90;  // Rank 2: High quality Natural Target Accent Voice
          } else if (!isBrokenDesktopVoice) {
            score = 80;  // Rank 3: Working local/UWP Target Accent Voice
          } else {
            score = 30;  // Rank 6: Legacy Windows Desktop Target Accent (penalized due to silent browser bugs)
          }
        } else {
          // Fallback accent (e.g. US voice when UK is requested)
          const isEnglish = lang.startsWith("en");
          if (isEnglish) {
            if (isGoogleVoice) {
              score = 70; // Rank 4: Google US Voice (excellent fallback that always works)
            } else if (!isBrokenDesktopVoice) {
              score = 60; // Rank 5: Non-desktop US Voice (good fallback)
            } else {
              score = 40; // Rank 5.5: Desktop US voice (Microsoft David/Zira usually work well in Chromium)
            }
          } else {
            score = 0; // Non-English voice
          }
        }
        
        return { voice: v, score };
      });

      // Filter out score = 0 unless no English voice is found at all
      let validScored = scoredVoices.filter(sv => sv.score > 0);
      if (validScored.length === 0) {
        validScored = scoredVoices;
      }
      
      // Sort descending by score
      validScored.sort((a, b) => b.score - a.score);

      if (validScored.length > 0) {
        const bestVoice = validScored[0].voice;
        utterance.voice = bestVoice;
        // CRITICAL: Aligns the utterance language with the actual voice's language.
        // If they mismatch, the browser might remain completely silent.
        utterance.lang = bestVoice.lang;
        
        console.log(`TTS Selected: ${bestVoice.name} (${bestVoice.lang}) [Score: ${validScored[0].score}] for target: ${accent}`);
      }
    };

    if (voices.length > 0) {
      applyVoice(voices);
      window.speechSynthesis.speak(utterance);
    } else {
      // Chrome & other browsers load voices asynchronously.
      const handleVoicesChanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        applyVoice(updatedVoices);
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.onvoiceschanged = null;
      };
      
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

      // Timeout fallback in case onvoiceschanged does not fire or is already fired
      setTimeout(() => {
        if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
          window.speechSynthesis.onvoiceschanged = null;
          // Speak with default OS/browser speech if voices are still not ready
          window.speechSynthesis.speak(utterance);
        }
      }, 200);
    }
  } catch (err) {
    console.error("TTS play failure:", err);
  }
};
