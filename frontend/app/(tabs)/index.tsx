import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Client, Session, Socket } from '@heroiclabs/nakama-js';
import { Buffer } from 'buffer';

// Fix for Buffer in React Native
if (!global.Buffer) (global as any).Buffer = Buffer;
const textDecoder = new TextDecoder();

// --- 1. LOCAL WI-FI CONFIGURATION (NO NGROK) ---
// If testing on Web (PC), use localhost. If on Mobile, use your PC's local IP.
const SERVER_IP = Platform.OS === 'web' ? "127.0.0.1" : "192.168.29.219"; 

// Initialize Client (SSL is false, Port is 7350)
const client = new Client("defaultkey", SERVER_IP, "7350", false);

export default function TicTacToeScreen() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [status, setStatus] = useState<string>("CONNECTING...");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<Session | null>(null);

  // --- 2. MATCHMAKING LOGIC ---
  const startMatchmaking = async () => {
    if (!socketRef.current) return;
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setStatus("FINDING OPPONENT...");
    try {
      // Look for exactly 2 players
      await socketRef.current.addMatchmaker("*", 2, 2);
    } catch (e) {
      console.error("Matchmaking Error:", e);
    }
  };

  useEffect(() => {
    async function start() {
      try {
        // Unique identity for each device/browser tab
        const uniqueSuffix = Math.random().toString(36).substring(2, 10);
        const deviceId = `LILA_${Platform.OS}_${uniqueSuffix}`;
        
        const session = await client.authenticateDevice(deviceId, true);
        sessionRef.current = session;
        
        // Open Socket locally (both SSL and verbose set to false)
        const socket = client.createSocket(false, false);
        await socket.connect(session, true);
        socketRef.current = socket;

        // Matchmaker found a pair
        socket.onmatchmakermatched = async (matched: any) => {
          if (matched.match_id) {
            const match = await socket.joinMatch(matched.match_id);
            setMatchId(match.match_id);
            setStatus("MATCH JOINED!");
          }
        };

        // Handle real-time state updates from Nakama Server
        socket.onmatchdata = (result: any) => {
          const data = JSON.parse(textDecoder.decode(result.data));
          
          if (result.op_code === 2) {
            setBoard([...data.board]); // Update UI board
            
            if (data.winner) {
                setGameOver(true);
                const isVictory = data.winner === sessionRef.current?.user_id;
                setStatus(isVictory ? "🏆 VICTORY" : "💀 DEFEAT");
            } else if (data.isDraw) {
                setGameOver(true);
                setStatus("🤝 DRAW");
            } else {
                // BUG FIX: Changed data.turn to data.nextTurn right here!
                const isMe = data.nextTurn === sessionRef.current?.user_id;
                setIsMyTurn(isMe);
                setStatus(isMe ? "YOUR TURN" : "OPPONENT'S TURN");
            }
          }
        };

        await startMatchmaking();
        
      } catch (e) { 
        console.error("Connection Error:", e);
        setStatus("OFFLINE: SERVER UNREACHABLE"); 
      }
    }
    start();
    // Cleanup on unmount
    return () => { if (socketRef.current) socketRef.current.disconnect(true); };
  }, []);

  const handlePress = async (index: number) => {
    // Only allow click if match is active, it's my turn, and square is empty
    if (!matchId || !isMyTurn || board[index] || gameOver) return;
    try {
      // Send move to server (OpCode 1)
      await socketRef.current?.sendMatchState(matchId, 1, JSON.stringify({ index }));
    } catch (e) { console.error("Move error:", e); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>LILA <Text style={{color: '#00FFCC'}}>ARENA</Text></Text>
        <Text style={styles.subtitle}>FULL STACK MULTIPLAYER</Text>
      </View>
      
      {/* PERFECT 3x3 MATRIX */}
      <View style={[styles.board, gameOver && {borderColor: '#FF3366'}]}>
        {board.map((cell, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.square, isMyTurn && !cell && !gameOver && styles.activeSquare]} 
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
        {status.includes("FINDING") && <ActivityIndicator color="#00FFCC" style={{marginBottom: 15}} />}
        <Text style={[styles.statusText, { color: (isMyTurn && !gameOver) ? '#00FFCC' : '#888' }]}>
          {status}
        </Text>
        
        {gameOver && (
          <TouchableOpacity style={styles.btn} onPress={startMatchmaking}>
            <Text style={styles.btnText}>FIND NEW MATCH</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- STYLES: FIXED FOR WEB & MOBILE ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070707', alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 60, alignItems: 'center' },
  brandTitle: { fontSize: 36, color: '#FFF', fontWeight: '900', letterSpacing: 8 },
  subtitle: { fontSize: 10, color: '#444', letterSpacing: 4, marginTop: 5 },
  board: { 
    width: 360, 
    height: 360, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    backgroundColor: '#111', 
    padding: 10, 
    borderRadius: 15, 
    borderWidth: 2, 
    borderColor: '#222', 
    justifyContent: 'center',
    alignContent: 'center',
    ...Platform.select({
        web: {
            display: 'flex' as any
        }
    })
  },
  square: { 
    width: 100, 
    height: 100, 
    backgroundColor: '#1A1A1A', 
    margin: 5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#252525' 
  },
  activeSquare: {
    borderColor: '#333'
  },
  markText: { fontSize: 52, fontWeight: '900' },
  footer: { position: 'absolute', bottom: 60, alignItems: 'center', height: 140 },
  statusText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' },
  btn: { marginTop: 25, backgroundColor: '#00FFCC', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});