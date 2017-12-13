$(function(){
	//Initialize audio file
	var ctx = new AudioContext();
	var audio = document.getElementById('myAudio');
	var audioSrc = ctx.createMediaElementSource(audio);
	//For analysing the audio
	var analyser = ctx.createAnalyser();

	audioSrc.connect(analyser);
	audioSrc.connect(ctx.destination);
	//frequencyBinCount tells you how many values received from the analyser
	var frequencyData = new Uint8Array(analyser.frequencyBinCount);
	var cube, cubeMaterial, cubeGeometry;
	var scene, camera, renderer;
	var controls, guiControls, datGUI;
	var axis, grid, color, fov;
	var spotLight;
	var stats;
	var SCREEN_WIDTH, SCREEN_HEIGHT;

	function init(){
		//Creates scene, camera, and render using Three
		scene = new THREE.Scene();
		//PerspectiveCamera zooms from .1 to 1000 in distance
		camera =  new THREE.PerspectiveCamera(30, window.innerWidth/window.innerHeight, .1, 1000);
		//Renderer softens edges by enabling antialiasing
		renderer = new THREE.WebGLRenderer({antialias:true});
    //Initialize renderer
		renderer.setClearColor(0x000000);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled= true;
		renderer.shadowMapSoft = true;

		//Initialize orbit controls
		//controls = new THREE.OrbitControls( camera, renderer.domElement );
		//controls.addEventListener( 'change', render );
		//Initialize new grid
		grid = new THREE.GridHelper(50, 5, "rgb(0, 255, 0)");

		var x = 0;
		var y = 0;
		var z = 0;

		for (var i = 0; i < 1000; i++){
			//Initialize cube features
			cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
			//MeshPhongMaterial uses Phong shading model (good for reflectance)
			cubeMaterial = new THREE.MeshPhongMaterial();
			cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
			//Adds shadow to cubes
			cube.castShadow = true;
			cube.receiveShadow = true;
			cube.name = frequencyData.length;
			cube.position.x = x;

			x += 10;
			//Reset x
			if (x == 100){
				z += 10;
				x = 0;
			}
			//Reset x and z
			else if (z == 100){
				x = 0;
				y += 10;
				z = 0;
			}
			cube.position.y = y;
			cube.position.z = z;
			scene.add(cube);
		}
		//Initialize camera position
		camera.position.x = 50;
		camera.position.y = 50;
		camera.position.z = 50;
		camera.lookAt(scene.position);

		//Initialize gui controls
		guiControls = new function(){
			this.rotationX  = 0.0;
			this.rotationY  = 0.0;
			this.rotationZ  = 0.0;

			this.lightX = 127;
			this.lightY = 152;
			this.lightZ = 127;
			this.intensity = 3.8;
			this.distance = 1000;
			this.angle = 1.60;
			this.exponent = 2;
			this.shadowCameraNear = 2;
			this.shadowCameraFar = 434;
			this.shadowCameraFov = 46;
			this.shadowCameraVisible=false;
			this.shadowMapWidth=2056;
			this.shadowMapHeight=2056;
			this.shadowBias=0.00;
			this.target = cube;

		}
		//Adds and positions new spotlight on cubes
		spotLight = new THREE.SpotLight(0xF6FF33);
		spotLight.castShadow = true;
		spotLight.position.set (20, 35, 40);
		spotLight.intensity = guiControls.intensity;
		spotLight.distance = guiControls.distance;
		spotLight.angle = guiControls.angle;
		spotLight.exponent = guiControls.exponent;
		spotLight.shadowCameraNear = guiControls.shadowCameraNear;
		spotLight.shadowCameraFar = guiControls.shadowCameraFar;
		spotLight.shadowCameraFov = guiControls.shadowCameraFov;
		spotLight.shadowCameraVisible = guiControls.shadowCameraVisible;
		spotLight.shadowBias = guiControls.shadowBias;
		scene.add(spotLight);

		//Add datGUI controls
		datGUI = new dat.GUI();

		datGUI.add(guiControls, 'rotationX',0,1);
		datGUI.add(guiControls, 'rotationY',0,1);
		datGUI.add(guiControls, 'rotationZ',0,1);

		datGUI.add(guiControls, 'lightX',-60,180);
		datGUI.add(guiControls, 'lightY',0,180);
		datGUI.add(guiControls, 'lightZ',-60,180);

		datGUI.add(guiControls, 'target', ['cube', 'torusKnot','text']).onChange(function(){
			if (guiControls.target == 'cube'){
				spotLight.target =  cube;
			}
			else if (guiControls.target == 'torusKnot'){
				spotLight.target =  torusKnot;
			}
			else if (guiControls.target == 'text'){
				spotLight.target =  text;
			}
		});
		datGUI.add(guiControls, 'intensity', 0.01, 5).onChange(function(value){
			spotLight.intensity = value;
		});
		datGUI.add(guiControls, 'distance', 0, 1000).onChange(function(value){
			spotLight.distance = value;
		});
		datGUI.add(guiControls, 'angle', 0.001, 1.570).onChange(function(value){
			spotLight.angle = value;
		});
		datGUI.add(guiControls, 'exponent', 0, 50).onChange(function(value){
			spotLight.exponent = value;
		});
		datGUI.add(guiControls, 'shadowCameraNear',0,100).name("Near").onChange(function(value){
			spotLight.shadowCamera.near = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowCameraFar',0,5000).name("Far").onChange(function(value){
			spotLight.shadowCamera.far = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowCameraFov',1,180).name("Fov").onChange(function(value){
			spotLight.shadowCamera.fov = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowCameraVisible').onChange(function(value){
			spotLight.shadowCameraVisible = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowBias',0,1).onChange(function(value){
			spotLight.shadowBias = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.close();

		$("#webGL-container").append(renderer.domElement);
		//Adds stats to top left
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';
		$("#webGL-container").append( stats.domElement );
		console.log(scene);
		fov = camera.fov, zoom = 1.0, inc = -0.01;
	}

	function render() {
		scene.traverse(function (e){
			if (e instanceof THREE.Mesh){
				//Rendering rotation based off frequencyData
				e.rotation.x += frequencyData[50]/1000;
				e.rotation.y = frequencyData[e.id]/50;
				e.rotation.z += guiControls.rotationZ;
				var color = new THREE.Color(1, 0, 0);
				//Sets boxes to lime green
				e.material.color.setRGB(0,1,0);
				//(frequencyData[e.id]/255 can be used to base color off audio
			}
		});
		guiControls.intensity = frequencyData[2];
		spotLight.position.x = guiControls.lightX;
		spotLight.position.y = guiControls.lightY;
		spotLight.position.z = guiControls.lightZ;
		//Gets frequencyData from audio
		analyser.getByteFrequencyData(frequencyData);
		camera.fov = fov * zoom;
		camera.updateProjectionMatrix();
		zoom += inc;
		//Rotations based off frequency
		if ( zoom <= 0.1 * (frequencyData[20]/100) || zoom >= 1 * (frequencyData[20]/50) ){
			inc = -inc;
		}
		camera.rotation.y = 90 * Math.PI / 180;
		camera.rotation.z = frequencyData[20] * Math.PI / 180;
		camera.rotation.x = frequencyData[100] * Math.PI / 180;
	}

	function animate(){
		requestAnimationFrame(animate);
		render();
		stats.update();
		renderer.render(scene, camera);
	}

	//If browser window is resized
	$(window).resize(function(){
		SCREEN_WIDTH = window.innerWidth;
		SCREEN_HEIGHT = window.innerHeight;
		camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
		camera.updateProjectionMatrix();
		renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	});
	init();
	animate();
	audio.play();
});
