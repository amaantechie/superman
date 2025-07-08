// Game constants
let boardWidth = 360;
let boardHeight = 640;
let context;
let uiContext;
let homepage = document.getElementById("homepage");
let board = document.getElementById("board");
let ui = document.getElementById("ui");
let startBtn = document.getElementById("start-btn");
let restartBtn = document.getElementById("restart-btn");
let soundBtnPause = document.getElementById("sound-btn-pause");
let muteBtnPause = document.getElementById("mute-btn-pause");
let pauseOverlay = document.getElementById("pause-overlay");
let resumeBtn = document.getElementById("resume-btn");
let powerUpImg = new Image();
let enemyImg = new Image();
let shieldActive = false;
let shieldDuration = 5000; // 5 seconds
let shieldEndTime = 0;
let powerUpArray = [];
let lastPowerUpSpawn = 0;
let powerUpSpawnInterval = 10000; // 10 seconds
let enemyArray = [];
let enemySpawnInterval = 4000; // 4 seconds
let lastEnemySpawn = 0;
let baseEnemySpeed = -4;
let enemySpeedIncrease = -0.5;
let maxEnemySpeed = -8;
const MAX_DIFFICULTY_LEVEL = 5;
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200;


// Superman
let SupermanWidth = 74.8;
let SupermanHeight = 32.4;
let SupermanX = boardWidth / 8;
let SupermanY = boardHeight / 2;
let SupermanImg;

let Superman = {
    x: SupermanX,
    y: SupermanY,
    width: SupermanWidth,
    height: SupermanHeight
};

// Pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

// Difficulty parameters
let basePipeInterval = 1700;
let minPipeInterval = 900;
let maxPipeInterval = 1720;
let basePipeGap = boardHeight / 3.2;
let minPipeGap = 90;
let baseVelocityX = -2;
let maxVelocityX = -6;
let levelSpeedIncrease = -0.5;
let baseObstacleChance = 0.1;
let obstacleIncreasePerLevel = 0.05;

// Images
let topPipeImg;
let bottomPipeImg;
let newTopPipeImg;
let newBottomPipeImg;
let gameOverImg;
let yourScoreImg;
let highScoreImg;
let collisionImg;

// Game variables
let velocityX = baseVelocityX;
let velocityY = 0;
let gravity = 0.4;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("supermanHighScore")) || 0;
let gameStarted = false;
let pipeInterval = null;
let animationFrameId = null;
let currentLevel = 0;
let lastLevelCheckpoint = 0;
let countdown = 3;
let isCountdownActive = false;
let lastPipeGap = { top: 0, bottom: 0 }; // Stores the Y-range of the pipe gap


// Level animation
let isLevelAnimating = false;
let levelAnimationStartTime = 0;
const levelAnimationDuration = 1000;

// Sound elements
let bgMusic = new Audio('./sound/bg.mp3');
let flySound = new Audio('./sound/fly.mp3');
let hitSound = new Audio('./sound/hit.mp3');
let soundEnabled = true;
let isPaused = false;

// UI elements
const pauseBtn = document.getElementById("pause-btn");
const playBtn = document.getElementById("play-btn");
const soundBtnHome = document.getElementById("sound-btn-home");
const muteBtnHome = document.getElementById("mute-btn-home");
const soundBtnGameover = document.getElementById("sound-btn-gameover");
const muteBtnGameover = document.getElementById("mute-btn-gameover");

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    let uiCanvas = document.getElementById("ui");
    uiCanvas.height = boardHeight;
    uiCanvas.width = boardWidth;
    uiContext = uiCanvas.getContext("2d");

    // Load images
    powerUpImg.src = "./images/powerups.png";
    enemyImg.src = "./images/enemy.png";
    SupermanImg = new Image();
    SupermanImg.src = "./images/superman1.png";
    topPipeImg = new Image();
    topPipeImg.src = "./images/toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./images/bottompipe.png";
    newTopPipeImg = new Image();
    newTopPipeImg.src = "./images/pipe11.png";
    newBottomPipeImg = new Image();
    newBottomPipeImg.src = "./images/pipe1.png";
    gameOverImg = new Image();
    gameOverImg.src = "./images/gameover.png";
    highScoreImg = new Image();
    highScoreImg.src = "./images/highscore.png";
    collisionImg = new Image();
    collisionImg.src = "./images/collision.png";

    // Initialize sound
    bgMusic.loop = true;
    updateSoundDisplay();

    // Setup event listeners
    setupEventListeners();
    showHomepage();
};

    function setupEventListeners() {
    // Setup buttons with both mouse and touch support
    setupButton(startBtn, startGame);
    setupButton(restartBtn, restartGame);
    setupButton(pauseBtn, pauseGame);
    setupButton(playBtn, resumeGame);
    setupButton(resumeBtn, resumeGame);
    setupButton(soundBtnHome, toggleSound);
    setupButton(muteBtnHome, toggleSound);
    setupButton(soundBtnGameover, toggleSound);
    setupButton(muteBtnGameover, toggleSound);
    setupButton(soundBtnPause, toggleSound);
    setupButton(muteBtnPause, toggleSound);

    // Keyboard controls
    document.addEventListener("keydown", handleKeyPress);
    
    // Touch controls
    document.addEventListener("touchstart", handleTouch, { passive: false });
    board.addEventListener("touchstart", handleGameTouch, { passive: false });
}

function setupButton(button, callback) {
    if (!button) return;
    
    // Remove existing event listeners to avoid duplicates
    button.removeEventListener("click", callback);
    button.removeEventListener("touchend", callback);
    
    // Add both mouse and touch events
    button.addEventListener("click", callback);
    button.addEventListener("touchend", function(e) {
        e.preventDefault();
        callback();
    });
    
    // Visual feedback for touch
    button.addEventListener("touchstart", function() {
        button.classList.add("button-active");
    });
    button.addEventListener("touchend", function() {
        button.classList.remove("button-active");
    });
}

function handleGameTouch(e) {
    if (!gameStarted || gameOver || isPaused || isCountdownActive) return;
    
    e.preventDefault();
    velocityY = -6;
    if (soundEnabled) {
        flySound.currentTime = 0;
        flySound.play();
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    
    // Update only relevant controls based on current screen
    if (gameOver) {
        soundBtnGameover.style.display = soundEnabled ? "block" : "none";
        muteBtnGameover.style.display = soundEnabled ? "none" : "block";
    } else if (isPaused) {
        soundBtnPause.style.display = soundEnabled ? "block" : "none";
        muteBtnPause.style.display = soundEnabled ? "none" : "block";
    } else if (!gameStarted) {
        soundBtnHome.style.display = soundEnabled ? "block" : "none";
        muteBtnHome.style.display = soundEnabled ? "none" : "block";
    }

    if (soundEnabled) bgMusic.play();
    else bgMusic.pause();
}

function updateSoundDisplay() {
    const showSound = soundEnabled;
    soundBtnHome.style.display = showSound ? "block" : "none";
    muteBtnHome.style.display = showSound ? "none" : "block";
    soundBtnGameover.style.display = showSound ? "block" : "none";
    muteBtnGameover.style.display = showSound ? "none" : "block";
}

function pauseGame() {
    if (!gameStarted || gameOver) return;

    isPaused = true;
    pauseOverlay.style.display = "flex";
    pauseBtn.style.display = "none";
    playBtn.style.display = "block";
    soundBtnPause.style.display = soundEnabled ? "block" : "none";
    muteBtnPause.style.display = soundEnabled ? "none" : "block";
    bgMusic.pause();
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipeInterval);
}


function resumeGame() {
    isPaused = false;
    pauseOverlay.style.display = "none";
    pauseBtn.style.display = "block";
    playBtn.style.display = "none";
    if (soundEnabled) bgMusic.play();
    pipeInterval = setDynamicPipeInterval();
    requestAnimationFrame(update);
}


function startGame() {
    gameOver = false;
    gameStarted = true;
    score = 0;
    currentLevel = 0;
    lastLevelCheckpoint = 0;
    velocityX = baseVelocityX;
    velocityY = 0;
    Superman.y = SupermanY;
    pipeArray = [];
    isLevelAnimating = false;
    

    // Hide/show elements
    homepage.style.display = "none";
    board.style.display = "block";
    ui.style.display = "block";
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    pauseBtn.style.display = "none";
    soundBtnHome.style.display = "none";
    muteBtnHome.style.display =  "none";

    // Start countdown
    isCountdownActive = true;
    countdown = 3;
    animateCountdown();
}

function animateCountdown() {
    if (!isCountdownActive) return;

    // Clear canvases
    context.clearRect(0, 0, board.width, board.height);
    uiContext.clearRect(0, 0, board.width, board.height);

    // Draw Superman
    context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height);

    // Animate countdown number
    const fontSize = 100 + (50 * (countdown - Math.floor(countdown)));
    const alpha = 1 - (countdown - Math.floor(countdown));
    
    uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    uiContext.font = `bold ${fontSize}px Arial`;
    uiContext.textAlign = "center";
    uiContext.fillText(Math.ceil(countdown).toString(), boardWidth/2, boardHeight/2);

    countdown -= 0.016; // Decrement by ~1/60th of a second

    if (countdown <= 0) {
        isCountdownActive = false;
        gameStarted = true;
        pauseBtn.style.display = "block";

        if (soundEnabled) bgMusic.play();
        pipeInterval = setDynamicPipeInterval();
        requestAnimationFrame(update);
    } else {
        requestAnimationFrame(animateCountdown);
    }
}

function update() {
    if (!gameStarted || gameOver || isPaused || isCountdownActive) return;
    animationFrameId = requestAnimationFrame(update);
    

    context.clearRect(0, 0, board.width, board.height);
    uiContext.clearRect(0, 0, board.width, board.height);

    currentLevel = Math.floor(score / 15);
    if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
        isLevelAnimating = true;
        levelAnimationStartTime = Date.now();
        updateDifficulty();
    }

    // UI elements
    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    uiContext.fillRect(0, 0, boardWidth, 50);
    uiContext.fillStyle = "#FFD700";
    uiContext.font = "16px Arial";
    uiContext.textAlign = "center";
    uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30);
    uiContext.textAlign = "center";
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2 , 30);

    // Superman physics
    velocityY += gravity;
    Superman.y = Math.max(Superman.y + velocityY, 0);
    context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height);

    if (Superman.y > board.height) endGame();

    // Pipe handling
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(Superman, pipe)) {
            // Draw collision image 1x the size of Superman, centered on Superman
            drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height);

            endGame(pipe);
        }
        
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    if (currentLevel !== lastLevelCheckpoint) {
        lastLevelCheckpoint = currentLevel;
        if (pipeInterval) clearInterval(pipeInterval);
        pipeInterval = setDynamicPipeInterval();
    }

    // Score display
    uiContext.fillStyle = "#FFD700";
    uiContext.font = "bold 45px 'Arial Black'";
    uiContext.textAlign = "center";
    uiContext.fillText(Math.floor(score), boardWidth / 2, 100);

    // Level animation
    if (isLevelAnimating) {
        const elapsed = Date.now() - levelAnimationStartTime;
        const progress = Math.min(elapsed / levelAnimationDuration, 1);
        uiContext.save();
        uiContext.textAlign = "center";
        uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`;
        uiContext.font = `bold ${40 + (20 * (1 - progress))}px Arial`;
        uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2);
        uiContext.restore();
        if (progress >= 1) isLevelAnimating = false;
    }


    // Handle shield
    if (shieldActive && Date.now() > shieldEndTime) {
        shieldActive = false;
    }

    // Draw shield if active
// Handle shield with flashing warning
if (shieldActive) {
    const timeLeft = shieldEndTime - Date.now();
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0;

    const shieldSize = 50;

    if (!isFlashing) {
        context.drawImage(powerUpImg,
            Superman.x - (shieldSize - Superman.width) / 2,
            Superman.y - (shieldSize - Superman.height) / 2,
            shieldSize,
            shieldSize
        );
    } else {
        // Optional flash effect using lower opacity
        context.globalAlpha = 0.5;
        context.drawImage(powerUpImg,
            Superman.x - (shieldSize - Superman.width) / 2,
            Superman.y - (shieldSize - Superman.height) / 2,
            shieldSize,
            shieldSize
        );
        context.globalAlpha = 1.0; // Reset transparency
    }

    // Auto-disable shield
    if (timeLeft <= 0) {
        shieldActive = false;
    }
}


    // Handle powerups
    for (let i = powerUpArray.length - 1; i >= 0; i--) {
        let p = powerUpArray[i];
        p.x += velocityX;
        context.drawImage(p.img, p.x, p.y, p.width, p.height);
        
        if (detectCollision(Superman, p)) {
            shieldActive = true;
            shieldEndTime = Date.now() + shieldDuration;
            powerUpArray.splice(i, 1);
        }
        
        if (p.x < -p.width) powerUpArray.splice(i, 1);
    }

    // Handle enemies
    for (let i = enemyArray.length - 1; i >= 0; i--) {
        let e = enemyArray[i];
        e.x += e.speed ;
        context.drawImage(e.img, e.x, e.y, e.width, e.height);
        
        if (!shieldActive && detectCollision(Superman, e)) {
            // Draw collision image 1x the size of Superman, centered on Superman
            drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height);

            endGame();
        }
        
        
        
        if (e.x < -e.width) enemyArray.splice(i, 1);
    }

    const now = Date.now();

if (now - lastPowerUpSpawn > powerUpSpawnInterval) {
    spawnPowerUp();
    lastPowerUpSpawn = now;
}

if (now - lastEnemySpawn > enemySpawnInterval) {
    spawnEnemy();
    lastEnemySpawn = now;
}

}

function updateDifficulty() {
    // Cap level at MAX_DIFFICULTY_LEVEL for speed calculations
    const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL);
    velocityX = baseVelocityX + (levelSpeedIncrease * effectiveLevel);
    velocityX = Math.max(maxVelocityX, velocityX);
}

function placePipes() {
    if (gameOver || !gameStarted) return;
    const currentGap = basePipeGap;
    let minPipeY = -pipeHeight + 50; // Original minimum Y position
    let maxPipeY = 0 - currentGap - 150; // Original maximum Y position
    let randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY;

    let gapTopY = randomPipeY + pipeHeight;
let gapBottomY = gapTopY + basePipeGap;
lastPipeGap = { top: gapTopY, bottom: gapBottomY }; // Save the current gap


    let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel;
    obstacleChance = Math.min(obstacleChance, 0.75);

    // Restore original pipe type logic
    let topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";
    let bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";

    let topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg;
    let bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg;

    pipeArray.push({
        img: topImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    });

    pipeArray.push({
        img: bottomImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + currentGap,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    });
}

function setDynamicPipeInterval() {
    // Cap level at MAX_DIFFICULTY_LEVEL for interval calculation
    const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL);
    
    // Calculate interval with capped level
    let interval = basePipeInterval - (effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL);
    
    // Ensure minimum interval
    interval = Math.max(interval, minPipeInterval);
    
    return setInterval(placePipes, interval);
}

function handleKeyPress(e) {
    
    if (e.code === "KeyM") toggleSound();
    if (isCountdownActive) return;
    if (e.code === "KeyP" && !gameOver) {
        if (isPaused) resumeGame();
        else pauseGame();
    }
    if (!gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
        startGame();
        return;
    }

    if (gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
        velocityY = -6;
        if (soundEnabled) {
            flySound.currentTime = 0;
            flySound.play();
        }
    }

    if (gameOver && e.code === "Enter") restartGame();
}

function handleTouch(e) {
    e.preventDefault(); // prevent scrolling on mobile

    if (isCountdownActive) return;

    // Start game if not started yet
    if (!gameStarted && !gameOver) {
        startGame();
        return;
    }

    // If game is over, restart
    if (gameOver) {
        restartGame();
        return;
    }

    // Fly action
    if (gameStarted && !gameOver && !isPaused) {
        velocityY = -6;
        if (soundEnabled) {
            flySound.currentTime = 0;
            flySound.play();
        }
    }

    // If game is paused, resume
    if (isPaused) {
        resumeGame();
    }
}


function restartGame() {
    if (pipeInterval) {
        clearInterval(pipeInterval);
        pipeInterval = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    gameOver = false;
    gameStarted = false;
    score = 0;
    currentLevel = 0;
    lastLevelCheckpoint = 0;
    velocityX = baseVelocityX;
    velocityY = 0;
    Superman.y = SupermanY;
    pipeArray = [];
    isLevelAnimating = false;
    shieldActive = false;
    powerUpArray = [];
    enemyArray = [];

    context.clearRect(0, 0, board.width, board.height);
    uiContext.clearRect(0, 0, board.width, board.height);

    if (soundEnabled) bgMusic.play();
    showHomepage();
    document.getElementById("powerup-count").textContent = "Double Jumps: 0";
}

function endGame() {
    gameOver = true;
    // highScore = Math.max(highScore, Math.floor(score));

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("supermanHighScore", highScore);
    }


    // Hide the pause button after the game ends
    pauseBtn.style.display = "none";  // Hide the pause button

    // Keep board visible for background
    board.style.display = "block";  // Changed from "none"
    homepage.style.display = "none";
    
    // Show UI canvas and game over elements
    ui.style.display = "block";
    restartBtn.style.display = "block";
    
    // Clear and redraw UI
    uiContext.clearRect(0, 0, board.width, board.height);
    
    // Draw semi-transparent overlay
    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)";  // Reduced opacity to 50%
    uiContext.fillRect(0, 0, boardWidth, boardHeight);
    
    const centerX = boardWidth / 2;
    
    // Game Over Image
    uiContext.drawImage(gameOverImg, centerX - 225, 95, 450, 200);
    
    // Scores
    uiContext.fillStyle = "#FFD700";
    uiContext.font = "bold 45px 'Arial Black'";
    uiContext.textAlign = "center";
    uiContext.fillText(Math.floor(score), centerX, 100);
    
    // High Score
    uiContext.drawImage(highScoreImg, centerX - 110, 280, 150, 80);
    uiContext.fillText(highScore, centerX + 75, 330);

    // Sound controls
    soundBtnGameover.style.display = soundEnabled ? "block" : "none";
    muteBtnGameover.style.display = soundEnabled ? "none" : "block";

    // Stop game elements
    if (pipeInterval) clearInterval(pipeInterval);
    bgMusic.pause();
    
    if (soundEnabled) {
        hitSound.currentTime = 0;
        hitSound.play();
    }
    document.getElementById("powerup-count").style.display = "none";
}

// New helper functions
function spawnPowerUp() {
    powerUpArray.push({
        img: powerUpImg,
        x: boardWidth,
        y: Math.random() * (boardHeight - 40),
        width: 40,
        height: 40
    });
}

function spawnEnemy() {
    let enemyHeight = 40;
    let y;
    let tries = 0;

    // Retry logic to avoid spawning in the pipe gap
    do {
        y = Math.random() * (boardHeight - enemyHeight);
        tries++;
    } while (
        lastPipeGap &&
        y + enemyHeight > lastPipeGap.top &&
        y < lastPipeGap.bottom &&
        tries < 10
    );

    let speed = baseEnemySpeed + (enemySpeedIncrease * currentLevel);
    speed = Math.max(maxEnemySpeed, speed);
    speed += (Math.random() - 0.5); // Small random variation

    enemyArray.push({
        img: enemyImg,
        x: boardWidth,
        y: y,
        width: 60,
        height: enemyHeight,
        speed: speed
    });
}


// Modified collision detection
function detectCollision(a, b) {
    if (shieldActive) return false; // No collisions when shield is active
    
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function drawCollisionEffect(x, y, width, height) {
    let scale = 1;
    let collisionW = width * scale;
    let collisionH = height * scale;
    let collisionX = x + (width - collisionW) / 2;
    let collisionY = y + (height - collisionH) / 2;
    context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH);
}


function showHomepage() {
    // Reset all displays
    homepage.style.display = "block";
    board.style.display = "none";
    ui.style.display = "none";
    startBtn.style.display = "block";
    restartBtn.style.display = "none";
    pauseBtn.style.display = "none";
    playBtn.style.display = "none";
    soundBtnHome.style.display = soundEnabled ? "block" : "none";
    muteBtnHome.style.display = soundEnabled ? "none" : "block";
    soundBtnGameover.style.display = "none";
    muteBtnGameover.style.display = "none";
    
    // Reset game state
    gameOver = false;
    gameStarted = false;
    pipeArray = [];
    score = 0;
    Superman.y = SupermanY;
    pauseOverlay.style.display = "none";

}  

