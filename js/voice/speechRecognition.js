// js/voice/speechRecognition.js

let recognition = null;
let onResultCallback = null;

/**
 * Initialise la reconnaissance vocale
 * @param {Function} onResult - Callback appelé avec le texte reconnu
 */
export function initSpeechRecognition(onResult) {
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[Voice] Web Speech API non supportée');
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  onResultCallback = onResult;

  recognition.onstart = () => $('#btn-voice').addClass('listening');
  recognition.onend = () => $('#btn-voice').removeClass('listening');
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    if (onResultCallback) onResultCallback(transcript);
  };

  return true;
}

/**
 * Démarre l'écoute vocale
 */
export function startListening() {
  if (recognition) recognition.start();
}

/**
 * Arrête l'écoute vocale
 */
export function stopListening() {
  if (recognition) recognition.stop();
}
