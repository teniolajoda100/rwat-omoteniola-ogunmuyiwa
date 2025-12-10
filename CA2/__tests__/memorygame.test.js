/**
 * Unit tests for MemoryGame custom element
 * Tests core game logic and functionality
 */

import { jest } from '@jest/globals';

// Mock firebase-config to avoid Firebase initialization in tests
jest.unstable_mockModule('../firebase-config.js', () => ({
    db: {}
}));

// Mock Firebase functions
jest.unstable_mockModule('firebase/firestore', () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    getDocs: jest.fn(),
    query: jest.fn()
}));

// Import after mocking
const { default: MemoryGame } = await import('../memorygame.js');

describe('MemoryGame - Card Generation', () => {
    let gameElement;

    beforeEach(() => {
        // Create a new game element before each test
        gameElement = document.createElement('memory-game');
        gameElement.setAttribute('dimensions', '3 x 4');
        document.body.appendChild(gameElement);
    });

    afterEach(() => {
        // Clean up after each test
        document.body.removeChild(gameElement);
    });

    test('should generate correct number of card pairs', () => {
        // Test that generateCardPairs creates the right number of cards
        const cards = gameElement.generateCardPairs();
        
        // For a 3x4 grid, we need 12 cards (6 pairs)
        expect(cards.length).toBe(12);
    });

    test('should create matching pairs of cards', () => {
        // Test that cards come in matching pairs
        const cards = gameElement.generateCardPairs();
        
        // Count occurrences of each card combination
        const cardCounts = {};
        cards.forEach(card => {
            const key = `${card.shape}-${card.color}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });
        
        // Every unique card should appear exactly twice (as a pair)
        Object.values(cardCounts).forEach(count => {
            expect(count).toBe(2);
        });
    });

    test('should use only valid shapes and colors', () => {
        // Test that only allowed shapes and colors are used
        const cards = gameElement.generateCardPairs();
        const validShapes = ['circle', 'square', 'triangle'];
        const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        cards.forEach(card => {
            expect(validShapes).toContain(card.shape);
            expect(validColors).toContain(card.color);
        });
    });
});