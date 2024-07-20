import { k } from "./kaboomCtx";


const FLOOR_HEIGHT = 48;
const JUMP_FORCE = 800;
const SPEED = 480;
const SLASH_SPEED = 480;

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
    k.add([
        k.rect(k.width(), k.height()),
        k.color(k.rand(1, 225), k.rand(1, 225), k.rand(1, 225)),
        k.opacity(1),
    ]);
    const player = k.add([
        k.sprite("assets", { anim: "idle-right" }),
        k.pos(80, 40),
        k.area(),
        k.body(),
        k.health(3),
        k.scale(5),
    ]);

    player.play("idle-right");

    k.onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.play("walk-right");
            player.jump(JUMP_FORCE);
        }
    });

    k.onKeyDown("left", () => {
        player.move(-SPEED, 0);
        player.play("walk-left");
        player.direction = "left";
    });

    k.onKeyDown("right", () => {
        player.move(SPEED, 0);
        player.play("walk-right");
        player.direction = "right";
    });

    k.onClick(() => {
        slashHit();
    });

    k.add([
        k.rect(k.width(), FLOOR_HEIGHT),
        k.pos(0, k.height() - FLOOR_HEIGHT),
        k.outline(4),
        k.area(),
        k.body({ isStatic: true }),
        k.color(127, 200, 255),
    ]);

    function slashHit() {
        k.add([
            k.sprite("assets", { anim: "slash-right" }),
            k.pos(player.pos),
            k.area(),
            k.move(k.RIGHT, SLASH_SPEED),
            k.scale(5),
            "slash"
        ]);
    }

    function spawnObject() {
        const object = k.choose(["tree", "slime", "frog", "ghost", "wizard"]);
        //const stars = k.choose(["g-star", "s-star", "b-star", "y-star"]);
        k.add([
            k.sprite("assets", { anim: object }),
            k.scale(k.rand(5, 8)),
            k.area(),
            k.outline(4),
            k.pos(k.width(), k.height() - 48),
            k.anchor("botleft"),
            k.color(255, 180, 255),
            k.move(k.LEFT, SPEED),
            k.offscreen({ destroy: true }),
            "object"
        ]);

        k.wait(k.rand(0.5, 1.5), () => {
            spawnObject();
        });
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


    let score = 0;

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