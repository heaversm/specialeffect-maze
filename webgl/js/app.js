/**
 * @author mrdoob / http://mrdoob.com/
 */

var APP = {

  Player: function () {

    var loader = new THREE.ObjectLoader();
    var renderer;
    var self = this;

    self.camera = null;
    self.scene = null;
    self.light = null;

    self.tweenLights = null;
    self.strobeDuration = 5;
    self.alternateColor = false;
    self.doStrobe = false;

    var scripts = {};

    this.dom = undefined;

    this.width = 500;
    this.height = 500;
    this.pi = Math.PI;

    this.load = function ( json ) {

      renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );

      self.camera = loader.parse( json.camera );
      self.scene = loader.parse( json.scene );
      self.light = self.scene.children[1];
      self.light.intensity = 5;

      scripts = {
        keydown: [],
        keyup: [],
        mousedown: [],
        mouseup: [],
        mousemove: [],
        update: []
      };

      for ( var uuid in json.scripts ) {

        var object = self.scene.getObjectByProperty( 'uuid', uuid, true );

        var sources = json.scripts[ uuid ];

        for ( var i = 0; i < sources.length; i ++ ) {

          var script = sources[ i ];

          var events = ( new Function( 'player', 'scene', 'keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'update', script.source + '\nreturn { keydown: keydown, keyup: keyup, mousedown: mousedown, mouseup: mouseup, mousemove: mousemove, update: update };' ).bind( object ) )( this, self.scene );

          for ( var name in events ) {

            if ( events[ name ] === undefined ) continue;

            if ( scripts[ name ] === undefined ) {

              console.warn( 'APP.Player: event type not supported (', name, ')' );
              continue;

            }

            scripts[ name ].push( events[ name ].bind( object ) );

          }

        }

      }

      this.dom = renderer.domElement;

    };

    this.setCamera = function ( value ) {

      self.camera = value;
      self.camera.aspect = this.width / this.height;
      self.camera.updateProjectionMatrix();

    };

    this.setSize = function ( width, height ) {

      this.width = width;
      this.height = height;

      self.camera.aspect = this.width / this.height;
      self.camera.updateProjectionMatrix();

      renderer.setSize( width, height );

    };

    var dispatch = function ( array, event ) {

      for ( var i = 0, l = array.length; i < l; i ++ ) {

        array[ i ]( event );

      }

    };

    var request;

    var animate = function ( time ) {

      request = requestAnimationFrame( animate );

      dispatch( scripts.update, { time: time } );

      renderer.render( self.scene, self.camera );

    };

    this.play = function () {

      document.addEventListener( 'keydown', onDocumentKeyDown );
      document.addEventListener( 'keyup', onDocumentKeyUp );
      document.addEventListener( 'mousedown', onDocumentMouseDown );
      document.addEventListener( 'mouseup', onDocumentMouseUp );
      document.addEventListener( 'mousemove', onDocumentMouseMove );

      request = requestAnimationFrame( animate );

    };

    this.stop = function () {

      document.removeEventListener( 'keydown', onDocumentKeyDown );
      document.removeEventListener( 'keyup', onDocumentKeyUp );
      document.removeEventListener( 'mousedown', onDocumentMouseDown );
      document.removeEventListener( 'mouseup', onDocumentMouseUp );
      document.removeEventListener( 'mousemove', onDocumentMouseMove );

      cancelAnimationFrame( request );

    };

    //

    var onDocumentKeyDown = function ( event ) {
      //console.log(event.keyCode);

      switch (event.keyCode){
        case 87: //A
        case 38: //UP
          self.camera.position.z -= 5;
          break;
        case 63: //S
        case 40: //DOWN
          self.camera.position.z += 5;
          break;
        case 65: //A
        case 37: //LEFT
          self.camera.position.x -= 5;
          break;
        case 68: //D
        case 39: //RIGHT
          self.camera.position.x += 5;
          break;
        case 32: //SPACE
          self.jumpUp();
          break;
      }

      dispatch( scripts.keydown, event );

    };

    var onDocumentKeyUp = function ( event ) {

      dispatch( scripts.keyup, event );

    };

    var onDocumentMouseDown = function ( event ) {

      dispatch( scripts.mousedown, event );

    };

    var onDocumentMouseUp = function ( event ) {

      dispatch( scripts.mouseup, event );

    };

    var onDocumentMouseMove = function ( event ) {
      if (event.shiftKey){
        var rotY = toRad(event.movementX);
        self.scene.rotateY(rotY);
      }

      dispatch( scripts.mousemove, event );

    };

    this.zoomIntoMaze = function(){

      //var tween = TweenMax.to(self.camera, 2, { delay: 1, fov: 50, ease:Linear.easeNone });
      var tweenQuaternion = TweenMax.to(self.camera.quaternion, 1, { delay: 2, _x: 0, ease:Linear.easeNone});
      var tweenLight = TweenMax.to(self.light, 2, { delay: 1.5, intensity: 1, ease:Linear.easeNone});
      var tweenY = TweenMax.to(self.camera.position, 2, { delay: 1, y: 0, ease:Linear.easeNone,
        onUpdate: function(){
          self.camera.updateProjectionMatrix();
        }, onComplete:function(){
          self.doStrobe = true;
          self.lightsDown();
          self.spinRight();
        }
      });

    }

    this.lightsDown = function(){

      if (self.alternateColor){
        self.alternateLightColorRed();
      }

      if (self.doStrobe == false){
        return;
      }

      self.tweenLights = TweenMax.to(self.light, self.strobeDuration, { intensity: .2, ease:Quad.easeInOut,
        onComplete:function(){
          self.lightsUp();
        }
      });
    }

    this.lightsUp = function(){
      if (self.alternateColor){
        self.alternateLightColorWhite();
      }

      if (self.doStrobe == false){
        return;
      }

      self.tweenLights = TweenMax.to(self.light, self.strobeDuration, { intensity: 2, ease:Quad.easeInOut,
        onComplete:function(){
          self.lightsDown();
        }
      });
    }

    this.jumpUp = function(){
      var jumpUp = TweenMax.to(self.camera.position, .5, { y: 25, ease:Expo.easeOut,
        onComplete:function(){
          self.jumpDown();
        }
      });
    }

    this.jumpDown = function(){
      var jumpDown = TweenMax.to(self.camera.position, .5, { y: 0, ease:Back.easeOut});
    }

    this.spinRight = function(){
      var rotY = toRad(90);
      var anim = TweenMax.to(self.scene.rotation, 2, { delay: 2, y: rotY, ease:Back.easeOut,onComplete: function(){
        self.spinLeft();
      }});

      //self.scene.rotateY(rotY);
    }

    this.spinLeft = function(){
      var rotY = toRad(-90);
      var anim = TweenMax.to(self.scene.rotation, 5, { delay: 1, y: rotY, ease:Back.easeOut,onComplete: function(){
        self.moveCloser();
      }});
    }

    this.moveCloser = function(){
       var newZ = self.camera.position.z - 100;
      var anim = TweenMax.to(self.camera.position, 1, { z: newZ, ease:Linear.easeNone,onComplete: function(){
        self.runningJump();
      }});
    }

    this.runningJump = function(){
      self.jumpUp();
      var newZ = self.camera.position.z - 50;
      var anim = TweenMax.to(self.camera.position, 1, { z: newZ, ease:Quad.easeOut,onComplete: function(){
        self.lookToCenter();
      }});
    }

    this.lookToCenter = function(){
      var rotY = toRad(0);
      var zAnim = TweenMax.to(self.camera.position, 1, { z: 0, ease:Quad.easeOut});
      var anim = TweenMax.to(self.scene.rotation, 1, { y: rotY, ease:Quad.easeOut,onComplete: function(){
        self.changeLightColor();
      }});
    }

    this.changeLightColor = function(){
      var anim = TweenMax.to(self.light.color, 5, { g: 0, b: 0,
        onComplete: function(){
          self.strobeDuration = .1;
          self.alternateColor = true;
          self.escape();
        }
      });
    }

    this.alternateLightColorRed = function(){
      self.light.color.r = 1;
      self.light.color.g = 0;
      self.light.color.b = 0;
    }

    this.alternateLightColorWhite = function(){
      self.light.color.r = 1;
      self.light.color.g = 1;
      self.light.color.b = 1;
    }

    this.escape = function(){

      var tweenQuaternion = TweenMax.to(self.camera.quaternion, .5, { delay: 10, _x: -0.7068251945610204, ease:Quad.easeOut,onComplete: function(){
          self.doStrobe = false;
      }});

      var tweenLight = TweenMax.to(self.light, .5, { delay: 13, intensity: 0, ease:Quad.easeOut,onComplete: function(){
        self.light.intensity = 1;
        self.light.color.r = 1;
        self.light.color.g = 1;
        self.light.color.b = 1;
        self.strobeDuration = 5;
        self.alternateColor = false;
        setTimeout(function(){
          self.zoomIntoMaze();
        },1000);
      }});
      var rotY = toRad(1440);
      var anim = TweenMax.to(self.scene.rotation, 3, { delay: 10, y: rotY, ease:Quad.easeOut,onComplete: function(){
        //self.changeLightColor();
      }});
      var tweenY = TweenMax.to(self.camera.position, 3, { delay: 10, y: 5000, ease:Quad.easeOut,
        onUpdate: function(){
          self.camera.updateProjectionMatrix();
        }, onComplete:function(){

        }
      });
    }

    var toRad = function(degrees){
      return degrees * (self.pi /180);
    }


  }



};
