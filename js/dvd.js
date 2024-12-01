let shit;
let x, y;
let xSpeed, ySpeed;
let logoWidth, logoHeight;

function preload() {
    shit = loadImage('./images/icon-shit.svg');
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('section-intro');
    canvas.style('z-index', '-1');
    x = random(50, width - 50);
    y = random(50, height - 50);
    xSpeed = 4;
    ySpeed = 3;
    shitWidth = 80;
    shitHeight = 65;
}

function draw() {
    clear();

    x += xSpeed;
    y += ySpeed;

    if (x <= 0 || x + shitWidth >= width) {
        xSpeed *= -1;
        changeColor();
    }
    if (y <= 0 || y + shitHeight >= height) {
        ySpeed *= -1;
        changeColor();
    }

    image(shit, x, y, shitWidth, shitHeight);
}

function changeColor() {
    tint(random(255), random(255), random(255));
}
