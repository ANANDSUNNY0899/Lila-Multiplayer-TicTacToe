import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Client, Session, Socket } from '@heroiclabs/nakama-js';
import { Buffer } from 'buffer';

if (!global.Buffer) global.Buffer = Buffer;
const textDecoder = new TextDecoder();

const SERVER_IP = Platform.OS === 'web' ? "127.0.0.1" : "192.168.29.219"; 
const client = new Client("defaultkey", SERVER_IP, "7350", false);

// --- UI CONSTANTS ---
const SQUARE_SIZE = 100;
const MARGIN = 5;
const PADDING = 10;
// Increased to 360 to account for the 4px total borderWidth of the board itself
const BOARD_SIZE = 360; 

export default function TicTacToeScreen() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [status, setStatus] = useState<string>("CONNECTING...");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    async function start() {
      try {
        const deviceId = `LILA_${Platform.OS}_${Math.random().toString(36).substring(2, 8)}`;
        const session = await client.authenticateDevice(deviceId, true);
        sessionRef.current = session;
        
        const socket = client.createSocket(false, false);
        await socket.connect(session, true);
        socketRef.current = socket;
        
        startMatchmaking();
      } catch (e) { setStatus("OFFLINE"); }
    }
    start();
    return () => { if (socketRef.current) socketRef.current.disconnect(true); };
  }, []);

  // Extracted matchmaking logic so we can reuse it for the "Play Again" button
  const startMatchmaking = async () => {
    setStatus("FINDING OPPONENT...");
    const socket = socketRef.current;
    if (!socket) return;

    socket.onmatchmakermatched = async (matched: any) => {
      const match = await socket.joinMatch(matched.match_id);
      setMatchId(match.match_id);
      setStatus("MATCH JOINED!");
    };

    socket.onmatchdata = (result: any) => {
      const data = JSON.parse(textDecoder.decode(result.data));
      if (result.op_code === 2) {
        setBoard([...data.board]); 
        if (data.winner) {
            setGameOver(true);
            setStatus(data.winner === sessionRef.current?.user_id ? "🏆 VICTORY" : "💀 DEFEAT");
        } else if (data.isDraw) {
            setGameOver(true);
            setStatus("🤝 DRAW");
        } else {
            const isMe = data.nextTurn === sessionRef.current?.user_id;
            setIsMyTurn(isMe);
            setStatus(isMe ? "YOUR TURN" : "OPPONENT'S TURN");
        }
      }
    };

    try {
      await socket.addMatchmaker("*", 2, 2);
    } catch (e) {
      console.error("Matchmaking error", e);
    }
  };

  const handlePress = async (index: number) => {
    if (!matchId || !isMyTurn || board[index] || gameOver) return;
    try {
      await socketRef.current?.sendMatchState(matchId, 1, JSON.stringify({ index }));
    } catch (e) { console.error(e); }
  };

  const handlePlayAgain = async () => {
    // 1. Leave current match if it exists
    if (matchId && socketRef.current) {
      try {
        await socketRef.current.leaveMatch(matchId);
      } catch (e) { console.log("Error leaving match", e); }
    }
    
    // 2. Reset local game states
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setMatchId(null);
    setIsMyTurn(false);
    
    // 3. Jump back into matchmaking
    startMatchmaking();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>LILA <Text style={{color: '#00FFCC'}}>ARENA</Text></Text>
      
      {/* THE BOARD */}
      <View style={[styles.board, gameOver && {borderColor: '#FF3366'}]}>
        {board.map((cell, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.square} 
            onPress={() => handlePress(index)}
            disabled={gameOver || !isMyTurn}
          >
            <Text style={[styles.markText, { color: cell === 'X' ? '#00FFCC' : '#FF3366' }]}>
              {cell}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        {status.includes("FINDING") && <ActivityIndicator color="#00FFCC" style={{marginBottom: 10}} />}
        <Text style={[styles.statusText, { color: isMyTurn && !gameOver ? '#00FFCC' : '#666' }]}>
          {status}
        </Text>

        {/* PLAY AGAIN BUTTON */}
        {gameOver && (
          <TouchableOpacity style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <Text style={styles.playAgainText}>FIND NEW MATCH</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070707', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 8, marginBottom: 50 },
  board: { 
    width: BOARD_SIZE, 
    height: BOARD_SIZE, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    backgroundColor: '#111', 
    padding: PADDING, 
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#222',
  },
  square: { 
    width: SQUARE_SIZE, 
    height: SQUARE_SIZE, 
    backgroundColor: '#1A1A1A', 
    margin: MARGIN, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333'
  },
  markText: { fontSize: 50, fontWeight: '900' },
  footer: { marginTop: 40, alignItems: 'center', minHeight: 80 },
  statusText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  playAgainBtn: {
    marginTop: 20,
    backgroundColor: '#00FFCC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playAgainText: {
    color: '#070707',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  }
});