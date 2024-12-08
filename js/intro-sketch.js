let img; 
let dithered; 

function preload() {

    img = loadImage('./images/dunyayi-kurtaran-adam-ozel-dosya.jpg'); // Replace with your image path
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('section-intro');
    canvas.style('z-index', '-1'); // Ensure it's the background

    img.resize(width, height);
    dithered = createImage(width, height);

    // Compute dithered image once
    applyDithering();
}

function draw() {
    background(0);

    // Display the dithered image with interaction
    image(dithered, 0, 0, windowWidth, windowHeight);
    addInteractionEffect();
}

function applyDithering() {
    dithered.loadPixels();
    img.loadPixels();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let index = (x + y * width) * 4;
            let oldR = img.pixels[index];
            let newR = oldR < 128 ? 0 : 255;
            dithered.pixels[index] = newR;
            dithered.pixels[index + 1] = newR;
            dithered.pixels[index + 2] = newR;
            dithered.pixels[index + 3] = 255;

            // Compute quantization error
            let error = oldR - newR;

            // Spread the error to neighboring pixels (Floyd-Steinberg dithering)
            if (x + 1 < width) img.pixels[index + 4] += error * 7 / 16;
            if (y + 1 < height) {
                if (x > 0) img.pixels[index + width * 4 - 4] += error * 3 / 16;
                img.pixels[index + width * 4] += error * 5 / 16;
                if (x + 1 < width) img.pixels[index + width * 4 + 4] += error * 1 / 16;
            }
        }
    }
    dithered.updatePixels();
}

function addInteractionEffect() {
    noStroke();
    fill(240, 230, 140, 150);
    ellipse(mouseX, mouseY, 150);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    img.resize(width, height);
    applyDithering();
}