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
    // when an element is added to dom 
    connectedCallback() {
        const dimensions = this.getAttribute('dimensions') || '3 x 4';
        this.setupGame(dimensions);
    }
    // Setting up game grid based on dimensions
    setupGame(dimensions) {
        const [rows, cols] = dimensions.split('x').map(s => s.trim());
        this.rows = parseInt(rows);
        this.cols = parseInt(cols);
        this.totalCards = this.rows * this.cols;
        
        if (this.totalCards % 2 !== 0) {
            console.error('Grid must have even number of cards');
            return;
        }
        
        this.createBoard();
    }
    // Generating the card pairs 
    generateCardPairs() {
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        //calculate number of pairs needed
        const pairsNeeded = this.totalCards / 2;
        const cards = [];
        
        for (let i = 0; i < pairsNeeded; i++) {
            const shape = shapes[i % shapes.length];
            const color = colors[Math.floor(i / shapes.length) % colors.length];
            
            cards.push({ shape, color });
            cards.push({ shape, color });
        }
        
        return cards.sort(() => Math.random() - 0.5);
    }
    //Creating the game board
    async createBoard() {
    const cards = this.generateCardPairs();
    
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
        }     
        .stats-button:hover {
            background-color: #45a049;
        }
        .stats-button:active {
            background-color: #3d8b40;
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
            <div class="average-display" id="average-display"></div>
        </div>
        <div class="game-board" id="board"></div>
    </div>
`;
    
    const board = this.shadowRoot.getElementById('board');
    //add event listener for average clicks button
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
    //add event listener for the statistics button
    const showAverageBtn = this.shadowRoot.getElementById('show-average-btn');
    showAverageBtn.addEventListener('click', () => this.displayAverageClicks());
    }

    handleCardClick(card) {
        if (!this.canClick || this.flippedCards.includes(card) || card.classList.contains('matched')) {
            return;
        }

        this.clickCount++;
        this.updateClickDisplay();
        card.flip();
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }
    //display average clicks from firestore
    updateClickDisplay() {
    const counter = this.shadowRoot.getElementById('click-counter');
    if (counter) {
        counter.textContent = this.clickCount;
        }
    }
    //fetch and display average clicks from firestore
    checkForMatch() {
        this.canClick = false;
        const [card1, card2] = this.flippedCards;
        
        const isMatch = card1.dataset.shape === card2.dataset.shape && 
                        card1.dataset.color === card2.dataset.color;
        
        setTimeout(() => {
            if (isMatch) {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                
                if (this.matchedPairs === this.totalCards / 2) {
                    this.gameWon();
                }
            } else {
                card1.flip();
                card2.flip();
            }
            
            this.flippedCards = [];
            this.canClick = true;
        }, 1000);
    }

async gameWon() {
    // Save game result to Firestore
    await this.saveGameResult();
    
    setTimeout(() => {
        alert(`Congratulations! You found all matches in ${this.clickCount} clicks!`);
    }, 500);
  }  
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
        // Game continues even if save fails - don't interrupt user experience
    }
}
async displayAverageClicks() {
    const displayElement = this.shadowRoot.getElementById('average-display');
    displayElement.textContent = 'Calculating...';

    try {
        // Query all game results from Firestore
        const q = query(collection(db, 'gameResults'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            displayElement.textContent = 'No games played yet!';
            return;
        }

        // Calculate average clicks
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

        const average = (totalClicks / gameCount).toFixed(2);
        displayElement.textContent = `Average clicks: ${average} (from ${gameCount} games)`;
        console.log(`Average calculated: ${average} clicks from ${gameCount} games`);

    } catch (error) {
        console.error('Error fetching game statistics:', error);
        displayElement.textContent = 'Error loading statistics. Please check Firebase configuration.';
    }
} 
}

customElements.define('memory-game', MemoryGame);