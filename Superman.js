// Game constants
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;

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
// Enemy parameters
let baseEnemySpeed = -4;
let enemySpeedIncrease = -0.5; // Speed increase per level
let maxEnemySpeed = -8;        // Maximum enemy speed
// Difficulty caps
const MAX_DIFFICULTY_LEVEL = 5;
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200; // How much faster pipes spawn per level


// Superman
let SupermanWidth = boardWidth * 0.2; // 20% width
let SupermanHeight = SupermanWidth * 0.433; // same aspect ratio

let SupermanX = boardWidth / 8;
let SupermanY = boardHeight / 2;
let SupermanImg;

let Superman = {
    x: boardWidth / 8,
    y: boardHeight / 2,
    width: SupermanWidth,
    height: SupermanHeight,
};


// Pipes
let pipeArray = [];
let pipeWidth = boardWidth * 0.18;
let pipeHeight = boardHeight * 0.8;

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

// Level animation
let isLevelAnimating = false;
let levelAnimationStartTime = 0;
const levelAnimationDuration = 1000;

// Sound elements
let bgMusic = new Audio('bg.mp3');
let flySound = new Audio('fly.mp3');
let hitSound = new Audio('hit.mp3');
let soundEnabled = true;
let isPaused = false;

// UI elements
const pauseBtn = document.getElementById("pause-btn");
const playBtn = document.getElementById("play-btn");
const soundBtnHome = document.getElementById("sound-btn-home");
const muteBtnHome = document.getElementById("mute-btn-home");
const soundBtnGameover = document.getElementById("sound-btn-gameover");
const muteBtnGameover = document.getElementById("mute-btn-gameover");



window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    let uiCanvas = document.getElementById("ui"); 
    uiCanvas.height = boardHeight;
    uiCanvas.width = boardWidth;
    uiContext = uiCanvas.getContext("2d");

    resizeGame();

    // Load images


    powerUpImg.src = "./powerups.png";
    enemyImg.src = "./enemy.png";

    SupermanImg = new Image();
    SupermanImg.src = "./superman1.png";

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    newTopPipeImg = new Image();
    newTopPipeImg.src = "./pipe11.png";

    newBottomPipeImg = new Image();
    newBottomPipeImg.src = "./pipe1.png";

    gameOverImg = new Image();
    gameOverImg.src = "./gameover.png";

    highScoreImg = new Image();
    highScoreImg.src = "./highscore.png";

    collisionImg = new Image();
    collisionImg.src = "./collision.png";

    // Initialize sound
    bgMusic.loop = true;
    updateSoundDisplay();

    // Event listeners
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", restartGame);
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("touchstart", handleTouchStart);
    pauseBtn.addEventListener("click", pauseGame);
    playBtn.addEventListener("click", resumeGame);
    soundBtnHome.addEventListener("click", toggleSound);
    muteBtnHome.addEventListener("click", toggleSound);
    soundBtnGameover.addEventListener("click", toggleSound);
    muteBtnGameover.addEventListener("click", toggleSound);
    resumeBtn.addEventListener("click", resumeGame);
    soundBtnPause.addEventListener("click", toggleSound);
    muteBtnPause.addEventListener("click", toggleSound);
    window.addEventListener("resize", resizeGame);

    showHomepage();
};

function resizeGame() {
    boardWidth = window.innerWidth;
    boardHeight = window.innerHeight;

    board.width = boardWidth;
    board.height = boardHeight;

    ui.width = boardWidth;
    ui.height = boardHeight;

    // Recalculate positions/sizes
    Superman.x = boardWidth / 8;
    Superman.width = boardWidth * 0.2;
    Superman.height = Superman.width * 0.433;
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
    soundBtnPause.style.display = "flex";
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
    cancelAnimationFrame(animationFrameId);
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
z
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

    currentLevel = Math.floor(score / 10);
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
            let scale = 1;
            let collisionW = Superman.width * scale;
            let collisionH = Superman.height * scale;
            let collisionX = Superman.x + (Superman.width - collisionW) / 2;
            let collisionY = Superman.y + (Superman.height - collisionH) / 2;
            context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH);
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
        placePipes(); // ✅ Immediately spawn a pipe after level up
    }
    

    // Score display
    uiContext.fillStyle = "#FFD700";
    let responsiveFontSize = Math.floor(boardWidth / 8); // adjust as needed
uiContext.font = `bold ${responsiveFontSize}px 'Arial Black'`;

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
            let scale = 1;
            let collisionW = Superman.width * scale;
            let collisionH = Superman.height * scale;
            let collisionX = Superman.x + (Superman.width - collisionW) / 2;
            let collisionY = Superman.y + (Superman.height - collisionH) / 2;
            context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH);
            endGame();
        }
        
        
        
        if (e.x < -e.width) enemyArray.splice(i, 1);
    }

    // Spawn new powerups
    if (Date.now() - lastPowerUpSpawn > powerUpSpawnInterval) {
        spawnPowerUp();
        lastPowerUpSpawn = Date.now();
    }

    // Spawn new enemies
    if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
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

    // Avoid placing pipes too close to each other
    if (pipeArray.length > 0) {
        let lastPipe = pipeArray[pipeArray.length - 1];
        if (lastPipe.x > boardWidth - 150) return; // Adjust spacing here
    }

    const currentGap = basePipeGap;
    let minPipeY = -pipeHeight + 50;
    let maxPipeY = 0 - currentGap - 150;
    let randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY;

    let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel;
    obstacleChance = Math.min(obstacleChance, 0.75);

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

function handleTouchStart(e) {
    e.preventDefault(); // Prevents accidental scrolling or zooming

    if (isCountdownActive) return;

    if (!gameStarted && !gameOver) {
        startGame();
        return;
    }

    if (gameStarted && !gameOver) {
        velocityY = -6;
        if (soundEnabled) {
            flySound.currentTime = 0;
            flySound.play();
        }
    }

    if (gameOver) restartGame();
}

function restartGame() {
    if (pipeInterval) {
        clearInterval(pipeInterval);
        pipeInterval = null;
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
    powerUpArray = [];
    enemyArray = [];
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
        width: boardWidth * 0.1,
height: boardWidth * 0.1,

    });
}

function spawnEnemy() {
    let speed = baseEnemySpeed + (enemySpeedIncrease * currentLevel);
    speed = Math.max(maxEnemySpeed, speed); // Cap at maximum speed
    speed += (Math.random() - 0.5); // Add random variation

    enemyArray.push({
        img: enemyImg,
        x: boardWidth,
        y: Math.random() * (boardHeight - 60),
        width: boardWidth * 0.1,
height: boardWidth * 0.1,

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

