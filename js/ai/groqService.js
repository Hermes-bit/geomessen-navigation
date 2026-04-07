// js/ai/groqService.js
import { CONFIG } from '../config.js';

/**
 * Envoie une phrase utilisateur à Groq pour extraction d'intention de navigation
 * @param {string} texte - Phrase en langage naturel (ex: "emmène-moi à la gare")
 * @returns {Promise<{depart: string|null, destination: string, mode: string}>}
 */
export async function extractNavIntent(texte) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Réponds UNIQUEMENT en JSON: {"depart": "lieu", "destination": "lieu", "mode": "car|bike|foot"}',
          },
          { role: 'user', content: texte },
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) throw new Error(`Groq: ${response.status}`);

    const data = await response.json();
    const raw = data.choices[0].message.content;

    // Extraire le JSON de la réponse (peut contenir du texte autour)
    const match = raw.match(/\{.*\}/s);
    if (!match) throw new Error('Réponse Groq non parsable');

    return JSON.parse(match[0]);
  } catch (error) {
    console.error('[Groq] extractNavIntent:', error.message);
    throw new Error("L'assistant IA n'a pas pu comprendre la demande.");
  }
}
