import React, { useRef, useEffect } from "react";
import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Observer } from "gsap/Observer";
import { gsap } from "gsap";

gsap.registerPlugin(Observer);

// Lightweight wrapper
function X(config) {
  this._config = { ...config };
  this._postprocessing = null;
  this._resizeObserver = null;
  this._intersectionObserver = null;
  this._resizeTimer = null;
  this._animationFrameId = 0;
  this._clock = new Clock();
  this._animationState = { elapsed: 0, delta: 0 };
  this._isAnimating = false;
  this._isVisible = false;

  this.canvas = null;
  this.camera = new PerspectiveCamera();
  this.cameraFov = this.camera.fov;
  this.scene = new Scene();
  this.renderer = null;
  this.size = {
    width: 0,
    height: 0,
    wWidth: 0,
    wHeight: 0,
    ratio: 0,
    pixelRatio: 0,
  };

  this.render = this._render.bind(this);
  this.onBeforeRender = () => {};
  this.onAfterRender = () => {};
  this.onAfterResize = () => {};
  this.isDisposed = false;

  this._initRenderer();
  this.resize();
  this._initObservers();
}
X.prototype._initRenderer = function () {
  if (this._config.canvas) this.canvas = this._config.canvas;
  else if (this._config.id) {
    const elem = document.getElementById(this._config.id);
    if (elem instanceof HTMLCanvasElement) this.canvas = elem;
    else console.error("Three: Missing canvas or id parameter");
  } else console.error("Three: Missing canvas or id parameter");
  this.canvas.style.display = "block";
  const rendererOptions = {
    canvas: this.canvas,
    powerPreference: "high-performance",
    ...(this._config.rendererOptions || {}),
  };
  this.renderer = new WebGLRenderer(rendererOptions);
  this.renderer.outputColorSpace = SRGBColorSpace;
};
X.prototype._initObservers = function () {
  if (!(this._config.size instanceof Object)) {
    this._onResizeBound = this._onResize.bind(this);
    window.addEventListener("resize", this._onResizeBound);
    if (this._config.size === "parent" && this.canvas.parentNode) {
      this._resizeObserver = new ResizeObserver(this._onResizeBound);
      this._resizeObserver.observe(this.canvas.parentNode);
    }
  }
  this._intersectionObserver = new IntersectionObserver(
    this._onIntersection.bind(this),
    { root: null, rootMargin: "0px", threshold: 0 }
  );
  this._intersectionObserver.observe(this.canvas);
  this._onVisibilityChangeBound = this._onVisibilityChange.bind(this);
  document.addEventListener("visibilitychange", this._onVisibilityChangeBound);
};
X.prototype._onResize = function () {
  if (this._resizeTimer) clearTimeout(this._resizeTimer);
  this._resizeTimer = window.setTimeout(this.resize.bind(this), 100);
};
X.prototype.resize = function () {
  let w, h;
  if (this._config.size instanceof Object) {
    w = this._config.size.width;
    h = this._config.size.height;
  } else if (this._config.size === "parent" && this.canvas.parentNode) {
    w = this.canvas.parentNode.offsetWidth;
    h = this.canvas.parentNode.offsetHeight;
  } else {
    w = window.innerWidth;
    h = window.innerHeight;
  }
  this.size.width = w;
  this.size.height = h;
  this.size.ratio = w / h;
  this._updateCamera();
  this._updateRenderer();
  this.onAfterResize(this.size);
};
X.prototype._updateCamera = function () {
  this.camera.aspect = this.size.width / this.size.height;
  if (this.camera.isPerspectiveCamera && this.cameraFov) {
    this.camera.fov = this.cameraFov;
  }
  this.camera.updateProjectionMatrix();
  this.updateWorldSize();
};
X.prototype.updateWorldSize = function () {
  if (this.camera.isPerspectiveCamera) {
    const fovRad = (this.camera.fov * Math.PI) / 180;
    this.size.wHeight =
      2 * Math.tan(fovRad / 2) * this.camera.position.length();
    this.size.wWidth = this.size.wHeight * this.camera.aspect;
  }
};
X.prototype._updateRenderer = function () {
  this.renderer.setSize(this.size.width, this.size.height);
  let pr = window.devicePixelRatio;
  this.renderer.setPixelRatio(pr);
  this.size.pixelRatio = pr;
};
Object.defineProperty(X.prototype, "postprocessing", {
  get() {
    return this._postprocessing;
  },
  set(v) {
    this._postprocessing = v;
    this.render = v.render.bind(v);
  },
});
X.prototype._onIntersection = function (entries) {
  this._isAnimating = entries[0].isIntersecting;
  this._isAnimating ? this._startAnimation() : this._stopAnimation();
};
X.prototype._onVisibilityChange = function () {
  if (this._isAnimating) {
    document.hidden ? this._stopAnimation() : this._startAnimation();
  }
};
X.prototype._startAnimation = function () {
  if (this._isVisible) return;
  const animateFrame = () => {
    this._animationFrameId = requestAnimationFrame(animateFrame);
    this._animationState.delta = this._clock.getDelta();
    this._animationState.elapsed += this._animationState.delta;
    this.onBeforeRender(this._animationState);
    this.render();
    this.onAfterRender(this._animationState);
  };
  this._isVisible = true;
  this._clock.start();
  animateFrame();
};
X.prototype._stopAnimation = function () {
  if (this._isVisible) {
    cancelAnimationFrame(this._animationFrameId);
    this._isVisible = false;
    this._clock.stop();
  }
};
X.prototype._render = function () {
  this.renderer.render(this.scene, this.camera);
};
X.prototype.clear = function () {
  this.scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      Object.keys(obj.material).forEach((k) => {
        const mv = obj.material[k];
        if (mv && typeof mv === "object" && typeof mv.dispose === "function") {
          mv.dispose();
        }
      });
      obj.material.dispose();
      obj.geometry.dispose();
    }
  });
  this.scene.clear();
};
X.prototype.dispose = function () {
  window.removeEventListener("resize", this._onResizeBound);
  this._resizeObserver && this._resizeObserver.disconnect();
  this._intersectionObserver && this._intersectionObserver.disconnect();
  document.removeEventListener(
    "visibilitychange",
    this._onVisibilityChangeBound
  );
  this._stopAnimation();
  this.clear();
  this.renderer.dispose();
  this.isDisposed = true;
};

// Physics + material + instances
function W(config) {
  this.config = config;
  this.positionData = new Float32Array(3 * config.count).fill(0);
  this.velocityData = new Float32Array(3 * config.count).fill(0);
  this.sizeData = new Float32Array(config.count).fill(1);
  this.center = new Vector3();
  this._initPositions();
  this.setSizes();
}
W.prototype._initPositions = function () {
  const c = this.config,
    p = this.positionData;
  this.center.toArray(p, 0);
  for (let i = 1; i < c.count; i++) {
    const idx = 3 * i;
    p[idx] = MathUtils.randFloatSpread(2 * c.maxX);
    p[idx + 1] = MathUtils.randFloatSpread(2 * c.maxY);
    p[idx + 2] = MathUtils.randFloatSpread(2 * c.maxZ);
  }
};
W.prototype.setSizes = function () {
  const c = this.config,
    s = this.sizeData;
  s[0] = c.size0;
  for (let i = 1; i < c.count; i++)
    s[i] = MathUtils.randFloat(c.minSize, c.maxSize);
};
W.prototype.update = function (deltaInfo) {
  const c = this.config,
    p = this.positionData,
    s = this.sizeData,
    v = this.velocityData;
  let startIdx = 0;
  if (c.controlSphere0) {
    startIdx = 1;
    const first = new Vector3().fromArray(p, 0);
    first.lerp(this.center, 0.1).toArray(p, 0);
    new Vector3(0, 0, 0).toArray(v, 0);
  }
  for (let idx = startIdx; idx < c.count; idx++) {
    const base = 3 * idx;
    const pos = new Vector3().fromArray(p, base);
    const vel = new Vector3().fromArray(v, base);
    vel.y -= deltaInfo.delta * c.gravity * s[idx];
    vel.multiplyScalar(c.friction);
    vel.clampLength(0, c.maxVelocity);
    pos.add(vel);
    pos.toArray(p, base);
    vel.toArray(v, base);
  }
  for (let idx = startIdx; idx < c.count; idx++) {
    const base = 3 * idx;
    const pos = new Vector3().fromArray(p, base);
    const vel = new Vector3().fromArray(v, base);
    const radius = s[idx];
    for (let jdx = idx + 1; jdx < c.count; jdx++) {
      const ob = 3 * jdx;
      const opos = new Vector3().fromArray(p, ob);
      const ovel = new Vector3().fromArray(v, ob);
      const diff = new Vector3().copy(opos).sub(pos);
      const dist = diff.length();
      const sum = radius + s[jdx];
      if (dist < sum) {
        const overlap = sum - dist;
        const corr = diff.normalize().multiplyScalar(0.5 * overlap);
        const vCorr = corr.clone().multiplyScalar(Math.max(vel.length(), 1));
        pos.sub(corr);
        vel.sub(vCorr);
        pos.toArray(p, base);
        vel.toArray(v, base);
        opos.add(corr);
        ovel.add(corr.clone().multiplyScalar(Math.max(ovel.length(), 1)));
        opos.toArray(p, ob);
        ovel.toArray(v, ob);
      }
    }
    if (c.controlSphere0) {
      const diff = new Vector3().copy(new Vector3().fromArray(p, 0)).sub(pos);
      const d = diff.length();
      const sum0 = radius + s[0];
      if (d < sum0) {
        const corr = diff.normalize().multiplyScalar(sum0 - d);
        const vCorr = corr.clone().multiplyScalar(Math.max(vel.length(), 2));
        pos.sub(corr);
        vel.sub(vCorr);
      }
    }
    if (Math.abs(pos.x) + radius > c.maxX) {
      pos.x = Math.sign(pos.x) * (c.maxX - radius);
      vel.x = -vel.x * c.wallBounce;
    }
    if (c.gravity === 0) {
      if (Math.abs(pos.y) + radius > c.maxY) {
        pos.y = Math.sign(pos.y) * (c.maxY - radius);
        vel.y = -vel.y * c.wallBounce;
      }
    } else if (pos.y - radius < -c.maxY) {
      pos.y = -c.maxY + radius;
      vel.y = -vel.y * c.wallBounce;
    }
    const maxB = Math.max(c.maxZ, c.maxSize);
    if (Math.abs(pos.z) + radius > maxB) {
      pos.z = Math.sign(pos.z) * (c.maxZ - radius);
      vel.z = -vel.z * c.wallBounce;
    }
    pos.toArray(p, base);
    vel.toArray(v, base);
  }
};

function Y(params) {
  MeshPhysicalMaterial.call(this, params);
  this.uniforms = {
    thicknessDistortion: { value: 0.1 },
    thicknessAmbient: { value: 0 },
    thicknessAttenuation: { value: 0.1 },
    thicknessPower: { value: 2 },
    thicknessScale: { value: 10 },
  };
  this.defines = { USE_UV: "" };
  const self = this;
  this.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, self.uniforms);
    shader.fragmentShader =
      `
      uniform float thicknessPower;
      uniform float thicknessScale;
      uniform float thicknessDistortion;
      uniform float thicknessAmbient;
      uniform float thicknessAttenuation;
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
      void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
        vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
        float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
        #ifdef USE_COLOR
          vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
        #else
          vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
        #endif
        reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
      }

      void main() {
      `
    );
    const lightsChunk = ShaderChunk.lights_fragment_begin.replaceAll(
      "RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",
      `
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
        RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_begin>",
      lightsChunk
    );
    if (self.onBeforeCompile2) self.onBeforeCompile2(shader);
  };
}
Y.prototype = Object.create(MeshPhysicalMaterial.prototype);
Y.prototype.constructor = Y;

const XDefaults = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  },
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
  followCursor: true,
};
const U = new Object3D();

let globalPointerActive = false;
const pointerPosition = new Vector2();
const pointerMap = new Map();

function createPointerData({ domElement, ...opts }) {
  const data = Object.assign(
    {
      position: new Vector2(),
      nPosition: new Vector2(),
      hover: false,
      touching: false,
      onEnter: () => {},
      onMove: () => {},
      onClick: () => {},
      onLeave: () => {},
    },
    opts
  );
  if (!pointerMap.has(domElement)) {
    pointerMap.set(domElement, data);
    if (!globalPointerActive) {
      document.body.addEventListener("pointermove", onPointerMove);
      document.body.addEventListener("pointerleave", onPointerLeave);
      document.body.addEventListener("click", onPointerClick);
      document.body.addEventListener("touchstart", onTouchStart, {
        passive: false,
      });
      document.body.addEventListener("touchmove", onTouchMove, {
        passive: false,
      });
      document.body.addEventListener("touchend", onTouchEnd, {
        passive: false,
      });
      document.body.addEventListener("touchcancel", onTouchEnd, {
        passive: false,
      });
      globalPointerActive = true;
    }
  }
  data.dispose = () => {
    pointerMap.delete(domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener("pointermove", onPointerMove);
      document.body.removeEventListener("pointerleave", onPointerLeave);
      document.body.removeEventListener("click", onPointerClick);
      document.body.removeEventListener("touchstart", onTouchStart);
      document.body.removeEventListener("touchmove", onTouchMove);
      document.body.removeEventListener("touchend", onTouchEnd);
      document.body.removeEventListener("touchcancel", onTouchEnd);
      globalPointerActive = false;
    }
  };
  return data;
}
function onPointerMove(e) {
  pointerPosition.set(e.clientX, e.clientY);
  processPointerInteraction();
}
function isInside(rect) {
  return (
    pointerPosition.x >= rect.left &&
    pointerPosition.x <= rect.left + rect.width &&
    pointerPosition.y >= rect.top &&
    pointerPosition.y <= rect.top + rect.height
  );
}
function updatePointerData(data, rect) {
  data.position.set(
    pointerPosition.x - rect.left,
    pointerPosition.y - rect.top
  );
  data.nPosition.set(
    (data.position.x / rect.width) * 2 - 1,
    (-data.position.y / rect.height) * 2 + 1
  );
}
function processPointerInteraction() {
  for (const [elem, data] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (isInside(rect)) {
      updatePointerData(data, rect);
      if (!data.hover) {
        data.hover = true;
        data.onEnter(data);
      }
      data.onMove(data);
    } else if (data.hover && !data.touching) {
      data.hover = false;
      data.onLeave(data);
    }
  }
}
function onTouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    pointerPosition.set(e.touches[0].clientX, e.touches[0].clientY);
    for (const [elem, data] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      if (isInside(rect)) {
        data.touching = true;
        updatePointerData(data, rect);
        if (!data.hover) {
          data.hover = true;
          data.onEnter(data);
        }
        data.onMove(data);
      }
    }
  }
}
function onTouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    pointerPosition.set(e.touches[0].clientX, e.touches[0].clientY);
    for (const [elem, data] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      updatePointerData(data, rect);
      if (isInside(rect)) {
        if (!data.hover) {
          data.hover = true;
          data.touching = true;
          data.onEnter(data);
        }
        data.onMove(data);
      } else if (data.hover && data.touching) {
        data.onMove(data);
      }
    }
  }
}
function onTouchEnd() {
  for (const [, data] of pointerMap) {
    if (data.touching) {
      data.touching = false;
      if (data.hover) {
        data.hover = false;
        data.onLeave(data);
      }
    }
  }
}
function onPointerClick(e) {
  pointerPosition.set(e.clientX, e.clientY);
  for (const [elem, data] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    updatePointerData(data, rect);
    if (isInside(rect)) data.onClick(data);
  }
}
function onPointerLeave() {
  for (const data of pointerMap.values()) {
    if (data.hover) {
      data.hover = false;
      data.onLeave(data);
    }
  }
}

class Z extends InstancedMesh {
  constructor(renderer, params = {}) {
    const config = { ...XDefaults, ...params };
    const roomEnv = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(roomEnv).texture;
    const geometry = new SphereGeometry();
    const material = new Y({ envMap: envTexture, ...config.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    super(geometry, material, config.count);
    this.config = config;
    this.physics = new W(config);
    this._setupLights();
    this.setColors(config.colors);
  }
  _setupLights() {
    this.ambientLight = new AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity
    );
    this.add(this.ambientLight);
    this.light = new PointLight(
      this.config.colors[0],
      this.config.lightIntensity
    );
    this.add(this.light);
  }
  setColors(colors) {
    if (Array.isArray(colors) && colors.length > 1) {
      const colorObjs = colors.map((c) => new Color(c));
      const getColorAt = (ratio) => {
        const clamped = Math.max(0, Math.min(1, ratio));
        const scaled = clamped * (colorObjs.length - 1);
        const idx = Math.floor(scaled);
        const start = colorObjs[idx];
        if (idx >= colorObjs.length - 1) return start.clone();
        const alpha = scaled - idx;
        const end = colorObjs[idx + 1];
        return new Color(
          start.r + alpha * (end.r - start.r),
          start.g + alpha * (end.g - start.g),
          start.b + alpha * (end.b - start.b)
        );
      };
      for (let i = 0; i < this.count; i++) {
        this.setColorAt(i, getColorAt(i / this.count));
        if (i === 0) this.light.color.copy(getColorAt(0));
      }
      this.instanceColor && (this.instanceColor.needsUpdate = true);
    }
  }
  update(deltaInfo) {
    this.physics.update(deltaInfo);
    for (let i = 0; i < this.count; i++) {
      U.position.fromArray(this.physics.positionData, 3 * i);
      if (i === 0 && this.config.followCursor === false) U.scale.setScalar(0);
      else U.scale.setScalar(this.physics.sizeData[i]);
      U.updateMatrix();
      this.setMatrixAt(i, U.matrix);
      if (i === 0) this.light.position.copy(U.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas, config = {}) {
  const three = new X({
    canvas,
    size: "parent",
    rendererOptions: { antialias: true, alpha: true },
  });
  let spheres;
  three.renderer.toneMapping = ACESFilmicToneMapping;
  three.camera.position.set(0, 0, 20);
  three.camera.lookAt(0, 0, 0);
  three.cameraMaxAspect = 1.5;
  three.resize();
  initialize(config);

  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const intersectionPoint = new Vector3();
  let isPaused = false;
  canvas.style.touchAction = "none";
  canvas.style.userSelect = "none";

  const pointerData = createPointerData({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(pointerData.nPosition, three.camera);
      three.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersectionPoint);
      spheres.physics.center.copy(intersectionPoint);
      spheres.config.controlSphere0 = true;
    },
    onLeave() {
      spheres.config.controlSphere0 = false;
    },
  });

  function initialize(cfg) {
    if (spheres) {
      three.clear();
      three.scene.remove(spheres);
    }
    spheres = new Z(three.renderer, { ...XDefaults, ...cfg });
    three.scene.add(spheres);
  }

  three.onBeforeRender = (deltaInfo) => {
    if (!isPaused) spheres.update(deltaInfo);
  };
  three.onAfterResize = (size) => {
    spheres.config.maxX = size.wWidth / 2;
    spheres.config.maxY = size.wHeight / 2;
  };

  return {
    three,
    get spheres() {
      return spheres;
    },
    setCount(count) {
      initialize({ ...spheres.config, count });
    },
    togglePause() {
      isPaused = !isPaused;
    },
    dispose() {
      pointerData.dispose && pointerData.dispose();
      three.dispose();
    },
  };
}

const Ballpit = ({ className = "", followCursor = true, ...props }) => {
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => {
      instRef.current && instRef.current.dispose();
    };
  }, []);
  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
export default Ballpit;
