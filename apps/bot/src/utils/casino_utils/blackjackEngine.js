// src/utils/blackjackEngine.js

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(deckCount = 8) { // Utilise 6 paquets par défaut
    const deck = [];
    for (let d = 0; d < deckCount; d++) {
        for (const suit of SUITS) {
            for (const value of VALUES) {
                deck.push({ suit, value });
            }
        }
    }
    // Mélange de Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// src/utils/casino_utils/blackjackEngine.js
export function drawDoubleCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';

    return { suit, value, color };
}

export function isSoftHand(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.value === 'A') aces++;
        else if (['K', 'Q', 'J'].includes(card.value)) score += 10;
        else score += parseInt(card.value, 10);
    }
    // C'est une main "soft" si un As compte encore pour 11 sans dépasser 21
    return aces > 0 && (score + 11 + (aces - 1)) <= 21;
}

export function calculateScore(hand) {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
        if (card.value === 'A') {
            aces += 1;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value, 10);
        }
    }

    // Ajustement de la valeur des As si le score dépasse 21
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }

    return score;
}

export function formatHand(hand, hideSecondCard = false) {
    if (hideSecondCard) {
        return `${hand[0].value}${hand[0].suit}  🎴`;
    }
    return hand.map(c => `${c.value}${c.suit}`).join(' ');
}