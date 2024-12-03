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

k.scene("game", () => {
    let score = 0;
    
    k.add([
        k.rect(k.width(), k.height()),
        k.color(k.rand(1, 225), k.rand(1, 225), k.rand(1, 225)),
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
            tree: { scale: [5, 8], speed: GAME_CONFIG.SPEED },
            slime: { scale: [5, 7], speed: GAME_CONFIG.SPEED * 1.2 },
            frog: { scale: [5, 6], speed: GAME_CONFIG.SPEED * 1.5 },
            ghost: { scale: [5, 7], speed: GAME_CONFIG.SPEED * 1.3 },
            wizard: { scale: [5, 6], speed: GAME_CONFIG.SPEED * 1.4 }
        };

        const objectType = k.choose(Object.keys(objects));
        const config = objects[objectType];
        
        k.add([
            k.sprite("assets", { anim: objectType }),
            k.scale(k.rand(...config.scale)),
            k.area(),
            k.outline(4),
            k.pos(k.width(), k.height() - GAME_CONFIG.FLOOR_HEIGHT),
            k.anchor("botleft"),
            k.color(255, 180, 255),
            k.move(k.LEFT, config.speed),
            k.offscreen({ destroy: true }),
            "object",
            { type: objectType }
        ]);

        // Gradually decrease spawn time as score increases
        const minDelay = Math.max(0.3, 1.5 - (score / 5000));
        k.wait(k.rand(minDelay, minDelay + 0.5), spawnObject);
    }


    spawnObject();

    player.onCollide("object", (object) => {
        k.addKaboom(player.pos);
        k.shake();
        k.go("lose", score, highscore);
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

k.go("game");

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