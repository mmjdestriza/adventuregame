import { k } from "./kaboomCtx";

// Group related constants
const GAME_CONFIG = {
    FLOOR_HEIGHT: 48,
    JUMP_FORCE: 800,
    SPEED: 480,
    SLASH_SPEED: 480,
    PLAYER_SCALE: 5,
    PLAYER_START_POS: { x: 80, y: 40 },
    PLAYER_HEALTH: 3
};

let highscore = 0;

// k.loadSprite("coinassets", "./coinsheet.png", {
//     sliceX: 56,
//     sliceY: 64,
//     anims: {
//         "g-star": { from: 680, to: 701, loop: true, speed: 8 },
//         "s-star": { from: 753, to: 758, loop: true, speed: 8 },
//         "b-star": { from: 810, to: 815, loop: true, speed: 8 },
//         "y-star": { from: 867, to: 872, loop: true, speed: 8 },
//     }
// });


k.loadSprite("assets", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
        "idle-right": 975,
        "walk-right": { from: 975, to: 978, loop: true, speed: 8 },
        "idle-left": 1053,
        "walk-left": { from: 1053, to: 1056, loop: true, speed: 8 },
        "hit-left": 1095,
        "hit-right": 1093,
        "tree": 160,
        "slime": 899,
        "frog": 829,
        "wizard": 825,
        "ghost": 903,
        "slash-right": { from: 1009, to: 1013, loop: true, speed: 8 },
        "slash-left": { from: 1052, to: 1048, loop: true, speed: 8 },
    },
});

k.setGravity(1600);

const LEVELS = [
    { required: 0, background: [0.1, 0.3, 0.6], name: "Meadow", enemyTypes: ["tree", "slime"] },
    { required: 5000, background: [0.3, 0.2, 0.5], name: "Forest", enemyTypes: ["tree", "slime", "frog"] },
    { required: 15000, background: [0.2, 0.1, 0.4], name: "Haunted Woods", enemyTypes: ["tree", "ghost", "frog"] },
    { required: 30000, background: [0.1, 0.0, 0.3], name: "Dark Castle", enemyTypes: ["ghost", "wizard"] },
];

function getCurrentLevel(score) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (score >= LEVELS[i].required) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

k.scene("game", () => {
    let score = 0;
    let scoreMultiplier = 1;
    
    let currentLevel = getCurrentLevel(0);
    const bgRect = k.add([
        k.rect(k.width(), k.height()),
        k.color(...currentLevel.background),
        k.opacity(1),
    ]);

    const player = createPlayer();
    const hud = createHUD(score, GAME_CONFIG.PLAYER_HEALTH);

    player.play("idle-right");

    k.onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.play("walk-right");
            player.jump(GAME_CONFIG.JUMP_FORCE);
        }
    });

    k.onKeyDown("left", () => {
        player.move(-GAME_CONFIG.SPEED, 0);
        player.play("walk-left");
        player.direction = "left";
    });

    k.onKeyDown("right", () => {
        player.move(GAME_CONFIG.SPEED, 0);
        player.play("walk-right");
        player.direction = "right";
    });

    k.onClick(() => {
        slashHit();
    });

    k.add([
        k.rect(k.width(), GAME_CONFIG.FLOOR_HEIGHT),
        k.pos(0, k.height() - GAME_CONFIG.FLOOR_HEIGHT),
        k.outline(4),
        k.area(),
        k.body({ isStatic: true }),
        k.color(127, 200, 255),
    ]);

    function slashHit() {
        if (player.isSlashing) return; // Prevent spam clicking
        
        const slashAnim = player.direction === "right" ? "slash-right" : "slash-left";
        const slashDirection = player.direction === "right" ? k.RIGHT : k.LEFT;
        
        player.isSlashing = true;
        
        const slash = k.add([
            k.sprite("assets", { anim: slashAnim }),
            k.pos(player.pos),
            k.area(),
            k.move(slashDirection, GAME_CONFIG.SLASH_SPEED),
            k.scale(GAME_CONFIG.PLAYER_SCALE),
            "slash"
        ]);

        // Reset slashing after a delay
        k.wait(0.5, () => {
            player.isSlashing = false;
        });
    }

    function spawnObject() {
        const objects = {
            tree: { 
                scale: [5, 8], 
                speed: GAME_CONFIG.SPEED,
                behavior: null // static obstacle
            },
            slime: { 
                scale: [5, 7], 
                speed: GAME_CONFIG.SPEED * 1.2,
                behavior: (obj) => {
                    // Jump behavior
                    if (k.rand(0, 100) < 2) {
                        obj.jump(400);
                    }
                }
            },
            frog: { 
                scale: [5, 6], 
                speed: GAME_CONFIG.SPEED * 1.5,
                behavior: (obj) => {
                    // Jump higher and follow player
                    if (k.rand(0, 100) < 5) {
                        obj.jump(600);
                        if (obj.pos.x > player.pos.x) {
                            obj.move(-100, 0);
                        }
                    }
                }
            },
            ghost: { 
                scale: [5, 7], 
                speed: GAME_CONFIG.SPEED * 1.3,
                behavior: (obj) => {
                    // Float up and down
                    obj.pos.y += Math.sin(k.time() * 5) * 2;
                }
            },
            wizard: { 
                scale: [5, 6], 
                speed: GAME_CONFIG.SPEED * 1.4,
                behavior: (obj) => {
                    // Occasionally shoot
                    if (k.rand(0, 100) < 1) {
                        shootProjectile(obj.pos, k.LEFT, 600);
                    }
                }
            }
        };

        const objectType = k.choose(Object.keys(objects));
        const config = objects[objectType];
        
        const obj = k.add([
            k.sprite("assets", { anim: objectType }),
            k.scale(k.rand(...config.scale)),
            k.area(),
            k.outline(4),
            k.pos(k.width(), k.height() - GAME_CONFIG.FLOOR_HEIGHT),
            k.anchor("botleft"),
            k.color(255, 180, 255),
            k.move(k.LEFT, config.speed),
            k.offscreen({ destroy: true }),
            k.body(),
            "object",
            { 
                type: objectType,
                behavior: config.behavior,
                update() {
                    if (this.behavior) {
                        this.behavior(this);
                    }
                }
            }
        ]);

        // Gradually decrease spawn time as score increases
        const difficultyFactor = Math.min(5, 1 + (score / 10000));
        const minDelay = Math.max(0.3, 1.5 - (score / 5000) / difficultyFactor);
        k.wait(k.rand(minDelay, minDelay + 0.5), spawnObject);
    }

    function shootProjectile(position, direction, speed) {
        k.add([
            k.rect(20, 20),
            k.pos(position.x, position.y - 30),
            k.area(),
            k.color(1, 0.5, 0),
            k.outline(2),
            k.move(direction, speed),
            k.offscreen({ destroy: true }),
            "projectile"
        ]);
    }

    function spawnPowerup() {
        const powerups = {
            "speed": { color: k.rgb(0, 1, 1), effect: () => {
                player.speed = GAME_CONFIG.SPEED * 1.5;
                k.wait(5, () => player.speed = GAME_CONFIG.SPEED);
            }},
            "invincible": { color: k.rgb(1, 1, 0), effect: () => {
                player.isInvincible = true;
                player.opacity = 0.7;
                k.wait(3, () => {
                    player.isInvincible = false;
                    player.opacity = 1;
                });
            }},
            "doubleScore": { color: k.rgb(0, 1, 0), effect: () => {
                scoreMultiplier = 2;
                k.wait(10, () => scoreMultiplier = 1);
            }}
        };
        
        const powerupType = k.choose(Object.keys(powerups));
        const config = powerups[powerupType];
        
        k.add([
            k.rect(30, 30),
            k.color(config.color),
            k.anchor("center"),
            k.area(),
            k.pos(k.width(), k.height() - GAME_CONFIG.FLOOR_HEIGHT - 50),
            k.move(k.LEFT, GAME_CONFIG.SPEED * 0.8),
            k.offscreen({ destroy: true }),
            k.rotate(0),
            {
                update() {
                    this.angle += k.dt() * 100;
                }
            },
            "powerup",
            { type: powerupType, effect: config.effect }
        ]);
        
        k.wait(k.rand(5, 15), spawnPowerup);
    }

    spawnObject();

    player.onCollide("object", (object) => {
        k.addKaboom(player.pos);
        k.shake();
        
        // Flash the player red
        player.color = k.rgb(1, 0, 0);
        k.wait(0.2, () => player.color = k.rgb(1, 1, 1));
        
        // Decrease health instead of immediate game over
        player.hurt(1);
        
        // Update health display
        const hearts = hud.healthContainer.get("heart");
        const heartToRemove = hearts.find(h => h.index === player.hp() - 1);
        if (heartToRemove) {
            heartToRemove.color = k.rgb(0.3, 0.3, 0.3);
        }
        
        if (player.hp() <= 0) {
            k.go("lose", score, highscore);
        }
    });

    k.onCollide("object", "slash", (object, slash) => {
        k.addKaboom(object.pos);
        k.destroy(object);
        k.destroy(slash);
    });

    // increment score every frame
    k.onUpdate(() => {
        score += 1 * scoreMultiplier;
        hud.scoreLabel.setScore(score);
        
        if (score > highscore) {
            highscore = score;
            hud.highscoreLabel.text = "High Score: " + highscore;
        }

        const newLevel = getCurrentLevel(score);
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            bgRect.color = k.rgb(...currentLevel.background);
            
            // Show level transition
            const levelText = k.add([
                k.text("Level: " + currentLevel.name, { size: 48 }),
                k.pos(k.width()/2, k.height()/2),
                k.anchor("center"),
                k.color(1, 1, 1),
                k.opacity(1),
                k.lifespan(2),
                {
                    update() {
                        this.opacity = this.opacity > 0 ? this.opacity - 0.01 : 0;
                    }
                }
            ]);
        }
    });
});

k.scene("lose", (score, highscore) => {
    // Add particle effects for background
    for(let i = 0; i < 100; i++) {
        k.add([
            k.rect(5, 5),
            k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
            k.color(k.rand(0, 1), k.rand(0, 1), k.rand(0, 1)),
            k.opacity(k.rand(0.1, 0.5)),
            k.scale(k.rand(0.5, 2)),
            {
                update() {
                    this.pos.y += k.rand(1, 3);
                    if (this.pos.y > k.height()) {
                        this.pos.y = 0;
                    }
                }
            }
        ]);
    }
    
    // Dark overlay
    k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(0.7),
    ]);
    
    // Game Over Title
    k.add([
        k.text("GAME OVER", { size: 80 }),
        k.pos(k.width() / 2, k.height() / 4),
        k.anchor("center"),
        k.color(1, 0, 0),
        {
            update() {
                this.scale = 1 + Math.sin(k.time() * 2) * 0.05;
            }
        }
    ]);
    
    // Character with animation
    k.add([
        k.sprite("assets", { anim: "idle-down" }),
        k.pos(k.width() / 2, k.height() / 2 - 40),
        k.scale(15),
        k.anchor("center"),
        {
            timer: 0,
            update() {
                this.timer += k.dt();
                // Make the character gently bob up and down
                this.pos.y += Math.sin(this.timer * 3) * 0.5;
            }
        }
    ]);

    // Score display with fancy animations
    k.add([
        k.text("Your Score: " + score, { size: 40 }),
        k.pos(k.width() / 2, k.height() / 2 + 100),
        k.scale(1),
        k.anchor("center"),
        k.color(1, 1, 1),
        {
            timer: 0,
            update() {
                this.timer += k.dt();
                // Subtle pulse effect
                this.scale = 1 + Math.sin(this.timer * 4) * 0.05;
            }
        }
    ]);
    
    // Highlight if high score was achieved
    const isNewHighscore = score >= highscore;
    k.add([
        k.text("Highest Score: " + highscore, { size: 32 }),
        k.pos(k.width() / 2, k.height() / 2 + 160),
        k.scale(isNewHighscore ? 1.2 : 1),
        k.anchor("center"),
        k.color(isNewHighscore ? 1 : 0.8, isNewHighscore ? 0.8 : 0.8, isNewHighscore ? 0 : 0),
    ]);
    
    // New High Score notification if applicable
    if (isNewHighscore) {
        k.add([
            k.text("NEW HIGH SCORE!", { size: 36 }),
            k.pos(k.width() / 2, k.height() / 2 + 210),
            k.anchor("center"),
            k.color(1, 1, 0),
            {
                timer: 0,
                update() {
                    this.timer += k.dt();
                    this.opacity = 0.5 + Math.sin(this.timer * 8) * 0.5;
                }
            }
        ]);
    }

    // Instructions to restart
    k.add([
        k.text("Press SPACE or click to play again", { size: 28 }),
        k.pos(k.width() / 2, k.height() - 100),
        k.anchor("center"),
        k.color(1, 1, 1),
        k.opacity(1),
        {
            timer: 0,
            update() {
                this.timer += k.dt();
                this.opacity = 0.5 + Math.abs(Math.sin(this.timer * 3)) * 0.5;
            }
        }
    ]);

    // go back to game with space is pressed
    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
});

k.scene("start", () => {
    // Animated background
    const bg = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0.3),
    ]);
    
    // Add background particles
    for(let i = 0; i < 50; i++) {
        k.add([
            k.rect(3, 3),
            k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
            k.color(1, 1, 1),
            k.opacity(k.rand(0.2, 0.8)),
            {
                speed: k.rand(20, 60),
                update() {
                    this.pos.y -= this.speed * k.dt();
                    if (this.pos.y < 0) {
                        this.pos.y = k.height();
                        this.pos.x = k.rand(0, k.width());
                    }
                }
            }
        ]);
    }
    
    // Title with glow effect
    k.add([
        k.text("ADVENTURE RUNNER", { size: 72 }),
        k.pos(k.width()/2, k.height()/4),
        k.anchor("center"),
        k.color(1, 1, 1),
        {
            timer: 0,
            update() {
                this.timer += k.dt();
                // Subtle pulse and color shift
                this.scale = 1 + Math.sin(this.timer * 2) * 0.05;
                this.color = k.rgb(
                    0.8 + Math.sin(this.timer) * 0.2,
                    0.8 + Math.cos(this.timer * 1.5) * 0.2,
                    1
                );
            }
        }
    ]);
    
    // Character showcase
    const character = k.add([
        k.sprite("assets", { anim: "idle-right" }),
        k.scale(GAME_CONFIG.PLAYER_SCALE * 3),
        k.pos(k.width()/2, k.height()/2 - 10),
        k.anchor("center"),
        {
            dir: 1,
            timer: 0,
            update() {
                this.timer += k.dt();
                // Make character run back and forth
                this.pos.x += this.dir * 2;
                
                if(this.pos.x > k.width()/2 + 100) {
                    this.dir = -1;
                    this.play("walk-left");
                }
                if(this.pos.x < k.width()/2 - 100) {
                    this.dir = 1;
                    this.play("walk-right");
                }
            }
        }
    ]);
    
    // Instructions header
    k.add([
        k.text("HOW TO PLAY", { size: 36 }),
        k.pos(k.width()/2, k.height()/2 + 80),
        k.anchor("center"),
        k.color(1, 0.8, 0.2)
    ]);
    
    // Instructions with icons
    const instructions = [
        "⌨️ Arrow Keys: Move left/right",
        "🔼 Space: Jump",
        "🖱️ Click: Slash enemies",
        "❤️ Collect power-ups, avoid obstacles"
    ];
    
    instructions.forEach((inst, i) => {
        k.add([
            k.text(inst, { size: 24 }),
            k.pos(k.width()/2, k.height()/2 + 130 + i * 30),
            k.anchor("center"),
            k.color(1, 1, 1)
        ]);
    });
    
    // Flashing start prompt
    k.add([
        k.text("Press SPACE to start", { size: 32 }),
        k.pos(k.width()/2, k.height() - 100),
        k.anchor("center"),
        k.color(1, 1, 1),
        k.opacity(1),
        {
            timer: 0,
            update() {
                this.timer += k.dt();
                this.opacity = Math.abs(Math.sin(this.timer * 3));
            }
        }
    ]);
    
    // Show high score if exists
    if (highscore > 0) {
        k.add([
            k.text("High Score: " + highscore, { size: 28 }),
            k.pos(k.width()/2, k.height() - 150),
            k.anchor("center"),
            k.color(1, 0.8, 0),
            {
                timer: 0,
                update() {
                    this.timer += k.dt();
                    this.scale = 1 + Math.sin(this.timer * 1.5) * 0.05;
                }
            }
        ]);
    }
    
    // Add some decorative elements
    for (let i = 0; i < 3; i++) {
        const enemy = k.choose(["tree", "slime", "frog", "ghost", "wizard"]);
        k.add([
            k.sprite("assets", { anim: enemy }),
            k.scale(3),
            k.pos(
                k.width() * (i + 1) / 4,
                k.height() - 100
            ),
            k.anchor("center"),
            {
                timer: i * 0.7,
                update() {
                    this.timer += k.dt();
                    // Bobbing motion
                    this.pos.y = k.height() - 100 + Math.sin(this.timer * 2) * 10;
                }
            }
        ]);
    }
    
    // Event handlers
    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
});

k.go("start");

function createPlayer() {
    const player = k.add([
        k.sprite("assets", { anim: "idle-right" }),
        k.pos(GAME_CONFIG.PLAYER_START_POS.x, GAME_CONFIG.PLAYER_START_POS.y),
        k.area(),
        k.body(),
        k.health(GAME_CONFIG.PLAYER_HEALTH),
        k.scale(GAME_CONFIG.PLAYER_SCALE),
        // Add a custom component for direction
        {
            direction: "right",
            isSlashing: false
        }
    ]);
    return player;
}

function createHUD(score, lives) {
    const hudContainer = k.add([
        k.pos(20, 20),
        k.fixed()
    ]);
    
    // Score with animated counter
    const scoreLabel = hudContainer.add([
        k.text("Score: 0", { size: 24 }),
        k.pos(0, 0),
        k.color(1, 1, 1),
        {
            displayScore: 0,
            actualScore: score,
            update() {
                if (this.displayScore < this.actualScore) {
                    this.displayScore = Math.min(this.displayScore + 5, this.actualScore);
                    this.text = "Score: " + this.displayScore;
                }
            },
            setScore(val) {
                this.actualScore = val;
            }
        }
    ]);
    
    // High score display
    const highscoreLabel = hudContainer.add([
        k.text("High Score: " + highscore, { size: 24 }),
        k.pos(0, 30),
        k.color(1, 0.8, 0)
    ]);
    
    // Health display with hearts
    const healthContainer = hudContainer.add([
        k.pos(0, 70)
    ]);
    
    // Create heart icons instead of rectangles
    for (let i = 0; i < lives; i++) {
        healthContainer.add([
            k.text("❤️", { size: 32 }),
            k.pos(i * 40, 0),
            "heart",
            { index: i }
        ]);
    }
    
    return { scoreLabel, highscoreLabel, healthContainer };
}