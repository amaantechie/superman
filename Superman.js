// Game constants - now responsive
let boardWidth = 360
let boardHeight = 640
let context
let uiContext
let scaleFactor = 1

// DOM elements
const homepage = document.getElementById("homepage")
const board = document.getElementById("board")
const ui = document.getElementById("ui")
const gameContainer = document.getElementById("game-container")
const startBtn = document.getElementById("start-btn")
const restartBtn = document.getElementById("restart-btn")
const pauseOverlay = document.getElementById("pause-overlay")
const mobileInstructions = document.getElementById("mobile-instructions")

// Control buttons
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")
const resumeBtn = document.getElementById("resume-btn")
const soundBtnPause = document.getElementById("sound-btn-pause")
const muteBtnPause = document.getElementById("mute-btn-pause")

// Game objects
const powerUpImg = new Image()
const enemyImg = new Image()
let shieldActive = false
const shieldDuration = 5000
let shieldEndTime = 0
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000
let enemyArray = []
const enemySpawnInterval = 4000
let lastEnemySpawn = 0

// Difficulty parameters
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Superman
let SupermanWidth = 74.8
let SupermanHeight = 32.4
let SupermanX
let SupermanY
let SupermanImg
let Superman = {}

// Pipes
let pipeArray = []
let pipeWidth = 64
let pipeHeight = 512
let pipeX
const pipeY = 0

// Difficulty parameters
const basePipeInterval = 1700
const minPipeInterval = 900
const maxPipeInterval = 1720
let basePipeGap
const minPipeGap = 90
const baseVelocityX = -2
const maxVelocityX = -6
const levelSpeedIncrease = -0.5
const baseObstacleChance = 0.1
const obstacleIncreasePerLevel = 0.05

// Images
let topPipeImg, bottomPipeImg, newTopPipeImg, newBottomPipeImg
let gameOverImg, yourScoreImg, highScoreImg, collisionImg

// Game variables
let velocityX
let velocityY = 0
let gravity = 0.4
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
let lastPipeGap = { top: 0, bottom: 0 }

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

// Touch handling
let touchStartTime = 0
let isTouching = false

function calculateDimensions() {
  const container = gameContainer.getBoundingClientRect()
  const containerWidth = container.width
  const containerHeight = container.height

  // Calculate scale factor
  const scaleX = containerWidth / 360
  const scaleY = containerHeight / 640
  scaleFactor = Math.min(scaleX, scaleY)

  // Set board dimensions
  boardWidth = containerWidth
  boardHeight = containerHeight

  // Update game object positions
  SupermanX = boardWidth / 8
  SupermanY = boardHeight / 2
  SupermanWidth = 74.8 * scaleFactor
  SupermanHeight = 32.4 * scaleFactor

  pipeWidth = 64 * scaleFactor
  pipeHeight = 512 * scaleFactor
  pipeX = boardWidth

  basePipeGap = boardHeight / 3.2
  velocityX = baseVelocityX * scaleFactor
  gravity = 0.4 * scaleFactor

  Superman = {
    x: SupermanX,
    y: SupermanY,
    width: SupermanWidth,
    height: SupermanHeight,
  }
}

function resizeCanvas() {
  calculateDimensions()

  board.width = boardWidth
  board.height = boardHeight
  ui.width = boardWidth
  ui.height = boardHeight

  if (context) {
    context = board.getContext("2d")
    context.imageSmoothingEnabled = false
  }
  if (uiContext) {
    uiContext = ui.getContext("2d")
    uiContext.imageSmoothingEnabled = false
  }
}

window.onload = () => {
  calculateDimensions()
  resizeCanvas()

  context = board.getContext("2d")
  uiContext = ui.getContext("2d")

  context.imageSmoothingEnabled = false
  uiContext.imageSmoothingEnabled = false

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
  bgMusic.volume = 0.5
  flySound.volume = 0.7
  hitSound.volume = 0.8

  // Add event listeners
  setupEventListeners()

  // Handle resize
  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", handleOrientationChange)

  showHomepage()
}

function setupEventListeners() {
  // Button click events
  startBtn.addEventListener("click", startGame)
  restartBtn.addEventListener("click", restartGame)
  pauseBtn.addEventListener("click", pauseGame)
  playBtn.addEventListener("click", resumeGame)
  resumeBtn.addEventListener("click", resumeGame)

  // Sound button events
  soundBtnHome.addEventListener("click", toggleSound)
  muteBtnHome.addEventListener("click", toggleSound)
  soundBtnGameover.addEventListener("click", toggleSound)
  muteBtnGameover.addEventListener("click", toggleSound)
  soundBtnPause.addEventListener("click", toggleSound)
  muteBtnPause.addEventListener("click", toggleSound)

  // Touch events for buttons (prevent event bubbling)
  const allButtons = document.querySelectorAll(".btn")
  allButtons.forEach((button) => {
    button.addEventListener("touchstart", handleButtonTouch, { passive: false })
    button.addEventListener("touchend", handleButtonTouch, { passive: false })
  })

  // Game area touch events
  gameContainer.addEventListener("touchstart", handleTouchStart, { passive: false })
  gameContainer.addEventListener("touchend", handleTouchEnd, { passive: false })
  gameContainer.addEventListener("touchmove", handleTouchMove, { passive: false })

  // Keyboard events
  document.addEventListener("keydown", handleKeyPress)

  // Prevent context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault())
}

function handleButtonTouch(e) {
  e.preventDefault()
  e.stopPropagation()
}

function handleTouchStart(e) {
  // Don't handle if touching a button
  if (e.target.closest(".btn")) {
    return
  }

  e.preventDefault()
  touchStartTime = Date.now()
  isTouching = true

  if (isCountdownActive) return

  // Start game if not started
  if (!gameStarted && !gameOver) {
    startGame()
    return
  }

  // Restart if game over
  if (gameOver) {
    restartGame()
    return
  }

  // Resume if paused
  if (isPaused) {
    resumeGame()
    return
  }

  // Fly action
  if (gameStarted && !gameOver && !isPaused) {
    fly()
  }
}

function handleTouchEnd(e) {
  if (e.target.closest(".btn")) {
    return
  }
  e.preventDefault()
  isTouching = false
}

function handleTouchMove(e) {
  e.preventDefault()
}

function handleResize() {
  setTimeout(() => {
    resizeCanvas()
    if (gameStarted && !gameOver) {
      Superman.x = SupermanX
      Superman.width = SupermanWidth
      Superman.height = SupermanHeight
    }
  }, 100)
}

function handleOrientationChange() {
  setTimeout(handleResize, 500)
}

function fly() {
  velocityY = -6 * scaleFactor
  if (soundEnabled) {
    flySound.currentTime = 0
    flySound.play().catch(() => {})
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled
  updateSoundDisplay()

  if (soundEnabled) {
    bgMusic.play().catch(() => {})
  } else {
    bgMusic.pause()
  }
}

function updateSoundDisplay() {
  // Home screen
  soundBtnHome.style.display = soundEnabled ? "block" : "none"
  muteBtnHome.style.display = soundEnabled ? "none" : "block"

  // Game over screen
  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  // Pause screen
  soundBtnPause.style.display = soundEnabled ? "block" : "none"
  muteBtnPause.style.display = soundEnabled ? "none" : "block"
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true
  pauseOverlay.style.display = "flex"
  pauseBtn.style.display = "none"
  playBtn.style.display = "block"

  bgMusic.pause()
  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)

  updateSoundDisplay()
}

function resumeGame() {
  isPaused = false
  pauseOverlay.style.display = "none"
  pauseBtn.style.display = "block"
  playBtn.style.display = "none"

  if (soundEnabled) bgMusic.play().catch(() => {})
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
  velocityX = baseVelocityX * scaleFactor
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  isLevelAnimating = false
  shieldActive = false

  // Hide/show elements
  homepage.style.display = "none"
  board.style.display = "block"
  ui.style.display = "block"
  startBtn.style.display = "none"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  soundBtnHome.style.display = "none"
  muteBtnHome.style.display = "none"
  mobileInstructions.style.display = "none"

  // Start countdown
  isCountdownActive = true
  countdown = 3
  animateCountdown()
}

function animateCountdown() {
  if (!isCountdownActive) return

  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  const baseFontSize = 100 * scaleFactor
  const fontSize = baseFontSize + 50 * scaleFactor * (countdown - Math.floor(countdown))
  const alpha = 1 - (countdown - Math.floor(countdown))

  uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
  uiContext.font = `bold ${fontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

  countdown -= 0.016

  if (countdown <= 0) {
    isCountdownActive = false
    gameStarted = true
    pauseBtn.style.display = "block"

    if (soundEnabled) bgMusic.play().catch(() => {})
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

  // UI elements
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, 50 * scaleFactor)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = `${16 * scaleFactor}px Arial`
  uiContext.textAlign = "left"
  uiContext.fillText(`HIGH: ${highScore}`, 10 * scaleFactor, 30 * scaleFactor)
  uiContext.textAlign = "center"
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30 * scaleFactor)

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

  // Score display
  uiContext.fillStyle = "#FFD700"
  uiContext.font = `bold ${45 * scaleFactor}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), boardWidth / 2, 100 * scaleFactor)

  // Level animation
  if (isLevelAnimating) {
    const elapsed = Date.now() - levelAnimationStartTime
    const progress = Math.min(elapsed / levelAnimationDuration, 1)
    uiContext.save()
    uiContext.textAlign = "center"
    uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`
    uiContext.font = `bold ${(40 + 20 * (1 - progress)) * scaleFactor}px Arial`
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2)
    uiContext.restore()
    if (progress >= 1) isLevelAnimating = false
  }

  // Handle shield
  if (shieldActive && Date.now() > shieldEndTime) {
    shieldActive = false
  }

  // Draw shield if active
  if (shieldActive) {
    const timeLeft = shieldEndTime - Date.now()
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0
    const shieldSize = 50 * scaleFactor

    if (!isFlashing) {
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
    } else {
      context.globalAlpha = 0.5
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
      context.globalAlpha = 1.0
    }

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
    e.x += e.speed * scaleFactor
    context.drawImage(e.img, e.x, e.y, e.width, e.height)

    if (!shieldActive && detectCollision(Superman, e)) {
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
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  velocityX = (baseVelocityX + levelSpeedIncrease * effectiveLevel) * scaleFactor
  velocityX = Math.max(maxVelocityX * scaleFactor, velocityX)
}

function placePipes() {
  if (gameOver || !gameStarted) return
  const currentGap = basePipeGap
  const minPipeY = -pipeHeight + 50 * scaleFactor
  const maxPipeY = 0 - currentGap - 150 * scaleFactor
  const randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY

  const gapTopY = randomPipeY + pipeHeight
  const gapBottomY = gapTopY + basePipeGap
  lastPipeGap = { top: gapTopY, bottom: gapBottomY }

  let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel
  obstacleChance = Math.min(obstacleChance, 0.75)

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
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL
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
    fly()
  }

  if (gameOver && e.code === "Enter") restartGame()
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
  velocityX = baseVelocityX * scaleFactor
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  isLevelAnimating = false
  shieldActive = false

  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  if (soundEnabled) bgMusic.play().catch(() => {})
  showHomepage()
}

function endGame() {
  gameOver = true

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  pauseBtn.style.display = "none"
  board.style.display = "block"
  homepage.style.display = "none"
  ui.style.display = "block"
  restartBtn.style.display = "block"

  uiContext.clearRect(0, 0, board.width, board.height)

  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, boardHeight)

  const centerX = boardWidth / 2

  // Game Over Image - scaled
  const gameOverWidth = 450 * scaleFactor
  const gameOverHeight = 200 * scaleFactor
  uiContext.drawImage(gameOverImg, centerX - gameOverWidth / 2, 95 * scaleFactor, gameOverWidth, gameOverHeight)

  // Scores
  uiContext.fillStyle = "#FFD700"
  uiContext.font = `bold ${45 * scaleFactor}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), centerX, 100 * scaleFactor)

  // High Score
  const highScoreWidth = 150 * scaleFactor
  const highScoreHeight = 80 * scaleFactor
  uiContext.drawImage(highScoreImg, centerX - highScoreWidth / 2, 280 * scaleFactor, highScoreWidth, highScoreHeight)
  uiContext.fillText(highScore, centerX + 75 * scaleFactor, 330 * scaleFactor)

  // Show sound controls
  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  if (pipeInterval) clearInterval(pipeInterval)
  bgMusic.pause()

  if (soundEnabled) {
    hitSound.currentTime = 0
    hitSound.play().catch(() => {})
  }
}

function spawnPowerUp() {
  powerUpArray.push({
    img: powerUpImg,
    x: boardWidth,
    y: Math.random() * (boardHeight - 40 * scaleFactor),
    width: 40 * scaleFactor,
    height: 40 * scaleFactor,
  })
}

function spawnEnemy() {
  const enemyHeight = 40 * scaleFactor
  let y
  let tries = 0

  do {
    y = Math.random() * (boardHeight - enemyHeight)
    tries++
  } while (lastPipeGap && y + enemyHeight > lastPipeGap.top && y < lastPipeGap.bottom && tries < 10)

  let speed = baseEnemySpeed + enemySpeedIncrease * currentLevel
  speed = Math.max(maxEnemySpeed, speed)
  speed += Math.random() - 0.5

  enemyArray.push({
    img: enemyImg,
    x: boardWidth,
    y: y,
    width: 60 * scaleFactor,
    height: enemyHeight,
    speed: speed,
  })
}

function detectCollision(a, b) {
  if (shieldActive) return false

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
  homepage.style.display = "block"
  board.style.display = "none"
  ui.style.display = "none"
  startBtn.style.display = "block"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  mobileInstructions.style.display = "block"

  // Show sound controls
  soundBtnHome.style.display = soundEnabled ? "block" : "none"
  muteBtnHome.style.display = soundEnabled ? "none" : "block"

  // Hide game over controls
  soundBtnGameover.style.display = "none"
  muteBtnGameover.style.display = "none"

  gameOver = false
  gameStarted = false
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  score = 0
  Superman.y = SupermanY
  pauseOverlay.style.display = "none"
}
