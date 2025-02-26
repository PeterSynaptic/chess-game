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
        this.difficulty = 'normal'; // 'easy', 'normal', 'hard'
        this.isInCheck = false;
        this.canCastle = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
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

        // Add difficulty button listeners
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update selected button styling
                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                // Set new difficulty
                const difficulty = button.dataset.difficulty;
                this.setDifficulty(difficulty);
            });
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
        const piece = this.boardState[fromRow][fromCol];
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        // Normal king move
        if (rowDiff <= 1 && colDiff <= 1) return true;

        // Castling
        if (piece.piece === 'king' && fromRow === toRow && Math.abs(fromCol - toCol) === 2) {
            if (this.isInCheck(piece.color)) return false;

            const isKingside = toCol > fromCol;
            const rookCol = isKingside ? 7 : 0;
            const rook = this.boardState[fromRow][rookCol];

            // Check if castling is still allowed
            if (!this.canCastle[piece.color][isKingside ? 'kingside' : 'queenside']) return false;
            if (!rook || rook.piece !== 'rook') return false;

            // Check if path is clear
            const direction = isKingside ? 1 : -1;
            for (let col = fromCol + direction; col !== rookCol; col += direction) {
                if (this.boardState[fromRow][col]) return false;
            }

            // Check if king passes through check
            const intermediateCol = fromCol + direction;
            this.boardState[fromRow][intermediateCol] = piece;
            this.boardState[fromRow][fromCol] = null;
            const passesThroughCheck = this.isInCheck(piece.color);
            this.boardState[fromRow][fromCol] = piece;
            this.boardState[fromRow][intermediateCol] = null;

            return !passesThroughCheck;
        }

        return false;
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

    getDifficultySettings() {
        const settings = {
            easy: {
                depth: 2,
                aggressiveness: 0.3,  // Lower value means less aggressive
                randomness: 0.2       // Higher value means more random moves
            },
            normal: {
                depth: 3,
                aggressiveness: 0.6,
                randomness: 0.1
            },
            hard: {
                depth: 4,
                aggressiveness: 0.9,
                randomness: 0.05
            }
        };
        return settings[this.difficulty];
    }

    setDifficulty(level) {
        if (['easy', 'normal', 'hard'].includes(level)) {
            this.difficulty = level;
            this.resetGame();
        }
    }

    evaluatePosition() {
        const settings = this.getDifficultySettings();
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
        let materialScore = 0;
        let positionalScore = 0;
        let attackScore = 0;
        let centerControl = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece) {
                    const isWhite = piece.color === 'white';
                    const positionRow = isWhite ? row : 7 - row;
                    
                    // Material score
                    const baseValue = pieceValues[piece.piece];
                    materialScore += isWhite ? baseValue : -baseValue;

                    // Position bonus
                    let positionBonus = 0;
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
                            // Add king safety evaluation
                            if (this.isInCheck && piece.color === this.currentPlayer) {
                                positionBonus -= 500; // Penalize being in check
                            }
                            break;
                    }
                    positionalScore += isWhite ? positionBonus : -positionBonus;

                    // Center control bonus (more aggressive positioning)
                    if ((row === 3 || row === 4) && (col === 3 || col === 4)) {
                        centerControl += isWhite ? 50 : -50;
                    }

                    // Attack potential (pieces near enemy king)
                    const enemyKingPos = this.findKing(isWhite ? 'black' : 'white');
                    if (enemyKingPos) {
                        const distance = Math.max(
                            Math.abs(row - enemyKingPos.row),
                            Math.abs(col - enemyKingPos.col)
                        );
                        attackScore += isWhite ? 
                            (8 - distance) * 10 * settings.aggressiveness :
                            -(8 - distance) * 10 * settings.aggressiveness;
                    }
                }
            }
        }

        // Combine all factors with weights
        score = materialScore + 
                positionalScore * 0.5 +
                centerControl * settings.aggressiveness +
                attackScore;

        // Add randomness based on difficulty
        score += (Math.random() - 0.5) * 50 * settings.randomness;

        return score;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece && piece.piece === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
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

    movePiece(fromRow, fromCol, toRow, toCol) {
        // Execute the player's move
        this.executeMove(fromRow, fromCol, toRow, toCol);

        // Trigger AI move if it's AI's turn
        if (this.isAIEnabled && this.currentPlayer === this.aiColor) {
            if (this.debugMode) console.log('Scheduling AI move...');
            // Increase delay slightly to ensure move is visible
            setTimeout(() => {
                if (this.currentPlayer === this.aiColor) {
                    if (this.debugMode) console.log('Making AI move...', this.currentPlayer);
                    this.makeAIMove();
                }
            }, 750); // Increased delay for better visibility
        }
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.boardState[fromRow][fromCol];
        const capturedPiece = this.boardState[toRow][toCol];
        
        if (this.debugMode) {
            console.log('Executing move:', {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                piece: piece,
                capturedPiece: capturedPiece,
                currentPlayer: this.currentPlayer
            });
        }

        // Handle captured piece
        if (capturedPiece) {
            const capturer = piece.color;
            const pieceValue = this.getPieceValue(capturedPiece.piece);
            this.capturedPieces[capturer].push(capturedPiece.piece);
            this.scores[capturer] += pieceValue;
            this.updateScoreDisplay();
            this.updateCapturedPieces();
        }

        // Handle castling move
        if (piece.piece === 'king' && Math.abs(fromCol - toCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? toCol - 1 : toCol + 1;
            const rook = this.boardState[fromRow][rookFromCol];
            
            // Move rook
            this.boardState[fromRow][rookToCol] = rook;
            this.boardState[fromRow][rookFromCol] = null;
            
            // Update UI for rook
            const squares = document.querySelectorAll('.square');
            squares[fromRow * 8 + rookFromCol].textContent = '';
            squares[fromRow * 8 + rookToCol].textContent = this.pieces[piece.color]['rook'];
        }

        // Make the move
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = null;

        // Update castling rights
        if (piece.piece === 'king') {
            this.canCastle[piece.color].kingside = false;
            this.canCastle[piece.color].queenside = false;
        } else if (piece.piece === 'rook') {
            if (fromCol === 0) this.canCastle[piece.color].queenside = false;
            if (fromCol === 7) this.canCastle[piece.color].kingside = false;
        }

        // Update UI
        const squares = document.querySelectorAll('.square');
        squares[fromRow * 8 + fromCol].textContent = '';
        squares[toRow * 8 + toCol].textContent = this.pieces[piece.color][piece.piece];

        // Update current player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Check for check/checkmate
        const isInCheck = this.isInCheck(this.currentPlayer);
        const isCheckmate = isInCheck && this.isCheckmate(this.currentPlayer);

        if (isCheckmate) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            this.turnDisplay.textContent = `Checkmate! ${winner} wins!`;
            this.isAIEnabled = false; // Stop AI moves after checkmate
        } else if (isInCheck) {
            this.turnDisplay.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
                this.currentPlayer.slice(1)}'s Turn - CHECK!`;
        } else {
            this.turnDisplay.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
                this.currentPlayer.slice(1)}'s Turn`;
        }

        if (this.debugMode) {
            console.log('Move complete, current player:', this.currentPlayer);
            console.log('Board state:', JSON.stringify(this.boardState));
        }
    }

    makeAIMove() {
        if (!this.isAIEnabled || this.currentPlayer !== this.aiColor) {
            if (this.debugMode) console.log('AI move skipped - not AI turn or AI disabled');
            return false;
        }

        if (this.debugMode) console.log('AI thinking...', 'Current player:', this.currentPlayer, 'AI color:', this.aiColor);
        const moves = this.getAllPossibleMoves(this.aiColor);
        
        if (this.debugMode) console.log('Available moves:', moves);

        if (!moves || moves.length === 0) {
            if (this.debugMode) console.log('No moves available for AI');
            return false;
        }

        // Get difficulty settings
        const settings = this.getDifficultySettings();
        const searchDepth = settings.depth;

        // Initialize best move tracking
        let bestMove = null;
        let bestScore = this.aiColor === 'white' ? -Infinity : Infinity;

        // Evaluate each possible move
        for (const move of moves) {
            // Make the move temporarily
            const savedPiece = this.boardState[move.toRow][move.toCol];
            const movingPiece = this.boardState[move.fromRow][move.fromCol];
            this.boardState[move.toRow][move.toCol] = movingPiece;
            this.boardState[move.fromRow][move.fromCol] = null;

            // Evaluate position
            const score = this.minimax(searchDepth - 1, false, -Infinity, Infinity);

            // Undo the move
            this.boardState[move.fromRow][move.fromCol] = movingPiece;
            this.boardState[move.toRow][move.toCol] = savedPiece;

            if (this.debugMode) {
                console.log(`Evaluated move: ${move.fromRow},${move.fromCol} to ${move.toRow},${move.toCol} score: ${score}`);
            }

            // Update best move
            if ((this.aiColor === 'white' && score > bestScore) || 
                (this.aiColor === 'black' && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (bestMove) {
            if (this.debugMode) console.log('Executing best move:', bestMove);
            
            // Directly update the board state and UI
            const fromPiece = this.boardState[bestMove.fromRow][bestMove.fromCol];
            const toPiece = this.boardState[bestMove.toRow][bestMove.toCol];
            
            // Execute the move using the regular move execution
            this.executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            
            if (this.debugMode) {
                console.log('Move executed, new board state:', this.boardState);
            }
            
            return true;
        }

        return false;
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;

        // Check if any opponent piece can capture the king
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove(row, col, kingPos.row, kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;

        // Try all possible moves to see if any can get out of check
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.boardState[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {  // Fixed the infinite loop here
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                // Try the move
                                const savedPiece = this.boardState[toRow][toCol];
                                this.boardState[toRow][toCol] = piece;
                                this.boardState[fromRow][fromCol] = null;

                                // Check if still in check
                                const stillInCheck = this.isInCheck(color);

                                // Undo the move
                                this.boardState[fromRow][fromCol] = piece;
                                this.boardState[toRow][toCol] = savedPiece;

                                if (!stillInCheck) return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    getPieceValue(piece) {
        const values = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 0  // King's value not counted in score as it can't be captured
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
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
