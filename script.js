const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
    x: 280,
    y: 340,
    width: 40,
    height: 40,
    speed: 6
};

let bullets = [];
let enemies = [];
let stars = [];
let explosions = [];
let powerUps = [];
let powerUpEffects = [];
let score = 0;
let lives = 3;
let powerUpMessage = "";
let powerUpMessageTime = 0;
let shieldActive = false;
let shieldTime = 0;
let running = false;
let keys = {};
let lastSpawn = 0;

let difficulty = "easy";

let enemySpeed = 1;
let spawnTime = 1800;

 function setDifficulty(level) {
    difficulty = level;

    document.querySelectorAll("#easyBtn, #mediumBtn, #hardBtn").forEach(button => {
        button.classList.remove("selected");
    });

    document.getElementById(level + "Btn").classList.add("selected");

    if (level === "easy") {
        enemySpeed = 1;
        spawnTime = 1800;
    } 
    else if (level === "medium") {
        enemySpeed = 2;
        spawnTime = 1200;
    } 
    else if (level === "hard") {
        enemySpeed = 3;
        spawnTime = 700;
    }
}
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 0.5
    });
}

function drawStars() {
    ctx.fillStyle = "white";

    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += star.speed;

        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function drawPlayer() {
    // Spaceship glow
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 20;

    // Spaceship body
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y);
    ctx.lineTo(player.x + 40, player.y + 40);
    ctx.lineTo(player.x + 20, player.y + 30);
    ctx.lineTo(player.x, player.y + 40);
    ctx.closePath();
    ctx.fill();

    // Remove glow for next drawings
    ctx.shadowBlur = 0;
}
function drawShield() {

    if (!shieldActive) return;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        player.x + 20,
        player.y + 20,
        35,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle = "#00c6ff";
    ctx.lineWidth = 4;

    ctx.shadowColor = "#00c6ff";
    ctx.shadowBlur = 25;

    ctx.stroke();

    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = "yellow";

    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 5, 12);
    });
}

function drawEnemies() {
    ctx.fillStyle = "orangered";

    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, 35, 30);
    });
} 
function shoot() {
    bullets.push({ x: player.x + 18, y: player.y });

    // Shooting sound
    if (!window.gameAudioContext) {
        window.gameAudioContext =
            new (window.AudioContext || window.webkitAudioContext)();
    }

    const audio = window.gameAudioContext;

    if (audio.state === "suspended") {
        audio.resume();
    }

    const oscillator = audio.createOscillator();
    const volume = audio.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(700, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        150, audio.currentTime + 0.12
    );

    volume.gain.setValueAtTime(0.12, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(
        0.001, audio.currentTime + 0.12
    );

    oscillator.connect(volume);
    volume.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.12);
}

function playHitSound() {
    const audio = window.gameAudioContext;

    if (!audio) return;

    const oscillator = audio.createOscillator();
    const volume = audio.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(300, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        60, audio.currentTime + 0.25
    );

    volume.gain.setValueAtTime(0.2, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(
        0.001, audio.currentTime + 0.25
    );

    oscillator.connect(volume);
    volume.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.25);
}
function playGameOverSound() {
    const audio = window.gameAudioContext;

    if (!audio) return;

    const oscillator = audio.createOscillator();
    const volume = audio.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(400, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        80, audio.currentTime + 0.7
    );

    volume.gain.setValueAtTime(0.15, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(
        0.001, audio.currentTime + 0.7
    );

    oscillator.connect(volume);
    volume.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.7);
}

// Create Explosion
function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
        explosions.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            life: 30
        });
    }
}

// Draw Explosion
function drawExplosions() {
    explosions.forEach(p => {
        ctx.fillStyle = "#ff9500";
        ctx.globalAlpha = p.life / 30;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        p.life--;
    });

    ctx.globalAlpha = 1;

    explosions = explosions.filter(p => p.life > 0);
}
// Create Power-Up
function createPowerUp(x, y) {
    powerUps.push({
        x: x,
        y: y,
        size: 15,
        speed: 2
    });
}
function createPowerUpEffect(x, y) {

    for (let i = 0; i < 20; i++) {

        powerUpEffects.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 6,
            speedY: (Math.random() - 0.5) * 6,
            life: 30
        });

    }

}
function activateShield() {
    shieldActive = true;
    shieldTime = 300;
}
function drawPowerUpEffects() {

    powerUpEffects.forEach(p => {

        ctx.save();

        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;

    });

    powerUpEffects = powerUpEffects.filter(p => p.life > 0);

}
// Draw Power-Ups
function drawPowerUps() {
    powerUps.forEach(p => {
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    });
}

function update() {
    // Shield Timer
if (shieldActive) {
    shieldTime--;

    if (shieldTime <= 0) {
        shieldActive = false;
    }
}
    if (keys["ArrowLeft"] || keys["KeyA"]) {
        player.x -= player.speed;
    }

    if (keys["ArrowRight"] || keys["KeyD"]) {
        player.x += player.speed;
    }

    if (keys["ArrowUp"] || keys["KeyW"]) {
        player.y -= player.speed;
    }

    if (keys["ArrowDown"] || keys["KeyS"]) {
        player.y += player.speed;
    }

    player.x = Math.max(0, Math.min(canvas.width - 40, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 40, player.y));

    bullets.forEach(b => b.y -= 8);
    bullets = bullets.filter(b => b.y > 0);

    enemies.forEach(e => e.y += enemySpeed);
    
// Move Power-Ups downwards
powerUps.forEach(p => {
    p.y += p.speed;
});


// Collect Power-Up
powerUps.forEach(p => {
    if (
        p.x - p.size < player.x + 40 &&
        p.x + p.size > player.x &&
        p.y - p.size < player.y + 40 &&
        p.y + p.size > player.y
    ) {
        p.collected = true;
lives++;

createPowerUpEffect(p.x,  p.y);
activateShield();

powerUpMessage = "+1 EXTRA LIFE! ❤️";
powerUpMessageTime = 120;
    }
});

// Remove collected and off-screen Power-Ups
powerUps = powerUps.filter(p =>
    !p.collected && p.y < canvas.height + p.size
);



    enemies.forEach(e => {
        if (e.y > canvas.height) {
            e.dead = true;
            lives--;
        }
    });

    bullets.forEach(b => {
        enemies.forEach(e => {
            if (
                b.x < e.x + 35 &&
                b.x + 5 > e.x &&
                b.y < e.y + 30 &&
                b.y + 12 > e.y &&
                !e.dead && !b.dead
            ) {
                e.dead = true;
                b.dead = true;
                score += 10;
                playHitSound();
                createExplosion(e.x + 17, e.y + 15);
                createPowerUp(e.x + 17, e.y + 15);
            }
        });
    });

    enemies.forEach(e => {
        if (
            !e.dead &&
            !shieldActive &&
            player.x < e.x + 35 &&
            player.x + 40 > e.x &&
            player.y < e.y + 30 &&
            player.y + 40 > e.y
        ) {
            e.dead = true;
            lives--;
        }
    });

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);

    if (lives <= 0) {
        running = false;
        playGameOverSound();
    }
}


function gameLoop(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars();

    if (running) {
        update();

        if (time - lastSpawn > spawnTime) {
            enemies.push({
                x: Math.random() * (canvas.width - 35),
                y: -30
            });
            lastSpawn = time;
        }

        drawPlayer();
        drawShield();
        drawBullets();
        drawEnemies();
        drawExplosions();
        drawPowerUps();
        drawPowerUpEffects();

       // Professional Game HUD
ctx.shadowColor = "#00e5ff";
ctx.shadowBlur = 10;
ctx.fillStyle = "#00e5ff";
ctx.font = "bold 20px Arial";

ctx.fillText("⭐ SCORE: " + score, 15, 30);
ctx.fillText("❤️ LIVES: " + lives, 465, 30);

ctx.shadowBlur = 0;

    } else {
        ctx.fillStyle = "white";
        ctx.font = "25px Arial";

        if (lives <= 0) {
ctx.shadowColor = "#ff1744";
ctx.shadowBlur = 25;
ctx.fillStyle = "#ff1744";
ctx.font = "bold 35px Arial";
ctx.fillText("GAME OVER", 190, 190);
ctx.shadowBlur = 0;
            ctx.font = "16px Arial";
            ctx.fillText("Click Restart Below!", 205, 225);

            document.getElementById("restartBtn").style.display = "block";

        } else {
            ctx.fillText("COSMIC BLASTER", 190, 190);
            ctx.font = "16px Arial";
            ctx.fillText("Click Start Game to Play", 205, 225);
        }
    }
    if (powerUpMessageTime > 0) {
    ctx.save();

    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#00ff88";
    ctx.textAlign = "center";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;

    ctx.fillText(powerUpMessage, canvas.width / 2, 100);

    ctx.restore();

    powerUpMessageTime--;
}

    requestAnimationFrame(gameLoop);
}


document.addEventListener("keydown", function (event) {
    keys[event.code] = true;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (event.code === "Space" && running && !event.repeat) {
        shoot();
    }
});

document.addEventListener("keyup", function (event) {
    keys[event.code] = false;
});

function startGame() {
     document.getElementById("startScreen").style.display = "none";
    document.querySelector(".game-container").style.display = "block";
    document.getElementById("restartBtn").style.display = "none";
    player.x = 280;
    player.y = 340;
    bullets = [];
    enemies = [];
    powerUps = [];
    powerUpEffects = [];
    score = 0;
    lives = 5;
    powerUpMessage = "";
powerUpMessageTime = 0;
shieldActive = false;
shieldTime = 0;
    lastSpawn = 0;
    running = true;
}
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn = document.getElementById("fireBtn");

if (leftBtn && rightBtn && fireBtn) {
    leftBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        keys["ArrowLeft"] = true;
    });

    leftBtn.addEventListener("touchend", function() {
        keys["ArrowLeft"] = false;
    });

    rightBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        keys["ArrowRight"] = true;
    });

    rightBtn.addEventListener("touchend", function() {
        keys["ArrowRight"] = false;
    });

    fireBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        if (running) shoot();
    });
}

requestAnimationFrame(gameLoop);
