// Game constants - now responsive
const boardWidth = 360
const boardHeight = 640
let context
let uiContext
const homepage = document.getElementById("homepage")
let board = document.getElementById("board")
let ui = document.getElementById("ui")
const startBtn = document.getElementById("start-btn")
const restartBtn = document.getElementById("restart-btn")
const soundBtnPause = document.getElementById("sound-btn-pause")
const muteBtnPause = document.getElementById("mute-btn-pause")
const pauseOverlay = document.getElementById("pause-overlay")
const resumeBtn = document.getElementById("resume-btn")
const powerUpImg = new Image()
const enemyImg = new Image()
let shieldActive = false
const shieldDuration = 5000 // 5 seconds
let shieldEndTime = 0
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000 // 10 seconds
let enemyArray = []
const enemySpawnInterval = 4000 // 4 seconds
let lastEnemySpawn = 0 // Enemy parameters
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5 // Speed increase per level
const maxEnemySpeed = -8 // Maximum enemy speed
// Difficulty caps
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200 // How much faster pipes spawn per level

// Responsive scaling variables
let scaleX = 1
let scaleY = 1
let gameWrapper

// Superman
const SupermanWidth = 74.8
const SupermanHeight = 32.4
const SupermanX = boardWidth / 8
const SupermanY = boardHeight / 2
let SupermanImg

const Superman = {
  x: SupermanX,
  y: SupermanY,
  width: SupermanWidth,
  height: SupermanHeight,
}

// Pipes
let pipeArray = []
const pipeWidth = 64
const pipeHeight = 512
const pipeX = boardWidth
const pipeY = 0

// Difficulty parameters
const basePipeInterval = 1700
const minPipeInterval = 900
const maxPipeInterval = 1720
const basePipeGap = boardHeight / 3.2
const minPipeGap = 90
const baseVelocityX = -2
const maxVelocityX = -6
const levelSpeedIncrease = -0.5
const baseObstacleChance = 0.1
const obstacleIncreasePerLevel = 0.05

// Images
let topPipeImg
let bottomPipeImg
let newTopPipeImg
let newBottomPipeImg
let gameOverImg
let yourScoreImg
let highScoreImg
let collisionImg

// Game variables
let velocityX = baseVelocityX
let velocityY = 0
const gravity = 0.4
let gameOver = false
let score = 0
let highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0
let gameStarted = false
let pipeInterval = null
let animationFrameId = null
let currentLevel = 0
let lastLevelCheckpoint = 0
let countdown = 3
let isCountdownActive = false
let lastPipeGap = { top: 0, bottom: 0 } // Stores the Y-range of the pipe gap

// Level animation
let isLevelAnimating = false
let levelAnimationStartTime = 0
const levelAnimationDuration = 1000

// Sound elements
const bgMusic = new Audio("./sound/bg.mp3")
const flySound = new Audio("./sound/fly.mp3")
const hitSound = new Audio("./sound/hit.mp3")
let soundEnabled = true
let isPaused = false

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Responsive setup function
function setupResponsiveCanvas() {
  gameWrapper = document.querySelector(".game-wrapper")
  const container = document.querySelector(".game-container")

  // Get actual container dimensions
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  // Calculate optimal game dimensions maintaining aspect ratio
  const targetAspectRatio = boardWidth / boardHeight // 360/640 = 0.5625

  let gameWidth, gameHeight

  if (containerWidth / containerHeight > targetAspectRatio) {
    // Container is wider than target ratio - fit to height
    gameHeight = containerHeight
    gameWidth = gameHeight * targetAspectRatio
  } else {
    // Container is taller than target ratio - fit to width
    gameWidth = containerWidth
    gameHeight = gameWidth / targetAspectRatio
  }

  // Set canvas dimensions
  board.width = boardWidth
  board.height = boardHeight
  ui.width = boardWidth
  ui.height = boardHeight

  // Set display size
  board.style.width = gameWidth + "px"
  board.style.height = gameHeight + "px"
  ui.style.width = gameWidth + "px"
  ui.style.height = gameHeight + "px"

  // Set wrapper size
  gameWrapper.style.width = gameWidth + "px"
  gameWrapper.style.height = gameHeight + "px"

  // Calculate scaling factors for touch coordinates
  scaleX = boardWidth / gameWidth
  scaleY = boardHeight / gameHeight
}

// Handle window resize
function handleResize() {
  setupResponsiveCanvas()
}

window.onload = () => {
  board = document.getElementById("board")
  ui = document.getElementById("ui")

  // Setup responsive canvas
  setupResponsiveCanvas()

  context = board.getContext("2d")
  uiContext = ui.getContext("2d")

  // Load images
  powerUpImg.src = "./images/powerups.png"
  enemyImg.src = "./images/enemy.png"

  SupermanImg = new Image()
  SupermanImg.src = "./images/superman1.png"

  topPipeImg = new Image()
  topPipeImg.src = "./images/toppipe.png"

  bottomPipeImg = new Image()
  bottomPipeImg.src = "./images/bottompipe.png"

  newTopPipeImg = new Image()
  newTopPipeImg.src = "./images/pipe11.png"

  newBottomPipeImg = new Image()
  newBottomPipeImg.src = "./images/pipe1.png"

  gameOverImg = new Image()
  gameOverImg.src = "./images/gameover.png"

  highScoreImg = new Image()
  highScoreImg.src = "./images/highscore.png"

  collisionImg = new Image()
  collisionImg.src = "./images/collision.png"

  // Initialize sound
  bgMusic.loop = true
  updateSoundDisplay()

  // Event listeners
  startBtn.addEventListener("click", startGame)
  restartBtn.addEventListener("click", restartGame)
  document.addEventListener("keydown", handleKeyPress)
  pauseBtn.addEventListener("click", pauseGame)
  playBtn.addEventListener("click", resumeGame)
  soundBtnHome.addEventListener("click", toggleSound)
  muteBtnHome.addEventListener("click", toggleSound)
  soundBtnGameover.addEventListener("click", toggleSound)
  muteBtnGameover.addEventListener("click", toggleSound)
  resumeBtn.addEventListener("click", resumeGame)
  soundBtnPause.addEventListener("click", toggleSound)
  muteBtnPause.addEventListener("click", toggleSound)

  // Enhanced touch handling
  document.addEventListener("touchstart", handleTouch, { passive: false })
  document.addEventListener("touchmove", preventScroll, { passive: false })
  document.addEventListener("touchend", preventScroll, { passive: false })

  // Window resize handler
  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 100) // Delay to ensure orientation change is complete
  })

  showHomepage()
}

// Prevent scrolling on mobile
function preventScroll(e) {
  e.preventDefault()
}

function toggleSound() {
  soundEnabled = !soundEnabled

  // Update only relevant controls based on current screen
  if (gameOver) {
    soundBtnGameover.style.display = soundEnabled ? "block" : "none"
    muteBtnGameover.style.display = soundEnabled ? "none" : "block"
  } else if (isPaused) {
    soundBtnPause.style.display = soundEnabled ? "block" : "none"
    muteBtnPause.style.display = soundEnabled ? "none" : "block"
  } else if (!gameStarted) {
    soundBtnHome.style.display = soundEnabled ? "block" : "none"
    muteBtnHome.style.display = soundEnabled ? "none" : "block"
  }

  if (soundEnabled) bgMusic.play()
  else bgMusic.pause()
}

function updateSoundDisplay() {
  const showSound = soundEnabled
  soundBtnHome.style.display = showSound ? "block" : "none"
  muteBtnHome.style.display = showSound ? "none" : "block"
  soundBtnGameover.style.display = showSound ? "block" : "none"
  muteBtnGameover.style.display = showSound ? "none" : "block"
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true
  pauseOverlay.style.display = "flex"
  pauseBtn.style.display = "none"
  playBtn.style.display = "block"
  soundBtnPause.style.display = "flex"
  bgMusic.pause()
  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)
}

function resumeGame() {
  isPaused = false
  pauseOverlay.style.display = "none"
  pauseBtn.style.display = "block"
  playBtn.style.display = "none"
  if (soundEnabled) bgMusic.play()
  pipeInterval = setDynamicPipeInterval()
  cancelAnimationFrame(animationFrameId)
  requestAnimationFrame(update)
}

function startGame() {
  gameOver = false
  gameStarted = true
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  isLevelAnimating = false

  // Hide/show elements
  homepage.style.display = "none"
  board.style.display = "block"
  ui.style.display = "block"
  startBtn.style.display = "none"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  soundBtnHome.style.display = "none"
  muteBtnHome.style.display = "none"

  // Start countdown
  isCountdownActive = true
  countdown = 3
  animateCountdown()
}

function animateCountdown() {
  if (!isCountdownActive) return

  // Clear canvases
  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  // Draw Superman
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  // Animate countdown number - responsive font size
  const baseFontSize = Math.min(boardWidth, boardHeight) * 0.15
  const fontSize = baseFontSize + baseFontSize * 0.5 * (countdown - Math.floor(countdown))
  const alpha = 1 - (countdown - Math.floor(countdown))

  uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
  uiContext.font = `bold ${fontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

  countdown -= 0.016 // Decrement by ~1/60th of a second

  if (countdown <= 0) {
    isCountdownActive = false
    gameStarted = true
    pauseBtn.style.display = "block"

    if (soundEnabled) bgMusic.play()
    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(update)
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return
  animationFrameId = requestAnimationFrame(update)

  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  currentLevel = Math.floor(score / 15)
  if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
    isLevelAnimating = true
    levelAnimationStartTime = Date.now()
    updateDifficulty()
  }

  // UI elements - responsive font sizes
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, Math.min(50, boardHeight * 0.08))
  uiContext.fillStyle = "#FFD700"

  const uiFontSize = Math.min(16, boardWidth * 0.045)
  uiContext.font = `${uiFontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30)
  uiContext.textAlign = "center"
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30)

  // Superman physics
  velocityY += gravity
  Superman.y = Math.max(Superman.y + velocityY, 0)
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  if (Superman.y > board.height) endGame()

  // Pipe handling
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i]
    pipe.x += velocityX
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

    if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
      score += 0.5
      pipe.passed = true
    }

    if (detectCollision(Superman, pipe)) {
      // Draw collision image 1x the size of Superman, centered on Superman
      drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
      endGame(pipe)
    }
  }

  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift()
  }

  if (currentLevel !== lastLevelCheckpoint) {
    lastLevelCheckpoint = currentLevel
    if (pipeInterval) clearInterval(pipeInterval)
    pipeInterval = setDynamicPipeInterval()
  }

  // Score display - responsive font size
  uiContext.fillStyle = "#FFD700"
  const scoreFontSize = Math.min(45, boardWidth * 0.125)
  uiContext.font = `bold ${scoreFontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), boardWidth / 2, Math.min(100, boardHeight * 0.15))

  // Level animation - responsive font size
  if (isLevelAnimating) {
    const elapsed = Date.now() - levelAnimationStartTime
    const progress = Math.min(elapsed / levelAnimationDuration, 1)
    uiContext.save()
    uiContext.textAlign = "center"
    uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`
    const levelFontSize = Math.min(40, boardWidth * 0.11) + Math.min(20, boardWidth * 0.055) * (1 - progress)
    uiContext.font = `bold ${levelFontSize}px Arial`
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2)
    uiContext.restore()
    if (progress >= 1) isLevelAnimating = false
  }

  // Handle shield
  if (shieldActive && Date.now() > shieldEndTime) {
    shieldActive = false
  }

  // Draw shield if active - responsive shield with flashing warning
  if (shieldActive) {
    const timeLeft = shieldEndTime - Date.now()
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0

    const shieldSize = Math.min(50, Math.max(Superman.width, Superman.height) * 1.3)

    if (!isFlashing) {
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
    } else {
      // Optional flash effect using lower opacity
      context.globalAlpha = 0.5
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
      context.globalAlpha = 1.0 // Reset transparency
    }

    // Auto-disable shield
    if (timeLeft <= 0) {
      shieldActive = false
    }
  }

  // Handle powerups
  for (let i = powerUpArray.length - 1; i >= 0; i--) {
    const p = powerUpArray[i]
    p.x += velocityX
    context.drawImage(p.img, p.x, p.y, p.width, p.height)

    if (detectCollision(Superman, p)) {
      shieldActive = true
      shieldEndTime = Date.now() + shieldDuration
      powerUpArray.splice(i, 1)
    }

    if (p.x < -p.width) powerUpArray.splice(i, 1)
  }

  // Handle enemies
  for (let i = enemyArray.length - 1; i >= 0; i--) {
    const e = enemyArray[i]
    e.x += e.speed
    context.drawImage(e.img, e.x, e.y, e.width, e.height)

    if (!shieldActive && detectCollision(Superman, e)) {
      // Draw collision image 1x the size of Superman, centered on Superman
      drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
      endGame()
    }

    if (e.x < -e.width) enemyArray.splice(i, 1)
  }

  const now = Date.now()

  if (now - lastPowerUpSpawn > powerUpSpawnInterval) {
    spawnPowerUp()
    lastPowerUpSpawn = now
  }

  if (now - lastEnemySpawn > enemySpawnInterval) {
    spawnEnemy()
    lastEnemySpawn = now
  }
}

function updateDifficulty() {
  // Cap level at MAX_DIFFICULTY_LEVEL for speed calculations
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  velocityX = baseVelocityX + levelSpeedIncrease * effectiveLevel
  velocityX = Math.max(maxVelocityX, velocityX)
}

function placePipes() {
  if (gameOver || !gameStarted) return
  const currentGap = basePipeGap
  const minPipeY = -pipeHeight + 50 // Original minimum Y position
  const maxPipeY = 0 - currentGap - 150 // Original maximum Y position
  const randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY

  const gapTopY = randomPipeY + pipeHeight
  const gapBottomY = gapTopY + basePipeGap
  lastPipeGap = { top: gapTopY, bottom: gapBottomY } // Save the current gap

  let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel
  obstacleChance = Math.min(obstacleChance, 0.75)

  // Restore original pipe type logic
  const topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"
  const bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"

  const topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg
  const bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg

  pipeArray.push({
    img: topImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  })

  pipeArray.push({
    img: bottomImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + currentGap,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  })
}

function setDynamicPipeInterval() {
  // Cap level at MAX_DIFFICULTY_LEVEL for interval calculation
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)

  // Calculate interval with capped level
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL

  // Ensure minimum interval
  interval = Math.max(interval, minPipeInterval)

  return setInterval(placePipes, interval)
}

function handleKeyPress(e) {
  if (e.code === "KeyM") toggleSound()
  if (isCountdownActive) return
  if (e.code === "KeyP" && !gameOver) {
    if (isPaused) resumeGame()
    else pauseGame()
  }
  if (!gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
    startGame()
    return
  }

  if (gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play()
    }
  }

  if (gameOver && e.code === "Enter") restartGame()
}

function handleTouch(e) {
  e.preventDefault() // prevent scrolling on mobile

  if (isCountdownActive) return

  // Start game if not started yet
  if (!gameStarted && !gameOver) {
    startGame()
    return
  }

  // If game is over, restart
  if (gameOver) {
    restartGame()
    return
  }

  // Fly action
  if (gameStarted && !gameOver && !isPaused) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play()
    }
  }

  // If game is paused, resume
  if (isPaused) {
    resumeGame()
  }
}

function restartGame() {
  if (pipeInterval) {
    clearInterval(pipeInterval)
    pipeInterval = null
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  gameOver = false
  gameStarted = false
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  isLevelAnimating = false
  shieldActive = false
  powerUpArray = []
  enemyArray = []

  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  if (soundEnabled) bgMusic.play()
  showHomepage()
}

function endGame() {
  gameOver = true

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  // Hide the pause button after the game ends
  pauseBtn.style.display = "none" // Hide the pause button

  // Keep board visible for background
  board.style.display = "block" // Changed from "none"
  homepage.style.display = "none"

  // Show UI canvas and game over elements
  ui.style.display = "block"
  restartBtn.style.display = "block"

  // Clear and redraw UI
  uiContext.clearRect(0, 0, board.width, board.height)

  // Draw semi-transparent overlay
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)" // Reduced opacity to 50%
  uiContext.fillRect(0, 0, boardWidth, boardHeight)

  const centerX = boardWidth / 2

  // Game Over Image - responsive sizing
  const gameOverWidth = Math.min(450, boardWidth * 0.9)
  const gameOverHeight = Math.min(200, boardHeight * 0.25)
  uiContext.drawImage(
    gameOverImg,
    centerX - gameOverWidth / 2,
    Math.min(95, boardHeight * 0.15),
    gameOverWidth,
    gameOverHeight,
  )

  // Scores - responsive font size
  uiContext.fillStyle = "#FFD700"
  const scoreFontSize = Math.min(45, boardWidth * 0.125)
  uiContext.font = `bold ${scoreFontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), centerX, Math.min(100, boardHeight * 0.15))

  // High Score - responsive sizing
  const highScoreWidth = Math.min(150, boardWidth * 0.4)
  const highScoreHeight = Math.min(80, boardHeight * 0.125)
  const highScoreY = Math.min(280, boardHeight * 0.44)
  uiContext.drawImage(highScoreImg, centerX - highScoreWidth / 2, highScoreY, highScoreWidth, highScoreHeight)
  uiContext.fillText(highScore, centerX + highScoreWidth / 4, highScoreY + highScoreHeight - 10)

  // Sound controls
  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  // Stop game elements
  if (pipeInterval) clearInterval(pipeInterval)
  bgMusic.pause()

  if (soundEnabled) {
    hitSound.currentTime = 0
    hitSound.play()
  }
}

// New helper functions
function spawnPowerUp() {
  const powerUpSize = Math.min(40, boardWidth * 0.11)
  powerUpArray.push({
    img: powerUpImg,
    x: boardWidth,
    y: Math.random() * (boardHeight - powerUpSize),
    width: powerUpSize,
    height: powerUpSize,
  })
}

function spawnEnemy() {
  const enemyHeight = Math.min(40, boardHeight * 0.0625)
  const enemyWidth = Math.min(60, boardWidth * 0.167)
  let y
  let tries = 0

  // Retry logic to avoid spawning in the pipe gap
  do {
    y = Math.random() * (boardHeight - enemyHeight)
    tries++
  } while (lastPipeGap && y + enemyHeight > lastPipeGap.top && y < lastPipeGap.bottom && tries < 10)

  let speed = baseEnemySpeed + enemySpeedIncrease * currentLevel
  speed = Math.max(maxEnemySpeed, speed)
  speed += Math.random() - 0.5 // Small random variation

  enemyArray.push({
    img: enemyImg,
    x: boardWidth,
    y: y,
    width: enemyWidth,
    height: enemyHeight,
    speed: speed,
  })
}

// Modified collision detection
function detectCollision(a, b) {
  if (shieldActive) return false // No collisions when shield is active

  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function drawCollisionEffect(x, y, width, height) {
  const scale = 1
  const collisionW = width * scale
  const collisionH = height * scale
  const collisionX = x + (width - collisionW) / 2
  const collisionY = y + (height - collisionH) / 2
  context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH)
}

function showHomepage() {
  // Reset all displays
  homepage.style.display = "block"
  board.style.display = "none"
  ui.style.display = "none"
  startBtn.style.display = "block"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  soundBtnHome.style.display = soundEnabled ? "block" : "none"
  muteBtnHome.style.display = soundEnabled ? "none" : "block"
  soundBtnGameover.style.display = "none"
  muteBtnGameover.style.display = "none"

  // Reset game state
  gameOver = false
  gameStarted = false
  pipeArray = []
  score = 0
  Superman.y = SupermanY
  pauseOverlay.style.display = "none"
}
