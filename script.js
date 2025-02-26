class ChessGame {
    constructor() {
        this.board = document.getElementById('chessboard');
        this.turnDisplay = document.getElementById('turn');
        this.resetButton = document.getElementById('reset');
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.isAIEnabled = true;  // Enable AI by default
        this.aiColor = 'black';   // AI plays as black
        this.debugMode = true; // Enable debug logging
        this.pieces = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
        
        this.boardState = [];
        this.capturedPieces = {
            white: [],
            black: []
        };
        this.scores = {
            white: 0,
            black: 0
        };
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        this.board.innerHTML = '';
        this.boardState = [];

        const initialSetup = [
            ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
            ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
            ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
        ];

        for (let row = 0; row < 8; row++) {
            this.boardState[row] = [];
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = initialSetup[row][col];
                if (piece) {
                    const color = row < 2 ? 'black' : 'white';
                    square.textContent = this.pieces[color][piece];
                    this.boardState[row][col] = { piece, color };
                } else {
                    this.boardState[row][col] = null;
                }

                this.board.appendChild(square);
            }
        }
    }

    setupEventListeners() {
        this.board.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            this.handleSquareClick(row, col);
        });

        this.resetButton.addEventListener('click', () => {
            this.resetGame();
        });
    }

    handleSquareClick(row, col) {
        // Prevent moves during AI turn
        if (this.isAIEnabled && this.currentPlayer === this.aiColor) {
            console.log('Blocked - AI turn');
            return;
        }

        const clickedSquare = this.boardState[row][col];
        const squares = document.querySelectorAll('.square');
        
        // Clear previous selections and valid moves
        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });

        // If no piece is selected and clicked on a piece of current player's color
        if (!this.selectedPiece && clickedSquare && clickedSquare.color === this.currentPlayer) {
            this.selectedPiece = { row, col };
            squares[row * 8 + col].classList.add('selected');
            this.showValidMoves(row, col);
            return;
        }

        // If a piece is selected
        if (this.selectedPiece) {
            const validMove = this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
            
            if (validMove) {
                console.log('Making move from', this.selectedPiece.row, this.selectedPiece.col, 'to', row, col);
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
            }
            this.selectedPiece = null;
        }
    }

    showValidMoves(row, col) {
        const piece = this.boardState[row][col];
        if (!piece) return;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(row, col, i, j)) {
                    const square = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                    square.classList.add('valid-move');
                }
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.boardState[fromRow][fromCol];
        if (!piece) return false;

        const target = this.boardState[toRow][toCol];
        
        // Can't capture own pieces
        if (target && target.color === piece.color) return false;

        // Basic move validation based on piece type
        switch (piece.piece) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.boardState[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Basic one square forward move
        if (fromCol === toCol && toRow === fromRow + direction && !this.boardState[toRow][toCol]) {
            return true;
        }

        // Initial two square move
        if (fromRow === startRow && fromCol === toCol && 
            toRow === fromRow + 2 * direction && 
            !this.boardState[fromRow + direction][toCol] &&
            !this.boardState[toRow][toCol]) {
            return true;
        }

        // Capture moves
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
            return this.boardState[toRow][toCol] && 
                   this.boardState[toRow][toCol].color !== piece.color;
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }

    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
        const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.boardState[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    evaluatePosition() {
        const pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };

        // Piece position tables for positional evaluation
        const pawnPositionWhite = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];

        const knightPosition = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];

        const bishopPosition = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];

        const rookPosition = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ];

        const queenPosition = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ];

        const kingPosition = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ];

        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece) {
                    let positionBonus = 0;
                    const isWhite = piece.color === 'white';
                    const positionRow = isWhite ? row : 7 - row;
                    
                    // Base piece value
                    const baseValue = pieceValues[piece.piece];
                    
                    // Position bonus based on piece type
                    switch(piece.piece) {
                        case 'pawn':
                            positionBonus = pawnPositionWhite[positionRow][col];
                            break;
                        case 'knight':
                            positionBonus = knightPosition[positionRow][col];
                            break;
                        case 'bishop':
                            positionBonus = bishopPosition[positionRow][col];
                            break;
                        case 'rook':
                            positionBonus = rookPosition[positionRow][col];
                            break;
                        case 'queen':
                            positionBonus = queenPosition[positionRow][col];
                            break;
                        case 'king':
                            positionBonus = kingPosition[positionRow][col];
                            break;
                    }

                    // Add position-adjusted score
                    const totalScore = baseValue + positionBonus;
                    score += isWhite ? totalScore : -totalScore;
                }
            }
        }
        return score;
    }

    getAllPossibleMoves(color) {
        const moves = [];
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.boardState[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                moves.push({
                                    fromRow,
                                    fromCol,
                                    toRow,
                                    toCol,
                                    piece: piece.piece
                                });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        if (depth === 0) {
            return this.evaluatePosition();
        }

        const color = isMaximizing ? 'white' : 'black';
        const moves = this.getAllPossibleMoves(color);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                // Make move
                const savedPiece = this.boardState[move.toRow][move.toCol];
                const movingPiece = this.boardState[move.fromRow][move.fromCol];
                this.boardState[move.toRow][move.toCol] = movingPiece;
                this.boardState[move.fromRow][move.fromCol] = null;

                const evalScore = this.minimax(depth - 1, false, alpha, beta);
                
                // Undo move
                this.boardState[move.fromRow][move.fromCol] = movingPiece;
                this.boardState[move.toRow][move.toCol] = savedPiece;

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                // Make move
                const savedPiece = this.boardState[move.toRow][move.toCol];
                const movingPiece = this.boardState[move.fromRow][move.fromCol];
                this.boardState[move.toRow][move.toCol] = movingPiece;
                this.boardState[move.fromRow][move.fromCol] = null;

                const evalScore = this.minimax(depth - 1, true, alpha, beta);
                
                // Undo move
                this.boardState[move.fromRow][move.fromCol] = movingPiece;
                this.boardState[move.toRow][move.toCol] = savedPiece;

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    makeAIMove() {
        if (!this.isAIEnabled || this.currentPlayer !== this.aiColor) {
            if (this.debugMode) console.log('AI move skipped - not AI turn or AI disabled');
            return;
        }

        if (this.debugMode) console.log('AI thinking...', 'Current player:', this.currentPlayer, 'AI color:', this.aiColor);
        const moves = this.getAllPossibleMoves(this.aiColor);
        if (this.debugMode) console.log('Available moves:', moves.length);

        if (moves.length === 0) {
            if (this.debugMode) console.log('No moves available for AI');
            return;
        }

        let bestMove = null;
        let bestScore = this.aiColor === 'white' ? -Infinity : Infinity;

        // Increase search depth for harder difficulty
        const searchDepth = 4;

        for (const move of moves) {
            // Make move
            const savedPiece = this.boardState[move.toRow][move.toCol];
            const movingPiece = this.boardState[move.fromRow][move.fromCol];
            this.boardState[move.toRow][move.toCol] = movingPiece;
            this.boardState[move.fromRow][move.fromCol] = null;

            // Evaluate position using deeper minimax search
            const score = this.minimax(searchDepth - 1, this.aiColor === 'white', -Infinity, Infinity);

            // Undo move
            this.boardState[move.fromRow][move.fromCol] = movingPiece;
            this.boardState[move.toRow][move.toCol] = savedPiece;

            // Update best move
            if (this.aiColor === 'white' && score > bestScore) {
                bestScore = score;
                bestMove = move;
            } else if (this.aiColor === 'black' && score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (bestMove) {
            if (this.debugMode) console.log('AI executing move:', bestMove, 'with score:', bestScore);
            this.executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
        } else {
            if (this.debugMode) console.log('AI could not find a valid move');
        }
    }

    getPieceValue(piece) {
        const values = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 0  // King's value not counted in score
        };
        return values[piece] || 0;
    }

    updateScoreDisplay() {
        document.getElementById('white-score').textContent = this.scores.white;
        document.getElementById('black-score').textContent = this.scores.black;
    }

    updateCapturedPieces() {
        const capturedByWhite = document.getElementById('captured-by-white');
        const capturedByBlack = document.getElementById('captured-by-black');
        
        capturedByWhite.innerHTML = this.capturedPieces.white
            .map(piece => this.pieces.black[piece])
            .join(' ');
        
        capturedByBlack.innerHTML = this.capturedPieces.black
            .map(piece => this.pieces.white[piece])
            .join(' ');
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.boardState[fromRow][fromCol];
        const capturedPiece = this.boardState[toRow][toCol];
        
        // Handle captured piece
        if (capturedPiece) {
            const capturer = piece.color;
            const pieceValue = this.getPieceValue(capturedPiece.piece);
            
            // Add to captured pieces array
            this.capturedPieces[capturer].push(capturedPiece.piece);
            
            // Update score
            this.scores[capturer] += pieceValue;
            
            // Update displays
            this.updateScoreDisplay();
            this.updateCapturedPieces();
        }

        // Make the move
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = null;

        // Update UI
        const squares = document.querySelectorAll('.square');
        squares[fromRow * 8 + fromCol].textContent = '';
        squares[toRow * 8 + toCol].textContent = this.pieces[piece.color][piece.piece];

        if (this.debugMode) {
            console.log(`Move executed: ${piece.color} ${piece.piece} from ${fromRow},${fromCol} to ${toRow},${toCol}`);
            if (capturedPiece) {
                console.log(`Captured: ${capturedPiece.color} ${capturedPiece.piece}`);
            }
        }

        // Update current player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.turnDisplay.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
            this.currentPlayer.slice(1)}'s Turn`;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        this.executeMove(fromRow, fromCol, toRow, toCol);

        // If it's AI's turn after this move, trigger AI move with a slight delay
        if (this.isAIEnabled && this.currentPlayer === this.aiColor) {
            if (this.debugMode) console.log('Triggering AI move...', 'Current player:', this.currentPlayer);
            setTimeout(() => {
                if (this.currentPlayer === this.aiColor) {
                    this.makeAIMove();
                }
            }, 500);
        }
    }

    resetGame() {
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.turnDisplay.textContent = "White's Turn";
        // Reset captured pieces and scores
        this.capturedPieces = { white: [], black: [] };
        this.scores = { white: 0, black: 0 };
        this.updateScoreDisplay();
        this.updateCapturedPieces();
        this.initializeBoard();
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
