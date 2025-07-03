// Game variables
let canvas, context, uiCanvas, uiContext
let gameWidth, gameHeight
const gameState = "home" // 'home', 'playing', 'paused', 'gameover'

// Game constants - responsive
let boardWidth, boardHeight
let scaleFactor = 1

// DOM elements
const homepage = document.getElementById("homepage")
const board = document.getElementById("board")
const ui = document.getElementById("ui")
const gameContainer = document.getElementById("game-container")

// Game objects - your original physics
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

// Difficulty parameters - your original values
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Superman - your original setup
let SupermanWidth = 74.8
let SupermanHeight = 32.4
let SupermanX
let SupermanY
let SupermanImg
let Superman = {}

// Pipes - your original setup
let pipeArray = []
let pipeWidth = 64
let pipeHeight = 512
let pipeX
const pipeY = 0

// Difficulty parameters - your original values
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

// Images - your original setup
let topPipeImg, bottomPipeImg, newTopPipeImg, newBottomPipeImg
let gameOverImg, yourScoreImg, highScoreImg, collisionImg

// Game variables - your original physics
let velocityX
let velocityY = 0
let gravity = 0.4 // Your original gravity
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
let bgMusic = new Audio("./sound/bg.mp3")
let flySound = new Audio("./sound/fly.mp3")
let hitSound = new Audio("./sound/hit.mp3")
let soundEnabled = true
let isPaused = false

// Touch handling
let touchStartTime = 0
let isTouching = false

const superman = {}
let gameSpeed = 0
let jumpPower = 0
const images = {}
const pipes = []
const powerUps = []
const enemies = []

function calculateDimensions() {
  boardWidth = window.innerWidth
  boardHeight = window.innerHeight

  // Calculate scale factor for responsive elements
  scaleFactor = Math.min(boardWidth / 360, boardHeight / 640)

  // Update Superman position and size with your original proportions
  SupermanX = boardWidth / 8
  SupermanY = boardHeight / 2
  SupermanWidth = 74.8 * scaleFactor
  SupermanHeight = 32.4 * scaleFactor

  // Update pipe dimensions with your original proportions
  pipeWidth = 64 * scaleFactor
  pipeHeight = 512 * scaleFactor
  pipeX = boardWidth

  // Update other scaled values with your original proportions
  basePipeGap = boardHeight / 3.2
  velocityX = baseVelocityX * scaleFactor

  // Update Superman object
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

  // Load images - your original setup
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

  // Initialize sound - your original setup
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

  // Start game loop
  requestAnimationFrame(gameLoop)
}

function setupCanvas() {
  canvas = document.getElementById("board")
  context = canvas.getContext("2d")
  uiCanvas = document.getElementById("ui")
  uiContext = uiCanvas.getContext("2d")

  // Disable image smoothing for pixel-perfect rendering
  context.imageSmoothingEnabled = false
  uiContext.imageSmoothingEnabled = false

  resize()
}

function resize() {
  gameWidth = window.innerWidth
  gameHeight = window.innerHeight

  canvas.width = gameWidth
  canvas.height = gameHeight
  uiCanvas.width = gameWidth
  uiCanvas.height = gameHeight

  // Update superman position and size
  superman.x = gameWidth * 0.15
  superman.y = gameHeight * 0.5
  superman.width = Math.min(gameWidth * 0.08, 60)
  superman.height = Math.min(gameWidth * 0.04, 30)

  // Update game physics based on screen size
  gameSpeed = Math.max(gameWidth * 0.003, 2)
  gravity = Math.max(gameHeight * 0.0008, 0.5)
  jumpPower = -Math.max(gameHeight * 0.015, 10)
}

function loadImages() {
  const imageList = [
    "superman1",
    "toppipe",
    "bottompipe",
    "pipe1",
    "pipe11",
    "powerups",
    "enemy",
    "collision",
    "gameover",
    "highscore",
  ]

  imageList.forEach((name) => {
    images[name] = new Image()
    images[name].src = `./images/${name}.png`
  })
}

function loadSounds() {
  bgMusic = new Audio("./sound/bg.mp3")
  flySound = new Audio("./sound/fly.mp3")
  hitSound = new Audio("./sound/hit.mp3")

  bgMusic.loop = true
  bgMusic.volume = 0.3
  flySound.volume = 0.5
  hitSound.volume = 0.7
}

function setupEventListeners() {
  // Button click events
  document.getElementById("start-btn").addEventListener("click", startGame)
  document.getElementById("restart-btn").addEventListener("click", restartGame)
  document.getElementById("pause-btn").addEventListener("click", pauseGame)
  document.getElementById("resume-btn").addEventListener("click", resumeGame)

  // Sound button events
  const soundButtons = ["sound-btn-home", "sound-btn-game", "sound-btn-pause", "sound-btn-gameover"]
  const muteButtons = ["mute-btn-home", "mute-btn-game", "mute-btn-pause", "mute-btn-gameover"]

  soundButtons.forEach((id) => {
    const btn = document.getElementById(id)
    if (btn) btn.addEventListener("click", toggleSound)
  })
  muteButtons.forEach((id) => {
    const btn = document.getElementById(id)
    if (btn) btn.addEventListener("click", toggleSound)
  })

  // Touch events for buttons (prevent event bubbling)
  const allButtons = document.querySelectorAll(".btn")
  allButtons.forEach((button) => {
    button.addEventListener("touchstart", handleButtonTouch, { passive: false })
    button.addEventListener("touchend", handleButtonTouch, { passive: false })
  })

  // Game area touch events
  document.addEventListener("touchstart", handleTouchStart, { passive: false })
  document.addEventListener("touchend", handleTouchEnd, { passive: false })
  document.addEventListener("touchmove", handleTouchMove, { passive: false })

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

  // Fly action - your original physics
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
      superman.x = SupermanX
      superman.width = SupermanWidth
      superman.height = SupermanHeight
    }
  }, 100)
}

function handleOrientationChange() {
  setTimeout(handleResize, 500)
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

function fly() {
  velocityY = jumpPower // Your original jump power
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
  const soundBtnHome = document.getElementById("sound-btn-home")
  const muteBtnHome = document.getElementById("mute-btn-home")
  if (soundBtnHome && muteBtnHome) {
    soundBtnHome.style.display = soundEnabled ? "flex" : "none"
    muteBtnHome.style.display = soundEnabled ? "none" : "flex"
  }

  // Game screen
  const soundBtnGame = document.getElementById("sound-btn-game")
  const muteBtnGame = document.getElementById("mute-btn-game")
  if (soundBtnGame && muteBtnGame) {
    soundBtnGame.style.display = soundEnabled ? "flex" : "none"
    muteBtnGame.style.display = soundEnabled ? "none" : "flex"
  }

  // Pause screen
  const soundBtnPause = document.getElementById("sound-btn-pause")
  const muteBtnPause = document.getElementById("mute-btn-pause")
  if (soundBtnPause && muteBtnPause) {
    soundBtnPause.style.display = soundEnabled ? "flex" : "none"
    muteBtnPause.style.display = soundEnabled ? "none" : "flex"
  }

  // Game over screen
  const soundBtnGameover = document.getElementById("sound-btn-gameover")
  const muteBtnGameover = document.getElementById("mute-btn-gameover")
  if (soundBtnGameover && muteBtnGameover) {
    soundBtnGameover.style.display = soundEnabled ? "flex" : "none"
    muteBtnGameover.style.display = soundEnabled ? "none" : "flex"
  }
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true
  showScreen("pause-screen")
  bgMusic.pause()
  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)
  updateSoundDisplay()
}

function resumeGame() {
  isPaused = false
  showScreen("game-screen")
  if (soundEnabled) bgMusic.play().catch(() => {})
  pipeInterval = setDynamicPipeInterval()
  cancelAnimationFrame(animationFrameId)
  requestAnimationFrame(gameLoop)
}

function startGame() {
  gameOver = false
  gameStarted = true
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX * scaleFactor
  velocityY = 0
  superman.y = SupermanY
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  isLevelAnimating = false
  shieldActive = false

  showScreen("game-screen")
  updateDisplay()

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

    if (soundEnabled) bgMusic.play().catch(() => {})
    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(gameLoop)
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

function gameLoop() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) {
    requestAnimationFrame(gameLoop)
    return
  }

  animationFrameId = requestAnimationFrame(gameLoop)
  update()
}

function update() {
  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  currentLevel = Math.floor(score / 15)
  if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
    isLevelAnimating = true
    levelAnimationStartTime = Date.now()
    updateDifficulty()
  }

  // Superman physics - your original
  velocityY += gravity
  superman.y = Math.max(superman.y + velocityY, 0)
  context.drawImage(SupermanImg, superman.x, superman.y, superman.width, superman.height)

  if (superman.y > board.height) endGame()

  // Pipe handling - your original logic
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i]
    pipe.x += velocityX
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

    if (!pipe.passed && superman.x > pipe.x + pipe.width) {
      score += 0.5
      pipe.passed = true
    }

    if (detectCollision(superman, pipe)) {
      drawCollisionEffect(superman.x, superman.y, superman.width, superman.height)
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

  // UI elements
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, 50 * scaleFactor)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = `${16 * scaleFactor}px Arial`
  uiContext.textAlign = "left"
  uiContext.fillText(`HIGH: ${highScore}`, 10 * scaleFactor, 30 * scaleFactor)
  uiContext.textAlign = "center"
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30 * scaleFactor)

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

  // Draw shield if active - your original logic
  if (shieldActive) {
    const timeLeft = shieldEndTime - Date.now()
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0
    const shieldSize = 50 * scaleFactor

    if (!isFlashing) {
      context.drawImage(
        powerUpImg,
        superman.x - (shieldSize - superman.width) / 2,
        superman.y - (shieldSize - superman.height) / 2,
        shieldSize,
        shieldSize,
      )
    } else {
      context.globalAlpha = 0.5
      context.drawImage(
        powerUpImg,
        superman.x - (shieldSize - superman.width) / 2,
        superman.y - (shieldSize - superman.height) / 2,
        shieldSize,
        shieldSize,
      )
      context.globalAlpha = 1.0
    }

    if (timeLeft <= 0) {
      shieldActive = false
    }
  }

  // Handle powerups - your original logic
  for (let i = powerUpArray.length - 1; i >= 0; i--) {
    const p = powerUpArray[i]
    p.x += velocityX
    context.drawImage(p.img, p.x, p.y, p.width, p.height)

    if (detectCollision(superman, p)) {
      shieldActive = true
      shieldEndTime = Date.now() + shieldDuration
      powerUpArray.splice(i, 1)
    }

    if (p.x < -p.width) powerUpArray.splice(i, 1)
  }

  // Handle enemies - your original logic
  for (let i = enemyArray.length - 1; i >= 0; i--) {
    const e = enemyArray[i]
    e.x += e.speed * scaleFactor
    context.drawImage(e.img, e.x, e.y, e.width, e.height)

    if (!shieldActive && detectCollision(superman, e)) {
      drawCollisionEffect(superman.x, superman.y, superman.width, superman.height)
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

// Your original functions
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
  superman.y = SupermanY
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

  document.getElementById("final-score-value").textContent = Math.floor(score)
  document.getElementById("final-high-score").textContent = highScore

  showScreen("gameover-screen")
  updateSoundDisplay()

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

function showScreen(screenId) {
  const screens = ["homepage", "game-screen", "pause-screen", "gameover-screen"]
  screens.forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.style.display = id === screenId ? "flex" : "none"
    }
  })
}

function updateDisplay() {
  const currentScoreEl = document.getElementById("current-score")
  const highScoreEl = document.getElementById("high-score")
  const levelDisplayEl = document.getElementById("level-display")

  if (currentScoreEl) currentScoreEl.textContent = Math.floor(score)
  if (highScoreEl) highScoreEl.textContent = `HIGH: ${highScore}`
  if (levelDisplayEl) levelDisplayEl.textContent = `LEVEL ${currentLevel}`
}

function showHomepage() {
  showScreen("homepage")
  updateSoundDisplay()

  gameOver = false
  gameStarted = false
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  score = 0
  superman.y = SupermanY
}

// Initialize game
window.addEventListener("load", init)

function init() {
  setupCanvas()
  loadImages()
  loadSounds()
  setupEventListeners()
  updateDisplay()
  resize()

  // Start game loop
  requestAnimationFrame(gameLoop)
}

function render() {
  // Clear canvases
  context.clearRect(0, 0, gameWidth, gameHeight)
  uiContext.clearRect(0, 0, gameWidth, gameHeight)

  // Draw superman
  if (images.superman1.complete) {
    context.drawImage(images.superman1, superman.x, superman.y, superman.width, superman.height)
  }

  // Draw shield
  if (shieldActive && images.powerups.complete) {
    const shieldSize = superman.width * 1.5
    const shieldX = superman.x - (shieldSize - superman.width) / 2
    const shieldY = superman.y - (shieldSize - superman.height) / 2

    const timeLeft = shieldEndTime - Date.now()
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0

    if (!isFlashing) {
      context.globalAlpha = 0.7
      context.drawImage(images.powerups, shieldX, shieldY, shieldSize, shieldSize)
      context.globalAlpha = 1.0
    }
  }

  // Draw pipes
  pipes.forEach((pipe) => {
    const img = pipe.isObstacle
      ? pipe.isTop
        ? images.pipe11
        : images.pipe1
      : pipe.isTop
        ? images.toppipe
        : images.bottompipe

    if (img && img.complete) {
      context.drawImage(img, pipe.x, pipe.y, pipe.width, pipe.height)
    }
  })

  // Draw power-ups
  powerUps.forEach((powerUp) => {
    if (images.powerups.complete) {
      context.drawImage(images.powerups, powerUp.x, powerUp.y, powerUp.width, powerUp.height)
    }
  })

  // Draw enemies
  enemies.forEach((enemy) => {
    if (images.enemy.complete) {
      context.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height)
    }
  })
}

function spawnPipe() {
  const pipeWidth = gameWidth * 0.12
  const pipeHeight = gameHeight * 1.2
  const gap = gameHeight * 0.3
  const minY = gameHeight * 0.2
  const maxY = gameHeight * 0.6
  const pipeY = minY + Math.random() * (maxY - minY)

  const isObstacle = Math.random() < Math.min(0.2 + currentLevel * 0.05, 0.6)

  // Top pipe
  pipes.push({
    x: gameWidth,
    y: pipeY - pipeHeight,
    width: pipeWidth,
    height: pipeHeight,
    isTop: true,
    isObstacle: isObstacle,
    scored: false,
  })

  // Bottom pipe
  pipes.push({
    x: gameWidth,
    y: pipeY + gap,
    width: pipeWidth,
    height: pipeHeight,
    isTop: false,
    isObstacle: isObstacle,
    scored: false,
  })
}

function checkCollision(rect1, rect2) {
  // Add small margin to make collision more forgiving
  const margin = 5
  return (
    rect1.x + margin < rect2.x + rect2.width &&
    rect1.x + rect1.width - margin > rect2.x &&
    rect1.y + margin < rect2.y + rect2.height &&
    rect1.y + rect1.height - margin > rect2.y
  )
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
