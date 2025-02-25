class ChessGame {
    constructor() {
        this.board = document.getElementById('chessboard');
        this.turnDisplay = document.getElementById('turn');
        this.resetButton = document.getElementById('reset');
        this.selectedPiece = null;
        this.currentPlayer = 'white';
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
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.turnDisplay.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
                    this.currentPlayer.slice(1)}'s Turn`;
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

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.boardState[fromRow][fromCol];
        this.boardState[toRow][toCol] = piece;
        this.boardState[fromRow][fromCol] = null;

        // Update UI
        const squares = document.querySelectorAll('.square');
        squares[fromRow * 8 + fromCol].textContent = '';
        squares[toRow * 8 + toCol].textContent = this.pieces[piece.color][piece.piece];
    }

    resetGame() {
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.turnDisplay.textContent = "White's Turn";
        this.initializeBoard();
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
