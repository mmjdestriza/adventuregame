import kaboom from "kaboom";

export const k = kaboom({
    global: false,
    touchToMouse: true,
    canvas: document.getElementById("game"),
    width: 1280,
    height: 720,
    scale: 1,
    debug: true,
    clearColor: [0, 0, 0, 1],
});