var camera, scene, renderer;
var geometry, checkerMaterial, wallMaterial,mesh, light, spotLight;
var controls;

var maze;

var gui;
var guiConfig = {};


var objects = [];

var raycaster;

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

var element = document.body;



var config = {
  mazeScale: 100, //no gui
  doCollisionDetection: false, //no gui
  recursiveCollisions: false, //no gui
  fogColor: '#4ff904',
  lightColor1: '#ffffff',
  lightColor2: '#eeeeee',
  lightIntensity: .75,
  checkerColor1: '#ffffff',
  checkerColor2: '#000000',
  checkerFucker: false, //no gui
  solidFloor: false, //no gui
  bgColor: '#3dc800',
  wallColor: '#000000',
  castShadow: true, //no gui
  shadowPositionX: 0,
  shadowPositionY: 500,
  shadowPositionZ: 1500,
  floorColor1: '#ffffff',
  floorColor2: '#eeeeee',
  floorSpecular: '#57be57',
  floorShininess: 5
}


var pointerlockchange = function ( event ) {

  if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

    controlsEnabled = true;
    controls.enabled = true;

  } else {
    controls.enabled = false;
  }

}

// Hook pointer lock state change events
document.addEventListener( 'pointerlockchange', pointerlockchange, false );
document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );


init();
animate();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( config.fogColor, 0, 750 );

  if (config.castShadow){
    spotLight = new THREE.SpotLight( 0xFFAA88 );
    spotLight.position.set(config.shadowPositionX,config.shadowPositionY,config.shadowPositionZ);
    spotLight.target.position.set( 0, 2, 0 );
    spotLight.shadowCameraNear  = 0.01;
    spotLight.castShadow    = true;
    spotLight.shadowDarkness  = 0.5;
    spotLight.shadowCameraVisible = true;
    scene.add(spotLight);
  }

  light = new THREE.HemisphereLight( config.lightColor1, config.lightColor2, config.lightIntensity );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  controls = new THREE.PointerLockControls( camera );
  scene.add( controls.getObject() );

  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true; break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  var onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0, -1 ), 0, 10 );

  // floor

  geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

  if (config.checkerFucker){
    for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
      var vertex = geometry.vertices[ i ];
      vertex.x += Math.random() * 20 - 10;
      vertex.y += Math.random() * 2;
      vertex.z += Math.random() * 20 - 10;
    }

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {
      var face = geometry.faces[ i ];
      face.vertexColors[ 0 ] = new THREE.Color(config.checkerColor1);
      face.vertexColors[ 1 ] = new THREE.Color(0xffffff);
      face.vertexColors[ 2 ] = new THREE.Color(config.checkerColor2);
    }

    checkerMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

  } else {

    if (config.solidFloor){
      checkerMaterial  = new THREE.MeshPhongMaterial({
        ambient   : config.floorColor2,
        color   : config.floorColor1,
        shininess : config.floorShininess,
        specular  : config.floorSpecular,
        shading   : THREE.SmoothShading,
      });
    } else {
      var checkerTexture = new CheckerBoardTexture(config.checkerColor1, config.checkerColor2, 800, 800);
      checkerMaterial = new THREE.MeshPhongMaterial({
        map: checkerTexture,
        shading   : THREE.SmoothShading
      });
    }



  }

  mesh = new THREE.Mesh( geometry, checkerMaterial );

  if (config.castShadow){
    mesh.receiveShadow = true;
  }


  //material = new THREE.MeshBasicMaterial( { color: '#eee' } );


  scene.add( mesh );


  //ADD MAZE HERE

  loadModelData();


  //END ADD MAZE

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor( config.bgColor );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  if (config.castShadow){
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType    = THREE.PCFSoftShadowMap;
  }

  document.body.appendChild( renderer.domElement );

  //

  window.addEventListener( 'resize', onWindowResize, false );

  addPointerLockHandlers();

}

function addPointerLockHandlers(){
  $('canvas')[0].addEventListener( 'click', function ( event ) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;


    if ( /Firefox/i.test( navigator.userAgent ) ) {

      var fullscreenchange = function (event ) {

      if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

        document.removeEventListener( 'fullscreenchange', fullscreenchange );
        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

        element.requestPointerLock();
      }

    }

    document.addEventListener( 'fullscreenchange', fullscreenchange, false );
    document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

    element.requestFullscreen();

  } else {
    element.requestPointerLock();
  }

  }, false);
}

function loadModelData(){
  // prepare loader and load the model
  var oLoader = new THREE.OBJLoader();
  //oLoader.load('models/chair.obj', function(object, materials) {
    oLoader.load('models/model-for-threejs.obj', function(object, materials) {

    // var material = new THREE.MeshFaceMaterial(materials);
    wallMaterial = new THREE.MeshLambertMaterial({ color: config.wallColor });
    //var material = new THREE.MeshBasicMaterial({wireframe: true});


    object.traverse( function(child) {
      if (child instanceof THREE.Mesh) {

        child.material = wallMaterial;

        child.castShadow = config.castShadow;
        child.receiveShadow = config.castShadow;

      }
    });

    object.position.x = 0;
    object.position.y = 12;
    object.position.z = 0;
    object.scale.set(config.mazeScale, config.mazeScale, config.mazeScale);
    scene.add(object);
    maze = object;
    objects.push(object);
    //renderer.render(scene,camera);

    addGUI();

  });
}

function addGUI(){
  gui = new dat.GUI();

  guiConfig.skyFolder = gui.addFolder('Sky');
  guiConfig.mazeFolder = gui.addFolder('Maze');

  guiConfig.fogColor = guiConfig.skyFolder.addColor(config,'fogColor');
  guiConfig.fogColor.onChange(function(value){
    scene.fog.color.set(value);
  });

  guiConfig.lightIntensity = guiConfig.skyFolder.add(config,'lightIntensity',0,1).step(.05);
  guiConfig.lightIntensity.onFinishChange(function(value){
    light.intensity = value;
  });
  guiConfig.lightColor1 = guiConfig.skyFolder.addColor(config,'lightColor1');
  guiConfig.lightColor1.onChange(function(value){
    light.color.set(value);
  });
  guiConfig.lightColor2 = guiConfig.skyFolder.addColor(config,'lightColor2');
  guiConfig.lightColor2.onChange(function(value){
    light.groundColor.set(value);
  });
  guiConfig.bgColor = guiConfig.skyFolder.addColor(config,'bgColor');
  guiConfig.bgColor.onChange(function(value){
    renderer.setClearColor( value );
  });
  guiConfig.shadowPositionX = guiConfig.skyFolder.add(config,'shadowPositionX',0,2000).step(10);
  guiConfig.shadowPositionX.onChange(function(value){
    changeShadowPosition();
  });
  guiConfig.shadowPositionY = guiConfig.skyFolder.add(config,'shadowPositionY',0,2000).step(10);
  guiConfig.shadowPositionY.onChange(function(value){
    changeShadowPosition();
  });
  guiConfig.shadowPositionZ = guiConfig.skyFolder.add(config,'shadowPositionZ',0,2000).step(10);
  guiConfig.shadowPositionZ.onChange(function(value){
    changeShadowPosition();
  });

  guiConfig.checkerColor1 = guiConfig.mazeFolder.addColor(config,'checkerColor1');
  guiConfig.checkerColor1.onChange(function(value){
    mesh.material.map = new CheckerBoardTexture(config.checkerColor1, config.checkerColor2, 800, 800);
  });
  guiConfig.checkerColor2 = guiConfig.mazeFolder.addColor(config,'checkerColor2');
  guiConfig.checkerColor2.onChange(function(value){
    mesh.material.map = new CheckerBoardTexture(config.checkerColor1, config.checkerColor2, 800, 800);
  });
  guiConfig.wallColor = guiConfig.mazeFolder.addColor(config,'wallColor');
  guiConfig.wallColor.onChange(function(value){
    wallMaterial.color.set(value);
  });
  guiConfig.floorColor1 = guiConfig.mazeFolder.addColor(config,'floorColor1');
  guiConfig.floorColor1.onChange(function(value){
    changeFloorColor();
  });
  guiConfig.floorColor2 = guiConfig.mazeFolder.addColor(config,'floorColor2');
  guiConfig.floorColor2.onChange(function(value){
    changeFloorColor();
  });
  guiConfig.floorSpecular = guiConfig.mazeFolder.addColor(config,'floorSpecular');
  guiConfig.floorSpecular.onChange(function(value){
    changeFloorColor();
  });
  guiConfig.floorShininess = guiConfig.mazeFolder.add(config,'floorShininess',0,500).step(5);
  guiConfig.floorShininess.onChange(function(value){
    changeFloorColor();
  });

}

function changeFloorColor(){

  mesh.material.color.set(config.floorColor1);
  mesh.material.ambient.set(config.floorColor2);
  mesh.material.specular.set(config.floorSpecular);
  mesh.material.shininess = config.floorShininess;
}

function changeShadowPosition(){
  spotLight.position.set(config.shadowPositionX,config.shadowPositionY,config.shadowPositionZ);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function collisionDetection(){

    var curPos = controls.getObject().position;
    var curRay = raycaster.ray.origin.copy(curPos);

    raycaster.ray.origin.copy( curPos );
    //raycaster.ray.origin.y -= 10;
    raycaster.ray.origin.z -=10;

    if (config.recursiveCollisions){
      var intersections = raycaster.intersectObjects( objects, true ); //MH - recursive
    } else {
      var intersections = raycaster.intersectObjects( objects, false );
    }


    var isOnObject = intersections.length > 0;

    if ( isOnObject === true ) {
      console.log('onObject');
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;
    }


}

function animate() {

  requestAnimationFrame( animate );

  if ( controlsEnabled ) {

    if (config.doCollisionDetection){
      collisionDetection();
    }


    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    if ( moveForward ) velocity.z -= 400.0 * delta;
    if ( moveBackward ) velocity.z += 400.0 * delta;

    if ( moveLeft ) velocity.x -= 400.0 * delta;
    if ( moveRight ) velocity.x += 400.0 * delta;

    var controlObject = controls.getObject();

    controlObject.translateX( velocity.x * delta );
    controlObject.translateY( velocity.y * delta );
    controlObject.translateZ( velocity.z * delta );

    if ( controlObject.position.y < 10 ) { //floor height is at 10

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

    prevTime = time;

  }

  renderer.render( scene, camera );

}
