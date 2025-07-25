import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStateTogether } from 'react-together';

const DevilLevelGame = () => {
    // Synchronized game timer state (10 minutes = 600 seconds)
    const [gameTimer, setGameTimer] = useStateTogether('game-timer', {
        startTime: null,
        timeLeft: 600, // 10 minutes in seconds
        isActive: false,
        gameEnded: false
    });

    // React state for UI updates
    const [gameState, setGameState] = useState({
        level: 1,
        score: 0,
        lives: 1,
        deaths: 0,
    });
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Refs for game logic to avoid re-renders within the loop
    const canvasRef = useRef(null);
    const gameLoopId = useRef(null);
    const gameStateRef = useRef({ ...gameState, running: false });

    // Game element refs
    const player = useRef({
        x: 50,
        y: 400,
        width: 25,
        height: 25,
        velX: 0,
        velY: 0,
        speed: 4,
        jumpPower: 12,
        onGround: false,
        jumpsMade: 0,
        maxJumps: 1,
        color: '#FFFFFF' // Player color
    });

    const keys = useRef({});
    const canJump = useRef(true);

    const platforms = useRef([]);
    const spikes = useRef([]);
    const movingPlatforms = useRef([]);
    const enemies = useRef([]);
    const lava = useRef([]);
    const teleporters = useRef([]);
    const goal = useRef({});

    // Memoized functions using useCallback to maintain stable references
    const checkCollision = useCallback((rect1, rect2) => {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }, []);
    
    const loadLevel = useCallback((level) => {
        platforms.current = [];
        spikes.current = [];
        movingPlatforms.current = [];
        enemies.current = [];
        lava.current = [];
        teleporters.current = [];

        player.current.maxJumps = level;
        player.current.jumpsMade = 0;

        // Base platforms and goal
        platforms.current.push({x: 0, y: 450, width: 200, height: 50, color: '#444'});
        platforms.current.push({x: 800, y: 450, width: 100, height: 50, color: '#444'});
        goal.current = {x: 850, y: 410, width: 30, height: 40, color: '#FF0000'};

        if (level === 1) {
            platforms.current.push({x: 250, y: 400, width: 40, height: 15, color: '#666'}, {x: 350, y: 350, width: 35, height: 15, color: '#666'}, {x: 450, y: 300, width: 30, height: 15, color: '#666'}, {x: 550, y: 250, width: 35, height: 15, color: '#666'}, {x: 650, y: 300, width: 40, height: 15, color: '#666'}, {x: 750, y: 350, width: 35, height: 15, color: '#666'});
            spikes.current.push({x: 200, y: 435, width: 50, height: 15}, {x: 290, y: 435, width: 60, height: 15}, {x: 385, y: 435, width: 65, height: 15}, {x: 480, y: 435, width: 70, height: 15}, {x: 585, y: 435, width: 65, height: 15}, {x: 690, y: 435, width: 60, height: 15});
            enemies.current.push({x: 270, y: 360, width: 15, height: 15, velX: 2, color: '#FF4444', range: 80, startX: 270}, {x: 470, y: 260, width: 15, height: 15, velX: -1.5, color: '#FF4444', range: 60, startX: 470}, {x: 670, y: 260, width: 15, height: 15, velX: 2.5, color: '#FF4444', range: 100, startX: 670});
        } else if (level === 2) {
            platforms.current.push({x: 220, y: 420, width: 25, height: 10, color: '#666'}, {x: 300, y: 380, width: 20, height: 10, color: '#666'}, {x: 380, y: 340, width: 25, height: 10, color: '#666'}, {x: 460, y: 280, width: 20, height: 10, color: '#666'}, {x: 540, y: 240, width: 25, height: 10, color: '#666'}, {x: 620, y: 200, width: 20, height: 10, color: '#666'}, {x: 700, y: 280, width: 25, height: 10, color: '#666'}, {x: 780, y: 350, width: 20, height: 10, color: '#666'});
            for (let i = 200; i < 800; i += 30) { if (Math.random() > 0.3) { spikes.current.push({x: i, y: 435, width: 25, height: 15}); } }
            movingPlatforms.current.push({x: 340, y: 300, width: 40, height: 10, velY: 2, color: '#888', range: 100, startY: 300}, {x: 500, y: 150, width: 30, height: 10, velX: 3, color: '#888', range: 120, startX: 500});
            enemies.current.push({x: 240, y: 380, width: 12, height: 12, velX: 3, color: '#FF0000', range: 60, startX: 240}, {x: 400, y: 300, width: 12, height: 12, velX: -4, color: '#FF0000', range: 80, startX: 400}, {x: 560, y: 200, width: 12, height: 12, velX: 3.5, color: '#FF0000', range: 100, startX: 560}, {x: 720, y: 240, width: 12, height: 12, velX: -3, color: '#FF0000', range: 70, startX: 720});
            lava.current.push({x: 270, y: 435, width: 110, height: 15}, {x: 420, y: 435, width: 90, height: 15}, {x: 580, y: 435, width: 100, height: 15});
        } else if (level === 3) {
            platforms.current.push({x: 210, y: 430, width: 15, height: 8, color: '#666'}, {x: 270, y: 400, width: 12, height: 8, color: '#666'}, {x: 330, y: 370, width: 15, height: 8, color: '#666'}, {x: 390, y: 320, width: 12, height: 8, color: '#666'}, {x: 450, y: 280, width: 15, height: 8, color: '#666'}, {x: 510, y: 240, width: 12, height: 8, color: '#666'}, {x: 570, y: 200, width: 15, height: 8, color: '#666'}, {x: 630, y: 160, width: 12, height: 8, color: '#666'}, {x: 690, y: 200, width: 15, height: 8, color: '#666'}, {x: 750, y: 280, width: 12, height: 8, color: '#666'}, {x: 790, y: 380, width: 15, height: 8, color: '#666'});
            for (let i = 200; i < 850; i += 20) { spikes.current.push({x: i, y: 435, width: 15, height: 15}); }
            movingPlatforms.current.push({x: 240, y: 350, width: 30, height: 8, velY: 4, color: '#888', range: 150, startY: 350}, {x: 420, y: 180, width: 25, height: 8, velX: 5, color: '#888', range: 180, startX: 420}, {x: 650, y: 120, width: 30, height: 8, velY: -3, color: '#888', range: 120, startY: 120});
            enemies.current.push({x: 230, y: 390, width: 10, height: 10, velX: 4, color: '#8B0000', range: 50, startX: 230}, {x: 350, y: 330, width: 10, height: 10, velX: -5, color: '#8B0000', range: 60, startX: 350}, {x: 470, y: 240, width: 10, height: 10, velX: 4.5, color: '#8B0000', range: 70, startX: 470}, {x: 590, y: 160, width: 10, height: 10, velX: -4, color: '#8B0000', range: 80, startX: 590}, {x: 710, y: 160, width: 10, height: 10, velX: 5, color: '#8B0000', range: 90, startX: 710});
            lava.current.push({x: 225, y: 435, width: 45, height: 15}, {x: 285, y: 435, width: 45, height: 15}, {x: 345, y: 435, width: 45, height: 15}, {x: 405, y: 435, width: 45, height: 15}, {x: 465, y: 435, width: 45, height: 15}, {x: 525, y: 435, width: 45, height: 15}, {x: 585, y: 435, width: 45, height: 15}, {x: 645, y: 435, width: 45, height: 15}, {x: 705, y: 435, width: 45, height: 15});
            teleporters.current.push({x: 300, y: 350, width: 20, height: 20, targetX: 50, targetY: 400}, {x: 500, y: 200, width: 20, height: 20, targetX: 250, targetY: 400});
        }
        
        player.current.x = 50;
        player.current.y = 400;
        player.current.velX = 0;
        player.current.velY = 0;
    }, []);

    const handleDeath = () => {
        gameStateRef.current.running = false;
        setGameState(prev => ({...prev, deaths: prev.deaths + 1 }));
        setIsGameOver(true);
    };

    const startGame = () => {
        gameStateRef.current.running = true;
        setIsPaused(false);
        setIsGameOver(false);
        loadLevel(gameStateRef.current.level);
    };

    const resetGame = () => {
        const initialGameState = {
            running: true,
            level: 1,
            score: 0,
            lives: 1,
            deaths: 0,
        };
        gameStateRef.current = initialGameState;
        setGameState(initialGameState);
        setIsGameOver(false);
        setIsPaused(false);
        loadLevel(1);
    };
    
    const pauseGame = () => {
        setIsPaused(p => !p);
    };

    const gameLoop = useCallback(() => {
        if (gameStateRef.current.running && !isPaused) {
            // Update functions
            const updatePlayer = () => {
                const p = player.current;
                const canvas = canvasRef.current;
                if (!canvas) return;

                if (keys.current['a'] || keys.current['arrowleft']) { p.velX = -p.speed; } 
                else if (keys.current['d'] || keys.current['arrowright']) { p.velX = p.speed; } 
                else { p.velX *= 0.7; }
                
                p.velY += 0.6; // Gravity
                if (p.velY > 15) p.velY = 15;
                
                p.x += p.velX; p.y += p.velY;
                
                if (p.x < 0) p.x = 0;
                if (p.x + p.width > canvas.width) p.x = canvas.width - p.width;
                
                p.onGround = false;
                for (let platform of [...platforms.current, ...movingPlatforms.current]) {
                    if (checkCollision(p, platform)) {
                        if (p.velY >= 0 && p.y + p.height - p.velY <= platform.y + 1) {
                            p.y = platform.y - p.height;
                            p.velY = 0;
                            p.onGround = true;
                            p.jumpsMade = 0;
                        }
                    }
                }
                
                let died = spikes.current.some(s => checkCollision(p, s)) || 
                           lava.current.some(l => checkCollision(p, l)) || 
                           enemies.current.some(e => checkCollision(p, e)) || 
                           p.y > canvas.height;

                for (let teleporter of teleporters.current) {
                    if (checkCollision(p, teleporter)) {
                        p.x = teleporter.targetX;
                        p.y = teleporter.targetY;
                        p.velX = 0;
                        p.velY = 0;
                    }
                }
                
                if (died) {
                    handleDeath();
                }
            };

            const updateMovingElements = () => {
                for (let p of movingPlatforms.current) {
                    if (p.velX) { p.x += p.velX; if (p.x <= p.startX - p.range || p.x >= p.startX + p.range) p.velX *= -1; }
                    if (p.velY) { p.y += p.velY; if (p.y <= p.startY - p.range || p.y >= p.startY + p.range) p.velY *= -1; }
                }
                for (let e of enemies.current) {
                    e.x += e.velX;
                    if (e.x <= e.startX - e.range || e.x >= e.startX + e.range) e.velX *= -1;
                }
            };
            
            const checkGoal = () => {
                if (checkCollision(player.current, goal.current)) {
                    const newLevel = gameStateRef.current.level + 1;
                    const newScore = gameStateRef.current.score + 1000;
            
                    if (newLevel > 3) {
                        alert(`🎉 CONGRATULATIONS! You have defeated the devil! 🎉\nTotal Deaths: ${gameStateRef.current.deaths}`);
                        resetGame();
                    } else {
                         gameStateRef.current = { ...gameStateRef.current, level: newLevel, score: newScore };
                         setGameState(prev => ({...prev, level: newLevel, score: newScore}));
                         loadLevel(newLevel);
                    }
                }
            };

            const draw = () => {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                for (let p of [...platforms.current, ...movingPlatforms.current]) {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.width, p.height);
                    ctx.fillStyle = '#999';
                    ctx.fillRect(p.x, p.y, p.width, 2);
                }

                for (let s of spikes.current) {
                    ctx.fillStyle = '#666'; ctx.beginPath();
                    for (let i = 0; i < s.width; i += 5) {
                        ctx.moveTo(s.x + i, s.y + s.height);
                        ctx.lineTo(s.x + i + 2.5, s.y);
                        ctx.lineTo(s.x + i + 5, s.y + s.height);
                    }
                    ctx.fill();
                }

                for (let l of lava.current) {
                    let grad = ctx.createLinearGradient(0, l.y, 0, l.y + l.height);
                    grad.addColorStop(0, '#FF4500'); grad.addColorStop(1, '#FF0000');
                    ctx.fillStyle = grad;
                    ctx.fillRect(l.x, l.y, l.width, l.height);
                }

                for (let t of teleporters.current) {
                    ctx.fillStyle = '#800080'; ctx.fillRect(t.x, t.y, t.width, t.height);
                    ctx.fillStyle = '#FF00FF'; ctx.fillRect(t.x + 2, t.y + 2, t.width - 4, t.height - 4);
                }

                for (let e of enemies.current) {
                    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.width, e.height);
                    ctx.fillStyle = '#FFFF00'; ctx.fillRect(e.x + 2, e.y + 2, 3, 3);
                    ctx.fillRect(e.x + e.width - 5, e.y + 2, 3, 3);
                }

                const p = player.current;
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(p.x + 3, p.y + 3, 4, 4);
                ctx.fillRect(p.x + p.width - 7, p.y + 3, 4, 4);

                const g = goal.current;
                let grad = ctx.createRadialGradient(g.x + g.width/2, g.y + g.height/2, 0, g.x + g.width/2, g.y + g.height/2, g.width);
                grad.addColorStop(0, '#FF0000'); grad.addColorStop(1, '#8B0000');
                ctx.fillStyle = grad;
                ctx.fillRect(g.x, g.y, g.width, g.height);
            };

            updatePlayer();
            updateMovingElements();
            checkGoal();
            draw();
        }
        gameLoopId.current = requestAnimationFrame(gameLoop);
    }, [isPaused, loadLevel, checkCollision]);

    // Timer initialization and countdown logic
    useEffect(() => {
        // Start the timer when the game component mounts (first time entering the game)
        if (!gameTimer.isActive && !gameTimer.startTime) {
            const now = Date.now();
            setGameTimer({
                startTime: now,
                timeLeft: 600, // 10 minutes
                isActive: true,
                gameEnded: false
            });
        }
    }, []);

    // Timer countdown effect
    useEffect(() => {
        let interval = null;
        
        if (gameTimer.isActive && !gameTimer.gameEnded && gameTimer.startTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - gameTimer.startTime) / 1000);
                const remaining = Math.max(0, 600 - elapsed);
                
                if (remaining <= 0) {
                    // Time's up - end the game
                    setGameTimer(prev => ({
                        ...prev,
                        timeLeft: 0,
                        isActive: false,
                        gameEnded: true
                    }));
                    setIsGameOver(true);
                } else {
                    // Update remaining time
                    setGameTimer(prev => ({
                        ...prev,
                        timeLeft: remaining
                    }));
                }
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameTimer.isActive, gameTimer.startTime, gameTimer.gameEnded, setGameTimer]);

    // Effect for keyboard and game loop setup
    useEffect(() => {
        loadLevel(1);
        gameLoopId.current = requestAnimationFrame(gameLoop);
        
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            keys.current[key] = true;

            if ((key === 'w' || key === 'arrowup' || key === ' ') && canJump.current) {
                if (player.current.jumpsMade < player.current.maxJumps) {
                    player.current.velY = -player.current.jumpPower;
                    player.current.onGround = false;
                    player.current.jumpsMade++;
                    canJump.current = false;
                }
            }
            if (key === 'r') resetGame();
            if (key === ' ') e.preventDefault();
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            keys.current[key] = false;
            if (key === 'w' || key === 'arrowup' || key === ' ') {
                canJump.current = true;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(gameLoopId.current);
        };
    }, [gameLoop, loadLevel]);

    // Effect for Mobile Controls
    useEffect(() => {
        const handleTouch = (key, isPressed, e) => {
            e.preventDefault();
            if (key === 'a' || key === 'd') {
                keys.current[key] = isPressed;
            }
            if (key === ' ') {
                if (isPressed && canJump.current) {
                    if (player.current.jumpsMade < player.current.maxJumps) {
                        player.current.velY = -player.current.jumpPower;
                        player.current.onGround = false;
                        player.current.jumpsMade++;
                        canJump.current = false;
                    }
                } else if (!isPressed) {
                    canJump.current = true;
                }
            }
        };

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnJump = document.getElementById('btnJump');

        if(btnLeft && btnRight && btnJump) {
            const leftStart = (e) => handleTouch('a', true, e);
            const leftEnd = (e) => handleTouch('a', false, e);
            const rightStart = (e) => handleTouch('d', true, e);
            const rightEnd = (e) => handleTouch('d', false, e);
            const jumpStart = (e) => handleTouch(' ', true, e);
            const jumpEnd = (e) => handleTouch(' ', false, e);

            btnLeft.addEventListener('touchstart', leftStart);
            btnLeft.addEventListener('touchend', leftEnd);
            btnRight.addEventListener('touchstart', rightStart);
            btnRight.addEventListener('touchend', rightEnd);
            btnJump.addEventListener('touchstart', jumpStart);
            btnJump.addEventListener('touchend', jumpEnd);

            return () => {
                btnLeft.removeEventListener('touchstart', leftStart);
                btnLeft.removeEventListener('touchend', leftEnd);
                btnRight.removeEventListener('touchstart', rightStart);
                btnRight.removeEventListener('touchend', rightEnd);
                btnJump.removeEventListener('touchstart', jumpStart);
                btnJump.removeEventListener('touchend', jumpEnd);
            };
        }
    }, []);

    return (
        <>
            <style>
                {`
                body {
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(45deg, #000000, #4A0000, #8B0000);
                    font-family: 'Courier New', monospace;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: white;
                }
                canvas {
                    border: 3px solid #FF0000;
                    background: linear-gradient(to bottom, #1a0000, #000000);
                    box-shadow: 0 0 30px rgba(255,0,0,0.5);
                    width: 100%;
                    max-width: 900px;
                    height: auto;
                }
                .controls { margin: 20px 0; text-align: center; }
                .info { margin: 10px 0; font-size: 18px; font-weight: bold; color: #FF6666; text-shadow: 0 0 10px #FF0000; }
                .instructions { margin: 10px 0; font-size: 14px; color: #FFB6C1; max-width: 600px; text-align: center; background: rgba(139,0,0,0.3); padding: 15px; border-radius: 10px; border: 1px solid #FF0000; }
                button { padding: 12px 25px; font-size: 16px; margin: 5px; border: 2px solid #FF0000; border-radius: 5px; background: linear-gradient(45deg, #8B0000, #FF0000); color: white; cursor: pointer; transition: all 0.3s; text-shadow: 0 0 5px #000; }
                button:hover { background: linear-gradient(45deg, #FF0000, #FF6666); box-shadow: 0 0 15px #FF0000; }
                .game-over { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(139,0,0,0.9); color: white; padding: 30px; border-radius: 15px; text-align: center; border: 2px solid #FF0000; box-shadow: 0 0 30px #FF0000; z-index: 10; }
                h1 { color: #FF0000; text-shadow: 0 0 20px #FF0000; font-size: 2.5em; margin-bottom: 10px; text-align: center; }
                .death-count { color: #FF4444; font-size: 16px; margin-top: 10px; }
                .warning { background: rgba(255,0,0,0.2); border: 1px solid #FF0000; padding: 10px; margin: 10px 0; border-radius: 5px; animation: pulse 2s infinite; text-align: center; }
                @keyframes pulse { 0% { box-shadow: 0 0 5px #FF0000; } 50% { box-shadow: 0 0 20px #FF0000; } 100% { box-shadow: 0 0 5px #FF0000; } }
                .mobile-controls { display: none; width: 100%; max-width: 900px; margin-top: 15px; justify-content: space-between; align-items: center; padding: 0 10px; box-sizing: border-box; }
                .mobile-controls button { width: 70px; height: 70px; font-size: 2em; border-radius: 50%; background: #8B0000; display: flex; align-items: center; justify-content: center; padding: 0; }
                .mobile-controls .move-controls { display: flex; gap: 20px; }
                @media (max-width: 768px) {
                    body { padding: 10px; }
                    h1 { font-size: 2em; }
                    .instructions { font-size: 12px; max-width: 100%; }
                    #keyboard-instructions { display: none; }
                    .controls { display: flex; flex-wrap: wrap; justify-content: center; }
                    .mobile-controls { display: flex; }
                }
                `}
            </style>

            <h1>👹 DEVIL LEVEL 👹</h1>
            
            <div className="warning">
                <strong>⚠️ WARNING ⚠️</strong><br />
                This game is extremely difficult and may be frustrating!
            </div>
            
            <div className="info">
                <span>Level: <span id="level">{gameState.level}</span></span> | 
                <span>Score: <span id="score">{gameState.score}</span></span> | 
                <span>Lives: <span id="lives">{gameState.lives}</span></span>
            </div>
            
            {/* Game Timer Display */}
            <div className="timer-display" style={{
                background: gameTimer.timeLeft <= 60 ? 'rgba(255,0,0,0.3)' : 'rgba(139,0,0,0.3)',
                border: `2px solid ${gameTimer.timeLeft <= 60 ? '#FF0000' : '#FF6666'}`,
                padding: '10px 20px',
                borderRadius: '10px',
                margin: '10px 0',
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: gameTimer.timeLeft <= 60 ? '#FF4444' : '#FFB6C1',
                textShadow: '0 0 10px #FF0000',
                animation: gameTimer.timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
            }}>
                ⏰ Time Remaining: {Math.floor(gameTimer.timeLeft / 60)}:{(gameTimer.timeLeft % 60).toString().padStart(2, '0')}
                {gameTimer.timeLeft <= 60 && <span style={{ display: 'block', fontSize: '14px', marginTop: '5px' }}>⚠️ HURRY UP! ⚠️</span>}
            </div>
            
            <div className="death-count">
                Deaths: <span id="deaths">{gameState.deaths}</span> 💀
            </div>
            
            <canvas ref={canvasRef} id="gameCanvas" width="900" height="500"></canvas>

            <div className="mobile-controls">
                <div className="move-controls">
                    <button id="btnLeft">◀</button>
                    <button id="btnRight">▶</button>
                </div>
                <button id="btnJump">▲</button>
            </div>
            
            <div className="instructions">
                <span id="keyboard-instructions"><strong>Controls:</strong> WASD or Arrow Keys, SPACE to jump<br /></span>
                <strong>Goal:</strong> Reach the red portal... If you can! 😈<br />
                <strong>Rule:</strong> Jumps are equal to the level number. Good luck.
            </div>
            
            <div className="controls">
                <button onClick={startGame}>Start Game</button>
                <button onClick={pauseGame}>{isPaused ? 'Resume' : 'Pause'}</button>
                <button onClick={resetGame}>Restart</button>
            </div>
            
            {isGameOver && (
                 <div className="game-over" id="gameOver">
                    <h2>💀 YOU DIED! 💀</h2>
                    <p>Your Score: <span>{gameState.score}</span></p>
                    <p>Total Deaths: <span>{gameState.deaths}</span></p>
                    <button onClick={resetGame}>Try Again</button>
                </div>
            )}
        </>
    );
};

export default DevilLevelGame;
