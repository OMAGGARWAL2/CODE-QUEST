/**
 * ==============================================================================
 * CHITKARA TESTPAD - 3-LANE SUBWAY ENDLESS RUNNER ENGINE
 * ==============================================================================
 * High-fidelity 3-Lane Railway Runner Architecture:
 * - 1. TRUE 3-LANE PERSPECTIVE TRACK: Converging perspective, extruded steel rails, wooden sleepers, ballast & signal gantries
 * - 2. DELTA-TIME MOVEMENT & ACCELERATION: 100% framerate-independent, smooth difficulty curve
 * - 3. RESPONSIVE LANE SWITCHING: Spring interpolation, body tilt, dust kickup, swipe & keyboard support
 * - 4. ARCADE JUMP & DOUBLE JUMP: Parabolic gravity, air pose, dynamic ground shadow, landing dust & bounce
 * - 5. HITBOX-ACCURATE SLIDE & DIVE: True collision height reduction, overhead clearance, mid-air dive roll
 * - 6. MULTI-CARRIAGE MOVING TRAINS: Multi-car depth, front locomotive, dual headlights, window glow, relative movement & passing
 * - 7. TRAIN ROOF RUNNING & RAMPS: Smooth ramp climbing, roof surfing, train-to-train hopping & roof drops
 * - 8. PHYSICS-BASED COLLISION ENGINE: Modular depth, lane, horizontal & vertical clearance validation
 * - 9. PROCEDURAL SOLVABLE PATTERNS: Fair obstacle generation, parabolic coin jump arches, power-ups
 * - 10. POWERUPS & HOVERBOARD: Magnet, Super Sneakers, 2X Multiplier, Hoverboard crash shield
 * - 11. DEBUG MODE (F3 / ~): Real-time telemetry & collision wireframe visualization
 * - 12. FULL UI & STORAGE PRESERVATION: Lobby, Me Character Locker, Shop, Daily B-O-L-T, Weekly Hunt, Save Me, Game Over
 * ==============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // GAME ENGINE OBJECT DEFINITION
    // =========================================================================
    const TeacherGame = {
        canvas: null,
        ctx: null,
        container: null,
        viewport: null,
        animFrameId: null,
        lastTime: 0,
        fps: 60,
        fpsTimer: 0,
        frameCount: 0,

        // Game State
        gameState: 'lobby', // 'lobby' | 'countdown' | 'running' | 'save_me' | 'gameover'
        isPaused: false,
        isCountingDown: false,
        countdownVal: 3,
        countdownTimer: 0,
        saveMeRequiredKeys: 1,
        mode: 'challenge',
        currentTheme: 'beach',
        debugMode: false, // Toggled with F3 or ~

        // Settings State
        musicEnabled: true,
        soundEffectsEnabled: true,

        // Wallet & Storage Inventory
        totalCoins: 100,
        totalKeys: 3,
        totalHoverboards: 3,
        scoreBoosters: 0,
        highScore: 0,
        totalDistanceAllTime: 0,
        totalRuns: 0,

        // Daily Challenge (B-O-L-T) & Weekly Hunt (Flamingos)
        dailyWord: ['B', 'O', 'L', 'T'],
        collectedLetters: [false, false, false, false],
        dailyStreakDay: 1,
        weeklyHuntTokens: 0,
        weeklyHuntTarget: 10,

        // Characters Roster
        selectedCharId: 'cipher',
        previewingCharId: 'cipher',
        characters: [
            {
                id: 'cipher',
                name: 'Runner',
                owned: true,
                price: 0,
                priceType: 'coins',
                capColor: '#ef4444',
                vestColor: '#0284c7',
                shirtColor: '#ffffff',
                skinColor: '#fed7aa',
                pantsColor: '#1e293b',
                shoeColor: '#06b6d4'
            },
            {
                id: 'tricky',
                name: 'Blaze',
                owned: false,
                price: 5000,
                priceType: 'coins',
                capColor: '#a855f7',
                vestColor: '#1e293b',
                shirtColor: '#ec4899',
                skinColor: '#fed7aa',
                pantsColor: '#64748b',
                shoeColor: '#a855f7'
            },
            {
                id: 'fresh',
                name: 'Sonic',
                owned: false,
                price: 10000,
                priceType: 'coins',
                capColor: '#22c55e',
                vestColor: '#15803d',
                shirtColor: '#fef08a',
                skinColor: '#a16207',
                pantsColor: '#0f172a',
                shoeColor: '#facc15'
            },
            {
                id: 'spike',
                name: 'Viper',
                owned: false,
                price: 20000,
                priceType: 'coins',
                capColor: '#ef4444',
                vestColor: '#7c3aed',
                shirtColor: '#f97316',
                skinColor: '#fed7aa',
                pantsColor: '#18181b',
                shoeColor: '#ef4444'
            },
            {
                id: 'yutani',
                name: 'Cyber',
                owned: false,
                price: 15,
                priceType: 'keys',
                capColor: '#10b981',
                vestColor: '#059669',
                shirtColor: '#064e3b',
                skinColor: '#6ee7b7',
                pantsColor: '#047857',
                shoeColor: '#34d399'
            }
        ],

        // 3D Perspective Projection Matrix
        width: 960,
        height: 500,
        vanishX: 480, // Symmetrical center vanishing point
        vanishY: 145, // Horizon height
        groundY: 435, // Foreground track ground level
        trackWidthFar: 140, // Far track width at vanishing point
        trackWidthNear: 720, // Wide foreground track spread across 3 parallel lanes
        curveAmount: 0, // Clean, parallel straight tracks converging to vanishing point (Screenshot 3 & 4)

        // Shop Amazon Quantity Selector State
        shopQty: {
            board: 1,
            mystery: 1,
            key: 1
        },

        // Active Run Physics & Acceleration
        baseSpeed: 1.25,
        speed: 1.25,
        maxSpeed: 2.75,
        distance: 0,
        score: 0,
        runCoins: 0,
        runGems: 0,
        gameTime: 0,
        trackScroll: 0,
        trainSpawnTimer: 0,
        lastSpawnDistance: 0,

        // Save Me 30-Second Dial Timer
        saveMeTimer: 30,
        saveMeTimerMax: 30,

        // Hoverboard 15s Shield
        hoverboardActive: false,
        hoverboardTimer: 0,
        hoverboardMaxTime: 15,

        // Active Power-ups System (Bullet / Jetpack, Magnet, Sneakers, 2X)
        activePowerUps: {
            bullet: 0,
            magnet: 0,
            sneakers: 0,
            double: 0,
            dash: 0
        },
        isFlyingBullet: false,

        // Player State & Physics Parameters
        playerDepthZ: 0.88,
        player: {
            currentLane: 1, // 0: Left, 1: Center, 2: Right
            targetLane: 1,
            x: 480,
            targetX: 480,
            y: 420,
            jumpY: 0,
            jumpVy: 0,
            isGrounded: true,
            onTrain: false,
            currentTrain: null,
            trainRoofHeight: 110,
            jumpsRemaining: 2,
            isSliding: false,
            slideTimer: 0,
            slideMaxTime: 0.85,
            runCycle: 0,
            tilt: 0,
            isFlipping: false,
            flipAngle: 0,
            invincibleTimer: 0,
            landingSquash: 0,
            // Hitbox Dimensions
            normalWidth: 36,
            normalHeight: 66,
            slideWidth: 42,
            slideHeight: 22
        },

        // Inspector & Guard Dog Chase Entity (Maintains visible gap behind player)
        guard: {
            active: true,
            distOffset: 180, // Distance behind player (No overlapping/clipping)
            x: 480,
            runCycle: 0
        },

        // World Objects Collections
        obstacles: [],
        coinsList: [],
        powerupsList: [],
        letterPickups: [],
        flamingoPickups: [],
        particles: [],
        confetti: [],
        floatTexts: [],
        sceneryProps: [],

        combo: 1,
        maxCombo: 1,

        // Camera Shake & Polish Hitch
        shakeTimer: 0,
        shakeMagnitude: 0,
        slowMoHitchTimer: 0,

        // Web Audio Synthesizer
        audioCtx: null,
        isMuted: false,

        // Touch gesture tracking
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0
    };

    // =========================================================================
    // AUDIO SYNTHESIZER (WEB AUDIO API)
    // =========================================================================
    TeacherGame.initAudio = function () {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    };

    TeacherGame.playSound = function (type) {
        if (!this.soundEffectsEnabled || this.isMuted || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const now = ctx.currentTime;

            if (type === 'coin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(980, now);
                osc.frequency.exponentialRampToValueAtTime(1470, now + 0.11);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);

            } else if (type === 'jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(760, now + 0.16);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.17);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.17);

            } else if (type === 'double_jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(420, now);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);

            } else if (type === 'super_jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(920, now + 0.14);
                osc.frequency.linearRampToValueAtTime(460, now + 0.25);
                gain.gain.setValueAtTime(0.24, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.27);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.27);

            } else if (type === 'slide') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(420, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);

            } else if (type === 'dodge') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);

            } else if (type === 'powerup') {
                const notes = [440, 554, 659, 880];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                    gain.gain.setValueAtTime(0.2, now + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.24);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.04);
                    osc.stop(now + idx * 0.04 + 0.24);
                });

            } else if (type === 'letter_chime') {
                const notes = [523.25, 659.25, 783.99, 1046.5];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.2, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.3);
                });

            } else if (type === 'hoverboard_on') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.32);

            } else if (type === 'board_shatter') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);

            } else if (type === 'crash') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(360, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);

            } else if (type === 'near_miss') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.12, now);
                gain.linearRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);

            } else if (type === 'bullet_fly') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(450, now + 0.4);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);

            } else if (type === 'free_revive') {
                const notes = [523.25, 659.25, 783.99, 1046.5];
                notes.forEach((f, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.2, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.3);
                });
            }
        } catch (e) { }
    };

    // =========================================================================
    // STORAGE & PERSISTENCE
    // =========================================================================
    TeacherGame.loadStorage = function () {
        try {
            const savedHighScore = localStorage.getItem('testpad_subway_highscore');
            if (savedHighScore !== null) this.highScore = parseInt(savedHighScore, 10) || 0;

            const savedCoins = localStorage.getItem('testpad_subway_coins');
            if (savedCoins !== null) this.totalCoins = parseInt(savedCoins, 10) || 0;
            else this.totalCoins = 100;

            const savedKeys = localStorage.getItem('testpad_subway_keys');
            if (savedKeys !== null) this.totalKeys = parseInt(savedKeys, 10) || 0;
            else this.totalKeys = 3;

            const savedBoards = localStorage.getItem('testpad_subway_boards');
            if (savedBoards !== null) this.totalHoverboards = parseInt(savedBoards, 10) || 0;
            else this.totalHoverboards = 3;

            const savedBoosters = localStorage.getItem('testpad_subway_boosters');
            if (savedBoosters !== null) this.scoreBoosters = parseInt(savedBoosters, 10) || 0;

            const savedFlamingos = localStorage.getItem('testpad_subway_flamingos');
            if (savedFlamingos !== null) this.weeklyHuntTokens = parseInt(savedFlamingos, 10) || 0;

            const savedChar = localStorage.getItem('testpad_subway_selected_char');
            if (savedChar) this.selectedCharId = savedChar;
            this.previewingCharId = this.selectedCharId;

            const savedOwned = localStorage.getItem('testpad_subway_owned_chars');
            if (savedOwned) {
                const ownedList = JSON.parse(savedOwned);
                this.characters.forEach(c => {
                    if (ownedList.includes(c.id)) c.owned = true;
                });
            }

            const savedMusic = localStorage.getItem('testpad_subway_music');
            if (savedMusic !== null) this.musicEnabled = (savedMusic === 'true');

            const savedSfx = localStorage.getItem('testpad_subway_sfx');
            if (savedSfx !== null) this.soundEffectsEnabled = (savedSfx === 'true');
        } catch (e) { }
    };

    TeacherGame.saveStorage = function () {
        try {
            localStorage.setItem('testpad_subway_highscore', this.highScore);
            localStorage.setItem('testpad_subway_coins', this.totalCoins);
            localStorage.setItem('testpad_subway_keys', this.totalKeys);
            localStorage.setItem('testpad_subway_boards', this.totalHoverboards);
            localStorage.setItem('testpad_subway_boosters', this.scoreBoosters);
            localStorage.setItem('testpad_subway_flamingos', this.weeklyHuntTokens);
            localStorage.setItem('testpad_subway_selected_char', this.selectedCharId);
            localStorage.setItem('testpad_subway_music', this.musicEnabled);
            localStorage.setItem('testpad_subway_sfx', this.soundEffectsEnabled);

            const ownedIds = this.characters.filter(c => c.owned).map(c => c.id);
            localStorage.setItem('testpad_subway_owned_chars', JSON.stringify(ownedIds));
        } catch (e) { }
    };

    TeacherGame.getCurrentChar = function () {
        return this.characters.find(c => c.id === this.selectedCharId) || this.characters[0];
    };

    TeacherGame.getPreviewChar = function () {
        return this.characters.find(c => c.id === this.previewingCharId) || this.characters[0];
    };

    // =========================================================================
    // DOM CREATION & UI INITIALIZATION
    // =========================================================================
    TeacherGame.init = function () {
        this.loadStorage();
        this.createDOM();
        this.bindEvents();
        this.initSceneryProps();
    };

    TeacherGame.createDOM = function () {
        if (document.getElementById('teacherGameOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'teacherGameOverlay';
        overlay.className = 'teacher-game-overlay';
        overlay.innerHTML = `
            <div class="teacher-game-modal">
                <!-- Floating In-Game Toast Notifications -->
                <div class="game-toast-container" id="gameToastContainer"></div>

                <!-- Header Bar -->
                <div class="game-modal-header">
                    <div class="game-header-brand">
                        <img src="../TESTPAD_WEBSITE__files/chitkara.png" onerror="this.src='../chitkara_icon.png'; if(!this.complete) this.src='../logo.jpg';" class="game-chitkara-logo" alt="Chitkara" title="Chitkara University">
                    </div>

                    <div class="game-header-controls">
                        <button class="game-ctrl-btn" id="gameSettingsBtn" title="Game Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="game-ctrl-btn game-close-btn" id="gameCloseBtn" title="Close Game (Ctrl+S)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Viewport -->
                <div class="game-viewport" id="gameViewport">
                    <canvas id="teacherGameCanvas" width="960" height="500"></canvas>

                    <!-- Biome Transition Banner -->
                    <div class="game-biome-banner" id="gameBiomeBanner">
                        <span id="bannerText">SUBWAY TRACKS</span>
                    </div>

                    <!-- Countdown 3-2-1 Overlay (Reference Image 1 Replica) -->
                    <div class="game-countdown-overlay" id="gameCountdownOverlay" style="display:none;">
                        <div class="countdown-title">Starting in</div>
                        <div class="countdown-number" id="countdownNum">3</div>
                    </div>

                    <!-- 1. START SCREEN (SUBWAY SURFERS LOBBY) -->
                    <div class="subway-start-overlay" id="subwayStartOverlay">
                        <!-- Top Left Badges -->
                        <div class="start-top-left-icons">
                            <div class="start-icon-box" id="btnOpenMissions" title="Missions">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <div class="start-icon-box" id="btnOpenDaily" title="Daily Challenge">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="start-icon-box" id="btnOpenWeekly" title="Weekly Hunt">
                                <span style="font-size: 1.4rem;">🦩</span>
                            </div>
                        </div>

                        <!-- Top Right Wallet Status & Settings -->
                        <div class="start-top-right-wallet">
                            <div class="start-icon-box" id="btnOpenHoverboardLobby" style="width:38px; height:38px; font-size:1rem;" title="Hoverboard">
                                <i class="fas fa-bolt" style="color:#fde047;"></i>
                            </div>
                            <div class="start-icon-box" id="btnOpenSettingsLobby" style="width:38px; height:38px; font-size:1rem;" title="Settings">
                                <i class="fas fa-cog"></i>
                            </div>
                            <div class="wallet-pill" title="Revive Keys">
                                <i class="fas fa-key wallet-key-icon"></i>
                                <span id="lobbyKeys">3</span>
                            </div>
                            <div class="wallet-pill coins-pill" title="Total Banked Coins">
                                <div class="wallet-coin-dot"></div>
                                <span id="lobbyCoins">100</span>
                                <span style="color:#86efac; font-weight:900; margin-left:2px;">+</span>
                            </div>
                        </div>

                        <!-- Center Press to Play Button -->
                        <div class="start-center-prompt" id="btnStartLobbyGame">
                            <div class="press-to-play-text">Press To Play</div>
                        </div>

                        <!-- Bottom 3 Buttons: TOP RUN, ME, SHOP -->
                        <div class="start-bottom-nav">
                            <button class="subway-arcade-btn btn-top-run" id="btnNavTopRun">
                                <i class="fas fa-trophy" style="font-size: 1.3rem; color: #fde047; margin-bottom: 2px;"></i>
                                <span class="btn-top-run-title">TOP RUN</span>
                            </button>

                            <button class="subway-arcade-btn btn-me" id="btnNavMe">
                                <i class="fas fa-user-ninja" style="font-size: 1.4rem; color: #fed7aa; margin-bottom: 2px;"></i>
                                <span class="btn-me-title">ME</span>
                            </button>

                            <button class="subway-arcade-btn btn-shop" id="btnNavShop">
                                <i class="fas fa-store" style="font-size: 1.4rem; color: #fde047; margin-bottom: 2px;"></i>
                                <span class="btn-shop-title">SHOP</span>
                            </button>
                        </div>
                    </div>

                    <!-- 2. IN-GAME TOP HUD (Reference Image 1 & 2 Replica) -->
                    <div class="game-hud-top" id="inGameHUD" style="display:none;">
                        <!-- Top Left: Blue Square Pause Button & Weekly Hunt Token Pill -->
                        <div class="hud-arcade-left">
                            <button class="hud-pause-btn" id="hudPauseBtn" title="Pause Game (P)">
                                <i class="fas fa-pause" id="hudPauseIcon"></i>
                            </button>
                            <div class="hud-quest-pill" id="hudQuestBtn" title="Weekly Hunt">
                                <span style="font-size: 1.1rem;">🦩</span>
                                <span id="hudInGameFlamingo">0/10</span>
                            </div>
                        </div>

                        <!-- Top Right (RHS): Score, Multiplier, Coins & Active Powerup Countdown Chips -->
                        <div class="hud-arcade-right">
                            <div class="hud-score-row">
                                <div class="hud-mult-badge" id="hudMult">x1</div>
                                <div class="hud-score-pill" id="hudScore">000000</div>
                            </div>
                            <div class="hud-coins-pill">
                                <span id="hudRunCoins">0</span>
                                <div class="hud-coin-star">★</div>
                            </div>
                            <!-- Active Power-up Countdown Timers -->
                            <div class="hud-active-powerups-list" id="hudActivePowerups"></div>
                        </div>
                    </div>

                    <!-- In-Game Hoverboard Button (Bottom Left) -->
                    <div class="hud-gadget-box" id="hudHoverboardBtn" style="display:none;" title="Activate Hoverboard (Press H / Space / Click)">
                        <i class="fas fa-bolt"></i>
                        <span class="gadget-counter" id="hudBoardCount">3</span>
                    </div>

                    <!-- 2.5. PAUSE MENU OVERLAY MODAL -->
                    <div class="subway-modal-overlay" id="pauseModalOverlay">
                        <div class="subway-pause-card">
                            <h2 class="pause-comic-title">GAME PAUSED</h2>
                            <div class="pause-stats-row">
                                <div class="pause-stat-chip">
                                    <span class="pause-stat-label">SCORE</span>
                                    <span class="pause-stat-val" id="pauseScoreVal">000000</span>
                                </div>
                                <div class="pause-stat-chip">
                                    <span class="pause-stat-label">DISTANCE</span>
                                    <span class="pause-stat-val" id="pauseDistanceVal">0m</span>
                                </div>
                            </div>
                            <button class="arcade-action-btn btn-resume" id="btnResumeGame">
                                <i class="fas fa-play"></i> RESUME
                            </button>
                            <button class="arcade-action-btn btn-restart" id="btnRestartGame">
                                <i class="fas fa-redo"></i> RESTART
                            </button>
                            <button class="arcade-action-btn btn-pause-settings" id="btnPauseSettings">
                                <i class="fas fa-cog"></i> SETTINGS
                            </button>
                            <button class="arcade-action-btn btn-pause-menu" id="btnPauseBackMenu">
                                <i class="fas fa-home"></i> MAIN MENU
                            </button>
                        </div>
                    </div>

                    <!-- 3. SETTINGS MODAL -->
                    <div class="subway-modal-overlay" id="settingsModalOverlay">
                        <div class="subway-settings-card">
                            <button class="modal-close-bubble-btn" id="btnCloseSettings"><i class="fas fa-times"></i></button>

                            <h2 class="settings-comic-title">Settings</h2>

                            <div class="settings-option-row">
                                <div class="settings-big-toggle-box" id="toggleMusicBtn">
                                    <i class="fas fa-music"></i>
                                </div>
                                <div class="settings-text-desc-col">
                                    <span class="settings-state-title" id="musicStatusText">Music ON</span>
                                    <span class="settings-state-sub">Affects music only</span>
                                </div>
                            </div>

                            <div class="settings-option-row">
                                <div class="settings-big-toggle-box" id="toggleSfxBtn">
                                    <i class="fas fa-volume-up"></i>
                                </div>
                                <div class="settings-text-desc-col">
                                    <span class="settings-state-title" id="sfxStatusText">Sound Effects ON</span>
                                    <span class="settings-state-sub">Affects sound effects only</span>
                                </div>
                            </div>

                            <span class="settings-footer-version">v 2.0 (High-Fidelity 3D)</span>
                        </div>
                    </div>

                    <!-- 4. DAILY CHALLENGE OVERLAY MODAL -->
                    <div class="subway-modal-overlay" id="dailyModalOverlay">
                        <div class="subway-event-card">
                            <button class="modal-close-bubble-btn" id="btnCloseDaily"><i class="fas fa-times"></i></button>

                            <h2 class="event-modal-title">Daily Challenge</h2>

                            <div class="daily-top-row">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <div class="daily-letter-box">
                                        <span class="daily-letter-slot" id="slotB">B</span>
                                        <span class="daily-letter-slot" id="slotO">O</span>
                                        <span class="daily-letter-slot" id="slotL">L</span>
                                        <span class="daily-letter-slot" id="slotT">T</span>
                                    </div>
                                    <span style="font-size:0.85rem; font-weight:800; color:#1e3a8a;">Collect letters on tracks</span>
                                </div>

                                <div class="daily-mystery-graphic">
                                    <i class="fas fa-question"></i>
                                </div>
                            </div>

                            <div class="daily-streak-grid">
                                <div class="daily-streak-col active">
                                    <span class="daily-day-label">Today</span>
                                    <div class="daily-day-icon" style="color:#a855f7;"><i class="fas fa-box-open"></i></div>
                                    <span class="daily-day-reward">Mystery</span>
                                </div>
                                <div class="daily-streak-col">
                                    <span class="daily-day-label">Day 2</span>
                                    <div class="daily-day-icon" style="color:#a855f7;"><i class="fas fa-box-open"></i></div>
                                    <span class="daily-day-reward">Mystery</span>
                                </div>
                                <div class="daily-streak-col">
                                    <span class="daily-day-label">Day 3</span>
                                    <div class="daily-day-icon" style="color:#f59e0b;"><i class="fas fa-coins"></i></div>
                                    <span class="daily-day-reward">🪙 1050</span>
                                </div>
                                <div class="daily-streak-col">
                                    <span class="daily-day-label">Day 4</span>
                                    <div class="daily-day-icon" style="color:#f59e0b;"><i class="fas fa-coins"></i></div>
                                    <span class="daily-day-reward">🪙 1500</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. WEEKLY HUNT OVERLAY MODAL -->
                    <div class="subway-modal-overlay" id="weeklyModalOverlay">
                        <div class="subway-event-card">
                            <button class="modal-close-bubble-btn" id="btnCloseWeekly"><i class="fas fa-times"></i></button>
                            <div class="weekly-header-badge">🦩</div>

                            <h2 class="event-modal-title" style="margin-left:55px; text-align:left;">Weekly Hunt</h2>

                            <div class="weekly-hunt-rows">
                                <div class="weekly-row-card active">
                                    <div class="weekly-info-left">
                                        <div class="weekly-title-row">
                                            <span class="weekly-title-text">WEEK 1</span>
                                            <span style="font-size:0.75rem; font-weight:800; color:#1e3a8a;"><i class="fas fa-clock"></i> 6 DAYS LEFT</span>
                                        </div>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="font-size:0.8rem; font-weight:800; color:#0f172a;">Collect: 🦩</span>
                                            <div class="weekly-progress-bar-bg" style="flex:1;">
                                                <div class="weekly-progress-bar-fill" id="weeklyBarFill" style="width:0%;"></div>
                                                <span class="weekly-progress-text" id="weeklyProgressText">0 / 10</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="weekly-reward-box">
                                        <i class="fas fa-bolt" style="font-size:1.4rem; color:#fde047;"></i>
                                        <span style="font-family:'Fredoka'; font-weight:900; font-size:0.85rem;">10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. MISSIONS OVERLAY MODAL -->
                    <div class="subway-modal-overlay" id="missionsModalOverlay">
                        <div class="subway-event-card">
                            <button class="modal-close-bubble-btn" id="btnCloseMissions"><i class="fas fa-times"></i></button>
                            <h2 class="event-modal-title">Missions</h2>

                            <div class="missions-list-container">
                                <div class="mission-row-card">
                                    <span style="font-size:0.88rem; font-weight:800; color:#0f172a;">1. Jump over 10 Track Hurdles.</span>
                                </div>
                                <div class="mission-row-card">
                                    <span style="font-size:0.88rem; font-weight:800; color:#0f172a;">2. Slide under 5 Barrier Gantries.</span>
                                </div>
                                <div class="mission-row-card">
                                    <span style="font-size:0.88rem; font-weight:800; color:#0f172a;">3. Surf on 3 Subway Train Roofs.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. SINGLE USE SHOP MODAL -->
                    <div class="subway-modal-overlay" id="shopModalOverlay">
                        <div class="subway-modal-card">
                            <button class="modal-close-bubble-btn" id="btnCloseShop"><i class="fas fa-times"></i></button>

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <button type="button" class="btn-open-coin-store" id="btnOpenCoinStore" style="width:auto; margin:0; padding:6px 14px; font-size:0.9rem;">
                                    <i class="fas fa-coins" style="color:#fde047;"></i> + Get Coins (Amazon Store)
                                </button>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div class="wallet-pill" title="Revive Keys">
                                        <i class="fas fa-key wallet-key-icon"></i>
                                        <span id="shopKeysVal">3</span>
                                    </div>
                                    <div class="wallet-pill coins-pill" id="shopCoinsPill" style="cursor:pointer;" title="Click to Select and Buy Coins!">
                                        <div class="wallet-coin-dot"></div>
                                        <span id="shopCoinsVal">100</span>
                                        <span style="color:#86efac; font-weight:900; margin-left:2px;">+</span>
                                    </div>
                                </div>
                            </div>

                            <h2 class="shop-single-use-title">Single Use</h2>

                            <!-- Hoverboard Row with Amazon Quantity Selector -->
                            <div class="shop-row-card">
                                <div class="shop-row-left">
                                    <div class="shop-icon-frame">
                                        <i class="fas fa-bolt" style="color:#fde047;"></i>
                                    </div>
                                    <div class="shop-item-info">
                                        <span class="shop-item-heading">Hoverboard</span>
                                        <span class="shop-item-sub">Protect yourself from crashing for 15 seconds. Activate with H / B / Double-Tap.</span>
                                        <span class="shop-item-count-text" id="shopBoardCountText">You have: 3</span>
                                    </div>
                                </div>
                                <div class="shop-row-right">
                                    <div class="shop-qty-selector">
                                        <span class="shop-qty-label">Qty</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyBoardMinus">-</button>
                                        <span class="shop-qty-display" id="shopQtyBoard">1</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyBoardPlus">+</button>
                                    </div>
                                    <button class="shop-green-price-btn" id="btnBuyBoard">
                                        <span id="priceBoardTotal">300</span>
                                        <div class="wallet-coin-dot" style="width:16px; height:16px;"></div>
                                        <span class="btn-buy-word">Buy</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Mystery Box Row with Amazon Quantity Selector -->
                            <div class="shop-row-card">
                                <div class="shop-row-left">
                                    <div class="shop-icon-frame" style="background: linear-gradient(180deg, #f59e0b, #ea580c);">
                                        <i class="fas fa-cube" style="color:#ffffff;"></i>
                                    </div>
                                    <div class="shop-item-info">
                                        <span class="shop-item-heading">Mystery Box</span>
                                        <span class="shop-item-sub">Open immediately for surprise coins, hoverboards, or keys!</span>
                                    </div>
                                </div>
                                <div class="shop-row-right">
                                    <div class="shop-qty-selector">
                                        <span class="shop-qty-label">Qty</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyMysteryMinus">-</button>
                                        <span class="shop-qty-display" id="shopQtyMystery">1</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyMysteryPlus">+</button>
                                    </div>
                                    <button class="shop-green-price-btn" id="btnBuyMystery">
                                        <span id="priceMysteryTotal">500</span>
                                        <div class="wallet-coin-dot" style="width:16px; height:16px;"></div>
                                        <span class="btn-buy-word">Buy</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Revive Key Row with Amazon Quantity Selector -->
                            <div class="shop-row-card">
                                <div class="shop-row-left">
                                    <div class="shop-icon-frame" style="background: linear-gradient(180deg, #f59e0b, #d97706);">
                                        <i class="fas fa-key" style="color:#fde047;"></i>
                                    </div>
                                    <div class="shop-item-info">
                                        <span class="shop-item-heading">Revive Key</span>
                                        <span class="shop-item-sub">Save your life and resume your run when crashed.</span>
                                        <span class="shop-item-count-text" id="shopKeyCountText">You have: 3</span>
                                    </div>
                                </div>
                                <div class="shop-row-right">
                                    <div class="shop-qty-selector">
                                        <span class="shop-qty-label">Qty</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyKeyMinus">-</button>
                                        <span class="shop-qty-display" id="shopQtyKey">1</span>
                                        <button type="button" class="shop-qty-btn" id="btnQtyKeyPlus">+</button>
                                    </div>
                                    <button class="shop-green-price-btn" id="btnBuyKey">
                                        <span id="priceKeyTotal">1500</span>
                                        <div class="wallet-coin-dot" style="width:16px; height:16px;"></div>
                                        <span class="btn-buy-word">Buy</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 7b. AMAZON-STYLE COIN STORE MODAL -->
                    <div class="subway-modal-overlay" id="coinStoreModalOverlay">
                        <div class="amazon-coin-store-card">
                            <button class="modal-close-bubble-btn" id="btnCloseCoinStore"><i class="fas fa-times"></i></button>
                            <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
                                <div class="wallet-pill coins-pill">
                                    <div class="wallet-coin-dot"></div>
                                    <span id="amazonCurrentCoins">100</span>
                                </div>
                            </div>
                            <h2 class="amazon-store-title">🛒 Get Coins (Amazon Style)</h2>
                            <p class="amazon-store-sub">Select how many coins you want, then click Buy:</p>

                            <div class="amazon-packs-grid">
                                <div class="amazon-pack-card" data-coins="5000">
                                    <span class="amazon-pack-coins">5,000 🪙</span>
                                    <span class="amazon-pack-name">Starter Pack</span>
                                </div>
                                <div class="amazon-pack-card" data-coins="15000">
                                    <span class="amazon-pack-coins">15,000 🪙</span>
                                    <span class="amazon-pack-name">Runner Pack</span>
                                </div>
                                <div class="amazon-pack-card selected" data-coins="50000">
                                    <span class="amazon-pack-badge">Popular</span>
                                    <span class="amazon-pack-coins">50,000 🪙</span>
                                    <span class="amazon-pack-name">Surfer Vault</span>
                                </div>
                                <div class="amazon-pack-card" data-coins="100000">
                                    <span class="amazon-pack-coins">100,000 🪙</span>
                                    <span class="amazon-pack-name">Jackpot Stash</span>
                                </div>
                            </div>

                            <div class="amazon-custom-box">
                                <div class="amazon-custom-label">
                                    <span>Or Enter Custom Coins:</span>
                                    <span style="color:#16a34a; font-weight:800;">Instant Delivery</span>
                                </div>
                                <div class="amazon-custom-input-row">
                                    <input type="number" class="amazon-coin-input" id="amazonCoinInput" value="50000" min="100" step="500" />
                                </div>
                                <div class="amazon-quick-buttons">
                                    <button type="button" class="amazon-quick-btn" data-add="1000">+1,000</button>
                                    <button type="button" class="amazon-quick-btn" data-add="5000">+5,000</button>
                                    <button type="button" class="amazon-quick-btn" data-add="10000">+10,000</button>
                                    <button type="button" class="amazon-quick-btn" data-add="50000">+50,000</button>
                                </div>
                            </div>

                            <button class="amazon-buy-now-btn" id="btnAmazonBuyCoins">
                                <i class="fas fa-shopping-cart"></i>
                                <span>Buy <span id="amazonBuyQtyDisplay">50,000</span> Coins</span>
                            </button>
                        </div>
                    </div>

                    <!-- 8. ME (CHARACTER LOCKER) MODAL -->
                    <div class="subway-modal-overlay" id="charModalOverlay">
                        <div class="subway-char-card">
                            <button class="modal-close-bubble-btn" id="btnCloseChar"><i class="fas fa-times"></i></button>

                            <div style="display:flex; justify-content:flex-end; align-items:center; gap:8px;">
                                <div class="wallet-pill" title="Revive Keys">
                                    <i class="fas fa-key wallet-key-icon"></i>
                                    <span id="charKeysVal">3</span>
                                </div>
                                <div class="wallet-pill coins-pill" id="charCoinsPill" style="cursor:pointer;" title="Click to Select and Buy Coins!">
                                    <div class="wallet-coin-dot"></div>
                                    <span id="charCoinsVal">100</span>
                                    <span style="color:#86efac; font-weight:900; margin-left:2px;">+</span>
                                </div>
                            </div>

                            <div class="char-top-stage-row">
                                <div class="char-preview-stage">
                                    <canvas id="charPreviewCanvas" width="160" height="180"></canvas>
                                </div>

                                <div class="char-details-panel">
                                    <h3 class="char-name-title" id="charNameDisplay">Runner</h3>

                                    <button class="char-select-main-btn selected" id="charActionBtn">
                                        SELECTED
                                    </button>
                                </div>
                            </div>

                            <div class="char-lineup-carousel" id="charLineupCarousel"></div>
                        </div>
                    </div>

                    <!-- 9. SAVE ME / REVIVE MODAL (Reference Image 3 Replica) -->
                    <div class="subway-modal-overlay" id="saveMeModalOverlay">
                        <div class="subway-saveme-card">
                            <!-- Top-Left Circular Pie Countdown Timer (30s) -->
                            <div class="saveme-timer-dial-box" title="30s Resume Window">
                                <div class="saveme-timer-pie" id="saveMeTimerPie"></div>
                            </div>

                            <!-- Top-Right Available Keys Pill -->
                            <div class="saveme-keys-pill">
                                <i class="fas fa-key" style="color:#60a5fa;"></i>
                                <span id="saveMeCurrentKeysCount">3</span>
                            </div>

                            <!-- Card Title -->
                            <h2 class="saveme-title">Save me!</h2>

                            <!-- Action Buttons -->
                            <div class="saveme-buttons-col">
                                <button class="btn-saveme-free" id="btnSaveMeFree" title="Free Rescue">
                                    <span>Free!</span>
                                    <div class="tv-badge-icon">
                                        <div class="tv-badge-antenna"></div>
                                        <div class="tv-badge-play"></div>
                                    </div>
                                </button>

                                <button class="btn-saveme-keys" id="btnSaveMeKey" title="Resume with Keys">
                                    <span id="saveMeKeysReq">1</span>
                                    <i class="fas fa-key" style="color:#93c5fd; font-size:1.5rem;"></i>
                                </button>
                            </div>

                            <button class="saveme-footer-link" id="btnEndRunNoThanks">
                                No thanks, End Run
                            </button>
                        </div>
                    </div>

                    <!-- 10. GAME OVER SPIRAL NOTEBOOK MODAL (Exact Screenshot Replica) -->
                    <div class="subway-notebook-overlay" id="gameOverModalOverlay">
                        <div class="subway-notebook-wrap">
                            <!-- Spiral Wire Rings Across Top -->
                            <div class="notebook-spiral-header">
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                                <div class="spiral-ring"></div>
                            </div>

                            <!-- White Notebook Paper Sheet -->
                            <div class="notebook-paper-sheet">
                                <!-- Top Right Keys & Coins Pill -->
                                <div class="notebook-top-wallet">
                                    <div class="notebook-wallet-chip">
                                        <i class="fas fa-key" style="color:#38bdf8;"></i>
                                        <span id="goKeysVal">4</span>
                                        <div class="wallet-coin-dot" style="margin-left:4px;"></div>
                                        <span id="goCoinsVal">70</span>
                                    </div>
                                </div>

                                <!-- Hero Row: Character Preview & Score Ticket Box -->
                                <div class="notebook-hero-row">
                                    <div class="notebook-char-preview">
                                        <canvas id="goCharCanvas" width="130" height="140"></canvas>
                                    </div>
                                    <div class="notebook-score-col">
                                        <h3 class="notebook-score-title">★ Score ★</h3>
                                        <div class="notebook-score-ticket" id="gameOverFinalScore">0</div>
                                        <div class="notebook-coins-badge">
                                            <div class="wallet-coin-dot" style="width:16px; height:16px;"></div>
                                            <span id="gameOverCoinsBanked">0</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Top 8 High Scores Leaderboard -->
                                <div class="notebook-leaderboard-wrap" id="goLeaderboardList">
                                    <!-- Populated dynamically based on score -->
                                </div>
                            </div>

                            <!-- Bottom Action Buttons: Menu (Home), Boosts, PLAY -->
                            <div class="notebook-actions-row">
                                <div class="btn-notebook-action-col">
                                    <button class="btn-notebook-square menu-btn" id="btnGameOverBackMenu" title="Main Menu">
                                        <i class="fas fa-home"></i>
                                    </button>
                                    <span class="btn-notebook-label">Menu</span>
                                </div>

                                <div class="btn-notebook-action-col">
                                    <button class="btn-notebook-square boosts-btn" id="btnGameOverBoosts" title="Shop & Boosts">
                                        <i class="fas fa-angle-double-up"></i>
                                    </button>
                                    <span class="btn-notebook-label">Boosts</span>
                                </div>

                                <button class="btn-notebook-play" id="btnPlayAgainGame" title="Play Again (Space/Enter)">
                                    PLAY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.container = overlay;
        this.viewport = document.getElementById('gameViewport');
        this.canvas = document.getElementById('teacherGameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    };

    TeacherGame.resizeCanvas = function () {
        if (!this.canvas) return;
        this.width = 960;
        this.height = 500;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.vanishX = 480;
        this.vanishY = 145;
        this.groundY = 435;
    };

    TeacherGame.initSceneryProps = function () {
        this.sceneryProps = [];
        for (let i = 0; i < 18; i++) {
            this.sceneryProps.push({
                z: (i / 18),
                side: i % 2 === 0 ? -1 : 1,
                type: i % 4
            });
        }
    };

    // =========================================================================
    // 3D PERSPECTIVE PROJECTION MATHEMATICS
    // =========================================================================
    TeacherGame.projectDepth = function (z) {
        // True perspective mapping with logarithmic compression towards horizon
        const clampedZ = Math.max(0, Math.min(1.5, z));
        return (clampedZ * clampedZ * 0.7 + clampedZ * 0.3);
    };

    TeacherGame.getTrackWidth = function (z) {
        const p = this.projectDepth(z);
        return this.trackWidthFar + (this.trackWidthNear - this.trackWidthFar) * p;
    };

    TeacherGame.getLaneWidth = function (z) {
        return this.getTrackWidth(z) / 3;
    };

    TeacherGame.getCurveOffset = function (z) {
        const curve = Math.sin(this.distance * 0.0075) * this.curveAmount;
        const p = (1 - Math.min(1, z));
        return p * p * curve;
    };

    TeacherGame.getLaneX = function (lane, z) {
        const totalW = this.getTrackWidth(z);
        const laneSpacing = totalW / 3;
        const curveX = this.getCurveOffset(z);
        return (this.vanishX + curveX) + (lane - 1) * laneSpacing;
    };

    TeacherGame.getScreenY = function (z) {
        const p = this.projectDepth(z);
        return this.vanishY + (this.groundY - this.vanishY) * p;
    };

    TeacherGame.getScale = function (z) {
        const p = this.projectDepth(z);
        return 0.16 + p * 0.84;
    };

    // =========================================================================
    // EVENT BINDINGS & TOUCH / KEYBOARD CONTROLS
    // =========================================================================
    TeacherGame.bindEvents = function () {
        const self = this;

        // Modal triggers
        const settingsBtnHeader = document.getElementById('gameSettingsBtn');
        const settingsBtnLobby = document.getElementById('btnOpenSettingsLobby');
        const settingsOverlay = document.getElementById('settingsModalOverlay');
        const btnCloseSettings = document.getElementById('btnCloseSettings');

        function openSettingsModal() {
            self.updateSettingsUI();
            if (settingsOverlay) settingsOverlay.classList.add('open');
        }

        if (settingsBtnHeader) settingsBtnHeader.addEventListener('click', openSettingsModal);
        if (settingsBtnLobby) settingsBtnLobby.addEventListener('click', openSettingsModal);
        if (btnCloseSettings && settingsOverlay) {
            btnCloseSettings.addEventListener('click', () => settingsOverlay.classList.remove('open'));
        }

        // Toggles
        const toggleMusicBtn = document.getElementById('toggleMusicBtn');
        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', () => {
                self.musicEnabled = !self.musicEnabled;
                self.saveStorage();
                self.updateSettingsUI();
            });
        }

        const toggleSfxBtn = document.getElementById('toggleSfxBtn');
        if (toggleSfxBtn) {
            toggleSfxBtn.addEventListener('click', () => {
                self.soundEffectsEnabled = !self.soundEffectsEnabled;
                self.saveStorage();
                self.updateSettingsUI();
            });
        }

        const closeBtn = document.getElementById('gameCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => self.close());

        const btnStartLobby = document.getElementById('btnStartLobbyGame');
        if (btnStartLobby) {
            btnStartLobby.addEventListener('click', () => self.startCountdown());
        }

        // Modals & Popups
        const btnOpenDaily = document.getElementById('btnOpenDaily');
        const dailyOverlay = document.getElementById('dailyModalOverlay');
        const btnCloseDaily = document.getElementById('btnCloseDaily');
        if (btnOpenDaily && dailyOverlay) {
            btnOpenDaily.addEventListener('click', () => {
                self.updateDailyUI();
                dailyOverlay.classList.add('open');
            });
        }
        if (btnCloseDaily && dailyOverlay) {
            btnCloseDaily.addEventListener('click', () => dailyOverlay.classList.remove('open'));
        }

        const btnOpenWeekly = document.getElementById('btnOpenWeekly');
        const weeklyOverlay = document.getElementById('weeklyModalOverlay');
        const btnCloseWeekly = document.getElementById('btnCloseWeekly');
        if (btnOpenWeekly && weeklyOverlay) {
            btnOpenWeekly.addEventListener('click', () => {
                self.updateWeeklyUI();
                weeklyOverlay.classList.add('open');
            });
        }
        if (btnCloseWeekly && weeklyOverlay) {
            btnCloseWeekly.addEventListener('click', () => weeklyOverlay.classList.remove('open'));
        }

        const btnOpenMissions = document.getElementById('btnOpenMissions');
        const missionsOverlay = document.getElementById('missionsModalOverlay');
        const btnCloseMissions = document.getElementById('btnCloseMissions');
        if (btnOpenMissions && missionsOverlay) {
            btnOpenMissions.addEventListener('click', () => missionsOverlay.classList.add('open'));
        }
        if (btnCloseMissions && missionsOverlay) {
            btnCloseMissions.addEventListener('click', () => missionsOverlay.classList.remove('open'));
        }

        const btnNavShop = document.getElementById('btnNavShop');
        const shopOverlay = document.getElementById('shopModalOverlay');
        const btnCloseShop = document.getElementById('btnCloseShop');
        if (btnNavShop && shopOverlay) {
            btnNavShop.addEventListener('click', () => {
                self.updateShopUI();
                shopOverlay.classList.add('open');
            });
        }
        if (btnCloseShop && shopOverlay) {
            btnCloseShop.addEventListener('click', () => shopOverlay.classList.remove('open'));
        }

        // Shop Amazon Quantity Steppers
        function updateShopItemQty(item, delta) {
            if (!self.shopQty) self.shopQty = { board: 1, mystery: 1, key: 1 };
            self.shopQty[item] = Math.max(1, Math.min(99, (self.shopQty[item] || 1) + delta));
            self.updateShopUI();
        }

        const btnQtyBoardMinus = document.getElementById('btnQtyBoardMinus');
        const btnQtyBoardPlus = document.getElementById('btnQtyBoardPlus');
        if (btnQtyBoardMinus) btnQtyBoardMinus.addEventListener('click', () => updateShopItemQty('board', -1));
        if (btnQtyBoardPlus) btnQtyBoardPlus.addEventListener('click', () => updateShopItemQty('board', 1));

        const btnQtyMysteryMinus = document.getElementById('btnQtyMysteryMinus');
        const btnQtyMysteryPlus = document.getElementById('btnQtyMysteryPlus');
        if (btnQtyMysteryMinus) btnQtyMysteryMinus.addEventListener('click', () => updateShopItemQty('mystery', -1));
        if (btnQtyMysteryPlus) btnQtyMysteryPlus.addEventListener('click', () => updateShopItemQty('mystery', 1));

        const btnQtyKeyMinus = document.getElementById('btnQtyKeyMinus');
        const btnQtyKeyPlus = document.getElementById('btnQtyKeyPlus');
        if (btnQtyKeyMinus) btnQtyKeyMinus.addEventListener('click', () => updateShopItemQty('key', -1));
        if (btnQtyKeyPlus) btnQtyKeyPlus.addEventListener('click', () => updateShopItemQty('key', 1));

        // Shop item purchases (Zero Chrome Alerts!)
        const btnBuyBoard = document.getElementById('btnBuyBoard');
        if (btnBuyBoard) {
            btnBuyBoard.addEventListener('click', () => {
                const qty = (self.shopQty && self.shopQty.board) ? self.shopQty.board : 1;
                const totalCost = 300 * qty;
                if (self.totalCoins >= totalCost) {
                    self.totalCoins -= totalCost;
                    self.totalHoverboards += qty;
                    self.saveStorage();
                    self.createConfettiExplosion(self.width / 2, self.height / 2);
                    self.updateLobbyUI();
                    self.updateShopUI();
                    self.showToast(`Purchased ${qty} Hoverboard${qty > 1 ? 's' : ''}! ⚡ (Press H / Space)`, 'success', '⚡');
                } else {
                    self.showToast(`Not enough coins! Need ${(totalCost - self.totalCoins).toLocaleString()} more. Click "+ Get Coins" above!`, 'error', '❌');
                }
            });
        }

        const btnBuyKey = document.getElementById('btnBuyKey');
        if (btnBuyKey) {
            btnBuyKey.addEventListener('click', () => {
                const qty = (self.shopQty && self.shopQty.key) ? self.shopQty.key : 1;
                const totalCost = 1500 * qty;
                if (self.totalCoins >= totalCost) {
                    self.totalCoins -= totalCost;
                    self.totalKeys += qty;
                    self.saveStorage();
                    self.createConfettiExplosion(self.width / 2, self.height / 2);
                    self.updateLobbyUI();
                    self.updateShopUI();
                    self.showToast(`Purchased ${qty} Revive Key${qty > 1 ? 's' : ''}! 🔑`, 'success', '🔑');
                } else {
                    self.showToast(`Not enough coins for Revive Keys! Need ${(totalCost - self.totalCoins).toLocaleString()} more. Click "+ Get Coins"`, 'error', '❌');
                }
            });
        }

        const btnBuyMystery = document.getElementById('btnBuyMystery');
        if (btnBuyMystery) {
            btnBuyMystery.addEventListener('click', () => {
                const qty = (self.shopQty && self.shopQty.mystery) ? self.shopQty.mystery : 1;
                const totalCost = 500 * qty;
                if (self.totalCoins >= totalCost) {
                    self.totalCoins -= totalCost;
                    let wonCoins = 0, wonBoards = 0, wonKeys = 0;
                    for (let k = 0; k < qty; k++) {
                        const prizeType = Math.random();
                        if (prizeType < 0.45) {
                            wonCoins += 1000;
                        } else if (prizeType < 0.75) {
                            wonBoards += 2;
                        } else {
                            wonKeys += 1;
                        }
                    }
                    self.totalCoins += wonCoins;
                    self.totalHoverboards += wonBoards;
                    self.totalKeys += wonKeys;
                    self.saveStorage();
                    self.createConfettiExplosion(self.width / 2, self.height / 2);
                    self.updateLobbyUI();
                    self.updateShopUI();

                    const prizes = [];
                    if (wonCoins > 0) prizes.push(`${wonCoins.toLocaleString()} Coins`);
                    if (wonBoards > 0) prizes.push(`${wonBoards} Hoverboards`);
                    if (wonKeys > 0) prizes.push(`${wonKeys} Revive Keys`);
                    self.showToast(`🎁 Opened ${qty} Mystery Box${qty > 1 ? 'es' : ''}!\nWon: ${prizes.join(', ')}!`, 'prize', '🎁');
                } else {
                    self.showToast(`Not enough coins for Mystery Box! Need ${(totalCost - self.totalCoins).toLocaleString()} more. Click "+ Get Coins"`, 'error', '❌');
                }
            });
        }

        // Amazon-Style Coin Store Modal Handlers
        const coinStoreOverlay = document.getElementById('coinStoreModalOverlay');
        const btnOpenCoinStore = document.getElementById('btnOpenCoinStore');
        const shopCoinsPill = document.getElementById('shopCoinsPill');
        const charCoinsPill = document.getElementById('charCoinsPill');
        const btnCloseCoinStore = document.getElementById('btnCloseCoinStore');
        const amazonCoinInput = document.getElementById('amazonCoinInput');
        const amazonBuyQtyDisplay = document.getElementById('amazonBuyQtyDisplay');

        function openCoinStore() {
            if (coinStoreOverlay) {
                const amazonCurrentCoins = document.getElementById('amazonCurrentCoins');
                if (amazonCurrentCoins) amazonCurrentCoins.innerText = self.totalCoins.toLocaleString();
                coinStoreOverlay.classList.add('open');
            }
        }

        if (btnOpenCoinStore) btnOpenCoinStore.addEventListener('click', openCoinStore);
        if (shopCoinsPill) shopCoinsPill.addEventListener('click', openCoinStore);
        if (charCoinsPill) charCoinsPill.addEventListener('click', openCoinStore);
        if (btnCloseCoinStore && coinStoreOverlay) {
            btnCloseCoinStore.addEventListener('click', () => coinStoreOverlay.classList.remove('open'));
        }

        // Pack Cards Click
        const packCards = document.querySelectorAll('.amazon-pack-card');
        packCards.forEach(card => {
            card.addEventListener('click', () => {
                packCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const val = parseInt(card.getAttribute('data-coins')) || 50000;
                if (amazonCoinInput) amazonCoinInput.value = val;
                if (amazonBuyQtyDisplay) amazonBuyQtyDisplay.innerText = val.toLocaleString();
            });
        });

        // Quick increment buttons
        const quickBtns = document.querySelectorAll('.amazon-quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const addVal = parseInt(btn.getAttribute('data-add')) || 1000;
                const currVal = parseInt(amazonCoinInput ? amazonCoinInput.value : 0) || 0;
                const newVal = currVal + addVal;
                if (amazonCoinInput) amazonCoinInput.value = newVal;
                if (amazonBuyQtyDisplay) amazonBuyQtyDisplay.innerText = newVal.toLocaleString();
                packCards.forEach(c => c.classList.remove('selected'));
            });
        });

        if (amazonCoinInput) {
            amazonCoinInput.addEventListener('input', () => {
                const val = parseInt(amazonCoinInput.value) || 0;
                if (amazonBuyQtyDisplay) amazonBuyQtyDisplay.innerText = val.toLocaleString();
                packCards.forEach(c => c.classList.remove('selected'));
            });
        }

        // Amazon Buy Coins button (Instant credit, ZERO alert popups!)
        const btnAmazonBuyCoins = document.getElementById('btnAmazonBuyCoins');
        if (btnAmazonBuyCoins) {
            btnAmazonBuyCoins.addEventListener('click', () => {
                const amount = parseInt(amazonCoinInput ? amazonCoinInput.value : 50000) || 50000;
                if (amount <= 0) {
                    self.showToast('Please select or enter a valid coin amount!', 'error', '❌');
                    return;
                }
                self.totalCoins += amount;
                self.saveStorage();
                self.playSound('coin');
                self.createConfettiExplosion(self.width / 2, self.height / 2);
                self.updateLobbyUI();
                self.updateShopUI();
                self.updateCharLockerUI();
                self.showToast(`Purchased +${amount.toLocaleString()} Coins! 🪙 (Instant Credit)`, 'success', '🪙');
            });
        }

        // Character Locker (Zero Chrome Alerts!)
        const btnNavMe = document.getElementById('btnNavMe');
        const charOverlay = document.getElementById('charModalOverlay');
        const btnCloseChar = document.getElementById('btnCloseChar');
        if (btnNavMe && charOverlay) {
            btnNavMe.addEventListener('click', () => {
                self.previewingCharId = self.selectedCharId;
                self.updateCharLockerUI();
                charOverlay.classList.add('open');
            });
        }
        if (btnCloseChar && charOverlay) {
            btnCloseChar.addEventListener('click', () => charOverlay.classList.remove('open'));
        }

        const charActionBtn = document.getElementById('charActionBtn');
        if (charActionBtn) {
            charActionBtn.addEventListener('click', () => {
                const char = self.getPreviewChar();
                if (char.owned) {
                    self.selectedCharId = char.id;
                    self.saveStorage();
                    self.playSound('powerup');
                    self.updateCharLockerUI();
                } else {
                    if (char.priceType === 'coins') {
                        if (self.totalCoins >= char.price) {
                            self.totalCoins -= char.price;
                            char.owned = true;
                            self.selectedCharId = char.id;
                            self.saveStorage();
                            self.createConfettiExplosion(self.width / 2, self.height / 2);
                            self.updateCharLockerUI();
                            self.updateLobbyUI();
                            self.showToast(`${char.name} Unlocked! 🎉`, 'success', '🎉');
                        } else {
                            self.showToast(`Need ${(char.price - self.totalCoins).toLocaleString()} more coins for ${char.name}! Click "+" on Coins.`, 'error', '❌');
                        }
                    } else if (char.priceType === 'keys') {
                        if (self.totalKeys >= char.price) {
                            self.totalKeys -= char.price;
                            char.owned = true;
                            self.selectedCharId = char.id;
                            self.saveStorage();
                            self.createConfettiExplosion(self.width / 2, self.height / 2);
                            self.updateCharLockerUI();
                            self.updateLobbyUI();
                            self.showToast(`${char.name} Unlocked! 🎉`, 'success', '🎉');
                        } else {
                            self.showToast(`Need ${char.price - self.totalKeys} more Revive Keys for ${char.name}!`, 'error', '❌');
                        }
                    }
                }
            });
        }

        // Hoverboard button
        const boardBtn = document.getElementById('hudHoverboardBtn');
        if (boardBtn) {
            boardBtn.addEventListener('click', () => self.activateHoverboard());
        }

        // Save Me: Free Resume button
        const btnSaveMeFree = document.getElementById('btnSaveMeFree');
        if (btnSaveMeFree) {
            btnSaveMeFree.addEventListener('click', () => self.resumeFromSaveMe('free'));
        }

        // Save Me: Keys Resume button
        const btnSaveMe = document.getElementById('btnSaveMeKey');
        if (btnSaveMe) {
            btnSaveMe.addEventListener('click', () => self.resumeFromSaveMe('key'));
        }

        // End Run
        const btnNoThanks = document.getElementById('btnEndRunNoThanks');
        if (btnNoThanks) {
            btnNoThanks.addEventListener('click', () => self.showGameOverScreen());
        }

        // Play Again
        const btnPlayAgain = document.getElementById('btnPlayAgainGame');
        if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => {
                document.getElementById('gameOverModalOverlay').classList.remove('open');
                self.startCountdown();
            });
        }

        // Back to Menu
        const btnBackMenu = document.getElementById('btnGameOverBackMenu');
        if (btnBackMenu) {
            btnBackMenu.addEventListener('click', () => {
                document.getElementById('gameOverModalOverlay').classList.remove('open');
                self.returnToLobby();
            });
        }

        // Boosts Button (Opens Shop)
        const btnGoBoosts = document.getElementById('btnGameOverBoosts');
        if (btnGoBoosts) {
            btnGoBoosts.addEventListener('click', () => {
                document.getElementById('gameOverModalOverlay').classList.remove('open');
                self.updateShopUI();
                const shopOverlay = document.getElementById('shopModalOverlay');
                if (shopOverlay) shopOverlay.classList.add('open');
            });
        }

        // Pause button
        const pauseBtn = document.getElementById('hudPauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => self.togglePause());
        }

        // Pause Modal Action Buttons
        const btnResume = document.getElementById('btnResumeGame');
        if (btnResume) {
            btnResume.addEventListener('click', () => self.togglePause());
        }

        const btnRestart = document.getElementById('btnRestartGame');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                const pauseModal = document.getElementById('pauseModalOverlay');
                if (pauseModal) pauseModal.classList.remove('open');
                self.isPaused = false;
                self.startCountdown();
            });
        }

        const btnPauseSettings = document.getElementById('btnPauseSettings');
        if (btnPauseSettings) {
            btnPauseSettings.addEventListener('click', () => {
                self.updateSettingsUI();
                const settingsOverlay = document.getElementById('settingsModalOverlay');
                if (settingsOverlay) settingsOverlay.classList.add('open');
            });
        }

        const btnPauseBackMenu = document.getElementById('btnPauseBackMenu');
        if (btnPauseBackMenu) {
            btnPauseBackMenu.addEventListener('click', () => {
                const pauseModal = document.getElementById('pauseModalOverlay');
                if (pauseModal) pauseModal.classList.remove('open');
                self.returnToLobby();
            });
        }

        // Touch & Swipe Controls for Canvas (Mobile / Tablet friendly)
        if (this.canvas) {
            this.canvas.addEventListener('touchstart', function (e) {
                if (e.touches && e.touches[0]) {
                    self.touchStartX = e.touches[0].clientX;
                    self.touchStartY = e.touches[0].clientY;
                    self.touchStartTime = performance.now();
                }
            }, { passive: true });

            this.canvas.addEventListener('touchend', function (e) {
                if (e.changedTouches && e.changedTouches[0]) {
                    const dx = e.changedTouches[0].clientX - self.touchStartX;
                    const dy = e.changedTouches[0].clientY - self.touchStartY;
                    const dt = performance.now() - self.touchStartTime;
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);

                    // Quick double-tap or tap -> Hoverboard
                    if (absDx < 15 && absDy < 15 && dt < 250) {
                        self.activateHoverboard();
                        return;
                    }

                    if (Math.max(absDx, absDy) > 25) {
                        if (absDx > absDy) {
                            if (dx > 0) self.moveRight();
                            else self.moveLeft();
                        } else {
                            if (dy > 0) self.slide();
                            else self.jump();
                        }
                    }
                }
            }, { passive: true });
        }

        // Keyboard Controls
        window.addEventListener('keydown', function (e) {
            // Hotkey to close modal: Ctrl+S
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
                if (self.container && self.container.classList.contains('active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.close();
                    return;
                }
            }

            // Developer Debug Mode toggle: F3 or Backquote (~)
            if (e.code === 'F3' || e.code === 'Backquote') {
                e.preventDefault();
                self.debugMode = !self.debugMode;
                return;
            }

            if (!self.container || !self.container.classList.contains('active')) return;

            if (self.gameState === 'lobby') {
                if (e.code === 'Tab' || e.key === 'Tab' || e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    e.stopPropagation();
                    self.startCountdown();
                    return;
                }
            } else if (self.gameState === 'gameover') {
                if (e.code === 'Tab' || e.key === 'Tab' || e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('gameOverModalOverlay').classList.remove('open');
                    self.startCountdown();
                    return;
                }
            }

            if (self.gameState === 'running') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                    e.preventDefault();
                    self.moveLeft();
                } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                    e.preventDefault();
                    self.moveRight();
                } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                    e.preventDefault();
                    self.jump();
                } else if (e.code === 'ArrowDown' || (!e.ctrlKey && !e.metaKey && e.code === 'KeyS')) {
                    e.preventDefault();
                    self.slide();
                } else if (e.code === 'KeyH' || e.code === 'KeyB') {
                    e.preventDefault();
                    self.activateHoverboard();
                } else if (e.code === 'KeyP') {
                    e.preventDefault();
                    self.togglePause();
                }
            }
        }, true);
    };

    TeacherGame.updateSettingsUI = function () {
        const musicBox = document.getElementById('toggleMusicBtn');
        const sfxBox = document.getElementById('toggleSfxBtn');
        const musicText = document.getElementById('musicStatusText');
        const sfxText = document.getElementById('sfxStatusText');

        if (musicBox && musicText) {
            if (this.musicEnabled) {
                musicBox.classList.remove('off');
                musicText.innerText = 'Music ON';
            } else {
                musicBox.classList.add('off');
                musicText.innerText = 'Music OFF';
            }
        }

        if (sfxBox && sfxText) {
            if (this.soundEffectsEnabled) {
                sfxBox.classList.remove('off');
                sfxText.innerText = 'Sound Effects ON';
            } else {
                sfxBox.classList.add('off');
                sfxText.innerText = 'Sound Effects OFF';
            }
        }
    };

    TeacherGame.updateLobbyUI = function () {
        const lobbyKeys = document.getElementById('lobbyKeys');
        const lobbyCoins = document.getElementById('lobbyCoins');
        if (lobbyKeys) lobbyKeys.innerText = this.totalKeys;
        if (lobbyCoins) lobbyCoins.innerText = this.totalCoins.toLocaleString();
    };

    TeacherGame.updateDailyUI = function () {
        const slots = ['slotB', 'slotO', 'slotL', 'slotT'];
        this.collectedLetters.forEach((col, idx) => {
            const el = document.getElementById(slots[idx]);
            if (el) {
                if (col) el.classList.add('collected');
                else el.classList.remove('collected');
            }
        });
    };

    TeacherGame.updateWeeklyUI = function () {
        const fill = document.getElementById('weeklyBarFill');
        const text = document.getElementById('weeklyProgressText');
        const pct = Math.min(100, (this.weeklyHuntTokens / this.weeklyHuntTarget) * 100);
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.innerText = `${this.weeklyHuntTokens} / ${this.weeklyHuntTarget}`;
    };

    TeacherGame.updateShopUI = function () {
        if (!this.shopQty) this.shopQty = { board: 1, mystery: 1, key: 1 };

        const shopKeysVal = document.getElementById('shopKeysVal');
        const shopCoinsVal = document.getElementById('shopCoinsVal');
        const shopBoardCountText = document.getElementById('shopBoardCountText');
        const shopKeyCountText = document.getElementById('shopKeyCountText');

        if (shopKeysVal) shopKeysVal.innerText = this.totalKeys;
        if (shopCoinsVal) shopCoinsVal.innerText = this.totalCoins.toLocaleString();
        if (shopBoardCountText) shopBoardCountText.innerText = `You have: ${this.totalHoverboards}`;
        if (shopKeyCountText) shopKeyCountText.innerText = `You have: ${this.totalKeys}`;

        // Update Amazon Quantity Selectors & Totals
        const qtyBoardEl = document.getElementById('shopQtyBoard');
        const priceBoardTotalEl = document.getElementById('priceBoardTotal');
        if (qtyBoardEl) qtyBoardEl.innerText = this.shopQty.board;
        if (priceBoardTotalEl) priceBoardTotalEl.innerText = (300 * this.shopQty.board).toLocaleString();

        const qtyMysteryEl = document.getElementById('shopQtyMystery');
        const priceMysteryTotalEl = document.getElementById('priceMysteryTotal');
        if (qtyMysteryEl) qtyMysteryEl.innerText = this.shopQty.mystery;
        if (priceMysteryTotalEl) priceMysteryTotalEl.innerText = (500 * this.shopQty.mystery).toLocaleString();

        const qtyKeyEl = document.getElementById('shopQtyKey');
        const priceKeyTotalEl = document.getElementById('priceKeyTotal');
        if (qtyKeyEl) qtyKeyEl.innerText = this.shopQty.key;
        if (priceKeyTotalEl) priceKeyTotalEl.innerText = (1500 * this.shopQty.key).toLocaleString();

        // Update Coin Store Current Balance
        const amazonCurrentCoins = document.getElementById('amazonCurrentCoins');
        if (amazonCurrentCoins) amazonCurrentCoins.innerText = this.totalCoins.toLocaleString();
    };

    TeacherGame.showToast = function (message, type = 'info', icon = null) {
        const container = document.getElementById('gameToastContainer');
        if (!container) return;

        let defaultIcon = 'fa-info-circle';
        if (type === 'success') defaultIcon = 'fa-check-circle';
        else if (type === 'error') defaultIcon = 'fa-exclamation-circle';
        else if (type === 'prize') defaultIcon = 'fa-gift';
        else if (type === 'coin') defaultIcon = 'fa-coins';

        const toast = document.createElement('div');
        toast.className = `game-toast-notification toast-${type}`;

        const iconHtml = icon ? `<span class="toast-custom-icon">${icon}</span>` : `<i class="fas ${defaultIcon}"></i>`;
        toast.innerHTML = `
            <div class="toast-icon-wrap">${iconHtml}</div>
            <div class="toast-msg-text">${message.replace(/\n/g, '<br>')}</div>
        `;

        container.appendChild(toast);

        // Audio feedback
        if (type === 'success' || type === 'prize') {
            this.playSound('powerup');
        } else if (type === 'error') {
            this.playSound('hit');
        }

        // Auto remove
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 350);
        }, 2600);
    };

    TeacherGame.updateCharLockerUI = function () {
        document.getElementById('charKeysVal').innerText = this.totalKeys;
        document.getElementById('charCoinsVal').innerText = this.totalCoins.toLocaleString();

        const previewChar = this.getPreviewChar();
        const isSelected = (this.selectedCharId === previewChar.id);

        document.getElementById('charNameDisplay').innerText = previewChar.name;
        const actionBtn = document.getElementById('charActionBtn');

        if (isSelected) {
            actionBtn.className = 'char-select-main-btn selected';
            actionBtn.innerText = 'SELECTED';
        } else if (previewChar.owned) {
            actionBtn.className = 'char-select-main-btn select-ready';
            actionBtn.innerText = 'SELECT';
        } else {
            actionBtn.className = 'char-select-main-btn buy-ready';
            if (previewChar.priceType === 'keys') {
                actionBtn.innerHTML = `<i class="fas fa-key" style="color:#fde047;"></i> ${previewChar.price} KEYS`;
            } else {
                actionBtn.innerHTML = `<div class="wallet-coin-dot" style="width:16px; height:16px;"></div> ${previewChar.price.toLocaleString()}`;
            }
        }

        const carousel = document.getElementById('charLineupCarousel');
        if (carousel) {
            let html = '';
            this.characters.forEach(c => {
                const isActive = (c.id === previewChar.id);
                const isCurrentSelected = (c.id === this.selectedCharId);
                html += `
                    <div class="char-thumb-slot ${isActive ? 'active' : ''}" data-id="${c.id}">
                        <div class="char-thumb-icon" style="color:${c.capColor};">
                            <i class="fas fa-user-ninja"></i>
                        </div>
                        <span style="font-size:0.65rem; font-weight:800; color:#0f172a; margin-top:2px;">${c.name}</span>
                        ${isCurrentSelected ? '<div class="char-thumb-check"><i class="fas fa-check"></i></div>' : ''}
                        ${!c.owned ? '<div class="char-thumb-lock"><i class="fas fa-lock"></i></div>' : ''}
                    </div>
                `;
            });
            carousel.innerHTML = html;

            carousel.querySelectorAll('.char-thumb-slot').forEach(slot => {
                slot.addEventListener('click', () => {
                    const charId = slot.getAttribute('data-id');
                    this.previewingCharId = charId;
                    this.updateCharLockerUI();
                });
            });
        }

        this.renderCharPreviewCanvas(previewChar);
    };

    TeacherGame.renderCharPreviewCanvas = function (char) {
        const pCanvas = document.getElementById('charPreviewCanvas');
        if (!pCanvas) return;
        const pctx = pCanvas.getContext('2d');
        pctx.clearRect(0, 0, pCanvas.width, pCanvas.height);

        pctx.save();
        pctx.translate(80, 150);

        // 3D Shadow
        pctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        pctx.beginPath();
        pctx.ellipse(0, 4, 32, 10, 0, 0, Math.PI * 2);
        pctx.fill();

        // 3D Legs
        pctx.fillStyle = char.pantsColor;
        pctx.fillRect(-13, -48, 10, 38);
        pctx.fillRect(3, -48, 10, 38);

        // Shoes with white soles
        pctx.fillStyle = char.shoeColor;
        pctx.fillRect(-15, -10, 13, 8);
        pctx.fillRect(2, -10, 13, 8);
        pctx.fillStyle = '#ffffff';
        pctx.fillRect(-15, -4, 13, 3);
        pctx.fillRect(2, -4, 13, 3);

        // Torso & Hoodie
        pctx.fillStyle = char.shirtColor;
        pctx.beginPath();
        pctx.roundRect(-20, -90, 40, 46, [8, 8, 4, 4]);
        pctx.fill();

        pctx.fillStyle = char.vestColor;
        pctx.fillRect(-20, -88, 11, 42);
        pctx.fillRect(9, -88, 11, 42);

        // Head & Cap
        pctx.fillStyle = char.skinColor;
        pctx.beginPath();
        pctx.arc(0, -104, 17, 0, Math.PI * 2);
        pctx.fill();

        pctx.fillStyle = char.capColor;
        pctx.beginPath();
        pctx.arc(0, -108, 18, Math.PI * 0.7, Math.PI * 2.3);
        pctx.fill();
        pctx.fillRect(-20, -108, 12, 5);

        // Spray can
        pctx.fillStyle = '#38bdf8';
        pctx.fillRect(22, -60, 9, 18);
        pctx.fillStyle = '#ffffff';
        pctx.fillRect(24, -64, 5, 4);

        pctx.restore();
    };

    TeacherGame.open = function () {
        this.initAudio();
        this.loadStorage();
        this.resizeCanvas();
        this.container.classList.add('active');
        this.returnToLobby();
    };

    TeacherGame.close = function () {
        this.gameState = 'lobby';
        this.isCountingDown = false;
        this.isPaused = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.container) {
            this.container.classList.remove('active');
        }
    };

    TeacherGame.returnToLobby = function () {
        this.gameState = 'lobby';
        this.isPaused = false;
        this.isCountingDown = false;

        document.getElementById('subwayStartOverlay').style.display = 'flex';
        document.getElementById('inGameHUD').style.display = 'none';
        document.getElementById('hudHoverboardBtn').style.display = 'none';
        document.getElementById('settingsModalOverlay').classList.remove('open');
        document.getElementById('dailyModalOverlay').classList.remove('open');
        document.getElementById('weeklyModalOverlay').classList.remove('open');
        document.getElementById('missionsModalOverlay').classList.remove('open');
        document.getElementById('shopModalOverlay').classList.remove('open');
        document.getElementById('charModalOverlay').classList.remove('open');
        document.getElementById('saveMeModalOverlay').classList.remove('open');
        document.getElementById('gameOverModalOverlay').classList.remove('open');
        const pauseModal1 = document.getElementById('pauseModalOverlay');
        if (pauseModal1) pauseModal1.classList.remove('open');

        this.updateLobbyUI();
        this.draw();
    };

    TeacherGame.activateHoverboard = function () {
        if (this.gameState !== 'running' || this.hoverboardActive) return;
        if (this.totalHoverboards > 0) {
            this.totalHoverboards--;
            this.hoverboardActive = true;
            this.hoverboardTimer = this.hoverboardMaxTime;
            this.playSound('hoverboard_on');
            this.createFloatingText(this.player.x, this.player.y - 65, 'HOVERBOARD ON! (15s)', '#0284c7');
            this.createDustParticles(this.player.x, this.player.y + 10, 20, '#38bdf8');
            this.saveStorage();

            const boardBtn = document.getElementById('hudHoverboardBtn');
            if (boardBtn) boardBtn.classList.add('active');
            this.updateInGameHUD();
        } else {
            this.createFloatingText(this.player.x, this.player.y - 65, 'NO BOARDS! BUY IN SHOP', '#ef4444');
        }
    };

    TeacherGame.startCountdown = function () {
        this.initAudio();
        this.resetRun();

        document.getElementById('subwayStartOverlay').style.display = 'none';
        document.getElementById('settingsModalOverlay').classList.remove('open');
        document.getElementById('dailyModalOverlay').classList.remove('open');
        document.getElementById('weeklyModalOverlay').classList.remove('open');
        document.getElementById('missionsModalOverlay').classList.remove('open');
        document.getElementById('shopModalOverlay').classList.remove('open');
        document.getElementById('charModalOverlay').classList.remove('open');
        document.getElementById('saveMeModalOverlay').classList.remove('open');
        document.getElementById('gameOverModalOverlay').classList.remove('open');
        const pauseModal2 = document.getElementById('pauseModalOverlay');
        if (pauseModal2) pauseModal2.classList.remove('open');

        this.gameState = 'countdown';
        this.isCountingDown = true;
        this.countdownVal = 3;
        this.countdownTimer = 0;

        const countdownOverlay = document.getElementById('gameCountdownOverlay');
        const countdownNum = document.getElementById('countdownNum');
        if (countdownOverlay && countdownNum) {
            countdownOverlay.style.display = 'flex';
            countdownNum.innerText = '3';
        }
        this.playSound('coin');

        this.lastTime = performance.now();
        this.loop(this.lastTime);
    };

    TeacherGame.resetRun = function () {
        this.score = 0;
        this.runCoins = 0;
        this.runGems = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.speed = this.baseSpeed;
        this.trainSpawnTimer = 0;
        this.lastSpawnDistance = 0;
        this.combo = 1;
        this.isPaused = false;
        this.slowMoHitchTimer = 0;
        this.shakeTimer = 0;
        this.trackScroll = 0;
        this.hoverboardActive = false;
        this.hoverboardTimer = 0;
        this.saveMeRequiredKeys = 1;

        this.activePowerUps.bullet = 0;
        this.activePowerUps.magnet = 0;
        this.activePowerUps.sneakers = 0;
        this.activePowerUps.double = 0;
        this.activePowerUps.dash = 0;
        this.isFlyingBullet = false;

        this.player.currentLane = 1;
        this.player.targetLane = 1;
        this.player.x = 480;
        this.player.targetX = 480;
        this.player.y = 420;
        this.player.jumpY = 0;
        this.player.jumpVy = 0;
        this.player.isGrounded = true;
        this.player.onTrain = false;
        this.player.currentTrain = null;
        this.player.trainRoofHeight = 110;
        this.player.jumpsRemaining = 2;
        this.player.isSliding = false;
        this.player.slideTimer = 0;
        this.player.runCycle = 0;
        this.player.tilt = 0;
        this.player.invincibleTimer = 0;
        this.player.landingSquash = 0;

        this.guard.distOffset = 180;
        this.guard.x = 480;
        this.guard.runCycle = 0;

        this.obstacles = [];
        this.coinsList = [];
        this.powerupsList = [];
        this.letterPickups = [];
        this.flamingoPickups = [];
        this.particles = [];
        this.confetti = [];
        this.floatTexts = [];
    };

    // =========================================================================
    // PLAYER CONTROLS & LOCOMOTION
    // =========================================================================
    TeacherGame.moveLeft = function () {
        if (this.gameState !== 'running' || this.isPaused) return;
        if (this.player.targetLane > 0) {
            this.player.targetLane--;
            this.player.currentLane = this.player.targetLane;
            this.playSound('dodge');
            this.createDustParticles(this.player.x, this.player.y - this.player.jumpY + 5, 8, '#facc15');
        }
    };

    TeacherGame.moveRight = function () {
        if (this.gameState !== 'running' || this.isPaused) return;
        if (this.player.targetLane < 2) {
            this.player.targetLane++;
            this.player.currentLane = this.player.targetLane;
            this.playSound('dodge');
            this.createDustParticles(this.player.x, this.player.y - this.player.jumpY + 5, 8, '#facc15');
        }
    };

    TeacherGame.jump = function () {
        if (this.gameState !== 'running' || this.isPaused) return;
        const isSneakers = this.activePowerUps.sneakers > 0;
        const jumpImpulse = isSneakers ? -1080 : -880;

        if (this.player.isGrounded) {
            this.player.jumpVy = jumpImpulse;
            this.player.isGrounded = false;
            this.player.isSliding = false;
            if (isSneakers) {
                this.playSound('super_jump');
                this.createDustParticles(this.player.x, this.player.y - this.player.jumpY + 10, 20, '#facc15');
            } else {
                this.playSound('jump');
                this.createDustParticles(this.player.x, this.player.y - this.player.jumpY + 10, 14, '#ffffff');
            }
            this.player.jumpsRemaining = 1;
        } else if (this.player.jumpsRemaining > 0) {
            // Second jump / aerial double jump boost
            this.player.jumpVy = isSneakers ? -980 : -780;
            this.player.isFlipping = true;
            this.player.flipAngle = 0;
            this.playSound('double_jump');
            this.createDustParticles(this.player.x, this.player.y - this.player.jumpY, 18, '#38bdf8');
            this.player.jumpsRemaining--;
        }
    };

    TeacherGame.slide = function () {
        if (this.gameState !== 'running' || this.isPaused) return;
        if (!this.player.isGrounded) {
            // Mid-air fast descent / ground slam dive roll
            this.player.jumpVy = 1450;
            this.createDustParticles(this.player.x, this.player.y - this.player.jumpY, 10, '#f59e0b');
        }
        this.player.isSliding = true;
        this.player.slideTimer = this.player.slideMaxTime;
        this.playSound('slide');
        this.createDustParticles(this.player.x, this.player.y - this.player.jumpY + 10, 14, '#fbbf24');
    };

    TeacherGame.togglePause = function () {
        if (this.gameState !== 'running') return;
        this.isPaused = !this.isPaused;
        const pauseIcon = document.getElementById('hudPauseIcon');
        const pauseModal = document.getElementById('pauseModalOverlay');
        const pauseScore = document.getElementById('pauseScoreVal');
        const pauseDist = document.getElementById('pauseDistanceVal');

        if (this.isPaused) {
            if (pauseIcon) { pauseIcon.classList.remove('fa-pause'); pauseIcon.classList.add('fa-play'); }
            if (pauseScore) pauseScore.innerText = this.score.toString().padStart(6, '0');
            if (pauseDist) pauseDist.innerText = Math.floor(this.distance) + 'm';
            if (pauseModal) pauseModal.classList.add('open');
        } else {
            if (pauseIcon) { pauseIcon.classList.remove('fa-play'); pauseIcon.classList.add('fa-pause'); }
            if (pauseModal) pauseModal.classList.remove('open');
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    };

    TeacherGame.handleCrash = function () {
        if (this.hoverboardActive) {
            this.hoverboardActive = false;
            this.hoverboardTimer = 0;
            this.playSound('board_shatter');
            this.shakeTimer = 0.38;
            this.shakeMagnitude = 8;
            this.player.invincibleTimer = 2.0;
            this.createFloatingText(this.player.x, this.player.y - 65, 'HOVERBOARD SAVED YOU!', '#10b981');
            this.createConfettiExplosion(this.player.x, this.player.y);

            const boardBtn = document.getElementById('hudHoverboardBtn');
            if (boardBtn) boardBtn.classList.remove('active');
            return;
        }

        this.playSound('crash');
        this.shakeTimer = 0.45;
        this.shakeMagnitude = 12;
        this.gameState = 'save_me';
        this.saveMeTimer = this.saveMeTimerMax;

        const saveMeOverlay = document.getElementById('saveMeModalOverlay');
        const currentKeys = document.getElementById('saveMeCurrentKeysCount');
        const reqVal = document.getElementById('saveMeKeysReq');
        if (currentKeys) currentKeys.innerText = this.totalKeys;
        if (reqVal) reqVal.innerText = this.saveMeRequiredKeys;
        if (saveMeOverlay) saveMeOverlay.classList.add('open');
    };

    TeacherGame.updateSaveMeTimer = function (dt) {
        this.saveMeTimer -= dt;
        const pie = document.getElementById('saveMeTimerPie');
        if (pie) {
            const pct = Math.max(0, this.saveMeTimer / this.saveMeTimerMax);
            const deg = Math.floor(pct * 360);
            pie.style.background = `conic-gradient(#0284c7 ${deg}deg, #e2e8f0 0deg)`;
        }
        if (this.saveMeTimer <= 0) {
            this.showGameOverScreen();
        }
    };

    TeacherGame.resumeFromSaveMe = function (type) {
        if (type === 'key') {
            if (this.totalKeys >= this.saveMeRequiredKeys) {
                this.totalKeys -= this.saveMeRequiredKeys;
                this.saveMeRequiredKeys *= 2;
            }
        }
        this.saveStorage();

        document.getElementById('saveMeModalOverlay').classList.remove('open');
        this.gameState = 'running';
        this.player.invincibleTimer = 2.5;
        this.obstacles = this.obstacles.filter(obs => obs.z > 0.45);
        this.playSound(type === 'free' ? 'free_revive' : 'powerup');
        this.createFloatingText(this.player.x, this.player.y - 65, type === 'free' ? 'FREE RESCUE! 📺' : 'REVIVED WITH KEY! 🔑', '#22c55e');
        this.createConfettiExplosion(this.player.x, this.player.y);

        this.updateInGameHUD();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    };

    TeacherGame.createBulletParticles = function (x, y) {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x - 12 + (Math.random() - 0.5) * 6,
                y: y,
                vx: (Math.random() - 0.5) * 35,
                vy: 140 + Math.random() * 80,
                size: Math.random() * 7 + 4,
                color: Math.random() < 0.6 ? '#f97316' : '#fde047',
                alpha: 1, life: 0.25
            });
            this.particles.push({
                x: x + 12 + (Math.random() - 0.5) * 6,
                y: y,
                vx: (Math.random() - 0.5) * 35,
                vy: 140 + Math.random() * 80,
                size: Math.random() * 7 + 4,
                color: Math.random() < 0.6 ? '#f97316' : '#fde047',
                alpha: 1, life: 0.25
            });
        }
        if (Math.random() < 0.4) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 24,
                y: y + 8,
                vx: (Math.random() - 0.5) * 40,
                vy: 70 + Math.random() * 50,
                size: Math.random() * 10 + 6,
                color: 'rgba(241, 245, 249, 0.7)',
                alpha: 0.7, life: 0.35
            });
        }
    };

    TeacherGame.showGameOverScreen = function () {
        this.gameState = 'gameover';
        const saveMeModal = document.getElementById('saveMeModalOverlay');
        if (saveMeModal) saveMeModal.classList.remove('open');

        this.totalCoins += this.runCoins;
        this.totalRuns++;
        this.totalDistanceAllTime += Math.floor(this.distance);

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        this.saveStorage();

        // 1. Update Keys & Coins pill on notebook page
        const goKeysVal = document.getElementById('goKeysVal');
        const goCoinsVal = document.getElementById('goCoinsVal');
        if (goKeysVal) goKeysVal.innerText = this.totalKeys;
        if (goCoinsVal) goCoinsVal.innerText = this.totalCoins.toLocaleString();

        // 2. Update Score & Run Coins on notebook page
        const finalScore = document.getElementById('gameOverFinalScore');
        const coinsBanked = document.getElementById('gameOverCoinsBanked');
        if (finalScore) finalScore.innerText = this.score.toLocaleString();
        if (coinsBanked) coinsBanked.innerText = this.runCoins.toLocaleString();

        // 3. Draw standing character on #goCharCanvas
        this.drawGameOverCharacter();

        // 4. Populate Top 8 High Scores Leaderboard
        this.renderGameOverLeaderboard();

        const gameOverOverlay = document.getElementById('gameOverModalOverlay');
        if (gameOverOverlay) gameOverOverlay.classList.add('open');
    };

    TeacherGame.drawGameOverCharacter = function () {
        const canvas = document.getElementById('goCharCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const char = this.getCurrentChar();
        ctx.save();
        ctx.translate(65, 128);

        // Ground shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Standing Legs
        ctx.fillStyle = char.pantsColor || '#2563eb';
        ctx.fillRect(-14, -36, 10, 36);
        ctx.fillRect(4, -36, 10, 36);

        // Sneakers with green/red accents
        ctx.fillStyle = char.shoeColor || '#dc2626';
        ctx.fillRect(-17, -8, 14, 8);
        ctx.fillRect(3, -8, 14, 8);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-18, -4, 5, 4);
        ctx.fillRect(13, -4, 5, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-17, 0, 14, 3);
        ctx.fillRect(3, 0, 14, 3);

        // White Hoodie & Denim Vest
        ctx.fillStyle = char.shirtColor || '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-22, -82, 44, 48, [10, 10, 4, 4]);
        ctx.fill();

        // Denim Vest
        ctx.fillStyle = char.vestColor || '#0284c7';
        ctx.fillRect(-22, -80, 12, 44);
        ctx.fillRect(10, -80, 12, 44);

        // Gold trim
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-22, -38, 44, 3);

        // Open Standing Arms (Posing)
        ctx.fillStyle = char.skinColor || '#fed7aa';
        ctx.save();
        ctx.translate(-22, -74);
        ctx.rotate(0.35);
        ctx.fillRect(-7, 0, 8, 36);
        ctx.beginPath(); ctx.arc(-3, 38, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(22, -74);
        ctx.rotate(-0.35);
        ctx.fillRect(-1, 0, 8, 36);
        ctx.beginPath(); ctx.arc(3, 38, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Head
        ctx.fillStyle = char.skinColor || '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -96, 17, 0, Math.PI * 2);
        ctx.fill();

        // Eyes & Smile
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-6, -98, 2, 0, Math.PI * 2);
        ctx.arc(6, -98, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, -94, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Cap with visor
        ctx.fillStyle = char.capColor || '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -100, 18, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-18, -102, 36, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-14, -106, 28, 4);

        ctx.restore();
    };

    TeacherGame.renderGameOverLeaderboard = function () {
        const container = document.getElementById('goLeaderboardList');
        if (!container) return;

        const defaultRoster = [
            { name: 'Yutani', score: 999999, avatar: '🛸', color: '#10b981' },
            { name: 'Spike', score: 810312, avatar: '🎸', color: '#38bdf8' },
            { name: 'Fresh', score: 555555, avatar: '📻', color: '#f59e0b' },
            { name: 'Tricky', score: 345678, avatar: '🧢', color: '#f43f5e' },
            { name: 'Lucy', score: 171110, avatar: '🎀', color: '#a855f7' },
            { name: 'Ninja', score: 123456, avatar: '🥷', color: '#0f172a' },
            { name: 'Brody', score: 65900, avatar: '🏄', color: '#f97316' },
            { name: 'Tagbot', score: 15505, avatar: '🤖', color: '#22c55e' }
        ];

        // Slot player's current run score into the leaderboard
        const playerScore = this.score;
        const playerEntry = {
            name: `${this.getCurrentChar().name} (YOU)`,
            score: playerScore,
            avatar: '⭐',
            color: '#facc15',
            isPlayer: true
        };

        const list = [...defaultRoster];
        list.push(playerEntry);
        list.sort((a, b) => b.score - a.score);

        // Keep top 8 entries
        const top8 = list.slice(0, 8);

        let html = '';
        top8.forEach((item, idx) => {
            const rank = idx + 1;
            const isPlayerClass = item.isPlayer ? 'player-row' : '';
            html += `
                <div class="notebook-lb-row ${isPlayerClass}">
                    <span class="lb-rank-num">${rank}</span>
                    <div class="lb-avatar-frame" style="border:1.5px solid ${item.color};">
                        <span>${item.avatar}</span>
                    </div>
                    <span class="lb-char-name">${item.name}</span>
                    <span class="lb-char-score">${item.score.toLocaleString()}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    };

    // =========================================================================
    // PARTICLES, VISUAL FX & COMBO SYSTEM
    // =========================================================================
    TeacherGame.createDustParticles = function (x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.8) * 130,
                size: Math.random() * 5 + 2,
                color: color || '#facc15',
                alpha: 1, life: 0.45
            });
        }
    };

    TeacherGame.createFloatingText = function (x, y, text, color) {
        this.floatTexts.push({ x: x, y: y, text: text, color: color || '#facc15', alpha: 1, life: 0.85 });
    };

    TeacherGame.createConfettiExplosion = function (x, y) {
        const colors = ['#f59e0b', '#0284c7', '#7c3aed', '#059669', '#ec4899', '#ffffff'];
        for (let i = 0; i < 35; i++) {
            this.confetti.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 420,
                vy: (Math.random() - 0.8) * 380,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1, rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 8, life: 1.2
            });
        }
    };

    TeacherGame.triggerCleanPass = function (obs, label) {
        this.playSound('coin');
        this.combo = Math.min(15, this.combo + 1);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const mult = (this.activePowerUps.double > 0 ? 2 : 1);
        const bonusPts = 50 * this.combo * mult;
        this.score += bonusPts;
        this.createFloatingText(this.player.x, this.player.y - this.player.jumpY - 45, `${label || 'CLEAN!'} +${bonusPts}`, '#38bdf8');
    };

    // =========================================================================
    // MAIN GAME LOOP & TIME STEPPING
    // =========================================================================
    TeacherGame.loop = function (time) {
        if (this.gameState !== 'running' && this.gameState !== 'countdown' && this.gameState !== 'save_me') return;

        const rawDt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        // FPS tracking for debug mode
        this.frameCount++;
        this.fpsTimer += rawDt;
        if (this.fpsTimer >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        if (this.gameState === 'countdown') {
            this.updateCountdown(rawDt);
            this.draw();
            this.animFrameId = requestAnimationFrame(this.loop.bind(this));
            return;
        }

        if (this.gameState === 'save_me') {
            this.updateSaveMeTimer(rawDt);
            this.draw();
            this.animFrameId = requestAnimationFrame(this.loop.bind(this));
            return;
        }

        if (this.isPaused) return;

        let effectiveTimeScale = 1.0;
        if (this.slowMoHitchTimer > 0) {
            this.slowMoHitchTimer -= rawDt;
            effectiveTimeScale *= 0.35;
        }

        const dt = rawDt * effectiveTimeScale;
        this.update(dt, rawDt);
        this.draw();

        this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    };

    TeacherGame.updateCountdown = function (dt) {
        this.countdownTimer += dt;
        const countdownOverlay = document.getElementById('gameCountdownOverlay');
        const countdownNum = document.getElementById('countdownNum');

        if (this.countdownTimer >= 0.85) {
            this.countdownTimer = 0;
            this.countdownVal--;

            if (this.countdownVal > 0) {
                if (countdownNum) countdownNum.innerText = this.countdownVal;
                this.playSound('coin');
            } else if (this.countdownVal === 0) {
                if (countdownNum) { countdownNum.innerText = 'GO!'; countdownNum.style.color = '#DE6834'; }
                this.playSound('powerup');
            } else {
                this.isCountingDown = false;
                this.gameState = 'running';
                if (countdownOverlay) countdownOverlay.style.display = 'none';
                document.getElementById('inGameHUD').style.display = 'flex';
                document.getElementById('hudHoverboardBtn').style.display = 'flex';
                this.updateInGameHUD();
            }
        }
    };

    // =========================================================================
    // UPDATE LOGIC (PHYSICS, TRAINS, COLLISION, COLLECTIBLES)
    // =========================================================================
    TeacherGame.update = function (dt, rawDt) {
        this.gameTime += rawDt;

        // Progressive difficulty speed scaling (Acceleration Curve)
        const speedGrowth = Math.min(this.maxSpeed - this.baseSpeed, Math.sqrt(this.distance * 0.00025) * 0.75);
        this.speed = this.baseSpeed + speedGrowth;

        this.distance += (this.speed * 92 * dt) * 0.1;
        const scoreMult = (this.activePowerUps.double > 0 ? 2 : 1);
        this.score = Math.floor((this.distance + (this.runCoins * 10) + (this.runGems * 50)) * scoreMult);

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        // Active Power-ups countdown
        if (this.activePowerUps.magnet > 0) this.activePowerUps.magnet -= dt;
        if (this.activePowerUps.sneakers > 0) this.activePowerUps.sneakers -= dt;
        if (this.activePowerUps.double > 0) this.activePowerUps.double -= dt;
        if (this.activePowerUps.dash > 0) this.activePowerUps.dash -= dt;

        // Bullet / Jetpack Sky Flight (15 seconds, unobstructed sky, dual thruster flames)
        if (this.activePowerUps.bullet > 0) {
            this.activePowerUps.bullet -= dt;
            this.isFlyingBullet = true;
            const targetFlightY = 215;
            this.player.jumpY += (targetFlightY - this.player.jumpY) * 5 * dt;
            this.player.jumpVy = 0;
            this.player.isGrounded = false;
            this.createBulletParticles(this.player.x, this.player.y - this.player.jumpY + 18);

            if (this.activePowerUps.bullet <= 0) {
                this.activePowerUps.bullet = 0;
                this.isFlyingBullet = false;
                this.player.invincibleTimer = 2.5; // Safe landing shield
                this.createFloatingText(this.player.x, this.player.y - 65, 'SAFE LANDING! 🛡️', '#38bdf8');
            }
        }

        // Hoverboard timer
        if (this.hoverboardActive) {
            this.hoverboardTimer -= dt;
            if (this.hoverboardTimer <= 0) {
                this.hoverboardActive = false;
                this.hoverboardTimer = 0;
                const boardBtn = document.getElementById('hudHoverboardBtn');
                if (boardBtn) boardBtn.classList.remove('active');
            }
        }

        if (this.player.invincibleTimer > 0) {
            this.player.invincibleTimer -= dt;
        }

        if (this.player.landingSquash > 0) {
            this.player.landingSquash -= dt * 6;
        }

        // Track rolling scroll
        this.trackScroll = (this.trackScroll + this.speed * dt * 2.8) % 1.0;
        if (this.shakeTimer > 0) this.shakeTimer -= rawDt;

        // Spring-like smooth lane interpolation
        this.player.currentLane = this.player.targetLane;
        this.player.targetX = this.getLaneX(this.player.targetLane, this.playerDepthZ);
        this.player.y = this.getScreenY(this.playerDepthZ);
        const dx = this.player.targetX - this.player.x;
        this.player.x += dx * 18 * dt;
        this.player.tilt = (dx * 0.0035);

        // Guard follows behind
        this.guard.x += (this.player.x - this.guard.x) * 8 * dt;
        this.guard.runCycle += dt * (this.speed * 18);

        // Train Roof Running & Ramp Ascent Integration
        let currentTrainUnderneath = null;
        let effectiveBaseHeight = 0;

        for (let obs of this.obstacles) {
            if (obs.type === 'subway_train' && obs.lane === this.player.targetLane) {
                const trainFrontZ = obs.z;
                const trainRearZ = obs.z - (obs.length || 0.75);
                const rampLength = obs.rampLength || 0.22;
                const rampTipZ = obs.hasRamp ? (trainFrontZ + rampLength) : trainFrontZ;

                // 1. Ramp Ascent: As player approaches ramp, height rises smoothly up to roof
                if (obs.hasRamp && this.playerDepthZ <= rampTipZ && this.playerDepthZ >= trainFrontZ) {
                    const rampProgress = (rampTipZ - this.playerDepthZ) / rampLength;
                    effectiveBaseHeight = Math.max(0, Math.min(1, rampProgress)) * this.player.trainRoofHeight;
                    currentTrainUnderneath = obs;
                    break;
                }

                // 2. On top of train roof
                if (this.playerDepthZ < trainFrontZ && this.playerDepthZ >= trainRearZ) {
                    currentTrainUnderneath = obs;
                    effectiveBaseHeight = this.player.trainRoofHeight;
                    break;
                }
            }
        }

        this.player.onTrain = (currentTrainUnderneath !== null && effectiveBaseHeight > 30);
        this.player.currentTrain = currentTrainUnderneath;

        // Authentic Arcade Jump & Gravity Physics
        if (!this.isFlyingBullet) {
            if (!this.player.isGrounded) {
                const gravity = 2200; // Snappy arcade gravity
                this.player.jumpVy += gravity * dt;
                this.player.jumpY -= this.player.jumpVy * dt;

                // Touch down / Landing on ground or train roof
                if (this.player.jumpY <= effectiveBaseHeight) {
                    this.player.jumpY = effectiveBaseHeight;
                    this.player.jumpVy = 0;
                    this.player.isGrounded = true;
                    this.player.jumpsRemaining = 2;
                    this.player.isFlipping = false;
                    this.player.landingSquash = 1.0;
                    this.createDustParticles(this.player.x, this.player.y - effectiveBaseHeight + 8, 8, '#ffffff');
                }
            } else {
                // Conform to changing roof height (e.g. running onto/off ramp or falling off train)
                if (this.player.jumpY > effectiveBaseHeight + 4) {
                    // Stepped off a train roof -> fall down to ground!
                    this.player.isGrounded = false;
                    this.player.jumpVy = 100;
                } else if (this.player.jumpY < effectiveBaseHeight) {
                    // Stepped onto ramp
                    this.player.jumpY = effectiveBaseHeight;
                }
            }
        }

        // Aerial flip angle
        if (this.player.isFlipping) {
            this.player.flipAngle += dt * 18;
            if (this.player.flipAngle >= Math.PI * 2) {
                this.player.isFlipping = false;
                this.player.flipAngle = 0;
            }
        }

        // Slide timer
        if (this.player.isSliding) {
            this.player.slideTimer -= dt;
            if (this.player.slideTimer <= 0) this.player.isSliding = false;
        }

        this.player.runCycle += dt * (this.speed * 18);

        this.updateTrackObjects(dt, rawDt);
        this.updateParticles(dt, rawDt);
        this.updateInGameHUD();
    };

    TeacherGame.updateTrackObjects = function (dt, rawDt) {
        const playerDepthZ = this.playerDepthZ;
        const playerX = this.player.x;
        const playerJumpY = this.player.jumpY;
        const isSliding = this.player.isSliding;

        // Scenery parallax
        for (let sp of this.sceneryProps) {
            sp.z += this.speed * dt * 0.45;
            if (sp.z > 1.2) {
                sp.z = 0;
                sp.side = Math.random() < 0.5 ? -1 : 1;
                sp.type = Math.floor(Math.random() * 4);
            }
        }

        // Coins Movement & Super Magnet Attraction
        const hasMagnet = this.activePowerUps.magnet > 0;
        for (let i = this.coinsList.length - 1; i >= 0; i--) {
            const coin = this.coinsList[i];
            coin.z += this.speed * dt * 0.45;

            // Super Magnet Attraction Curve across all lanes in 3D
            if (hasMagnet && !coin.collected && coin.z > 0.22) {
                if (Math.abs(coin.lane - this.player.targetLane) > 0.05) {
                    coin.lane += (this.player.targetLane - coin.lane) * 10 * dt;
                }
            }

            let coinScreenX = this.getLaneX(coin.lane, coin.z);
            let coinScreenY = this.getScreenY(coin.z) - (coin.inAir ? 215 : (coin.onTrain ? 110 : 0)) - (coin.jumpArc ? Math.sin(Math.min(1, Math.max(0, coin.z * 1.2))) * 85 : 25);

            const isNearZ = Math.abs(coin.z - playerDepthZ) < 0.08 || (hasMagnet && Math.abs(coin.z - playerDepthZ) < 0.22);
            if (!coin.collected && isNearZ) {
                if (hasMagnet || Math.abs(coinScreenX - playerX) < 55) {
                    coin.collected = true;
                    this.runCoins++;
                    this.combo = Math.min(15, this.combo + 1);
                    this.playSound('coin');
                    this.createFloatingText(coinScreenX, coinScreenY - 10, `+10`, '#facc15');
                    this.createDustParticles(coinScreenX, coinScreenY, 6, '#facc15');
                }
            }
            if (coin.z > 1.2 || coin.collected) this.coinsList.splice(i, 1);
        }

        // Power-ups (Jetpack Bullet, Sneakers, Magnet, 2X)
        for (let i = this.powerupsList.length - 1; i >= 0; i--) {
            const pw = this.powerupsList[i];
            pw.z += this.speed * dt * 0.45;
            const pwScreenX = this.getLaneX(pw.lane, pw.z);
            const pwScreenY = this.getScreenY(pw.z) - (pw.onTrain ? 110 : 0) - 30;

            if (!pw.collected && Math.abs(pw.z - playerDepthZ) < 0.08) {
                if (Math.abs(pwScreenX - playerX) < 50) {
                    pw.collected = true;
                    this.playSound('powerup');
                    if (pw.type === 'bullet') {
                        this.activePowerUps.bullet = 15;
                        this.createFloatingText(pwScreenX, pwScreenY - 20, 'JETPACK BULLET! 🚀 (15s)', '#f97316');
                        this.playSound('bullet_fly');
                    } else if (pw.type === 'sneakers') {
                        this.activePowerUps.sneakers = 15;
                        this.createFloatingText(pwScreenX, pwScreenY - 20, 'SUPER SNEAKERS! 👟', '#38bdf8');
                    } else if (pw.type === 'magnet') {
                        this.activePowerUps.magnet = 15;
                        this.createFloatingText(pwScreenX, pwScreenY - 20, 'COIN MAGNET! 🧲', '#ef4444');
                    } else if (pw.type === 'double') {
                        this.activePowerUps.double = 18;
                        this.createFloatingText(pwScreenX, pwScreenY - 20, '2X MULTIPLIER! ⭐', '#facc15');
                    }
                    this.createConfettiExplosion(pwScreenX, pwScreenY);
                }
            }
            if (pw.z > 1.2 || pw.collected) this.powerupsList.splice(i, 1);
        }

        // Daily Letter Pickups (B-O-L-T) - Attracted by Super Magnet
        for (let i = this.letterPickups.length - 1; i >= 0; i--) {
            const letObj = this.letterPickups[i];
            letObj.z += this.speed * dt * 0.45;

            if (hasMagnet && !letObj.collected && letObj.z > 0.22) {
                if (Math.abs(letObj.lane - this.player.targetLane) > 0.05) {
                    letObj.lane += (this.player.targetLane - letObj.lane) * 8 * dt;
                }
            }

            const letScreenX = this.getLaneX(letObj.lane, letObj.z);
            const letScreenY = this.getScreenY(letObj.z) - 35;

            const isNearLetter = Math.abs(letObj.z - playerDepthZ) < 0.08 || (hasMagnet && Math.abs(letObj.z - playerDepthZ) < 0.18);
            if (!letObj.collected && isNearLetter) {
                if (hasMagnet || Math.abs(letScreenX - playerX) < 48) {
                    letObj.collected = true;
                    const letterIdx = this.dailyWord.indexOf(letObj.letter);
                    if (letterIdx !== -1) {
                        this.collectedLetters[letterIdx] = true;
                    }
                    this.playSound('letter_chime');
                    this.createFloatingText(letScreenX, letScreenY - 20, `LETTER ${letObj.letter}!`, '#38bdf8');
                    this.createConfettiExplosion(letScreenX, letScreenY);
                }
            }
            if (letObj.z > 1.2 || letObj.collected) this.letterPickups.splice(i, 1);
        }

        // Weekly Hunt Flamingo Pickups - Attracted by Super Magnet
        for (let i = this.flamingoPickups.length - 1; i >= 0; i--) {
            const flam = this.flamingoPickups[i];
            flam.z += this.speed * dt * 0.45;

            if (hasMagnet && !flam.collected && flam.z > 0.22) {
                if (Math.abs(flam.lane - this.player.targetLane) > 0.05) {
                    flam.lane += (this.player.targetLane - flam.lane) * 8 * dt;
                }
            }

            const flamScreenX = this.getLaneX(flam.lane, flam.z);
            const flamScreenY = this.getScreenY(flam.z) - 35;

            const isNearFlam = Math.abs(flam.z - playerDepthZ) < 0.08 || (hasMagnet && Math.abs(flam.z - playerDepthZ) < 0.18);
            if (!flam.collected && isNearFlam) {
                if (hasMagnet || Math.abs(flamScreenX - playerX) < 48) {
                    flam.collected = true;
                    this.weeklyHuntTokens++;
                    this.saveStorage();
                    this.playSound('coin');
                    this.createFloatingText(flamScreenX, flamScreenY - 20, `🦩 +1 HUNT TOKEN!`, '#ec4899');
                    this.createConfettiExplosion(flamScreenX, flamScreenY);
                }
            }
            if (flam.z > 1.2 || flam.collected) this.flamingoPickups.splice(i, 1);
        }

        // Obstacles & High-Speed Multi-Carriage Trains
        if (this.mode === 'challenge') {
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                const trainExtraSpeed = obs.type === 'subway_train' ? (obs.isMoving ? obs.speedBonus : 0.0) : 0.0;
                obs.z += (this.speed + trainExtraSpeed) * dt * 0.45;

                // Physics-Based Bounding Box Collision Check
                const isColliding = this.checkPlayerObstacleCollision(obs);

                if (isColliding && !obs.hitRegistered) {
                    obs.hitRegistered = true;
                    this.handleCrash();
                    return;
                }

                // Delete obstacle only after entire body has completely passed camera
                const maxZ = obs.type === 'subway_train' ? 1.6 : 1.3;
                if (obs.z > maxZ) this.obstacles.splice(i, 1);
            }
        }

        // Procedural Wave Spawning
        this.trainSpawnTimer += dt;
        const distDelta = this.distance - this.lastSpawnDistance;
        if (distDelta > 28 || this.obstacles.length === 0) {
            this.spawnTrackWave();
            this.lastSpawnDistance = this.distance;
        }
    };

    // =========================================================================
    // MODULAR COLLISION SYSTEM
    // =========================================================================
    TeacherGame.checkPlayerObstacleCollision = function (obs) {
        if (this.player.invincibleTimer > 0 || this.activePowerUps.bullet > 0 || this.isFlyingBullet) return false;

        const playerDepthZ = this.playerDepthZ;
        const playerJumpY = this.player.jumpY;
        const isSliding = this.player.isSliding;
        const playerLane = this.player.targetLane;

        // 1. Check Lane Match
        if (obs.lane !== playerLane) {
            // Near-miss check for excitement!
            if (!obs.nearMissChecked && Math.abs(obs.z - playerDepthZ) < 0.06 && Math.abs(obs.lane - playerLane) === 1) {
                obs.nearMissChecked = true;
                this.playSound('near_miss');
                this.createFloatingText(this.player.x, this.player.y - playerJumpY - 50, 'NEAR MISS! +50', '#facc15');
                this.score += 50;
            }
            return false;
        }

        // 2. Obstacle Types Collision Verification
        if (obs.type === 'low_barrier') {
            // Short Hurdle (Depth span 0.065)
            if (Math.abs(obs.z - playerDepthZ) < 0.065) {
                if (playerJumpY < 28) {
                    return true; // Crashed into low barrier
                } else if (!obs.passed) {
                    obs.passed = true;
                    this.triggerCleanPass(obs, 'JUMP OVER!');
                }
            }

        } else if (obs.type === 'tunnel_arch') {
            // High Barrier Gantry (Depth span 0.07)
            if (Math.abs(obs.z - playerDepthZ) < 0.07) {
                if (!isSliding && playerJumpY > 6) {
                    return true; // Jumped into high gantry or didn't slide
                } else if (!isSliding && playerJumpY <= 6) {
                    return true; // Must slide under!
                } else if (!obs.passed) {
                    obs.passed = true;
                    this.triggerCleanPass(obs, 'SLIDE UNDER!');
                }
            }

        } else if (obs.type === 'subway_train') {
            // Long Multi-Carriage Subway Train
            const trainFrontZ = obs.z;
            const trainRearZ = obs.z - (obs.length || 0.75);
            const rampLength = obs.rampLength || 0.22;
            const rampTipZ = obs.hasRamp ? (trainFrontZ + rampLength) : trainFrontZ;

            // Check if player's depth falls within physical train body or ramp span
            if (playerDepthZ <= rampTipZ && playerDepthZ >= trainRearZ) {
                // 1. Safe ramp ascent
                if (obs.hasRamp && playerDepthZ >= trainFrontZ) {
                    if (!obs.passed) {
                        obs.passed = true;
                        this.triggerCleanPass(obs, 'RAMP SURF!');
                    }
                    return false;
                }

                // 2. Safe roof running or high jump / vault onto roof
                if (playerJumpY >= 35 || this.player.onTrain) {
                    if (!obs.passed) {
                        obs.passed = true;
                        this.triggerCleanPass(obs, 'TRAIN SURF!');
                    }
                    return false;
                }

                // Hit front of train or side of train
                return true;
            }
        }

        return false;
    };

    // =========================================================================
    // PROCEDURAL SOLVABLE PATTERN GENERATOR
    // =========================================================================
    TeacherGame.spawnTrackWave = function () {
        // 1. Bullet Jetpack Sky Flight Wave
        if (this.activePowerUps.bullet > 0) {
            // Dense bundle of gold coins across all 3 rows in the air!
            for (let l = 0; l < 3; l++) {
                for (let c = 0; c < 5; c++) {
                    this.coinsList.push({
                        lane: l,
                        z: -0.15 + c * 0.07,
                        inAir: true,
                        collected: false
                    });
                }
            }
            return;
        }

        const pattern = Math.floor(Math.random() * 6);
        const freeLane = Math.floor(Math.random() * 3);
        const obsLane = (freeLane + 1) % 3;
        const thirdLane = (freeLane + 2) % 3;

        if (pattern === 0) {
            // Pattern 0: Low Barrier with Parabolic Jump Arc Coins
            this.obstacles.push({
                type: 'low_barrier',
                lane: freeLane,
                z: 0.0,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            for (let c = 0; c < 5; c++) {
                this.coinsList.push({ lane: freeLane, z: -0.15 + c * 0.06, jumpArc: true, collected: false });
            }
            if (Math.random() < 0.35) {
                const pType = Math.random() < 0.4 ? 'bullet' : (Math.random() < 0.5 ? 'sneakers' : 'magnet');
                this.powerupsList.push({ type: pType, lane: obsLane, z: -0.1, collected: false });
            }

        } else if (pattern === 1) {
            // Pattern 1: High Slide Arch Gantry + Flamingo Token
            this.obstacles.push({
                type: 'tunnel_arch',
                lane: freeLane,
                z: 0.0,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            for (let c = 0; c < 4; c++) {
                this.coinsList.push({ lane: freeLane, z: -0.1 + c * 0.05, collected: false });
            }
            if (Math.random() < 0.35) {
                this.flamingoPickups.push({ lane: obsLane, z: -0.15, collected: false });
            }

        } else if (pattern === 2) {
            // Pattern 2: Train with Front Ramp & Roof Coins
            const trainStyle = Math.random() < 0.55 ? 'lumber' : 'commuter';
            this.obstacles.push({
                id: 'train_' + Math.random().toString(36).substr(2, 6),
                type: 'subway_train',
                trainStyle: trainStyle,
                lane: obsLane,
                z: 0.0,
                length: 0.75,
                carriages: 3,
                speedBonus: 0.0, // Less moving, natural scroll
                hasRamp: true,   // Front ramp to get on train
                rampLength: 0.22,
                isMoving: false,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });

            // Parabolic coin arch leading up the ramp and along the roof!
            for (let c = 0; c < 5; c++) {
                this.coinsList.push({
                    lane: obsLane,
                    z: 0.12 - c * 0.08,
                    onTrain: true,
                    jumpArc: (trainStyle === 'lumber' && c >= 1 && c <= 3),
                    collected: false
                });
            }

            const uncollected = [];
            this.collectedLetters.forEach((col, idx) => { if (!col) uncollected.push(idx); });
            if (uncollected.length > 0 && Math.random() < 0.4) {
                const targetIdx = uncollected[Math.floor(Math.random() * uncollected.length)];
                this.letterPickups.push({ lane: freeLane, z: -0.2, letter: this.dailyWord[targetIdx], collected: false });
            }

        } else if (pattern === 3) {
            // Pattern 3: Dual Trains (Left lumber train with ramp, Right commuter train with ramp)
            this.obstacles.push({
                id: 'train_left',
                type: 'subway_train',
                trainStyle: 'lumber',
                lane: 0,
                z: 0.0,
                length: 0.75,
                carriages: 3,
                speedBonus: 0.0,
                hasRamp: true,
                rampLength: 0.22,
                isMoving: false,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            this.obstacles.push({
                id: 'train_right',
                type: 'subway_train',
                trainStyle: 'commuter',
                lane: 2,
                z: -0.12,
                length: 0.75,
                carriages: 3,
                speedBonus: 0.02,
                hasRamp: true,
                rampLength: 0.22,
                isMoving: true,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            for (let c = 0; c < 5; c++) {
                this.coinsList.push({ lane: 1, z: -c * 0.05, collected: false });
            }
            if (Math.random() < 0.35) {
                this.powerupsList.push({ type: 'bullet', lane: 1, z: -0.15, collected: false });
            }

        } else if (pattern === 4) {
            // Pattern 4: Hurdle in free lane + Ramp Train on side lane
            const trainStyle = Math.random() < 0.5 ? 'lumber' : 'commuter';
            this.obstacles.push({
                type: 'low_barrier',
                lane: freeLane,
                z: 0.0,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            this.obstacles.push({
                id: 'train_side',
                type: 'subway_train',
                trainStyle: trainStyle,
                lane: obsLane,
                z: -0.08,
                length: 0.75,
                carriages: 3,
                speedBonus: 0.0,
                hasRamp: true,
                rampLength: 0.22,
                isMoving: false,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            for (let c = 0; c < 4; c++) {
                this.coinsList.push({ lane: freeLane, z: -0.12 + c * 0.06, jumpArc: true, collected: false });
            }

        } else {
            // Pattern 5: 2X Multiplier Star or Bullet + High Arch Gantry
            this.obstacles.push({
                type: 'tunnel_arch',
                lane: freeLane,
                z: 0.0,
                passed: false,
                hitRegistered: false,
                nearMissChecked: false
            });
            this.powerupsList.push({
                type: Math.random() < 0.5 ? 'bullet' : 'double',
                lane: freeLane,
                z: -0.08,
                collected: false
            });
            for (let c = 0; c < 4; c++) {
                this.coinsList.push({ lane: obsLane, z: -0.1 + c * 0.05, collected: false });
            }
        }
    };

    TeacherGame.updateParticles = function (dt, rawDt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= rawDt; p.alpha = Math.max(0, p.life / 0.45);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 500 * dt;
            c.rot += c.rotSpeed * dt; c.life -= rawDt; c.alpha = Math.max(0, c.life / 1.2);
            if (c.life <= 0) this.confetti.splice(i, 1);
        }
        for (let ft of this.floatTexts) {
            ft.y -= 45 * dt; ft.life -= rawDt; ft.alpha = Math.max(0, ft.life / 0.85);
        }
        this.floatTexts = this.floatTexts.filter(ft => ft.life > 0);
    };

    TeacherGame.updateInGameHUD = function () {
        const hudCoins = document.getElementById('hudRunCoins');
        const hudScore = document.getElementById('hudScore');
        const hudMult = document.getElementById('hudMult');
        const hudFlamingo = document.getElementById('hudInGameFlamingo');
        const hudBoardCount = document.getElementById('hudBoardCount');
        const hudDist = document.getElementById('hudDistance');
        const hudKeys = document.getElementById('hudRunKeys');

        if (hudCoins) hudCoins.innerText = this.runCoins;
        if (hudScore) hudScore.innerText = this.score.toString().padStart(6, '0');
        if (hudMult) hudMult.innerText = `x${this.combo * (this.activePowerUps.double > 0 ? 2 : 1)}`;
        if (hudFlamingo) hudFlamingo.innerText = `${this.weeklyHuntTokens}/10`;
        if (hudBoardCount) hudBoardCount.innerText = this.totalHoverboards;
        if (hudDist) hudDist.innerText = Math.floor(this.distance) + 'm';
        if (hudKeys) hudKeys.innerText = this.totalKeys;

        // Render Active Power-up Countdown Progress Bars
        const pContainer = document.getElementById('hudActivePowerups');
        if (pContainer) {
            let html = '';
            if (this.activePowerUps.magnet > 0) {
                const pct = Math.min(100, Math.max(0, (this.activePowerUps.magnet / 15) * 100));
                html += `<div class="powerup-timer-chip magnet">
                    <span class="powerup-icon">🧲</span>
                    <div class="powerup-bar-wrap"><div class="powerup-bar-fill" style="width:${pct}%"></div></div>
                    <span class="powerup-sec">${this.activePowerUps.magnet.toFixed(1)}s</span>
                </div>`;
            }
            if (this.activePowerUps.sneakers > 0) {
                const pct = Math.min(100, Math.max(0, (this.activePowerUps.sneakers / 15) * 100));
                html += `<div class="powerup-timer-chip sneakers">
                    <span class="powerup-icon">👟</span>
                    <div class="powerup-bar-wrap"><div class="powerup-bar-fill" style="width:${pct}%"></div></div>
                    <span class="powerup-sec">${this.activePowerUps.sneakers.toFixed(1)}s</span>
                </div>`;
            }
            if (this.activePowerUps.double > 0) {
                const pct = Math.min(100, Math.max(0, (this.activePowerUps.double / 18) * 100));
                html += `<div class="powerup-timer-chip double">
                    <span class="powerup-icon">⭐</span>
                    <div class="powerup-bar-wrap"><div class="powerup-bar-fill" style="width:${pct}%"></div></div>
                    <span class="powerup-sec">${this.activePowerUps.double.toFixed(1)}s</span>
                </div>`;
            }
            if (this.activePowerUps.bullet > 0) {
                const pct = Math.min(100, Math.max(0, (this.activePowerUps.bullet / 15) * 100));
                html += `<div class="powerup-timer-chip bullet">
                    <span class="powerup-icon">🚀</span>
                    <div class="powerup-bar-wrap"><div class="powerup-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#f97316,#facc15)"></div></div>
                    <span class="powerup-sec">${this.activePowerUps.bullet.toFixed(1)}s</span>
                </div>`;
            }
            if (this.hoverboardActive) {
                const pct = Math.min(100, Math.max(0, (this.hoverboardTimer / this.hoverboardMaxTime) * 100));
                html += `<div class="powerup-timer-chip hoverboard">
                    <span class="powerup-icon">🛹</span>
                    <div class="powerup-bar-wrap"><div class="powerup-bar-fill" style="width:${pct}%"></div></div>
                    <span class="powerup-sec">${this.hoverboardTimer.toFixed(1)}s</span>
                </div>`;
            }
            pContainer.innerHTML = html;
        }
    };

    // =========================================================================
    // HIGH-FIDELITY 3D CANVAS RENDERING PIPELINE
    // =========================================================================
    TeacherGame.draw = function () {
        const ctx = this.ctx;

        ctx.save();
        if (this.shakeTimer > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            const shakeY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            ctx.translate(shakeX, shakeY);
        }

        ctx.clearRect(0, 0, this.width, this.height);

        // 1. Sky & Glowing Sun
        this.drawSky(ctx);

        // 2. Distant Miami City Skyline
        this.drawCitySkyline(ctx);

        // 3. Ground Base: Sand, Concrete & Ballast Bed
        this.drawEnvironmentBase(ctx);

        // 4. Chunky 3D Wooden Sleepers & Shiny Steel Rails
        this.drawTracksAndRails(ctx);

        // 5. Overhead Utility Gantries & Cables
        this.drawOverheadWires(ctx);

        // 6. Trackside Scenery Props (Buildings, Umbrellas, Palms)
        this.drawSceneryProps(ctx);

        if (this.gameState === 'lobby') {
            this.drawLobbyGraffitiTrain(ctx);
            this.drawLobbyJake(ctx);
        } else {
            // Render depth-sorted obstacles & trains
            this.drawObstacles(ctx);
            this.drawCollectibles(ctx);
            this.drawInspectorAndDog(ctx);
            this.drawRunner(ctx);
            this.drawParticlesAndTexts(ctx);
        }

        // 7. Developer Debug Overlay (F3 / ~)
        if (this.debugMode) {
            this.drawDebugOverlay(ctx);
        }

        ctx.restore();
    };

    TeacherGame.drawSky = function (ctx) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.vanishY + 20);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.65, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun
        const sunX = this.vanishX;
        const sunY = this.vanishY - 55;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
        ctx.fill();
    };

    TeacherGame.drawCitySkyline = function (ctx) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        const buildings = [
            { x: 15, w: 35, h: 75 },
            { x: 55, w: 28, h: 105 },
            { x: 88, w: 42, h: 65 },
            { x: 135, w: 32, h: 90 },
            { x: 172, w: 30, h: 115 },
            { x: 206, w: 38, h: 70 },
            { x: 740, w: 36, h: 85 },
            { x: 782, w: 32, h: 110 },
            { x: 820, w: 40, h: 75 },
            { x: 865, w: 34, h: 95 }
        ];

        for (let b of buildings) {
            ctx.fillRect(b.x, this.vanishY + 15 - b.h, b.w, b.h);
        }
    };

    TeacherGame.drawEnvironmentBase = function (ctx) {
        const vy = this.vanishY + 10;
        const gy = this.groundY + 110;

        const wFar = this.trackWidthFar / 2;
        const wNear = this.trackWidthNear / 2;
        const curveFar = this.getCurveOffset(0);
        const curveNear = this.getCurveOffset(1);

        // Warm golden ground base spanning entire landscape
        ctx.fillStyle = '#edd197';
        ctx.fillRect(0, vy, this.width, gy - vy);

        // Right Raised Wooden/Stone Platform Sidewalk
        ctx.fillStyle = '#c89658';
        ctx.beginPath();
        ctx.moveTo(this.vanishX + curveFar + wFar + 12, vy);
        ctx.lineTo(this.width, vy);
        ctx.lineTo(this.width, gy);
        ctx.lineTo(this.vanishX + curveNear + wNear + 45, gy);
        ctx.closePath();
        ctx.fill();

        // Right Curb Bevel / Shadow
        ctx.fillStyle = '#9c6630';
        ctx.beginPath();
        ctx.moveTo(this.vanishX + curveFar + wFar + 12, vy);
        ctx.lineTo(this.vanishX + curveFar + wFar + 18, vy);
        ctx.lineTo(this.vanishX + curveNear + wNear + 55, gy);
        ctx.lineTo(this.vanishX + curveNear + wNear + 45, gy);
        ctx.closePath();
        ctx.fill();

        // Left Raised Sidewalk Curb & Platform
        ctx.fillStyle = '#c89658';
        ctx.beginPath();
        ctx.moveTo(0, vy);
        ctx.lineTo(this.vanishX + curveFar - wFar - 12, vy);
        ctx.lineTo(this.vanishX + curveNear - wNear - 45, gy);
        ctx.lineTo(0, gy);
        ctx.closePath();
        ctx.fill();

        // Left Curb Shadow
        ctx.fillStyle = '#9c6630';
        ctx.beginPath();
        ctx.moveTo(this.vanishX + curveFar - wFar - 12, vy);
        ctx.lineTo(this.vanishX + curveFar - wFar - 18, vy);
        ctx.lineTo(this.vanishX + curveNear - wNear - 55, gy);
        ctx.lineTo(this.vanishX + curveNear - wNear - 45, gy);
        ctx.closePath();
        ctx.fill();

        // 3. Sandy Ballast Bed (Smooth warm sand between curbs)
        ctx.fillStyle = '#e5ca8d';
        ctx.beginPath();
        ctx.moveTo(this.vanishX + curveFar - wFar - 12, vy);
        ctx.lineTo(this.vanishX + curveFar + wFar + 12, vy);
        ctx.lineTo(this.vanishX + curveNear + wNear + 45, gy);
        ctx.lineTo(this.vanishX + curveNear - wNear - 45, gy);
        ctx.closePath();
        ctx.fill();
    };

    TeacherGame.drawTracksAndRails = function (ctx) {
        const sleeperCount = 28;

        // 1. Spaced Chunky 3D Wooden Sleepers (Authentic warm golden timber with 3D bevels)
        for (let i = 0; i < sleeperCount; i++) {
            const z = (i / sleeperCount + this.trackScroll * (1 / sleeperCount)) % 1.0;
            if (z < 0.04) continue;
            const y = this.getScreenY(z);
            const scale = this.getScale(z);
            const sleeperH = 4 + z * 8;

            for (let l = 0; l < 3; l++) {
                const laneX = this.getLaneX(l, z);
                const sleeperHalfW = 38 * scale;

                // 3D Underside / Front Shadow Face (Dark caramel wood depth)
                ctx.fillStyle = '#8c5220';
                ctx.beginPath();
                ctx.roundRect(laneX - sleeperHalfW, y - sleeperH / 2, sleeperHalfW * 2, sleeperH + 3 * scale, 3 * scale);
                ctx.fill();

                // Top Face (Rich warm golden-orange wood)
                ctx.fillStyle = '#d99243';
                ctx.beginPath();
                ctx.roundRect(laneX - sleeperHalfW, y - sleeperH / 2, sleeperHalfW * 2, sleeperH * 0.85, 2 * scale);
                ctx.fill();

                // Sunlit Top Bevel
                ctx.fillStyle = '#f5b66d';
                ctx.fillRect(laneX - sleeperHalfW + 2 * scale, y - sleeperH / 2, sleeperHalfW * 2 - 4 * scale, sleeperH * 0.3);

                // Steel Tie Plates with Spikes securing rails
                ctx.fillStyle = '#596573';
                const plateSpacing = 18 * scale;
                ctx.fillRect(laneX - plateSpacing - 3.5 * scale, y - sleeperH / 2 - 1, 7 * scale, sleeperH + 1);
                ctx.fillRect(laneX + plateSpacing - 3.5 * scale, y - sleeperH / 2 - 1, 7 * scale, sleeperH + 1);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(laneX - plateSpacing - 1.5 * scale, y - sleeperH / 2, 3 * scale, 2 * scale);
                ctx.fillRect(laneX + plateSpacing - 1.5 * scale, y - sleeperH / 2, 3 * scale, 2 * scale);
            }
        }

        // 2. 3D Metallic Extruded Steel Rails (6 distinct shiny chrome rails)
        for (let l = 0; l < 3; l++) {
            for (let side of [-1, 1]) {
                const points = [];
                for (let step = 0; step <= 24; step++) {
                    const z = step / 24;
                    const y = this.getScreenY(z);
                    const scale = this.getScale(z);
                    const laneX = this.getLaneX(l, z);
                    const railSpacing = 18 * scale;
                    const railX = laneX + side * railSpacing;
                    points.push({ x: railX, y: y, scale: scale });
                }

                // Layer A: Dark Steel Rail Base & Underside Shadow
                ctx.strokeStyle = '#2d3748';
                ctx.lineWidth = 5.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) ctx.moveTo(points[i].x, points[i].y);
                    else ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();

                // Layer B: Solid Steel Web & Head
                ctx.strokeStyle = '#9ca6b5';
                ctx.lineWidth = 3.6;
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) ctx.moveTo(points[i].x, points[i].y - 1);
                    else ctx.lineTo(points[i].x, points[i].y - 1);
                }
                ctx.stroke();

                // Layer C: Top Specular Shiny Silver Chrome Line
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                for (let i = 0; i < points.length; i++) {
                    if (i === 0) ctx.moveTo(points[i].x - 0.5, points[i].y - 1.5);
                    else ctx.lineTo(points[i].x - 0.5, points[i].y - 1.5);
                }
                ctx.stroke();
            }
        }
    };

    TeacherGame.drawOverheadWires = function (ctx) {
        const portalCount = 4;
        for (let i = 0; i < portalCount; i++) {
            const z = (i / portalCount + this.trackScroll * (1 / portalCount)) % 1.0;
            if (z < 0.08 || z > 0.94) continue;
            const y = this.getScreenY(z);
            const scale = this.getScale(z);
            const totalW = this.getTrackWidth(z);
            const leftX = this.vanishX - totalW / 2 - 24 * scale;
            const rightX = this.vanishX + totalW / 2 + 24 * scale;
            const gantryH = 160 * scale;
            const beamY = y - gantryH;
            const frameW = 9 * scale;

            ctx.save();

            // 1. Red Overhead Portal Frame (Screenshot 3 Replica!)
            // Left Column
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(leftX - frameW / 2, beamY, frameW, gantryH);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(leftX + frameW / 2 - 2.5 * scale, beamY, 2.5 * scale, gantryH);

            // Right Column
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(rightX - frameW / 2, beamY, frameW, gantryH);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(rightX - frameW / 2, beamY, 2.5 * scale, gantryH);

            // Top Horizontal Crossbeam
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(leftX - frameW / 2, beamY, (rightX - leftX) + frameW, 8 * scale);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(leftX - frameW / 2, beamY + 6 * scale, (rightX - leftX) + frameW, 2 * scale);

            // Overhead Black High-Voltage Catenary Power Cables suspended across portal
            for (let l = 0; l < 3; l++) {
                const lx = this.getLaneX(l, z);
                // Insulator dropper
                ctx.fillStyle = '#64748b';
                ctx.fillRect(lx - 1.5 * scale, beamY + 8 * scale, 3 * scale, 14 * scale);

                // Cable clamp
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(lx, beamY + 22 * scale, 3 * scale, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Continuous longitudinal overhead power cables running straight into horizon
        for (let l = 0; l < 3; l++) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (let s = 0; s <= 20; s++) {
                const z = s / 20;
                const y = this.getScreenY(z) - 138 * this.getScale(z);
                const x = this.getLaneX(l, z);
                if (s === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    };

    TeacherGame.drawSceneryProps = function (ctx) {
        for (let sp of this.sceneryProps) {
            if (sp.z < 0.08) continue;
            const y = this.getScreenY(sp.z);
            const scale = this.getScale(sp.z);
            const curveX = this.getCurveOffset(sp.z);
            const trackHalfW = (this.trackWidthFar + sp.z * (this.trackWidthNear - this.trackWidthFar)) / 2;

            ctx.save();
            if (sp.side === -1) {
                // LEFT ROADSIDE / BEACH SCENERY
                const sideX = this.vanishX + curveX - trackHalfW - 55 * scale - 15;
                ctx.translate(sideX, y);
                ctx.scale(scale, scale);

                if (sp.type % 2 === 0) {
                    // 1. Roadside Steel Post with Vertical Flame Banner (Screenshots 1 & 2)
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-3, -135, 6, 135); // Post
                    ctx.fillRect(-3, -135, 32, 5);  // Arm

                    // Red & Yellow Flame Banner
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(2, -130);
                    ctx.lineTo(28, -130);
                    ctx.lineTo(28, -60);
                    ctx.lineTo(15, -48);
                    ctx.lineTo(2, -60);
                    ctx.closePath();
                    ctx.fill();

                    // Gold Flame Graphic on Banner
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(15, -92, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(15, -92, 4, 0, Math.PI * 2);
                    ctx.fill();

                } else {
                    // 2. Tropical Wooden Beach Hut & Palm Tree (Screenshot 4)
                    // Wooden hut frame
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(-45, -75, 8, 75);
                    ctx.fillRect(15, -75, 8, 75);
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(-50, -45, 75, 45);

                    // Thatched straw roof
                    ctx.fillStyle = '#d97706';
                    ctx.beginPath();
                    ctx.moveTo(-60, -75);
                    ctx.lineTo(30, -75);
                    ctx.lineTo(-15, -115);
                    ctx.closePath();
                    ctx.fill();

                    // Palm fronds over roof
                    ctx.strokeStyle = '#78350f';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(25, 0); ctx.quadraticCurveTo(45, -60, 20, -125);
                    ctx.stroke();

                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.ellipse(20, -125, 38, 14, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else {
                // RIGHT ROADSIDE / TOWN SCENERY
                const townX = this.vanishX + curveX + trackHalfW + 65 * scale + 15;
                ctx.translate(townX, y);
                ctx.scale(scale, scale);

                if (sp.type % 2 === 0) {
                    // 1. Right Roadside Post with Vertical Flame Banner
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-3, -135, 6, 135);
                    ctx.fillRect(-32, -135, 32, 5);

                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(-28, -130);
                    ctx.lineTo(-2, -130);
                    ctx.lineTo(-2, -60);
                    ctx.lineTo(-15, -48);
                    ctx.lineTo(-28, -60);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(-15, -92, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(-15, -92, 4, 0, Math.PI * 2);
                    ctx.fill();

                } else {
                    // 2. Vibrant Beachside Cabana & Swaying Palm
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(-25, -90, 65, 90);
                    ctx.fillStyle = '#0284c7';
                    ctx.fillRect(-30, -95, 75, 14);

                    // Palm Tree
                    ctx.strokeStyle = '#78350f';
                    ctx.lineWidth = 10;
                    ctx.beginPath();
                    ctx.moveTo(35, 0); ctx.quadraticCurveTo(55, -55, 30, -120);
                    ctx.stroke();

                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.ellipse(30, -120, 36, 14, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    };

    TeacherGame.drawLobbyGraffitiTrain = function (ctx) {
        ctx.save();
        ctx.translate(480, 290);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-220, -120, 440, 130);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-220, -120, 440, 24);

        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-170 + i * 95, -90, 60, 45);
        }

        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(-0.04);

        ctx.font = '900 42px Bungee, Fredoka, sans-serif';
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 8;
        ctx.textAlign = 'center';
        ctx.strokeText('SUBWAY', 0, -10);
        ctx.fillText('SUBWAY', 0, -10);

        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 7;
        ctx.strokeText('SURF', 0, 30);
        ctx.fillText('SURF', 0, 30);
        ctx.restore();

        ctx.restore();
    };

    TeacherGame.drawLobbyJake = function (ctx) {
        const char = this.getCurrentChar();
        ctx.save();
        ctx.translate(480, 420);

        // Spray Cans Bag
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(18, -18, 40, 20, 6);
        ctx.fill();

        const canColors = ['#ef4444', '#10b981', '#f59e0b', '#38bdf8'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = canColors[i];
            ctx.fillRect(22 + i * 9, -28, 7, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(23 + i * 9, -32, 5, 4);
        }

        // Jake Character (Back View)
        ctx.fillStyle = char.pantsColor;
        ctx.fillRect(-10, -32, 9, 34);
        ctx.fillRect(2, -32, 9, 34);

        ctx.fillStyle = char.shirtColor;
        ctx.beginPath();
        ctx.roundRect(-18, -72, 36, 42, [8, 8, 3, 3]);
        ctx.fill();

        ctx.fillStyle = char.vestColor;
        ctx.fillRect(-18, -70, 10, 38);
        ctx.fillRect(8, -70, 10, 38);

        ctx.fillStyle = char.skinColor;
        ctx.beginPath();
        ctx.arc(0, -86, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = char.capColor;
        ctx.beginPath();
        ctx.arc(0, -88, 15, Math.PI * 0.7, Math.PI * 2.3);
        ctx.fill();
        ctx.fillRect(-18, -88, 10, 4);

        ctx.restore();
    };

    // =========================================================================
    // MULTI-CARRIAGE SUBWAY TRAIN & OBSTACLES 3D RENDERING
    // =========================================================================
    TeacherGame.drawObstacles = function (ctx) {
        // Sort obstacles by depth Z so distant obstacles render first
        const sortedObs = [...this.obstacles].sort((a, b) => a.z - b.z);

        for (let obs of sortedObs) {
            if (obs.type === 'subway_train') {
                this.drawMultiCarriageTrain(ctx, obs);
            } else {
                this.drawStandardObstacle(ctx, obs);
            }
        }
    };

    TeacherGame.drawStandardObstacle = function (ctx, obs) {
        if (obs.z < 0.04) return;
        const x = this.getLaneX(obs.lane, obs.z);
        const y = this.getScreenY(obs.z);
        const scale = this.getScale(obs.z);

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (obs.type === 'low_barrier') {
            // 3D Short Hurdle
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-40, -6, 12, 6);
            ctx.fillRect(28, -6, 12, 6);

            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-36, -42, 6, 38);
            ctx.fillRect(30, -42, 6, 38);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-42, -42, 84, 30);

            // White hazard stripes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-32, -12); ctx.lineTo(-20, -42); ctx.lineTo(-12, -42); ctx.lineTo(-24, -12);
            ctx.moveTo(-4, -12); ctx.lineTo(8, -42); ctx.lineTo(16, -42); ctx.lineTo(4, -12);
            ctx.moveTo(24, -12); ctx.lineTo(36, -42); ctx.lineTo(42, -42); ctx.lineTo(32, -12);
            ctx.fill();

            // Amber hazard lights
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(-34, -46, 5, 0, Math.PI * 2);
            ctx.arc(34, -46, 5, 0, Math.PI * 2);
            ctx.fill();

        } else if (obs.type === 'tunnel_arch') {
            // 3D High Barrier Gantry (Slide Under)
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-48, -105, 8, 105);
            ctx.fillRect(40, -105, 8, 105);

            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.roundRect(-52, -105, 104, 34, 6);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 13px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▼ SLIDE UNDER ▼', 0, -83);

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(-42, -108, 4, 0, Math.PI * 2);
            ctx.arc(42, -108, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    TeacherGame.drawMultiCarriageTrain = function (ctx, train) {
        const numCars = train.carriages || 3;
        const trainLength = train.length || 0.75;
        const carDepthSpan = trainLength / numCars;
        const trainStyle = train.trainStyle || 'lumber';
        const trainW = 88;
        const trainH = 135;

        // 1. Render Carriages from Rear (farthest, c = numCars - 1) down to Front (closest, c = 0)
        for (let c = numCars - 1; c >= 0; c--) {
            const carZ = train.z - c * carDepthSpan;
            if (carZ < 0.04 || carZ > 1.45) continue;

            const carX = this.getLaneX(train.lane, carZ);
            const carY = this.getScreenY(carZ);
            const carScale = this.getScale(carZ);
            const isFrontCar = (c === 0);

            ctx.save();
            ctx.translate(carX, carY);
            ctx.scale(carScale, carScale);

            if (trainStyle === 'lumber') {
                // =============================================================
                // LUMBER / BAMBOO FLATBED RAILCAR (Screenshot 4)
                // =============================================================
                // Bottom Chassis & Wheels
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(-trainW / 2 - 2, -22, trainW + 4, 22);

                // Wheel bogies & springs
                ctx.fillStyle = '#475569';
                ctx.fillRect(-trainW / 2 + 6, -14, 16, 12);
                ctx.fillRect(trainW / 2 - 22, -14, 16, 12);

                // Golden Wooden Flatbed Bed
                ctx.fillStyle = '#b47926';
                ctx.fillRect(-trainW / 2, -38, trainW, 18);
                ctx.fillStyle = '#d89b37';
                ctx.fillRect(-trainW / 2, -38, trainW, 6);

                // Side Wooden Stakes / Walls
                ctx.fillStyle = '#c68627';
                ctx.fillRect(-trainW / 2, -trainH + 40, 10, trainH - 78);
                ctx.fillRect(trainW / 2 - 10, -trainH + 40, 10, trainH - 78);

                // Wooden Stake posts
                ctx.fillStyle = '#9c621a';
                ctx.fillRect(-trainW / 2 - 1, -trainH + 35, 6, trainH - 70);
                ctx.fillRect(trainW / 2 - 5, -trainH + 35, 6, trainH - 70);

                // Massive Stack of Cylindrical Bamboo / Timber Logs
                const logRows = [
                    { y: -45, count: 5, r: 12 },
                    { y: -66, count: 4, r: 12 },
                    { y: -87, count: 3, r: 12 },
                    { y: -106, count: 2, r: 12 }
                ];

                for (let row of logRows) {
                    const spacing = 19;
                    const startX = -((row.count - 1) * spacing) / 2;
                    for (let i = 0; i < row.count; i++) {
                        const lx = startX + i * spacing;
                        const ly = row.y;

                        // Outer Bark / Log Body
                        const logColors = ['#748232', '#8ea03d', '#a38f3f', '#7e8a34'];
                        ctx.fillStyle = logColors[(i + c) % logColors.length];
                        ctx.beginPath();
                        ctx.arc(lx, ly, row.r, 0, Math.PI * 2);
                        ctx.fill();

                        // Cut Wood Concentric Rings
                        ctx.fillStyle = '#deb887';
                        ctx.beginPath();
                        ctx.arc(lx, ly, row.r - 2.5, 0, Math.PI * 2);
                        ctx.fill();

                        // Inner Core Ring & Bark Crack
                        ctx.strokeStyle = '#b08b53';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(lx, ly, row.r - 6, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.fillStyle = '#8a652a';
                        ctx.beginPath();
                        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Front Timber Headboard (on front car)
                if (isFrontCar) {
                    ctx.fillStyle = '#b47926';
                    ctx.fillRect(-trainW / 2 + 4, -trainH + 45, trainW - 8, 14);
                    ctx.fillStyle = '#d89b37';
                    ctx.fillRect(-trainW / 2 + 4, -trainH + 45, trainW - 8, 4);
                }

            } else {
                // =============================================================
                // COMMUTER MODERN SUBWAY TRAIN (Screenshots 1 & 2)
                // =============================================================
                // Bottom Chassis
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(-trainW / 2 - 2, -24, trainW + 4, 24);

                // Red Speed Stripe along skirt
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-trainW / 2, -38, trainW, 14);

                // Sleek Cream / White Carriage Body
                ctx.fillStyle = isFrontCar ? '#f8fafc' : '#f1f5f9';
                ctx.beginPath();
                ctx.roundRect(-trainW / 2, -trainH + 15, trainW, trainH - 53, [4, 4, 0, 0]);
                ctx.fill();

                // Curved Silver Metallic Roof
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.roundRect(-trainW / 2 - 2, -trainH - 2, trainW + 4, 24, [14, 14, 0, 0]);
                ctx.fill();
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-trainW / 2 - 2, -trainH + 18, trainW + 4, 4);

                if (isFrontCar) {
                    // Aerodynamic Cab Windshield
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.roundRect(-trainW / 2 + 10, -trainH + 24, trainW - 20, 46, [8, 8, 4, 4]);
                    ctx.fill();

                    // Windshield Blue Reflection
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(-24, -trainH + 30); ctx.lineTo(-8, -trainH + 62);
                    ctx.stroke();

                    // Circular Orange Flame Emblem on nose
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(0, -trainH + 82, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    ctx.arc(0, -trainH + 82, 5, 0, Math.PI * 2);
                    ctx.fill();

                    // Amber Projective Headlights
                    ctx.fillStyle = '#fef08a';
                    ctx.beginPath();
                    ctx.arc(-26, -30, 8, 0, Math.PI * 2);
                    ctx.arc(26, -30, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // Warm Headlight Glow Cone onto tracks
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
                    ctx.beginPath();
                    ctx.moveTo(-26, -30); ctx.lineTo(-75, 60); ctx.lineTo(75, 60); ctx.lineTo(26, -30);
                    ctx.closePath();
                    ctx.fill();

                } else {
                    // Panoramic Side Windows with Interior Warm Glow
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-35, -trainH + 30, 30, 40);
                    ctx.fillRect(5, -trainH + 30, 30, 40);

                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(-31, -trainH + 34, 22, 32);
                    ctx.fillRect(9, -trainH + 34, 22, 32);

                    // Passenger Silhouettes
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
                    ctx.beginPath();
                    ctx.arc(-20, -trainH + 46, 6, 0, Math.PI * 2);
                    ctx.arc(20, -trainH + 46, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        // 2. Render Front Sloped Ramp (Connects steel rails up to train roof in front of train!)
        if (train.hasRamp) {
            const rampLength = train.rampLength || 0.22;
            const rampTipZ = train.z + rampLength;

            if (rampTipZ > 0.04 && train.z < 1.4) {
                const botX = this.getLaneX(train.lane, rampTipZ);
                const botY = this.getScreenY(rampTipZ);
                const botScale = this.getScale(rampTipZ);

                const topX = this.getLaneX(train.lane, train.z);
                const topY = this.getScreenY(train.z) - (trainH - 35) * this.getScale(train.z);
                const topScale = this.getScale(train.z);

                const botHalfW = (trainW / 2 - 6) * botScale;
                const topHalfW = (trainW / 2 - 10) * topScale;

                ctx.save();

                if (trainStyle === 'lumber') {
                    // =========================================================
                    // LUMBER GOLDEN WOODEN PLANK RAMP WITH GREEN LEAVES (Screenshot 4)
                    // =========================================================
                    // Dark Underside Shadow
                    ctx.fillStyle = '#8c5220';
                    ctx.beginPath();
                    ctx.moveTo(botX - botHalfW, botY);
                    ctx.lineTo(botX + botHalfW, botY);
                    ctx.lineTo(topX + topHalfW, topY + 8 * topScale);
                    ctx.lineTo(topX - topHalfW, topY + 8 * topScale);
                    ctx.closePath();
                    ctx.fill();

                    // Main Golden Wooden Slanted Ramp
                    ctx.fillStyle = '#e0a33c';
                    ctx.beginPath();
                    ctx.moveTo(botX - botHalfW, botY);
                    ctx.lineTo(botX + botHalfW, botY);
                    ctx.lineTo(topX + topHalfW, topY);
                    ctx.lineTo(topX - topHalfW, topY);
                    ctx.closePath();
                    ctx.fill();

                    // Side Wooden Guard Rails
                    ctx.fillStyle = '#b57723';
                    ctx.beginPath();
                    ctx.moveTo(botX - botHalfW - 4 * botScale, botY);
                    ctx.lineTo(botX - botHalfW, botY);
                    ctx.lineTo(topX - topHalfW, topY);
                    ctx.lineTo(topX - topHalfW - 4 * topScale, topY);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(botX + botHalfW, botY);
                    ctx.lineTo(botX + botHalfW + 4 * botScale, botY);
                    ctx.lineTo(topX + topHalfW + 4 * topScale, topY);
                    ctx.lineTo(topX + topHalfW, topY);
                    ctx.closePath();
                    ctx.fill();

                    // Cross Wooden Plank Lines / Slats across the ramp
                    const plankSteps = 7;
                    for (let p = 1; p < plankSteps; p++) {
                        const t = p / plankSteps;
                        const px1 = (botX - botHalfW) * (1 - t) + (topX - topHalfW) * t;
                        const py1 = botY * (1 - t) + topY * t;
                        const px2 = (botX + botHalfW) * (1 - t) + (topX + topHalfW) * t;
                        const py2 = botY * (1 - t) + topY * t;

                        ctx.strokeStyle = '#9c621a';
                        ctx.lineWidth = 3 * (botScale * (1 - t) + topScale * t);
                        ctx.beginPath();
                        ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
                        ctx.stroke();

                        ctx.strokeStyle = '#f5ba6d';
                        ctx.lineWidth = 1.2 * (botScale * (1 - t) + topScale * t);
                        ctx.beginPath();
                        ctx.moveTo(px1, py1 - 2); ctx.lineTo(px2, py2 - 2);
                        ctx.stroke();
                    }

                    // Scattered Bright Green Tropical Leaves on the Ramp (Screenshot 4 replica!)
                    const leafPositions = [
                        { t: 0.22, xOff: -0.35, rot: -0.4, s: 1.0 },
                        { t: 0.38, xOff: 0.25, rot: 0.6, s: 1.2 },
                        { t: 0.58, xOff: -0.15, rot: -0.2, s: 1.1 },
                        { t: 0.72, xOff: 0.3, rot: 0.5, s: 0.9 },
                        { t: 0.85, xOff: -0.28, rot: -0.5, s: 0.8 }
                    ];

                    for (let lf of leafPositions) {
                        const t = lf.t;
                        const currHalfW = botHalfW * (1 - t) + topHalfW * t;
                        const lx = (botX * (1 - t) + topX * t) + lf.xOff * currHalfW;
                        const ly = botY * (1 - t) + topY * t;
                        const lScale = (botScale * (1 - t) + topScale * t) * lf.s;

                        ctx.save();
                        ctx.translate(lx, ly);
                        ctx.rotate(lf.rot);
                        ctx.scale(lScale, lScale);

                        // Jungle Green Palm Leaf
                        ctx.fillStyle = '#22c55e';
                        ctx.beginPath();
                        ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
                        ctx.fill();

                        // Darker green central vein
                        ctx.strokeStyle = '#15803d';
                        ctx.lineWidth = 1.4;
                        ctx.beginPath();
                        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
                        ctx.stroke();

                        ctx.restore();
                    }

                } else {
                    // =========================================================
                    // COMMUTER RED/WHITE CHEVRON RAMP (Screenshots 1 & 2)
                    // =========================================================
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.moveTo(botX - botHalfW, botY);
                    ctx.lineTo(botX + botHalfW, botY);
                    ctx.lineTo(topX + topHalfW, topY);
                    ctx.lineTo(topX - topHalfW, topY);
                    ctx.closePath();
                    ctx.fill();

                    // White Diagonal Chevrons (<<<)
                    const chevronSteps = 5;
                    for (let s = 1; s <= chevronSteps; s++) {
                        const t = s / (chevronSteps + 1);
                        const cy = botY * (1 - t) + topY * t;
                        const cx = botX * (1 - t) + topX * t;
                        const cw = (botHalfW * (1 - t) + topHalfW * t) * 0.75;
                        const sScale = botScale * (1 - t) + topScale * t;

                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - 8 * sScale);
                        ctx.lineTo(cx + cw, cy + 6 * sScale);
                        ctx.lineTo(cx + cw - 8 * sScale, cy + 6 * sScale);
                        ctx.lineTo(cx, cy - 2 * sScale);
                        ctx.lineTo(cx - cw + 8 * sScale, cy + 6 * sScale);
                        ctx.lineTo(cx - cw, cy + 6 * sScale);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Circular Flame Logo in center of ramp
                    const midT = 0.5;
                    const midX = botX * (1 - midT) + topX * midT;
                    const midY = botY * (1 - midT) + topY * midT;
                    const midScale = botScale * (1 - midT) + topScale * midT;

                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 14 * midScale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 9 * midScale, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }
    };

    TeacherGame.drawCollectibles = function (ctx) {
        // Gold Coins
        for (let coin of this.coinsList) {
            if (coin.collected || coin.z < 0.05) continue;
            const x = this.getLaneX(coin.lane, coin.z);
            const y = this.getScreenY(coin.z) - (coin.inAir ? 215 : (coin.onTrain ? 110 : 0)) - (coin.jumpArc ? Math.sin(Math.min(1, Math.max(0, coin.z * 1.2))) * 85 : 25);
            const scale = this.getScale(coin.z);

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Outer coin rim
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
            // Shiny gold center
            ctx.fillStyle = '#fef08a';
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
            // Star emboss
            ctx.fillStyle = '#d97706';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 0, 0);

            ctx.restore();
        }

        // Power-ups (Jetpack Bullet, Sneakers, Magnet, 2X)
        for (let pw of this.powerupsList) {
            if (pw.collected || pw.z < 0.05) continue;
            const x = this.getLaneX(pw.lane, pw.z);
            const y = this.getScreenY(pw.z) - (pw.onTrain ? 110 : 0) - 30;
            const scale = this.getScale(pw.z);

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();

            if (pw.type === 'bullet') {
                ctx.font = '32px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🚀', 0, 0);
            } else if (pw.type === 'sneakers') {
                ctx.font = '32px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('👟', 0, 0);
            } else if (pw.type === 'magnet') {
                ctx.font = '32px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🧲', 0, 0);
            } else if (pw.type === 'double') {
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Fredoka';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('2X', 0, 0);
            }
            ctx.restore();
        }

        // Daily Letter Pickups
        for (let letObj of this.letterPickups) {
            if (letObj.collected || letObj.z < 0.05) continue;
            const x = this.getLaneX(letObj.lane, letObj.z);
            const y = this.getScreenY(letObj.z) - 35;
            const scale = this.getScale(letObj.z);

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            ctx.fillStyle = '#0284c7';
            ctx.beginPath(); ctx.roundRect(-18, -22, 36, 44, 8); ctx.fill();
            ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.stroke();

            ctx.font = 'bold 22px Fredoka, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letObj.letter, 0, 0);

            ctx.restore();
        }

        // Weekly Hunt Flamingo Pickups
        for (let flam of this.flamingoPickups) {
            if (flam.collected || flam.z < 0.05) continue;
            const x = this.getLaneX(flam.lane, flam.z);
            const y = this.getScreenY(flam.z) - 35;
            const scale = this.getScale(flam.z);

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦩', 0, 0);

            ctx.restore();
        }
    };

    TeacherGame.drawInspectorAndDog = function (ctx) {
        if (this.gameState !== 'running') return;

        const g = this.guard;
        const cycle = g.runCycle;
        const guardY = this.player.y + g.distOffset;

        ctx.save();
        ctx.translate(g.x, guardY);

        // 1. Guard (Inspector) in Blue Uniform
        const legAngle = Math.sin(cycle) * 0.7;
        ctx.save();
        ctx.translate(-8, -32); ctx.rotate(legAngle);
        ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-5, 0, 10, 32);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, 28, 12, 6);
        ctx.restore();

        ctx.save();
        ctx.translate(8, -32); ctx.rotate(-legAngle);
        ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-5, 0, 10, 32);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, 28, 12, 6);
        ctx.restore();

        // Inspector Body
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath(); ctx.roundRect(-18, -75, 36, 44, [8, 8, 4, 4]); ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.fillRect(-18, -42, 36, 8); // Belt
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-4, -42, 8, 8); // Buckle

        // Head & Police Cap
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath(); ctx.arc(0, -90, 15, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath(); ctx.arc(0, -94, 16, Math.PI * 0.7, Math.PI * 2.3); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-16, -94, 10, 5);

        // 2. Dog running next to Inspector
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.ellipse(26, -14, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.fillRect(18, -18, 16, 4);

        ctx.restore();
    };

    /**
     * REALISTIC 3D JAKE / RUNNER CHARACTER RENDERING
     */
    TeacherGame.drawRunner = function (ctx) {
        const char = this.getCurrentChar();
        const p = this.player;
        const cycle = p.runCycle;
        const isSliding = p.isSliding;
        const isJumping = !p.isGrounded;
        const totalHeightOffset = -p.jumpY;

        // 1. Dynamic 3D Ground Shadow beneath Player
        const groundShadowY = p.y - (p.onTrain ? p.trainRoofHeight : 0);
        const shadowHeightRatio = Math.max(0.2, 1 - (p.jumpY - (p.onTrain ? p.trainRoofHeight : 0)) / 220);
        ctx.save();
        ctx.translate(p.x, groundShadowY + 2);
        ctx.fillStyle = `rgba(15, 23, 42, ${0.45 * shadowHeightRatio})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26 * shadowHeightRatio, 9 * shadowHeightRatio, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Main 3D Runner Rendering
        ctx.save();
        ctx.translate(p.x, p.y + totalHeightOffset);
        ctx.rotate(p.tilt);

        if (p.isFlipping) {
            ctx.translate(0, -45); ctx.rotate(p.flipAngle); ctx.translate(0, 45);
        }

        // Hoverboard underneath runner
        if (this.hoverboardActive) {
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.roundRect(-30, -6, 60, 12, 6);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#fde047';
            ctx.fillRect(-20, -3, 40, 6);

            // Jet thruster flame
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-26, 0); ctx.lineTo(-38, 0); ctx.lineTo(-28, 6);
            ctx.fill();
        }

        // Shield / Invincibility Glow Bubble
        if (p.invincibleTimer > 0) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.arc(0, -42, 50, 0, Math.PI * 2); ctx.stroke();
        }

        // Magnet Aura Glow & 3D Horseshoe Magnet above Head
        if (this.activePowerUps.magnet > 0) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, -42, 56, 0, Math.PI * 2); ctx.stroke();

            // Floating Horseshoe Magnet
            ctx.save();
            ctx.translate(0, -100);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 13, Math.PI, 0, false);
            ctx.stroke();
            // Silver magnetic poles
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-13, 0); ctx.lineTo(-13, 7);
            ctx.moveTo(13, 0); ctx.lineTo(13, 7);
            ctx.stroke();
            ctx.restore();
        }

        // Jetpack Thruster Units on back when flying with Bullet
        if (this.isFlyingBullet || this.activePowerUps.bullet > 0) {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-24, -66, 9, 30);
            ctx.fillRect(15, -66, 9, 30);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-24, -66); ctx.lineTo(-19.5, -76); ctx.lineTo(-15, -66); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(15, -66); ctx.lineTo(19.5, -76); ctx.lineTo(24, -66); ctx.fill();
            // Jet thruster flames
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-23, -36); ctx.lineTo(-19.5, -20); ctx.lineTo(-16, -36); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(16, -36); ctx.lineTo(19.5, -20); ctx.lineTo(23, -36); ctx.fill();
        }

        if (isSliding) {
            // Low-Profile Ground Slide Animation
            ctx.save();
            ctx.translate(0, -18);

            ctx.fillStyle = char.shirtColor;
            ctx.beginPath();
            ctx.roundRect(-24, -14, 48, 22, 6);
            ctx.fill();

            ctx.fillStyle = char.vestColor;
            ctx.fillRect(-24, -14, 14, 22);

            ctx.fillStyle = char.pantsColor;
            ctx.fillRect(-6, -4, 30, 16);

            ctx.fillStyle = char.shoeColor;
            ctx.fillRect(20, 2, 14, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(20, 7, 14, 3);

            ctx.fillStyle = char.skinColor;
            ctx.beginPath(); ctx.arc(-22, -18, 13, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = char.capColor;
            ctx.beginPath(); ctx.arc(-22, -20, 14, Math.PI * 0.7, Math.PI * 2.3); ctx.fill();
            ctx.fillRect(-32, -20, 10, 4);

            ctx.restore();

        } else if (isJumping) {
            // Mid-Air Jump Pose
            const jumpAirCycle = Math.min(1, Math.abs(p.jumpVy) / 800);

            // Left Leg (Bent forward)
            ctx.save();
            ctx.translate(-10, -28); ctx.rotate(-0.5 + jumpAirCycle * 0.3);
            ctx.fillStyle = char.pantsColor; ctx.fillRect(-5, 0, 10, 24);
            ctx.fillStyle = char.shoeColor; ctx.fillRect(-6, 20, 13, 7);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 25, 13, 3);
            ctx.restore();

            // Right Leg (Tucked up)
            ctx.save();
            ctx.translate(10, -28); ctx.rotate(0.6 - jumpAirCycle * 0.2);
            ctx.fillStyle = char.pantsColor; ctx.fillRect(-5, 0, 10, 20);
            ctx.fillStyle = char.shoeColor; ctx.fillRect(-6, 16, 13, 7);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 21, 13, 3);
            ctx.restore();

            // Torso & Hoodie
            ctx.save();
            ctx.translate(0, -66);
            ctx.fillStyle = char.shirtColor;
            ctx.beginPath(); ctx.roundRect(-17, 0, 34, 40, [8, 8, 3, 3]); ctx.fill();

            ctx.fillStyle = char.vestColor;
            ctx.fillRect(-17, 2, 10, 36); ctx.fillRect(7, 2, 10, 36);

            // Backpack
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-12, 6, 24, 22);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(-9, 0, 6, 8);
            ctx.fillStyle = '#0284c7'; ctx.fillRect(3, 0, 6, 8);

            // Arms flared out
            ctx.fillStyle = char.skinColor;
            ctx.fillRect(-24, 8, 8, 18);
            ctx.fillRect(16, 8, 8, 18);

            // Head & Cap
            ctx.fillStyle = char.skinColor;
            ctx.beginPath(); ctx.arc(0, -14, 14, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = char.capColor;
            ctx.beginPath(); ctx.arc(0, -16, 15, Math.PI * 0.7, Math.PI * 2.3); ctx.fill();
            ctx.fillRect(-17, -16, 10, 4);
            ctx.restore();

        } else {
            // Dynamic 3D Running Animation
            const hipBob = Math.abs(Math.sin(cycle * 2)) * 6;
            const leftLegAngle = Math.sin(cycle) * 0.7;
            const rightLegAngle = Math.sin(cycle + Math.PI) * 0.7;

            // 3D Legs
            ctx.save();
            ctx.translate(-9, -28 - hipBob); ctx.rotate(leftLegAngle);
            ctx.fillStyle = char.pantsColor; ctx.fillRect(-5, 0, 10, 30);
            ctx.fillStyle = char.shoeColor; ctx.fillRect(-6, 27, 13, 7);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 32, 13, 3);
            ctx.restore();

            ctx.save();
            ctx.translate(9, -28 - hipBob); ctx.rotate(rightLegAngle);
            ctx.fillStyle = char.pantsColor; ctx.fillRect(-5, 0, 10, 30);
            ctx.fillStyle = char.shoeColor; ctx.fillRect(-6, 27, 13, 7);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 32, 13, 3);
            ctx.restore();

            // 3D Torso & Hoodie
            ctx.save();
            ctx.translate(0, -66 - hipBob);
            ctx.fillStyle = char.shirtColor;
            ctx.beginPath(); ctx.roundRect(-17, 0, 34, 40, [8, 8, 3, 3]); ctx.fill();

            ctx.fillStyle = char.vestColor;
            ctx.fillRect(-17, 2, 10, 36); ctx.fillRect(7, 2, 10, 36);

            // Backpack with spray cans
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-12, 6, 24, 22);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(-9, 0, 6, 8);
            ctx.fillStyle = '#0284c7'; ctx.fillRect(3, 0, 6, 8);

            // 3D Pumping Arms
            const leftArmAngle = Math.sin(cycle + Math.PI) * 0.6;
            const rightArmAngle = Math.sin(cycle) * 0.6;

            ctx.save();
            ctx.translate(-18, 6); ctx.rotate(leftArmAngle);
            ctx.fillStyle = char.skinColor; ctx.fillRect(-3, 0, 7, 24);
            ctx.restore();

            ctx.save();
            ctx.translate(18, 6); ctx.rotate(rightArmAngle);
            ctx.fillStyle = char.skinColor; ctx.fillRect(-4, 0, 7, 24);
            // Spray can in hand
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(-3, 20, 8, 14);
            ctx.restore();

            // Head & Backward Baseball Cap
            ctx.fillStyle = char.skinColor;
            ctx.beginPath(); ctx.arc(0, -14, 14, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = char.capColor;
            ctx.beginPath(); ctx.arc(0, -16, 15, Math.PI * 0.7, Math.PI * 2.3); ctx.fill();
            ctx.fillRect(-17, -16, 10, 4);
            ctx.restore();
        }

        ctx.restore();
    };

    TeacherGame.drawParticlesAndTexts = function (ctx) {
        for (let p of this.particles) {
            ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        for (let c of this.confetti) {
            ctx.save(); ctx.globalAlpha = c.alpha; ctx.translate(c.x, c.y); ctx.rotate(c.rot);
            ctx.fillStyle = c.color; ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            ctx.restore();
        }
        for (let ft of this.floatTexts) {
            ctx.save(); ctx.globalAlpha = ft.alpha; ctx.fillStyle = ft.color;
            ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    };

    // =========================================================================
    // DEVELOPER DEBUG OVERLAY (F3 / ~)
    // =========================================================================
    TeacherGame.drawDebugOverlay = function (ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.fillRect(10, 10, 260, 210);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, 260, 210);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('--- RUNNER DEBUG INFO (F3) ---', 20, 28);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(`FPS: ${this.fps}`, 20, 48);
        ctx.fillText(`Speed: ${this.speed.toFixed(2)}x`, 20, 64);
        ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, 20, 80);
        ctx.fillText(`Player Lane: ${this.player.targetLane} (0:L, 1:C, 2:R)`, 20, 96);
        ctx.fillText(`Player X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`, 20, 112);
        ctx.fillText(`Jump Y: ${Math.round(this.player.jumpY)}, Vy: ${Math.round(this.player.jumpVy)}`, 20, 128);
        ctx.fillText(`onTrain: ${this.player.onTrain}`, 20, 144);
        ctx.fillText(`isSliding: ${this.player.isSliding}`, 20, 160);
        ctx.fillText(`Obstacles in memory: ${this.obstacles.length}`, 20, 176);
        ctx.fillText(`Coins in memory: ${this.coinsList.length}`, 20, 192);
        ctx.fillText(`Hoverboard: ${this.hoverboardActive ? this.hoverboardTimer.toFixed(1) + 's' : 'OFF'}`, 20, 208);

        // Draw collision wireframe around player
        const pHitW = this.player.isSliding ? this.player.slideWidth : this.player.normalWidth;
        const pHitH = this.player.isSliding ? this.player.slideHeight : this.player.normalHeight;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.player.x - pHitW / 2, this.player.y - this.player.jumpY - pHitH, pHitW, pHitH);

        ctx.restore();
    };

    // =========================================================================
    // GLOBAL EXPORT & INITIALIZATION
    // =========================================================================
    window.TeacherGame = TeacherGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TeacherGame.init());
    } else {
        TeacherGame.init();
    }
})();
