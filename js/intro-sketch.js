let video;
let tracker;
let useWebcam = false; // Whether to use webcam
let positions = null; // Face tracking points
let leftEyePath = [];
let rightEyePath = [];
let w = 0, h = 0;
let iris;

const eyeDistance = 50;

function setup() {
  w = windowWidth;
  h = windowHeight;
  createCanvas(w, h);

  frameRate(10);
  colorMode(HSB);
  background(0);

  iris = color(25, 80, 80, 0.4);

  // Request webcam access on page load
  video = createCapture(VIDEO, function () {
    useWebcam = true;
    video.size(160, 120);
    video.hide();

    tracker = new clm.tracker();
    tracker.init();
    tracker.start(video.elt);
  });

  // Handle webcam denial
  video.elt.addEventListener('error', () => {
    console.log("Webcam access denied or unavailable. Using mouse tracking instead.");
    useWebcam = false;
  });
}

function draw() {
  translate(w, 0);
  scale(-1.0, 1.0);

  background(0, 20);

  if (useWebcam && tracker) {
    positions = tracker.getCurrentPosition();
  }

  if (useWebcam && positions && positions.length > 0) {
    // Webcam tracking mode
    const eye1 = createEye(23, 24, 25, 26, 63, 64, 65, 66, 27);
    const eye2 = createEye(28, 29, 30, 31, 67, 68, 69, 70, 32);
    leftEyePath.push(eye1.outline);
    rightEyePath.push(eye2.outline);

    drawEye(eye1, iris);
    drawEye(eye2, iris);
  } else {
    // Mouse tracking mode (no fallback switch mid-interaction)
    const eye1 = createMouseEye(mouseX - eyeDistance, mouseY);
    const eye2 = createMouseEye(mouseX + eyeDistance, mouseY);
    leftEyePath.push(eye1.outline);
    rightEyePath.push(eye2.outline);

    drawEye(eye1, iris);
    drawEye(eye2, iris);
  }

  // Draw paths
  drawPaths(leftEyePath, color(63, 49, 97, 0.2));
  drawPaths(rightEyePath, color(63, 49, 97, 0.2));

  // Limit path history
  if (leftEyePath.length > 100) leftEyePath.shift();
  if (rightEyePath.length > 100) rightEyePath.shift();
}

function createEye(p1, p2, p3, p4, p5, p6, p7, p8, center) {
  return {
    outline: [
      getPoint(p1), getPoint(p2), getPoint(p3), getPoint(p4),
      getPoint(p5), getPoint(p6), getPoint(p7), getPoint(p8)
    ],
    center: getPoint(center),
    top: getPoint(p2),
    bottom: getPoint(p4)
  };
}

function createMouseEye(x, y) {
  const sizeX = 40;
  const sizeY = 20;
  return {
    outline: [
      createVector(x - sizeX, y - sizeY),
      createVector(x + sizeX, y - sizeY * 1.5),
      createVector(x + sizeX, y - sizeY),
      createVector(x + sizeX, y + sizeY),
      createVector(x - sizeX, y + sizeY),
      createVector(x + sizeX, y + sizeY * 1.5)
    ],
    center: createVector(x, y),
  };
}

function getPoint(index) {
  return createVector(
    positions[index][0] * (width / video.width),
    positions[index][1] * (height / video.height)
  );
}

function drawEye(eye, irisColor) {
  noStroke();

  // Calculate iris size based on distances
  const irisRadius = min(abs(eye.center-eye.top), abs(eye.center-eye.bottom));
  const irisSize = irisRadius * 2;

  // Draw iris
  fill(irisColor);
  ellipse(eye.center.x, eye.center.y, irisSize, irisSize);

  // Draw pupil
  const pupilSize = irisSize / 3;
  fill(0, 0.6);
  ellipse(eye.center.x, eye.center.y, pupilSize, pupilSize);
}

function drawPaths(paths, col) {
  noFill();
  stroke(col);
  strokeWeight(2);
  for (let path of paths) {
    beginShape();
    for (let p of path) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
