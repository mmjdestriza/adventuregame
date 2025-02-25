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
    
    let currentLevel = getCurrentLevel(0);
    const bgRect = k.add([
        k.rect(k.width(), k.height()),
        k.color(...currentLevel.background),
        k.opacity(1),
    ]);

    const player = createPlayer();

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


    const scoreLabel = k.add([
        k.text("Current Score: " + score),
        k.pos(24, 24),
    ]);
    const highscoreLabel = k.add([
        k.text("High Score:" + highscore),
        k.pos(24, 58),
    ]);

    // increment score every frame
    k.onUpdate(() => {
        score++;
        scoreLabel.text = "Current Score:" + score;
        if (score > highscore) {
            highscore++;
            highscoreLabel.text = "High Score:" + highscore;
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
    k.add([
        k.rect(k.width(), k.height()),
        k.color(k.rand(1, 225), k.rand(1, 225), k.rand(1, 225)),
        k.opacity(1),
    ]);
    k.add([
        k.sprite("assets", { anim: "idle-down" }),
        k.pos(k.width() / 2, k.height() / 2 - 80),
        k.scale(15),
        k.anchor("center"),
    ]);

    // display score
    k.add([
        k.text("Current Score:" + score),
        k.pos(k.width() / 2, k.height() / 2 + 80),
        k.scale(2),
        k.anchor("center"),
    ]);
    k.add([
        k.text("Highest Score:" + highscore),
        k.pos(k.width() / 2, k.height() / 2 + 150),
        k.scale(2),
        k.anchor("center"),
    ]);

    // go back to game with space is pressed
    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
})

k.scene("start", () => {
    k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0.5),
    ]);
    
    k.add([
        k.text("ADVENTURE RUNNER", { size: 64 }),
        k.pos(k.width()/2, k.height()/4),
        k.anchor("center"),
        k.color(1, 1, 1)
    ]);
    
    k.add([
        k.text("Instructions:", { size: 32 }),
        k.pos(k.width()/2, k.height()/2 - 50),
        k.anchor("center"),
        k.color(1, 1, 0)
    ]);
    
    const instructions = [
        "Space: Jump",
        "Left/Right Arrows: Move",
        "Click: Slash enemies",
        "Avoid obstacles, slash enemies"
    ];
    
    instructions.forEach((inst, i) => {
        k.add([
            k.text(inst, { size: 24 }),
            k.pos(k.width()/2, k.height()/2 + i * 30),
            k.anchor("center"),
            k.color(1, 1, 1)
        ]);
    });
    
    k.add([
        k.text("Press SPACE to start", { size: 32 }),
        k.pos(k.width()/2, k.height() * 0.75),
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
    
    // Health display with hearts
    const healthContainer = hudContainer.add([
        k.pos(0, 40)
    ]);
    
    for (let i = 0; i < GAME_CONFIG.PLAYER_HEALTH; i++) {
        healthContainer.add([
            k.rect(30, 30),
            k.color(1, 0, 0),
            k.pos(i * 40, 0),
            k.outline(2),
            "heart",
            { index: i }
        ]);
    }
    
    return { scoreLabel, healthContainer };
}