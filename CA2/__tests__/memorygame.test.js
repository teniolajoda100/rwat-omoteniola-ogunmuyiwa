/**
 * Unit tests for MemoryGame custom element
 * Tests core game logic and functionality
 */

import { jest } from '@jest/globals';

//mock firebase-config to avoid Firebase initialization in tests
jest.unstable_mockModule('../firebase-config.js', () => ({
    db: {}
}));

//mock Firebase functions
jest.unstable_mockModule('firebase/firestore', () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    getDocs: jest.fn(),
    query: jest.fn()
}));

//import after mocking
const { default: MemoryGame } = await import('../memorygame.js');

describe('MemoryGame - Card Generation', () => {
    let gameElement;

    beforeEach(() => {
        //create a new game element before each test
        gameElement = document.createElement('memory-game');
        gameElement.setAttribute('dimensions', '3 x 4');
        document.body.appendChild(gameElement);
    });

    afterEach(() => {
        //clean up after each test
        document.body.removeChild(gameElement);
    });

    test('should generate correct number of card pairs', () => {
        //test that generateCardPairs creates the right number of cards
        const cards = gameElement.generateCardPairs();
        
        //for a 3x4 grid, we need 12 cards (6 pairs)
        expect(cards.length).toBe(12);
    });

    test('should create matching pairs of cards', () => {
        //test that cards come in matching pairs
        const cards = gameElement.generateCardPairs();
        
        //count occurrences of each card combination
        const cardCounts = {};
        cards.forEach(card => {
            const key = `${card.shape}-${card.color}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });
        
        //every unique card should appear exactly twice (as a pair)
        Object.values(cardCounts).forEach(count => {
            expect(count).toBe(2);
        });
    });

    test('should use only valid shapes and colors', () => {
        //test that only allowed shapes and colors are used
        const cards = gameElement.generateCardPairs();
        const validShapes = ['circle', 'square', 'triangle'];
        const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        cards.forEach(card => {
            expect(validShapes).toContain(card.shape);
            expect(validColors).toContain(card.color);
        });
    });
});

describe('MemoryGame - Click Tracking', () => {
    let gameElement;

    beforeEach(() => {
        //create a new game element before each test
        gameElement = document.createElement('memory-game');
        gameElement.setAttribute('dimensions', '2 x 2');
        document.body.appendChild(gameElement);
    });

    afterEach(() => {
        //clean up after each test
        document.body.removeChild(gameElement);
    });

    test('should initialize click count to zero', () => {
        //test that game starts with zero clicks
        expect(gameElement.clickCount).toBe(0);
    });

    test('should increment click count when card is clicked', () => {
        //test that clicking cards increases the counter
        gameElement.canClick = true;
        const initialCount = gameElement.clickCount;
        
        //simulate a card click by directly calling the method
        //we create a mock card element
        const mockCard = document.createElement('div');
        mockCard.flip = jest.fn();
        mockCard.classList = {
            contains: jest.fn(() => false)
        };
        
        gameElement.handleCardClick(mockCard);
        
        //click count should increase by 1
        expect(gameElement.clickCount).toBe(initialCount + 1);
    });

    test('should not increment click count when clicking is disabled', () => {
        //test that clicks don't count when canClick is false
        gameElement.canClick = false;
        const initialCount = gameElement.clickCount;
        
        const mockCard = document.createElement('div');
        mockCard.flip = jest.fn();
        mockCard.classList = {
            contains: jest.fn(() => false)
        };
        
        gameElement.handleCardClick(mockCard);
        
        //click count should remain the same
        expect(gameElement.clickCount).toBe(initialCount);
    });

    test('should reset click count when game is restarted', () => {
        //test that restart resets the counter
        gameElement.clickCount = 15;
        
        gameElement.restartGame();
        
        //click count should be back to zero
        expect(gameElement.clickCount).toBe(0);
    });
});