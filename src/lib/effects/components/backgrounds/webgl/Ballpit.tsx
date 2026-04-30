// @ts-nocheck
"use client";
import { useEffect, useRef } from 'react';
import {
  Vector3 as a,
  MeshPhysicalMaterial as c,
  InstancedMesh as d,
  Clock as e,
  AmbientLight as f,
  SphereGeometry as g,
  ShaderChunk as h,
  Scene as i,
  Color as l,
  Object3D as m,
  SRGBColorSpace as n,
  MathUtils as o,
  PMREMGenerator as p,
  Vector2 as r,
  WebGLRenderer as s,
  PerspectiveCamera as t,
  PointLight as u,
  ACESFilmicToneMapping as v,
  Plane as w,
  Raycaster as y
} from 'three';
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js';

class ThreeApp {
  #opts;
  canvas;
  camera;
  cameraMinAspect;
  cameraMaxAspect;
  cameraFov;
  maxPixelRatio;
  minPixelRatio;
  scene;
  renderer;
  #postprocessing;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  onBeforeRender = () => {};
  onAfterRender = () => {};
  onAfterResize = () => {};
  #isVisible = false;
  #isAnimating = false;
  isDisposed = false;
  #intersectionObserver;
  #resizeObserver;
  #resizeTimeout;
  #clock = new e();
  #time = { elapsed: 0, delta: 0 };
  #rafId;

  constructor(opts) {
    this.#opts = { ...opts };
    this.#initCamera();
    this.#initScene();
    this.#initRenderer();
    this.resize();
    this.#initObservers();
  }
  #initCamera() {
    this.camera = new t();
    this.cameraFov = this.camera.fov;
  }
  #initScene() {
    this.scene = new i();
  }
  #initRenderer() {
    if (this.#opts.canvas) {
      this.canvas = this.#opts.canvas;
    } else if (this.#opts.id) {
      this.canvas = document.getElementById(this.#opts.id);
    } else {
      console.error('Three: Missing canvas or id parameter');
    }
    this.canvas.style.display = 'block';
    const rendererOpts = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      ...(this.#opts.rendererOptions ?? {})
    };
    this.renderer = new s(rendererOpts);
    this.renderer.outputColorSpace = n;
  }
  #initObservers() {
    if (!(this.#opts.size instanceof Object)) {
      window.addEventListener('resize', this.#onWindowResize.bind(this));
      if (this.#opts.size === 'parent' && this.canvas.parentNode) {
        this.#resizeObserver = new ResizeObserver(this.#onWindowResize.bind(this));
        this.#resizeObserver.observe(this.canvas.parentNode);
      }
    }
    this.#intersectionObserver = new IntersectionObserver(this.#onIntersect.bind(this), {
      root: null, rootMargin: '0px', threshold: 0
    });
    this.#intersectionObserver.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#onVisibilityChange.bind(this));
  }
  #removeObservers() {
    window.removeEventListener('resize', this.#onWindowResize.bind(this));
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.#onVisibilityChange.bind(this));
  }
  #onIntersect(entries) {
    this.#isVisible = entries[0].isIntersecting;
    this.#isVisible ? this.#startAnimation() : this.#stopAnimation();
  }
  #onVisibilityChange() {
    if (this.#isVisible) {
      document.hidden ? this.#stopAnimation() : this.#startAnimation();
    }
  }
  #onWindowResize() {
    if (this.#resizeTimeout) clearTimeout(this.#resizeTimeout);
    this.#resizeTimeout = setTimeout(this.resize.bind(this), 100);
  }
  resize() {
    let width, height;
    if (this.#opts.size instanceof Object) {
      width = this.#opts.size.width;
      height = this.#opts.size.height;
    } else if (this.#opts.size === 'parent' && this.canvas.parentNode) {
      width = this.canvas.parentNode.offsetWidth;
      height = this.canvas.parentNode.offsetHeight;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    this.size.width = width;
    this.size.height = height;
    this.size.ratio = width / height;
    this.#updateCamera();
    this.#updateRenderer();
    this.onAfterResize(this.size);
  }
  #updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#adjustFov(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#adjustFov(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }
  #adjustFov(aspect) {
    const tanHalf = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / aspect);
    this.camera.fov = 2 * o.radToDeg(Math.atan(tanHalf));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #updateRenderer() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#postprocessing?.setSize(this.size.width, this.size.height);
    let dpr = window.devicePixelRatio;
    if (this.maxPixelRatio && dpr > this.maxPixelRatio) dpr = this.maxPixelRatio;
    else if (this.minPixelRatio && dpr < this.minPixelRatio) dpr = this.minPixelRatio;
    this.renderer.setPixelRatio(dpr);
    this.size.pixelRatio = dpr;
  }
  get postprocessing() { return this.#postprocessing; }
  set postprocessing(pp) {
    this.#postprocessing = pp;
    this.render = pp.render.bind(pp);
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  #startAnimation() {
    if (this.#isAnimating) return;
    const animate = () => {
      this.#rafId = requestAnimationFrame(animate);
      this.#time.delta = this.#clock.getDelta();
      this.#time.elapsed += this.#time.delta;
      this.onBeforeRender(this.#time);
      this.render();
      this.onAfterRender(this.#time);
    };
    this.#isAnimating = true;
    this.#clock.start();
    animate();
  }
  #stopAnimation() {
    if (this.#isAnimating) {
      cancelAnimationFrame(this.#rafId);
      this.#isAnimating = false;
      this.#clock.stop();
    }
  }
  clear() {
    this.scene.traverse(obj => {
      if (obj.isMesh && typeof obj.material === 'object' && obj.material !== null) {
        Object.keys(obj.material).forEach(key => {
          const val = obj.material[key];
          if (val !== null && typeof val === 'object' && typeof val.dispose === 'function') val.dispose();
        });
        obj.material.dispose();
        obj.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() {
    this.#removeObservers();
    this.#stopAnimation();
    this.clear();
    this.#postprocessing?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.isDisposed = true;
  }
}

const pointerMap = new Map();
const globalPointer = new r();
let globalListening = false;

function createPointerHandler(opts) {
  const handler = {
    position: new r(),
    nPosition: new r(),
    hover: false,
    touching: false,
    onEnter() {},
    onMove() {},
    onClick() {},
    onLeave() {},
    ...opts
  };
  if (!pointerMap.has(opts.domElement)) {
    pointerMap.set(opts.domElement, handler);
    if (!globalListening) {
      document.body.addEventListener('pointermove', onPointerMove);
      document.body.addEventListener('pointerleave', onPointerLeave);
      document.body.addEventListener('click', onPointerClick);
      document.body.addEventListener('touchstart', onTouchStart, { passive: false });
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
      document.body.addEventListener('touchend', onTouchEnd, { passive: false });
      document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });
      globalListening = true;
    }
  }
  handler.dispose = () => {
    pointerMap.delete(opts.domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);
      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);
      globalListening = false;
    }
  };
  return handler;
}

function onPointerMove(evt) {
  globalPointer.x = evt.clientX;
  globalPointer.y = evt.clientY;
  processPointerInteraction();
}

function processPointerInteraction() {
  for (const [elem, handler] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (isPointerInRect(rect)) {
      updateHandlerPosition(handler, rect);
      if (!handler.hover) { handler.hover = true; handler.onEnter(handler); }
      handler.onMove(handler);
    } else if (handler.hover && !handler.touching) {
      handler.hover = false;
      handler.onLeave(handler);
    }
  }
}

function onPointerClick(evt) {
  globalPointer.x = evt.clientX;
  globalPointer.y = evt.clientY;
  for (const [elem, handler] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    updateHandlerPosition(handler, rect);
    if (isPointerInRect(rect)) handler.onClick(handler);
  }
}

function onPointerLeave() {
  for (const handler of pointerMap.values()) {
    if (handler.hover) { handler.hover = false; handler.onLeave(handler); }
  }
}

function onTouchStart(evt) {
  if (evt.touches.length > 0) {
    evt.preventDefault();
    globalPointer.x = evt.touches[0].clientX;
    globalPointer.y = evt.touches[0].clientY;
    for (const [elem, handler] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      if (isPointerInRect(rect)) {
        handler.touching = true;
        updateHandlerPosition(handler, rect);
        if (!handler.hover) { handler.hover = true; handler.onEnter(handler); }
        handler.onMove(handler);
      }
    }
  }
}

function onTouchMove(evt) {
  if (evt.touches.length > 0) {
    evt.preventDefault();
    globalPointer.x = evt.touches[0].clientX;
    globalPointer.y = evt.touches[0].clientY;
    for (const [elem, handler] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      updateHandlerPosition(handler, rect);
      if (isPointerInRect(rect)) {
        if (!handler.hover) { handler.hover = true; handler.touching = true; handler.onEnter(handler); }
        handler.onMove(handler);
      } else if (handler.hover && handler.touching) {
        handler.onMove(handler);
      }
    }
  }
}

function onTouchEnd() {
  for (const [, handler] of pointerMap) {
    if (handler.touching) {
      handler.touching = false;
      if (handler.hover) { handler.hover = false; handler.onLeave(handler); }
    }
  }
}

function updateHandlerPosition(handler, rect) {
  handler.position.x = globalPointer.x - rect.left;
  handler.position.y = globalPointer.y - rect.top;
  handler.nPosition.x = (handler.position.x / rect.width) * 2 - 1;
  handler.nPosition.y = (-handler.position.y / rect.height) * 2 + 1;
}

function isPointerInRect(rect) {
  const { x, y } = globalPointer;
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

const { randFloat: randFloat, randFloatSpread: randSpread } = o;
const v3a = new a(), v3b = new a(), v3c = new a(), v3d = new a();
const v3e = new a(), v3f = new a(), v3g = new a(), v3h = new a();
const v3i = new a(), v3j = new a();

class BallPhysics {
  constructor(config) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new a();
    this.#initPositions();
    this.setSizes();
  }
  #initPositions() {
    const { config: cfg, positionData: pos } = this;
    this.center.toArray(pos, 0);
    for (let i = 1; i < cfg.count; i++) {
      const base = 3 * i;
      pos[base] = randSpread(2 * cfg.maxX);
      pos[base + 1] = randSpread(2 * cfg.maxY);
      pos[base + 2] = randSpread(2 * cfg.maxZ);
    }
  }
  setSizes() {
    const { config: cfg, sizeData: sz } = this;
    sz[0] = cfg.size0;
    for (let i = 1; i < cfg.count; i++) sz[i] = randFloat(cfg.minSize, cfg.maxSize);
  }
  update(frame) {
    const { config: cfg, center, positionData: pos, sizeData: sz, velocityData: vel } = this;
    let start = 0;
    if (cfg.controlSphere0) {
      start = 1;
      v3a.fromArray(pos, 0);
      v3a.lerp(center, 0.1).toArray(pos, 0);
      v3d.set(0, 0, 0).toArray(vel, 0);
    }
    for (let idx = start; idx < cfg.count; idx++) {
      const base = 3 * idx;
      v3b.fromArray(pos, base);
      v3e.fromArray(vel, base);
      v3e.y -= frame.delta * cfg.gravity * sz[idx];
      v3e.multiplyScalar(cfg.friction);
      v3e.clampLength(0, cfg.maxVelocity);
      v3b.add(v3e);
      v3b.toArray(pos, base);
      v3e.toArray(vel, base);
    }
    for (let idx = start; idx < cfg.count; idx++) {
      const base = 3 * idx;
      v3b.fromArray(pos, base);
      v3e.fromArray(vel, base);
      const radius = sz[idx];
      for (let jdx = idx + 1; jdx < cfg.count; jdx++) {
        const otherBase = 3 * jdx;
        v3c.fromArray(pos, otherBase);
        v3f.fromArray(vel, otherBase);
        const otherRadius = sz[jdx];
        v3g.copy(v3c).sub(v3b);
        const dist = v3g.length();
        const sumR = radius + otherRadius;
        if (dist < sumR) {
          const overlap = sumR - dist;
          v3h.copy(v3g).normalize().multiplyScalar(0.5 * overlap);
          v3i.copy(v3h).multiplyScalar(Math.max(v3e.length(), 1));
          v3j.copy(v3h).multiplyScalar(Math.max(v3f.length(), 1));
          v3b.sub(v3h); v3e.sub(v3i);
          v3b.toArray(pos, base); v3e.toArray(vel, base);
          v3c.add(v3h); v3f.add(v3j);
          v3c.toArray(pos, otherBase); v3f.toArray(vel, otherBase);
        }
      }
      if (cfg.controlSphere0) {
        v3g.copy(v3a).sub(v3b);
        const dist = v3g.length();
        const sumR0 = radius + sz[0];
        if (dist < sumR0) {
          const diff = sumR0 - dist;
          v3h.copy(v3g.normalize()).multiplyScalar(diff);
          v3i.copy(v3h).multiplyScalar(Math.max(v3e.length(), 2));
          v3b.sub(v3h); v3e.sub(v3i);
        }
      }
      if (Math.abs(v3b.x) + radius > cfg.maxX) {
        v3b.x = Math.sign(v3b.x) * (cfg.maxX - radius);
        v3e.x = -v3e.x * cfg.wallBounce;
      }
      if (cfg.gravity === 0) {
        if (Math.abs(v3b.y) + radius > cfg.maxY) {
          v3b.y = Math.sign(v3b.y) * (cfg.maxY - radius);
          v3e.y = -v3e.y * cfg.wallBounce;
        }
      } else if (v3b.y - radius < -cfg.maxY) {
        v3b.y = -cfg.maxY + radius;
        v3e.y = -v3e.y * cfg.wallBounce;
      }
      const maxBound = Math.max(cfg.maxZ, cfg.maxSize);
      if (Math.abs(v3b.z) + radius > maxBound) {
        v3b.z = Math.sign(v3b.z) * (cfg.maxZ - radius);
        v3e.z = -v3e.z * cfg.wallBounce;
      }
      v3b.toArray(pos, base);
      v3e.toArray(vel, base);
    }
  }
}

class SubsurfaceMaterial extends c {
  constructor(opts) {
    super(opts);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines.USE_UV = '';
    this.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader =
        '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      '
      );
      const replaced = h.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        '
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', replaced);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

const DEFAULT_BALLPIT_CONFIG = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 16777215,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const dummyObj = new m();

class BallpitMesh extends d {
  constructor(renderer, opts = {}) {
    const cfg = { ...DEFAULT_BALLPIT_CONFIG, ...opts };
    const env = new z();
    const envTexture = new p(renderer, 0.04).fromScene(env).texture;
    const geo = new g();
    const mat = new SubsurfaceMaterial({ envMap: envTexture, ...cfg.materialParams });
    mat.envMapRotation.x = -Math.PI / 2;
    super(geo, mat, cfg.count);
    this.config = cfg;
    this.physics = new BallPhysics(cfg);
    this.#setupLights();
    this.setColors(cfg.colors);
  }
  #setupLights() {
    this.ambientLight = new f(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new u(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }
  setColors(colors) {
    if (!Array.isArray(colors) || colors.length <= 1) return;
    const colorList = colors.map(col => new l(col));
    const getColorAt = (ratio, out = new l()) => {
      const scaled = Math.max(0, Math.min(1, ratio)) * (colorList.length - 1);
      const idx = Math.floor(scaled);
      const start = colorList[idx];
      if (idx >= colorList.length - 1) return start.clone();
      const alpha = scaled - idx;
      const end = colorList[idx + 1];
      out.r = start.r + alpha * (end.r - start.r);
      out.g = start.g + alpha * (end.g - start.g);
      out.b = start.b + alpha * (end.b - start.b);
      return out;
    };
    for (let idx = 0; idx < this.count; idx++) {
      this.setColorAt(idx, getColorAt(idx / this.count));
      if (idx === 0) this.light.color.copy(getColorAt(idx / this.count));
    }
    this.instanceColor.needsUpdate = true;
  }
  update(frame) {
    this.physics.update(frame);
    for (let idx = 0; idx < this.count; idx++) {
      dummyObj.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        dummyObj.scale.setScalar(0);
      } else {
        dummyObj.scale.setScalar(this.physics.sizeData[idx]);
      }
      dummyObj.updateMatrix();
      this.setMatrixAt(idx, dummyObj.matrix);
      if (idx === 0) this.light.position.copy(dummyObj.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas, opts = {}) {
  const app = new ThreeApp({
    canvas,
    size: 'parent',
    rendererOptions: { antialias: true, alpha: true }
  });
  let spheres;
  app.renderer.toneMapping = v;
  app.camera.position.set(0, 0, 20);
  app.camera.lookAt(0, 0, 0);
  app.cameraMaxAspect = 1.5;
  app.resize();
  initialize(opts);
  const raycaster = new y();
  const plane = new w(new a(0, 0, 1), 0);
  const intersection = new a();
  let paused = false;

  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.webkitUserSelect = 'none';

  const pointerHandler = createPointerHandler({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(pointerHandler.nPosition, app.camera);
      app.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersection);
      spheres.physics.center.copy(intersection);
      spheres.config.controlSphere0 = true;
    },
    onLeave() {
      spheres.config.controlSphere0 = false;
    }
  });

  function initialize(cfg) {
    if (spheres) {
      app.clear();
      app.scene.remove(spheres);
    }
    spheres = new BallpitMesh(app.renderer, cfg);
    app.scene.add(spheres);
  }

  app.onBeforeRender = frame => {
    if (!paused) spheres.update(frame);
  };
  app.onAfterResize = size => {
    spheres.config.maxX = size.wWidth / 2;
    spheres.config.maxY = size.wHeight / 2;
  };

  return {
    three: app,
    get spheres() { return spheres; },
    setCount(count) { initialize({ ...spheres.config, count }); },
    togglePause() { paused = !paused; },
    dispose() { pointerHandler.dispose(); app.dispose(); }
  };
}

const Ballpit = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => {
      instanceRef.current?.dispose();
    };
     
  }, []);

  return <canvas className={className} ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Ballpit;
