// Game variables
let canvas, context, uiCanvas, uiContext
let gameWidth, gameHeight
let gameState = "home" // 'home', 'playing', 'paused', 'gameover'

// Game objects
const superman = {
  x: 0,
  y: 0,
  width: 60,
  height: 30,
  velocityY: 0,
  img: null,
}

let pipes = []
let powerUps = []
let enemies = []
let particles = []

// Game settings
let score = 0
let highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0
let level = 0
let gameSpeed = 2
let gravity = 0.4
let jumpPower = -8

// Timing
let lastTime = 0
let pipeTimer = 0
let powerUpTimer = 0
let enemyTimer = 0

// Game settings
let soundEnabled = true
let shieldActive = false
let shieldEndTime = 0

// Audio
let bgMusic, flySound, hitSound

// Images
const images = {}

// Touch handling
let touchStartY = 0
let isTouching = false

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
  // Button events
  document.getElementById("start-btn").addEventListener("click", startGame)
  document.getElementById("restart-btn").addEventListener("click", restartGame)
  document.getElementById("pause-btn").addEventListener("click", pauseGame)
  document.getElementById("resume-btn").addEventListener("click", resumeGame)

  // Sound buttons
  const soundButtons = ["sound-btn-home", "sound-btn-game", "sound-btn-pause", "sound-btn-gameover"]
  const muteButtons = ["mute-btn-home", "mute-btn-game", "mute-btn-pause", "mute-btn-gameover"]

  soundButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", toggleSound)
  })
  muteButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", toggleSound)
  })

  // Touch events
  document.addEventListener("touchstart", handleTouchStart, { passive: false })
  document.addEventListener("touchend", handleTouchEnd, { passive: false })
  document.addEventListener("touchmove", handleTouchMove, { passive: false })

  // Keyboard events
  document.addEventListener("keydown", handleKeyPress)

  // Prevent context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault())

  // Resize
  window.addEventListener("resize", resize)
  window.addEventListener("orientationchange", () => setTimeout(resize, 100))
}

function handleTouchStart(e) {
  if (e.target.closest(".btn")) return

  e.preventDefault()
  isTouching = true
  touchStartY = e.touches[0].clientY

  if (gameState === "playing") {
    fly()
  } else if (gameState === "home") {
    startGame()
  } else if (gameState === "gameover") {
    restartGame()
  } else if (gameState === "paused") {
    resumeGame()
  }
}

function handleTouchEnd(e) {
  if (e.target.closest(".btn")) return
  e.preventDefault()
  isTouching = false
}

function handleTouchMove(e) {
  e.preventDefault()
}

function handleKeyPress(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault()
    if (gameState === "playing") {
      fly()
    } else if (gameState === "home") {
      startGame()
    }
  } else if (e.code === "KeyP") {
    if (gameState === "playing") pauseGame()
    else if (gameState === "paused") resumeGame()
  } else if (e.code === "KeyM") {
    toggleSound()
  }
}

function fly() {
  superman.velocityY = jumpPower
  if (soundEnabled) {
    flySound.currentTime = 0
    flySound.play().catch(() => {})
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled
  updateSoundButtons()

  if (soundEnabled && gameState === "playing") {
    bgMusic.play().catch(() => {})
  } else {
    bgMusic.pause()
  }
}

function updateSoundButtons() {
  const contexts = ["home", "game", "pause", "gameover"]
  contexts.forEach((context) => {
    const soundBtn = document.getElementById(`sound-btn-${context}`)
    const muteBtn = document.getElementById(`mute-btn-${context}`)
    if (soundBtn && muteBtn) {
      soundBtn.style.display = soundEnabled ? "flex" : "none"
      muteBtn.style.display = soundEnabled ? "none" : "flex"
    }
  })
}

function startGame() {
  gameState = "playing"
  score = 0
  level = 0
  pipes = []
  powerUps = []
  enemies = []
  particles = []

  superman.y = gameHeight * 0.5
  superman.velocityY = 0
  shieldActive = false

  pipeTimer = 0
  powerUpTimer = 0
  enemyTimer = 0

  showScreen("game-screen")
  updateDisplay()

  // Start countdown
  startCountdown()
}

function startCountdown() {
  let count = 3
  const countdownEl = document.getElementById("countdown")

  function showCount() {
    if (count > 0) {
      countdownEl.textContent = count
      countdownEl.style.display = "block"
      count--
      setTimeout(showCount, 1000)
    } else {
      countdownEl.style.display = "none"
      if (soundEnabled) bgMusic.play().catch(() => {})
    }
  }

  showCount()
}

function pauseGame() {
  if (gameState !== "playing") return
  gameState = "paused"
  showScreen("pause-screen")
  bgMusic.pause()
}

function resumeGame() {
  if (gameState !== "paused") return
  gameState = "playing"
  showScreen("game-screen")
  if (soundEnabled) bgMusic.play().catch(() => {})
}

function restartGame() {
  startGame()
}

function endGame() {
  gameState = "gameover"

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  document.getElementById("final-score-value").textContent = Math.floor(score)
  document.getElementById("final-high-score").textContent = highScore

  showScreen("gameover-screen")
  updateSoundButtons()

  bgMusic.pause()
  if (soundEnabled) {
    hitSound.currentTime = 0
    hitSound.play().catch(() => {})
  }
}

function showScreen(screenId) {
  const screens = ["homepage", "game-screen", "pause-screen", "gameover-screen"]
  screens.forEach((id) => {
    document.getElementById(id).style.display = id === screenId ? "flex" : "none"
  })
}

function updateDisplay() {
  document.getElementById("current-score").textContent = Math.floor(score)
  document.getElementById("high-score").textContent = `HIGH: ${highScore}`
  document.getElementById("level-display").textContent = `LEVEL ${level}`
}

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  if (gameState === "playing") {
    update(deltaTime)
    render()
  }

  requestAnimationFrame(gameLoop)
}

function update(deltaTime) {
  // Update superman physics
  superman.velocityY += gravity
  superman.y += superman.velocityY

  // Keep superman within screen bounds
  if (superman.y < 0) {
    superman.y = 0
    superman.velocityY = 0
  }
  if (superman.y + superman.height > gameHeight) {
    superman.y = gameHeight - superman.height
    superman.velocityY = 0
    endGame()
    return
  }

  // Update timers
  pipeTimer += deltaTime
  powerUpTimer += deltaTime
  enemyTimer += deltaTime

  // Spawn pipes (adjusted timing)
  if (pipeTimer > Math.max(1500 - level * 50, 800)) {
    spawnPipe()
    pipeTimer = 0
  }

  // Spawn power-ups
  if (powerUpTimer > 10000) {
    spawnPowerUp()
    powerUpTimer = 0
  }

  // Spawn enemies
  if (enemyTimer > Math.max(6000 - level * 300, 3000)) {
    spawnEnemy()
    enemyTimer = 0
  }

  // Update pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i]
    pipe.x -= gameSpeed

    // Score when passing through pipes
    if (!pipe.scored && superman.x > pipe.x + pipe.width) {
      if (pipe.isTop) {
        score += 0.5
        pipe.scored = true
      }
    }

    // Remove pipes that are off screen
    if (pipe.x + pipe.width < 0) {
      pipes.splice(i, 1)
      continue
    }

    // Collision detection with pipes
    if (!shieldActive && checkCollision(superman, pipe)) {
      endGame()
      return
    }
  }

  // Update power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i]
    powerUp.x -= gameSpeed

    // Remove power-ups that are off screen
    if (powerUp.x + powerUp.width < 0) {
      powerUps.splice(i, 1)
      continue
    }

    // Collision with power-ups
    if (checkCollision(superman, powerUp)) {
      shieldActive = true
      shieldEndTime = Date.now() + 5000
      powerUps.splice(i, 1)
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    enemy.x -= gameSpeed * 1.2

    // Remove enemies that are off screen
    if (enemy.x + enemy.width < 0) {
      enemies.splice(i, 1)
      continue
    }

    // Collision with enemies
    if (!shieldActive && checkCollision(superman, enemy)) {
      endGame()
      return
    }
  }

  // Update shield
  if (shieldActive && Date.now() > shieldEndTime) {
    shieldActive = false
  }

  // Update level
  const newLevel = Math.floor(score / 10)
  if (newLevel > level) {
    level = newLevel
    updateDisplay()
  }

  updateDisplay()
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

  const isObstacle = Math.random() < Math.min(0.2 + level * 0.05, 0.6)

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

function spawnPowerUp() {
  powerUps.push({
    x: gameWidth,
    y: Math.random() * (gameHeight - gameHeight * 0.1),
    width: gameWidth * 0.06,
    height: gameWidth * 0.06,
  })
}

function spawnEnemy() {
  enemies.push({
    x: gameWidth,
    y: Math.random() * (gameHeight - gameHeight * 0.15),
    width: gameWidth * 0.08,
    height: gameWidth * 0.06,
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
