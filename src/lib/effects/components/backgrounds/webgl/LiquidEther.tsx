// @ts-nocheck
"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const containerStyle: React.CSSProperties = { width: "100%", height: "100%", position: "relative", overflow: "hidden" };

export default function LiquidEther({
  mouseForce = 20, cursorSize = 100, isViscous = false, viscous = 30,
  iterationsViscous = 32, iterationsPoisson = 32, dt = 0.014, BFECC = true,
  resolution = 0.5, isBounce = false, colors = ["#5227FF", "#FF9FFC", "#B497CF"],
  style = {}, autoDemo = true, autoSpeed = 0.5, autoIntensity = 2.2,
  takeoverDuration = 0.25, autoResumeDelay = 1000, autoRampDuration = 0.6,
}: any) {
  const mountRef = useRef<HTMLDivElement>(null);
  const webglRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    function makePaletteTexture(stops: string[]) {
      const arr = (!Array.isArray(stops) || stops.length === 0) ? ["#ffffff", "#ffffff"] : stops.length === 1 ? [stops[0], stops[0]] : stops;
      const w = arr.length;
      const data = new Uint8Array(w * 4);
      for (let i = 0; i < w; i++) {
        const c = new THREE.Color(arr[i]);
        data[i * 4] = Math.round(c.r * 255); data[i * 4 + 1] = Math.round(c.g * 255); data[i * 4 + 2] = Math.round(c.b * 255); data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false; tex.needsUpdate = true;
      return tex;
    }
    const paletteTex = makePaletteTexture(colors);
    const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

    class CommonClass {
      width = 0; height = 0; renderer: THREE.WebGLRenderer | null = null; clock: THREE.Clock | null = null; delta = 0; time = 0; container: HTMLElement | null = null;
      init(container: HTMLElement) {
        this.container = container; this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false; this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = "100%"; this.renderer.domElement.style.height = "100%"; this.renderer.domElement.style.display = "block";
        this.clock = new THREE.Clock(); this.clock.start();
      }
      resize() { if (!this.container) return; const rect = this.container.getBoundingClientRect(); this.width = Math.max(1, Math.floor(rect.width)); this.height = Math.max(1, Math.floor(rect.height)); if (this.renderer) this.renderer.setSize(this.width, this.height, false); }
      update() { this.delta = this.clock!.getDelta(); this.time += this.delta; }
    }
    const Common = new CommonClass();

    class MouseClass {
      mouseMoved = false; coords = new THREE.Vector2(); coords_old = new THREE.Vector2(); diff = new THREE.Vector2();
      timer: ReturnType<typeof setTimeout> | null = null; container: HTMLElement | null = null; listenerTarget: any = null; docTarget: any = null;
      isHoverInside = false; hasUserControl = false; isAutoActive = false; autoIntensity = 2.0;
      takeoverActive = false; takeoverStartTime = 0; takeoverDuration = 0.25;
      takeoverFrom = new THREE.Vector2(); takeoverTo = new THREE.Vector2(); onInteract: (() => void) | null = null;
      _onMouseMove = (e: MouseEvent) => this.onDocumentMouseMove(e);
      _onTouchStart = (e: TouchEvent) => this.onDocumentTouchStart(e);
      _onTouchMove = (e: TouchEvent) => this.onDocumentTouchMove(e);
      _onTouchEnd = () => { this.isHoverInside = false; };
      _onDocumentLeave = () => { this.isHoverInside = false; };
      init(container: HTMLElement) {
        this.container = container; this.docTarget = container.ownerDocument;
        const dv = this.docTarget?.defaultView || window;
        this.listenerTarget = dv;
        this.listenerTarget.addEventListener("mousemove", this._onMouseMove);
        this.listenerTarget.addEventListener("touchstart", this._onTouchStart, { passive: true });
        this.listenerTarget.addEventListener("touchmove", this._onTouchMove, { passive: true });
        this.listenerTarget.addEventListener("touchend", this._onTouchEnd);
        if (this.docTarget) this.docTarget.addEventListener("mouseleave", this._onDocumentLeave);
      }
      dispose() {
        if (this.listenerTarget) { this.listenerTarget.removeEventListener("mousemove", this._onMouseMove); this.listenerTarget.removeEventListener("touchstart", this._onTouchStart); this.listenerTarget.removeEventListener("touchmove", this._onTouchMove); this.listenerTarget.removeEventListener("touchend", this._onTouchEnd); }
        if (this.docTarget) this.docTarget.removeEventListener("mouseleave", this._onDocumentLeave);
      }
      isPointInside(cx: number, cy: number) { if (!this.container) return false; const rect = this.container.getBoundingClientRect(); return cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom; }
      setCoords(x: number, y: number) {
        if (!this.container || this.timer) return; if (this.timer) clearTimeout(this.timer);
        const rect = this.container.getBoundingClientRect(); if (rect.width === 0 || rect.height === 0) return;
        this.coords.set(((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1));
        this.mouseMoved = true; this.timer = setTimeout(() => { this.mouseMoved = false; }, 100);
      }
      setNormalized(nx: number, ny: number) { this.coords.set(nx, ny); this.mouseMoved = true; }
      onDocumentMouseMove(event: MouseEvent) {
        this.isHoverInside = this.isPointInside(event.clientX, event.clientY);
        if (!this.isHoverInside) return;
        if (this.onInteract) this.onInteract();
        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          if (!this.container) return; const rect = this.container.getBoundingClientRect(); if (rect.width === 0) return;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
          this.takeoverStartTime = performance.now(); this.takeoverActive = true; this.hasUserControl = true; this.isAutoActive = false; return;
        }
        this.setCoords(event.clientX, event.clientY); this.hasUserControl = true;
      }
      onDocumentTouchStart(event: TouchEvent) { if (event.touches.length !== 1) return; const t = event.touches[0]; this.isHoverInside = this.isPointInside(t.clientX, t.clientY); if (!this.isHoverInside) return; if (this.onInteract) this.onInteract(); this.setCoords(t.clientX, t.clientY); this.hasUserControl = true; }
      onDocumentTouchMove(event: TouchEvent) { if (event.touches.length !== 1) return; const t = event.touches[0]; this.isHoverInside = this.isPointInside(t.clientX, t.clientY); if (!this.isHoverInside) return; if (this.onInteract) this.onInteract(); this.setCoords(t.clientX, t.clientY); }
      update() {
        if (this.takeoverActive) { const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000); if (t >= 1) { this.takeoverActive = false; this.coords.copy(this.takeoverTo); this.coords_old.copy(this.coords); this.diff.set(0, 0); } else { const k = t * t * (3 - 2 * t); this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k); } }
        this.diff.subVectors(this.coords, this.coords_old); this.coords_old.copy(this.coords);
        if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
        if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
      }
    }
    const Mouse = new MouseClass();

    class AutoDriver {
      mouse: MouseClass; manager: any; enabled: boolean; speed: number; resumeDelay: number; rampDurationMs: number;
      active = false; current = new THREE.Vector2(0, 0); target = new THREE.Vector2(); lastTime = performance.now(); activationTime = 0; margin = 0.2;
      constructor(mouse: MouseClass, manager: any, opts: any) {
        this.mouse = mouse; this.manager = manager; this.enabled = opts.enabled; this.speed = opts.speed;
        this.resumeDelay = opts.resumeDelay || 3000; this.rampDurationMs = (opts.rampDuration || 0) * 1000;
        this.pickNewTarget();
      }
      pickNewTarget() { this.target.set((Math.random() * 2 - 1) * (1 - this.margin), (Math.random() * 2 - 1) * (1 - this.margin)); }
      forceStop() { this.active = false; this.mouse.isAutoActive = false; }
      update() {
        if (!this.enabled) return;
        const now = performance.now(); const idle = now - this.manager.lastUserInteraction;
        if (idle < this.resumeDelay) { if (this.active) this.forceStop(); return; }
        if (this.mouse.isHoverInside) { if (this.active) this.forceStop(); return; }
        if (!this.active) { this.active = true; this.current.copy(this.mouse.coords); this.lastTime = now; this.activationTime = now; }
        this.mouse.isAutoActive = true;
        let dtSec = (now - this.lastTime) / 1000; this.lastTime = now; if (dtSec > 0.2) dtSec = 0.016;
        const dir = new THREE.Vector2().subVectors(this.target, this.current); const dist = dir.length();
        if (dist < 0.01) { this.pickNewTarget(); return; }
        dir.normalize();
        let ramp = 1; if (this.rampDurationMs > 0) { const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs); ramp = t * t * (3 - 2 * t); }
        this.current.addScaledVector(dir, Math.min(this.speed * dtSec * ramp, dist));
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    const face_vert = `attribute vec3 position;uniform vec2 px;uniform vec2 boundarySpace;varying vec2 uv;precision highp float;void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`;
    const line_vert = `attribute vec3 position;uniform vec2 px;precision highp float;varying vec2 uv;void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`;
    const mouse_vert = `precision highp float;attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`;
    const advection_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;uniform vec2 px;varying vec2 uv;void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;if(isBFECC==false){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;vec2 nv=texture2D(velocity,uv2).xy;gl_FragColor=vec4(nv,0.0,0.0);}else{vec2 sn=uv;vec2 vo=texture2D(velocity,uv).xy;vec2 so=sn-vo*dt*ratio;vec2 vn1=texture2D(velocity,so).xy;vec2 sn2=so+vn1*dt*ratio;vec2 err=sn2-sn;vec2 sn3=sn-err/2.0;vec2 v2=texture2D(velocity,sn3).xy;vec2 so2=sn3-v2*dt*ratio;vec2 nv2=texture2D(velocity,so2).xy;gl_FragColor=vec4(nv2,0.0,0.0);}}`;
    const color_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;varying vec2 uv;void main(){vec2 vel=texture2D(velocity,uv).xy;float lenv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb;vec3 outRGB=mix(bgColor.rgb,c,lenv);float outA=mix(bgColor.a,1.0,lenv);gl_FragColor=vec4(outRGB,outA);}`;
    const divergence_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;void main(){float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x;float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y;float divergence=(x1-x0+y1-y0)/2.0;gl_FragColor=vec4(divergence/dt);}`;
    const externalForce_frag = `precision highp float;uniform vec2 force;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 circle=(vUv-0.5)*2.0;float d=1.0-min(length(circle),1.0);d*=d;gl_FragColor=vec4(force*d,0.0,1.0);}`;
    const poisson_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r;float div=texture2D(divergence,uv).r;float nP=(p0+p1+p2+p3)/4.0-div;gl_FragColor=vec4(nP);}`;
    const pressure_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){float s=1.0;float p0=texture2D(pressure,uv+vec2(px.x*s,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*s,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*s)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*s)).r;vec2 v=texture2D(velocity,uv).xy;vec2 gradP=vec2(p0-p1,p2-p3)*0.5;v=v-gradP*dt;gl_FragColor=vec4(v,0.0,1.0);}`;
    const viscous_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){vec2 old=texture2D(velocity,uv).xy;vec2 n0=texture2D(velocity_new,uv+vec2(px.x*2.0,0.0)).xy;vec2 n1=texture2D(velocity_new,uv-vec2(px.x*2.0,0.0)).xy;vec2 n2=texture2D(velocity_new,uv+vec2(0.0,px.y*2.0)).xy;vec2 n3=texture2D(velocity_new,uv-vec2(0.0,px.y*2.0)).xy;vec2 nv=4.0*old+v*dt*(n0+n1+n2+n3);nv/=4.0*(1.0+v*dt);gl_FragColor=vec4(nv,0.0,0.0);}`;

    class ShaderPass {
      props: any; uniforms: any; scene: THREE.Scene | null = null; camera: THREE.Camera | null = null; material: THREE.RawShaderMaterial | null = null; geometry: THREE.PlaneGeometry | null = null; plane: THREE.Mesh | null = null;
      constructor(props: any) { this.props = props || {}; this.uniforms = this.props.material?.uniforms; }
      init() { this.scene = new THREE.Scene(); this.camera = new THREE.Camera(); if (this.uniforms) { this.material = new THREE.RawShaderMaterial(this.props.material); this.geometry = new THREE.PlaneGeometry(2.0, 2.0); this.plane = new THREE.Mesh(this.geometry, this.material); this.scene.add(this.plane); } }
      update() { Common.renderer!.setRenderTarget(this.props.output || null); Common.renderer!.render(this.scene!, this.camera!); Common.renderer!.setRenderTarget(null); }
    }

    class Advection extends ShaderPass {
      line: any;
      constructor(simProps: any) { super({ material: { vertexShader: face_vert, fragmentShader: advection_frag, uniforms: { boundarySpace: { value: simProps.cellScale }, px: { value: simProps.cellScale }, fboSize: { value: simProps.fboSize }, velocity: { value: simProps.src.texture }, dt: { value: simProps.dt }, isBFECC: { value: true } } }, output: simProps.dst }); this.uniforms = this.props.material.uniforms; this.init(); }
      init() { super.init(); const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1,-1,0,-1,1,0,-1,1,0,1,1,0,1,1,0,1,-1,0,1,-1,0,-1,-1,0]), 3)); this.line = new THREE.LineSegments(bg, new THREE.RawShaderMaterial({ vertexShader: line_vert, fragmentShader: advection_frag, uniforms: this.uniforms })); this.scene!.add(this.line); }
      update(o: any) { this.uniforms.dt.value = o.dt; this.line.visible = o.isBounce; this.uniforms.isBFECC.value = o.BFECC; super.update(); }
    }
    class ExternalForce extends ShaderPass {
      mouse: any;
      constructor(simProps: any) { super({ output: simProps.dst }); this.init2(simProps); }
      init2(simProps: any) { super.init(); const g = new THREE.PlaneGeometry(1, 1); const m = new THREE.RawShaderMaterial({ vertexShader: mouse_vert, fragmentShader: externalForce_frag, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { px: { value: simProps.cellScale }, force: { value: new THREE.Vector2(0, 0) }, center: { value: new THREE.Vector2(0, 0) }, scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) } } }); this.mouse = new THREE.Mesh(g, m); this.scene!.add(this.mouse); }
      update(props: any) { const u = this.mouse.material.uniforms; u.force.value.set((Mouse.diff.x / 2) * props.mouse_force, (Mouse.diff.y / 2) * props.mouse_force); const csx = props.cursor_size * props.cellScale.x; const csy = props.cursor_size * props.cellScale.y; u.center.value.set(Math.min(Math.max(Mouse.coords.x, -1 + csx + props.cellScale.x * 2), 1 - csx - props.cellScale.x * 2), Math.min(Math.max(Mouse.coords.y, -1 + csy + props.cellScale.y * 2), 1 - csy - props.cellScale.y * 2)); u.scale.value.set(props.cursor_size, props.cursor_size); super.update(); }
    }
    class Viscous extends ShaderPass {
      constructor(sp: any) { super({ material: { vertexShader: face_vert, fragmentShader: viscous_frag, uniforms: { boundarySpace: { value: sp.boundarySpace }, velocity: { value: sp.src.texture }, velocity_new: { value: sp.dst_.texture }, v: { value: sp.viscous }, px: { value: sp.cellScale }, dt: { value: sp.dt } } }, output: sp.dst, output0: sp.dst_, output1: sp.dst }); this.init(); }
      update(o: any) { let fi, fo; this.uniforms.v.value = o.viscous; for (let i = 0; i < o.iterations; i++) { if (i % 2 === 0) { fi = this.props.output0; fo = this.props.output1; } else { fi = this.props.output1; fo = this.props.output0; } this.uniforms.velocity_new.value = fi.texture; this.props.output = fo; this.uniforms.dt.value = o.dt; super.update(); } return fo; }
    }
    class Divergence extends ShaderPass {
      constructor(sp: any) { super({ material: { vertexShader: face_vert, fragmentShader: divergence_frag, uniforms: { boundarySpace: { value: sp.boundarySpace }, velocity: { value: sp.src.texture }, px: { value: sp.cellScale }, dt: { value: sp.dt } } }, output: sp.dst }); this.init(); }
      update(o: any) { this.uniforms.velocity.value = o.vel.texture; super.update(); }
    }
    class Poisson extends ShaderPass {
      constructor(sp: any) { super({ material: { vertexShader: face_vert, fragmentShader: poisson_frag, uniforms: { boundarySpace: { value: sp.boundarySpace }, pressure: { value: sp.dst_.texture }, divergence: { value: sp.src.texture }, px: { value: sp.cellScale } } }, output: sp.dst, output0: sp.dst_, output1: sp.dst }); this.init(); }
      update(o: any) { let pi, po; for (let i = 0; i < o.iterations; i++) { if (i % 2 === 0) { pi = this.props.output0; po = this.props.output1; } else { pi = this.props.output1; po = this.props.output0; } this.uniforms.pressure.value = pi.texture; this.props.output = po; super.update(); } return po; }
    }
    class Pressure extends ShaderPass {
      constructor(sp: any) { super({ material: { vertexShader: face_vert, fragmentShader: pressure_frag, uniforms: { boundarySpace: { value: sp.boundarySpace }, pressure: { value: sp.src_p.texture }, velocity: { value: sp.src_v.texture }, px: { value: sp.cellScale }, dt: { value: sp.dt } } }, output: sp.dst }); this.init(); }
      update(o: any) { this.uniforms.velocity.value = o.vel.texture; this.uniforms.pressure.value = o.pressure.texture; super.update(); }
    }

    class Simulation {
      options: any; fbos: any = {}; fboSize = new THREE.Vector2(); cellScale = new THREE.Vector2(); boundarySpace = new THREE.Vector2();
      advection: any; externalForce: any; viscous: any; divergence: any; poisson: any; pressure: any;
      constructor(options?: any) { this.options = { iterations_poisson: 32, iterations_viscous: 32, mouse_force: 20, resolution: 0.5, cursor_size: 100, viscous: 30, isBounce: false, dt: 0.014, isViscous: false, BFECC: true, ...options }; this.init(); }
      init() { this.calcSize(); this.createAllFBO(); this.createShaderPass(); }
      getFloatType() { return /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType; }
      createAllFBO() { const type = this.getFloatType(); const opts: any = { type, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }; for (const key of ["vel_0","vel_1","vel_viscous0","vel_viscous1","div","pressure_0","pressure_1"]) this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts); }
      createShaderPass() {
        this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.vel_0, dst: this.fbos.vel_1 });
        this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.vel_1 });
        this.viscous = new Viscous({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, viscous: this.options.viscous, src: this.fbos.vel_1, dst: this.fbos.vel_viscous1, dst_: this.fbos.vel_viscous0, dt: this.options.dt });
        this.divergence = new Divergence({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.vel_viscous0, dst: this.fbos.div, dt: this.options.dt });
        this.poisson = new Poisson({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.div, dst: this.fbos.pressure_1, dst_: this.fbos.pressure_0 });
        this.pressure = new Pressure({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src_p: this.fbos.pressure_0, src_v: this.fbos.vel_viscous0, dst: this.fbos.vel_0, dt: this.options.dt });
      }
      calcSize() { const w = Math.max(1, Math.round(this.options.resolution * Common.width)); const h = Math.max(1, Math.round(this.options.resolution * Common.height)); this.cellScale.set(1 / w, 1 / h); this.fboSize.set(w, h); }
      resize() { this.calcSize(); for (const key in this.fbos) this.fbos[key].setSize(this.fboSize.x, this.fboSize.y); }
      update() {
        if (this.options.isBounce) this.boundarySpace.set(0, 0); else this.boundarySpace.copy(this.cellScale);
        this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });
        this.externalForce.update({ cursor_size: this.options.cursor_size, mouse_force: this.options.mouse_force, cellScale: this.cellScale });
        let vel = this.fbos.vel_1;
        if (this.options.isViscous) vel = this.viscous.update({ viscous: this.options.viscous, iterations: this.options.iterations_viscous, dt: this.options.dt });
        this.divergence.update({ vel }); const pressure = this.poisson.update({ iterations: this.options.iterations_poisson }); this.pressure.update({ vel, pressure });
      }
    }

    class Output {
      simulation: Simulation; scene: THREE.Scene; camera: THREE.Camera; output: THREE.Mesh;
      constructor() {
        this.simulation = new Simulation(); this.scene = new THREE.Scene(); this.camera = new THREE.Camera();
        this.output = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.RawShaderMaterial({ vertexShader: face_vert, fragmentShader: color_frag, transparent: true, depthWrite: false, uniforms: { velocity: { value: this.simulation.fbos.vel_0.texture }, boundarySpace: { value: new THREE.Vector2() }, palette: { value: paletteTex }, bgColor: { value: bgVec4 } } }));
        this.scene.add(this.output);
      }
      resize() { this.simulation.resize(); }
      render() { Common.renderer!.setRenderTarget(null); Common.renderer!.render(this.scene, this.camera); }
      update() { this.simulation.update(); this.render(); }
    }

    class WebGLManager {
      props: any; output!: Output; running = false; lastUserInteraction = performance.now(); autoDriver: AutoDriver;
      constructor(props: any) {
        this.props = props; Common.init(props.$wrapper); Mouse.init(props.$wrapper);
        Mouse.autoIntensity = props.autoIntensity; Mouse.takeoverDuration = props.takeoverDuration;
        Mouse.onInteract = () => { this.lastUserInteraction = performance.now(); if (this.autoDriver) this.autoDriver.forceStop(); };
        this.autoDriver = new AutoDriver(Mouse, this, { enabled: props.autoDemo, speed: props.autoSpeed, resumeDelay: props.autoResumeDelay, rampDuration: props.autoRampDuration });
        this.init(); this._loop = this.loop.bind(this); this._resize = this.resize.bind(this);
        window.addEventListener("resize", this._resize);
        this._onVis = () => { if (document.hidden) this.pause(); else if (isVisibleRef.current) this.start(); };
        document.addEventListener("visibilitychange", this._onVis);
      }
      _loop: () => void; _resize: () => void; _onVis: () => void;
      init() { this.props.$wrapper.prepend(Common.renderer!.domElement); this.output = new Output(); }
      resize() { Common.resize(); this.output.resize(); }
      render() { if (this.autoDriver) this.autoDriver.update(); Mouse.update(); Common.update(); this.output.update(); }
      loop() { if (!this.running) return; this.render(); rafRef.current = requestAnimationFrame(this._loop); }
      start() { if (this.running) return; this.running = true; this._loop(); }
      pause() { this.running = false; if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } }
      dispose() { try { window.removeEventListener("resize", this._resize); document.removeEventListener("visibilitychange", this._onVis); Mouse.dispose(); if (Common.renderer) { const c = Common.renderer.domElement; if (c?.parentNode) c.parentNode.removeChild(c); Common.renderer.dispose(); Common.renderer.forceContextLoss(); } } catch {} }
    }

    const container = mountRef.current;
    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";
    const webgl = new WebGLManager({ $wrapper: container, autoDemo, autoSpeed, autoIntensity, takeoverDuration, autoResumeDelay, autoRampDuration });
    webglRef.current = webgl;
    const sim = webgl.output?.simulation;
    if (sim) Object.assign(sim.options, { mouse_force: mouseForce, cursor_size: cursorSize, isViscous, viscous, iterations_viscous: iterationsViscous, iterations_poisson: iterationsPoisson, dt, BFECC, resolution, isBounce });
    webgl.start();

    const io = new IntersectionObserver(entries => { const e = entries[0]; const vis = e.isIntersecting && e.intersectionRatio > 0; isVisibleRef.current = vis; if (!webglRef.current) return; if (vis && !document.hidden) webglRef.current.start(); else webglRef.current.pause(); }, { threshold: [0, 0.01, 0.1] });
    io.observe(container);
    const ro = new ResizeObserver(() => { if (!webglRef.current) return; if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current); resizeRafRef.current = requestAnimationFrame(() => { if (webglRef.current) webglRef.current.resize(); }); });
    ro.observe(container);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); try { ro.disconnect(); } catch {} try { io.disconnect(); } catch {} if (webglRef.current) webglRef.current.dispose(); webglRef.current = null; };
  }, [BFECC, cursorSize, dt, isBounce, isViscous, iterationsPoisson, iterationsViscous, mouseForce, resolution, viscous, colors, autoDemo, autoSpeed, autoIntensity, takeoverDuration, autoResumeDelay, autoRampDuration]);

  return <div ref={mountRef} style={{ ...containerStyle, ...style }} />;
}
