import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';

class MemoryGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.canClick = true;
        //track total clicks for statistics
        this.clickCount = 0; 
    }

    //called when element is added to DOM
    connectedCallback() {
        const dimensions = this.getAttribute('dimensions') || '3 x 4';
        this.setupGame(dimensions);
    }

    //set up game grid based on dimensions attribute
    setupGame(dimensions) {
        const [rows, cols] = dimensions.split('x').map(s => s.trim());
        this.rows = parseInt(rows);
        this.cols = parseInt(cols);
        this.totalCards = this.rows * this.cols;
        
        //make sure we have an even number of cards for pairs
        if (this.totalCards % 2 !== 0) {
            console.error('Grid must have even number of cards');
            return;
        }
        
        this.createBoard();
    }

    //generate pairs of cards with shapes and colors
    generateCardPairs() {
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        //calculate how many unique pairs we need
        const pairsNeeded = this.totalCards / 2;
        const cards = [];
        
        //create pairs by combining shapes with colors
        for (let i = 0; i < pairsNeeded; i++) {
            const shape = shapes[i % shapes.length];
            const color = colors[Math.floor(i / shapes.length) % colors.length];
            
            //add two identical cards to create a pair
            cards.push({ shape, color });
            cards.push({ shape, color });
        }
        
        // shuffle cards randomly
        return cards.sort(() => Math.random() - 0.5);
    }

    // create and render the game board
    async createBoard() {
        const cards = this.generateCardPairs();
        
        //set up HTML structure and CSS styles for the game
        this.shadowRoot.innerHTML = `
            <style>
                .game-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .stats {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 1.2em;
                    font-weight: bold;
                }
                .controls {
                    text-align: center;
                    margin-bottom: 20px;
                } 
                .stats-button {
                    padding: 10px 20px;
                    font-size: 1em;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin: 0 5px;
                }     
                .stats-button:hover {
                    background-color: #45a049;
                }
                .stats-button:active {
                    background-color: #3d8b40;
                }
                .restart-button {
                    background-color: #2196F3;
                }
                .restart-button:hover {
                    background-color: #0b7dda;
                }
                .restart-button:active {
                    background-color: #0869b8;
                }
                .average-display {
                    margin-top: 10px;
                    font-size: 1.1em;
                    color: #333;
                    min-height: 25px;
                }
                .game-board {
                    display: grid;
                    grid-template-columns: repeat(${this.cols}, 120px);
                    grid-template-rows: repeat(${this.rows}, 120px);
                    gap: 15px;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                shape-card {
                    cursor: pointer;
                }
                shape-card.matched {
                    opacity: 0.6;
                    cursor: default;
                }
            </style>
            <div class="game-container">
                <div class="stats">
                    Clicks: <span id="click-counter">0</span>
                </div>
                <div class="controls">
                    <button class="stats-button" id="show-average-btn">Show Average Clicks</button>
                    <button class="stats-button restart-button" id="restart-btn">Restart Game</button>
                    <div class="average-display" id="average-display"></div>
                </div>
                <div class="game-board" id="board"></div>
            </div>
        `;
        
        const board = this.shadowRoot.getElementById('board');
        
        //create shape-card elements and add to board
        cards.forEach((card, index) => {
            const shapeCard = document.createElement('shape-card');
            shapeCard.setAttribute('type', card.shape);
            shapeCard.setAttribute('colour', card.color);
            shapeCard.dataset.index = index;
            shapeCard.dataset.shape = card.shape;
            shapeCard.dataset.color = card.color;
            
            shapeCard.addEventListener('click', () => this.handleCardClick(shapeCard));
            
            board.appendChild(shapeCard);
        });
        
        //set up event listener for statistics button
        const showAverageBtn = this.shadowRoot.getElementById('show-average-btn');
        showAverageBtn.addEventListener('click', () => this.displayAverageClicks());
        
        //set up event listener for restart button
        const restartBtn = this.shadowRoot.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.restartGame());
    }

    //handle card click events
    handleCardClick(card) {
        //dont allow clicks when disabled or card already matched
        if (!this.canClick || this.flippedCards.includes(card) || card.classList.contains('matched')) {
            return;
        }

        //update click count and flip the card
        this.clickCount++;
        this.updateClickDisplay();
        card.flip();
        this.flippedCards.push(card);
        
        //check for match when two cards are flipped
        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }

    //update the click counter display
    updateClickDisplay() {
        const counter = this.shadowRoot.getElementById('click-counter');
        if (counter) {
            counter.textContent = this.clickCount;
        }
    }

    // check if two flipped cards match
    checkForMatch() {
        this.canClick = false;
        const [card1, card2] = this.flippedCards;
        
        //compare shape and color to determine if cards match
        const isMatch = card1.dataset.shape === card2.dataset.shape && 
                        card1.dataset.color === card2.dataset.color;
        
        setTimeout(() => {
            if (isMatch) {
                //mark cards as matched
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                
                //check if all pairs have been found
                if (this.matchedPairs === this.totalCards / 2) {
                    this.gameWon();
                }
            } else {
                //flip cards back if they don't match
                card1.flip();
                card2.flip();
            }
            
            //reset for next turn
            this.flippedCards = [];
            this.canClick = true;
        }, 1000);
    }

    //called when player wins the game
    async gameWon() {
        //save game result to Firestore
        await this.saveGameResult();
        
        setTimeout(() => {
            alert(`Congratulations! You found all matches in ${this.clickCount} clicks!`);
        }, 500);
    }

    //save game result to Firestore database
    async saveGameResult() {
        try {
            const gameResult = {
                clicks: this.clickCount,
                timestamp: serverTimestamp(),
                dimensions: this.getAttribute('dimensions') || '3 x 4',
                totalCards: this.totalCards
            };

            await addDoc(collection(db, 'gameResults'), gameResult);
            console.log('Game result saved to Firestore:', gameResult);
        } catch (error) {
            console.error('Error saving game result to Firestore:', error);
            //game continues even if save fails - don't interrupt user experience
        }
    }

    // fetch and display average clicks from Firestore
    async displayAverageClicks() {
        const displayElement = this.shadowRoot.getElementById('average-display');
        displayElement.textContent = 'Calculating...';

        try {
            // query all game results from Firestore
            const q = query(collection(db, 'gameResults'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                displayElement.textContent = 'No games played yet!';
                return;
            }

            // calculate average from all game results
            let totalClicks = 0;
            let gameCount = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.clicks) {
                    totalClicks += data.clicks;
                    gameCount++;
                }
            });

            if (gameCount === 0) {
                displayElement.textContent = 'No valid game data found.';
                return;
            }

            // displayying average with 2 decimal places
            const average = (totalClicks / gameCount).toFixed(2);
            displayElement.textContent = `Average clicks: ${average} (from ${gameCount} games)`;
            console.log(`Average calculated: ${average} clicks from ${gameCount} games`);

        } catch (error) {
            console.error('Error fetching game statistics:', error);
            displayElement.textContent = 'Error loading statistics. Please check Firebase configuration.';
        }
    }

    // resetting game to initial state
    restartGame() {
        // resetting all game state variables
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.canClick = true;
        this.clickCount = 0;

        // clear average display
        const displayElement = this.shadowRoot.getElementById('average-display');
        if (displayElement) {
            displayElement.textContent = '';
        }

        // recreating the board with new shuffled cards
        this.createBoard();
       
    }
}

customElements.define('memory-game', MemoryGame);