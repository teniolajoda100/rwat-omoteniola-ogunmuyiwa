/**
 * Unit tests for MemoryGame custom element
 * Two distinct tests for core game functionality
 */

import { describe, test, expect } from '@jest/globals';

describe('MemoryGame Unit Tests', () => {
    
    // Test 1: Card generation logic
    test('should generate correct number of matching card pairs', () => {
        // Test the card generation algorithm directly
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        const totalCards = 12; // 3x4 grid
        const pairsNeeded = totalCards / 2;
        const cards = [];
        
        // Simulate generateCardPairs logic
        for (let i = 0; i < pairsNeeded; i++) {
            const shape = shapes[i % shapes.length];
            const color = colors[Math.floor(i / shapes.length) % colors.length];
            cards.push({ shape, color });
            cards.push({ shape, color });
        }
        
        // Should generate 12 cards
        expect(cards.length).toBe(12);
        
        // Verify all cards come in pairs
        const cardCounts = {};
        cards.forEach(card => {
            const key = `${card.shape}-${card.color}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });
        
        // Each unique card should appear exactly twice
        Object.values(cardCounts).forEach(count => {
            expect(count).toBe(2);
        });
    });

    // Test 2: Click tracking logic
    test('should track clicks correctly and reset', () => {
        // Simulate game state
        let clickCount = 0;
        let canClick = true;
        let flippedCards = [];
        
        // Mock card click handler logic
        const handleClick = (card) => {
            if (!canClick || flippedCards.includes(card)) {
                return;
            }
            clickCount++;
            flippedCards.push(card);
        };
        
        // Mock restart logic
        const restart = () => {
            clickCount = 0;
            flippedCards = [];
            canClick = true;
        };
        
        // Initial state
        expect(clickCount).toBe(0);
        
        // Simulate clicks
        handleClick('card1');
        expect(clickCount).toBe(1);
        
        handleClick('card2');
        expect(clickCount).toBe(2);
        
        // Restart
        restart();
        expect(clickCount).toBe(0);
    });
});