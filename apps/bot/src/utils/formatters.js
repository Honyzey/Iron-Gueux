// src/utils/formatters.js

/**
 * Formate un nombre de crédits avec le format complet et le format compact entre parenthèses
 * Exemple : 1250000 -> "1 250 000 (1,25 M) crédits"
 * 
 * @param {number} amount - Le montant à formater
 * @param {boolean} [showSymbol=true] - Inclure "crédits" à la fin
 * @returns {string}
 */
export function formatCredits(amount, showSymbol = true) {
    const full = new Intl.NumberFormat('fr-FR').format(amount);
    
    // Si le montant est inférieur à 10 000, le format compact n'apporte rien (ex: 1 500 au lieu de 1,5 k)
    if (Math.abs(amount) < 10000) {
        return showSymbol ? `${full} crédits` : full;
    }

    const compact = new Intl.NumberFormat('fr-FR', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
    }).format(amount);

    return showSymbol ? `${full} (${compact}) crédits` : `${full} (${compact})`;
}