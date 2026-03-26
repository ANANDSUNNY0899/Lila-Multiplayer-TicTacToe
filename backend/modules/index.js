// ========================================
// LILA ARENA - TIC-TAC-TOE SERVER LOGIC
// ========================================

// --- 1. GAME LOGIC & WIN CONDITIONS ---
var WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWin(board, mark) {
    for (var i = 0; i < WIN_PATTERNS.length; i++) {
        var p = WIN_PATTERNS[i];
        if (board[p[0]] === mark && board[p[1]] === mark && board[p[2]] === mark) {
            return true;
        }
    }
    return false;
}

function isBoardFull(board) {
    for (var i = 0; i < board.length; i++) {
        if (board[i] === null) return false;
    }
    return true;
}

// --- 2. MATCH LIFECYCLE HANDLERS ---

var matchInit = function(ctx, logger, nk, params) {
    logger.info("New match initialized");
    return {
        state: { 
            board: Array(9).fill(null), 
            presences: {}, 
            marks: {}, 
            turn: null, 
            winner: null, 
            isDraw: false 
        },
        tickRate: 1,
        label: "tic_tac_toe"
    };
};

var matchJoinAttempt = function(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    var canJoin = Object.keys(state.presences).length < 2;
    logger.info("Join attempt - Can join: " + canJoin);
    return { state: state, accept: canJoin };
};

var matchJoin = function(ctx, logger, nk, dispatcher, tick, state, presences) {
    presences.forEach(function(p) {
        state.presences[p.sessionId] = p;
        
        // Assign marks (X or O)
        if (Object.keys(state.marks).length === 0) {
            state.marks[p.sessionId] = 'X';
            state.turn = p.userId; // First player gets first turn
            logger.info("Player joined as X: " + p.userId);
        } else {
            state.marks[p.sessionId] = 'O';
            logger.info("Player joined as O: " + p.userId);
        }
    });

    // When both players are ready, broadcast initial state
    if (Object.keys(state.presences).length === 2) {
        logger.info("Both players connected! Game starting. First turn: " + state.turn);
        dispatcher.broadcastMessage(2, JSON.stringify({
            board: state.board,
            nextTurn: state.turn,
            winner: null,
            isDraw: false
        }));
    }
    
    return { state: state };
};

var matchLoop = function(ctx, logger, nk, dispatcher, tick, state, messages) {
    // Stop processing if game is over
    if (state.winner || state.isDraw) {
        return { state: state };
    }

    messages.forEach(function(m) {
        var data = JSON.parse(nk.binaryToString(m.data));
        
        // OpCode 1: Player Move
        if (m.opCode === 1 && m.sender.userId === state.turn) {
            var idx = data.index;
            var mark = state.marks[m.sender.sessionId];

            // Validate move
            if (idx >= 0 && idx < 9 && state.board[idx] === null) {
                state.board[idx] = mark;
                logger.info("Move made at index " + idx + " by " + mark);

                // Check for win
                if (checkWin(state.board, mark)) {
                    state.winner = m.sender.userId;
                    state.turn = null;
                    logger.info("Game won by: " + state.winner);
                } 
                // Check for draw
                else if (isBoardFull(state.board)) {
                    state.isDraw = true;
                    state.turn = null;
                    logger.info("Game ended in draw");
                } 
                // Switch turn to other player
                else {
                    var sessionIds = Object.keys(state.presences);
                    var nextSessionId = sessionIds.find(function(sid) { 
                        return sid !== m.sender.sessionId; 
                    });
                    state.turn = state.presences[nextSessionId].userId;
                    logger.info("Turn switched to: " + state.turn);
                }

                // Broadcast updated state to all players
                dispatcher.broadcastMessage(2, JSON.stringify({
                    board: state.board,
                    nextTurn: state.turn,
                    winner: state.winner,
                    isDraw: state.isDraw
                }));
            }
        }
    });
    
    return { state: state };
};

var matchLeave = function(ctx, logger, nk, dispatcher, tick, state, presences) { 
    logger.info("Player left the match");
    return null; 
};

var matchTerminate = function(ctx, logger, nk, dispatcher, tick, state, graceSeconds) { 
    logger.info("Match terminated");
    return { state: state }; 
};

var matchSignal = function(ctx, logger, nk, dispatcher, tick, state, data) { 
    return { state: state, data: data }; 
};

// --- 3. MATCHMAKER HOOK ---
var matchmakerMatched = function(context, logger, nk, matches) {
    logger.info("Matchmaker matched, creating new match");
    return nk.matchCreate("tic_tac_toe", {});
};

// --- 4. MODULE INITIALIZER ---
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerMatch("tic_tac_toe", {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLoop: matchLoop,
        matchLeave: matchLeave,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    
    initializer.registerMatchmakerMatched(matchmakerMatched);
    
    logger.info("✓ LILA TIC-TAC-TOE: Server module loaded successfully");
}