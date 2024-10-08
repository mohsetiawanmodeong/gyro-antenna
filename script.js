/*
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp32-mpu-6050-web-server/

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

document.getElementById('refreshBtn').addEventListener('click', function() {
  location.reload();
});

document.getElementById('fullscreenBtn').addEventListener('click', function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

let scene, camera, renderer, tube;

function parentWidth(elem) {
  return elem.parentElement.clientWidth;
}

function parentHeight(elem) {
  return elem.parentElement.clientHeight;
}

function init3D(){
  scene = new THREE.Scene();
  
  // Create a gradient background
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0, '#4a6fa5');  // Light blue center
  gradient.addColorStop(1, '#172a45');  // Dark blue edge
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const bgTexture = new THREE.CanvasTexture(canvas);
  scene.background = bgTexture;

  camera = new THREE.PerspectiveCamera(75, parentWidth(document.getElementById("3Dtube")) / parentHeight(document.getElementById("3Dtube")), 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(parentWidth(document.getElementById("3Dtube")), parentHeight(document.getElementById("3Dtube")));

  document.getElementById('3Dtube').appendChild(renderer.domElement);

  // Create geometries for the antenna parts
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
  const bodyMaterial = new THREE.MeshPhongMaterial({color: 0xCCCCCC});  // Light gray
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

  const topGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const topMaterial = new THREE.MeshPhongMaterial({color: 0xDDDDDD});  // Slightly lighter gray
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.y = 1.5;

  const baseGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
  const baseMaterial = new THREE.MeshPhongMaterial({color: 0x555555});  // Dark gray
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -1.55;

  const cableGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 32);
  const cableMaterial = new THREE.MeshPhongMaterial({color: 0x222222});  // Very dark gray
  const cable = new THREE.Mesh(cableGeometry, cableMaterial);
  cable.position.y = -1.85;
  cable.position.x = 0.2;
  cable.rotation.z = Math.PI / 6;

  tube = new THREE.Group();
  tube.add(body);
  tube.add(top);
  tube.add(base);
  tube.add(cable);

  scene.add(tube);
  
  // Enhanced lighting
  const mainLight = new THREE.PointLight(0xFFFFFF, 1, 100);
  mainLight.position.set(10, 10, 10);
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0x9999FF, 0.5, 100);  // Soft blue fill light
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  camera.position.z = 6;
  renderer.render(scene, camera);
}

// Resize the 3D object when the browser window changes size
function onWindowResize(){
  camera.aspect = parentWidth(document.getElementById("3Dtube")) / parentHeight(document.getElementById("3Dtube"));
  camera.updateProjectionMatrix();
  renderer.setSize(parentWidth(document.getElementById("3Dtube")), parentHeight(document.getElementById("3Dtube")));
}

window.addEventListener('resize', onWindowResize, false);

// Create the 3D representation
init3D();

// Create events for the sensor readings
if (!!window.EventSource) {
  var source = new EventSource('/events');

  source.addEventListener('open', function(e) {
    console.log("Events Connected");
  }, false);

  source.addEventListener('error', function(e) {
    if (e.target.readyState != EventSource.OPEN) {
      console.log("Events Disconnected");
    }
  }, false);

  source.addEventListener('gyro_readings', function(e) {
    var obj = JSON.parse(e.data);
    document.getElementById("gyroX").innerHTML = obj.gyroX;
    document.getElementById("gyroY").innerHTML = obj.gyroY;
    document.getElementById("gyroZ").innerHTML = obj.gyroZ;

    // Ubah rotasi antena
    tube.rotation.x = obj.gyroY;
    tube.rotation.z = obj.gyroX;
    tube.rotation.y = obj.gyroZ;
    renderer.render(scene, camera);
  }, false);

  source.addEventListener('temperature_reading', function(e) {
    console.log("temperature_reading", e.data);
    document.getElementById("temp").innerHTML = e.data;
  }, false);

  source.addEventListener('accelerometer_readings', function(e) {
    console.log("accelerometer_readings", e.data);
    var obj = JSON.parse(e.data);
    document.getElementById("accX").innerHTML = obj.accX;
    document.getElementById("accY").innerHTML = obj.accY;
    document.getElementById("accZ").innerHTML = obj.accZ;
  }, false);
}

function resetPosition(element){
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/"+element.id, true);
  console.log(element.id);
  xhr.send();
}