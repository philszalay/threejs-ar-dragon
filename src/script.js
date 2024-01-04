import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import { ARButton } from 'three/examples/jsm/webxr/ARButton'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import dragon from '../assets/models/dragon.glb'
import cathedral from '../assets/light/cathedral.hdr'

export default class ThreeJsDraft {
  constructor() {
    /**
     * Variables
     */
    this.canvas = document.querySelector('canvas.webgl')
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.devicePixelRatio = window.devicePixelRatio
    this.clock = new THREE.Clock()

    this.uniforms = {
      u_resolution: { type: 'v2', value: new THREE.Vector2(this.width, this.height) },
      u_time: { type: 'f', value: 0.0 },
      u_texture: { value: null }
    }

    /**
     * Scene
     */
    this.scene = new THREE.Scene()

    /**
     * Camera
     */
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    this.camera.position.z = 5

    /**
     * Renderer
     */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(Math.min(this.devicePixelRatio, 2))
    this.renderer.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(this.renderer));
    this.renderer.setAnimationLoop(this.animate.bind(this));

    /**
     * Controls
     */
    this.orbitControls = new OrbitControls(this.camera, this.canvas)

    /**
     * Resize
     */
    window.addEventListener('resize', () => {
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()

      this.devicePixelRatio = window.devicePixelRatio

      this.renderer.setSize(this.width, this.height)
      this.renderer.setPixelRatio(Math.min(this.devicePixelRatio, 2))
    }, false)

    /**
     * Loading Manager
     */
    this.loadingManager = new THREE.LoadingManager()

    this.loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
      console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
    }

    this.loadingManager.onLoad = function () {
      console.log('Loading complete!')
    }

    this.loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
      console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
    }

    this.loadingManager.onError = function (url) {
      console.log('There was an error loading ' + url)
    }

    /**
     * Load Assets
     */
    this.loadAssets()

    /**
     * Helpers
     */
    this.addHelpers()

    /**
     * Objects
     */
    this.addObjects()
  }

  loadAssets() {
    const loader = new GLTFLoader(this.loadingManager);

    loader.load(dragon, (gltf) => {

      console.log(gltf.scene)

      gltf.scene.traverse((object) => {
        if (object.isMesh) {
          object.material.envMapIntensity = 5
          console.log(object.material);
        }
      })

      this.scene.add(gltf.scene)

      gltf.scene.scale.set(.1, .1, .1)

      this.mixer = new THREE.AnimationMixer(gltf.scene)

      const animationAction = this.mixer.clipAction(gltf.animations[0]).play()
    },
      // called while loading is progressing
      function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

      },
      // called when loading has errors
      function (error) {

        console.log('An error happened');

      })

    const hdriLoader = new RGBELoader(this.loadingManager)
    let generator = new THREE.PMREMGenerator(this.renderer);

    hdriLoader.load(cathedral, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      let envmap = generator.fromEquirectangular(texture);
      this.scene.environment = envmap.texture
    });
  }

  addHelpers() {
    const axisHelper = new THREE.AxesHelper(3)
    this.scene.add(axisHelper)

    this.stats = Stats()
    document.body.appendChild(this.stats.dom)
  }

  addObjects() {
  }

  animate() {
    this.orbitControls.update()
    this.stats.update()

    var delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    this.uniforms['u_time'].value += 0.01
    this.renderer.render(this.scene, this.camera)
  }
}

/**
 * Create ThreeJsDraft
 */
// eslint-disable-next-line no-new
new ThreeJsDraft()
