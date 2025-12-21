const { dekl } = require('deklinacija');

/**
 * Generate common Serbian declension patterns for a word
 * This is a simplified implementation - in production you'd want more sophisticated rules
 */
function generateSerbianDeclensions(word) {
  const patterns = new Set([word]);

  // Common Serbian declension patterns
  // Format: [base_suffix, [genitive, dative, accusative, instrumental, locative]]
  const declensionPatterns = [
    // Masculine nouns/adjectives
    ['an', ['ana', 'anu', 'ana', 'anom', 'anu']],  // Dragan
    ['in', ['ina', 'inu', 'ina', 'inom', 'inu']],  // Marin
    ['ski', ['skog', 'skom', 'skog', 'skim', 'skom']], // Beogradski
    ['ev', ['eva', 'evu', 'eva', 'evim', 'evu']], // Vučićev
    ['ov', ['ova', 'ovu', 'ova', 'ovim', 'ovu']], // Markov
    ['ić', ['ića', 'iću', 'ića', 'ićem', 'iću']], // Marković
    ['ak', ['ka', 'ku', 'ka', 'kom', 'ku']], // Novak

    // Feminine nouns
    ['a', ['e', 'i', 'u', 'om', 'i']], // Rusija -> Rusije, Rusiji, etc.
    ['ica', ['ice', 'ici', 'icu', 'icom', 'ici']], // Republika
    ['ka', ['ke', 'ki', 'ku', 'kom', 'ki']], // Srbijanka
    ['ija', ['ije', 'iji', 'iju', 'ijom', 'iji']], // Srbija
    ['nja', ['nje', 'nji', 'nju', 'njom', 'nji']], // Slovenija
  ];

  let baseWord = word;
  let appliedPattern = null;

  // First, try to find if the word is already a declined form and stem it back
  for (const [baseSuffix, replacements] of declensionPatterns) {
    for (const replacement of replacements) {
      if (word.toLowerCase().endsWith(replacement)) {
        // This word might be a declined form, try to stem it back
        const potentialBase = word.slice(0, -replacement.length) + baseSuffix;
        // For now, just add the base form - we can refine this logic later
        patterns.add(potentialBase);
        baseWord = potentialBase;
        break;
      }
    }
    if (appliedPattern) break;
  }

  // Now generate all declensions from the base word
  for (const [baseSuffix, replacements] of declensionPatterns) {
    if (baseWord.toLowerCase().endsWith(baseSuffix)) {
      const base = baseWord.slice(0, -baseSuffix.length);
      // Add nominative (base form)
      patterns.add(base + baseSuffix);
      // Add all other cases
      for (const replacement of replacements) {
        patterns.add(base + replacement);
      }
      appliedPattern = baseSuffix;
      break; // Only apply one pattern per word
    }
  }

  // Add possessive forms for names
  // For masculine names ending in consonants, add -ev/-ev
  if (!word.toLowerCase().endsWith('a') && !word.toLowerCase().endsWith('e') && !word.toLowerCase().endsWith('i') && !word.toLowerCase().endsWith('o') && !word.toLowerCase().endsWith('u')) {
    patterns.add(word + 'ev');
    patterns.add(word + 'evom'); // instrumental of possessive
    patterns.add(word + 'eva');  // genitive feminine
    patterns.add(word + 'evoj'); // dative feminine
  }
  // For names ending in -a (feminine), possessive is usually -in
  else if (word.toLowerCase().endsWith('a')) {
    const base = word.slice(0, -1);
    patterns.add(base + 'in');
    patterns.add(base + 'ina');  // genitive
    patterns.add(base + 'inoj'); // dative/locative
  }

  // Try to get vocative form if it's a name
  try {
    const declResult = dekl(word);
    if (declResult && declResult.found) {
      patterns.add(declResult.vocative);
      patterns.add(declResult.vocativeCyr); // Also add Cyrillic version
    }
  } catch (e) {
    // Ignore deklinacija errors
  }

  return Array.from(patterns);
}

/**
 * Create a regex pattern that matches all declensions of a word
 */
function createDeclensionRegex(word, declensions = []) {
  const allForms = [word, ...declensions];
  const escaped = allForms.map(form =>
    form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // Create word boundary aware regex
  return new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
}

/**
 * Get all forms of a word (original + declensions)
 */
function getAllWordForms(word, options = {}) {
  const { useDeclensions = false, declensionPatterns = [], stemmingEnabled = true } = options;

  let forms = [word];

  if (useDeclensions) {
    if (declensionPatterns && declensionPatterns.length > 0) {
      // Use manually specified patterns
      forms = forms.concat(declensionPatterns);
    } else if (stemmingEnabled) {
      // Auto-generate declensions
      forms = forms.concat(generateSerbianDeclensions(word));
    }
  }

  return [...new Set(forms)]; // Remove duplicates
}

module.exports = {
  generateSerbianDeclensions,
  createDeclensionRegex,
  getAllWordForms
};
