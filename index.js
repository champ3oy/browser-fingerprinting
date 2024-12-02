/**
 * Samarithan
 * Author: Akoto Selorm (https://github.com/champ3oy)
 * Original copyright (c) Deadalus Systems, 2024 (https://deadal.us)
 */

// Core utility functions
const utils = {
  setPrototypeOf: function (target, proto) {
    if ({ __proto__: [] }) {
      target.__proto__ = proto;
    } else {
      for (let key in proto) {
        if (Object.prototype.hasOwnProperty.call(proto, key)) {
          target[key] = proto[key];
        }
      }
    }
    return target;
  },

  assign: function (target) {
    for (let i = 1; i < arguments.length; i++) {
      const source = arguments[i];
      for (let key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  },

  // Remove specified keys from object
  exclude: function (obj, excludeKeys) {
    const result = {};
    for (let key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        excludeKeys.indexOf(key) < 0
      ) {
        result[key] = obj[key];
      }
    }
    return result;
  },
};

// Promise-based utilities
const promiseUtils = {
  delay: function (ms, value) {
    return new Promise((resolve) => setTimeout(resolve, ms, value));
  },

  withTimeout: function (promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  },

  retry: function (fn, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        fn()
          .then(resolve)
          .catch((err) => {
            if (retries-- > 0) {
              setTimeout(attempt, delay);
            } else {
              reject(err);
            }
          });
      };
      attempt();
    });
  },
};

// Browser fingerprinting components
class BrowserFingerprint {
  constructor(options = {}) {
    this.options = options;
    this.apiKey = options.apiKey;
    this.cookieName = options.cookieName || "smbfjs_id";
    this.cookieDays = options.cookieDays || 365;

    if (!this.apiKey) {
      throw new Error("API key is required");
    }

    this.components = [];
  }

  setCookie(value) {
    const date = new Date();
    date.setTime(date.getTime() + this.cookieDays * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this.cookieName}=${value};${expires};path=/;SameSite=Lax`;
  }

  getCookie() {
    const name = `${this.cookieName}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(";");
    for (let cookie of cookies) {
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  async verifyApiKey() {
    // TODO: Implement API key verification logic here
    return true;
  }

  addComponent(component) {
    this.components.push(component);
    return this;
  }

  async get() {
    await this.verifyApiKey();

    let visitorId = this.getCookie();

    if (!visitorId) {
      const components = await Promise.all(this.components.map((c) => c.get()));

      const stableComponents = components.filter((c) =>
        [
          "userAgent",
          "hardwareConcurrency",
          "deviceMemory",
          "language",
          "colorDepth",
          "pixelRatio",
          "videoCard",
          "canvas",
          "webgl",
          "fonts",
        ].includes(c.key)
      );

      visitorId = this.hashComponents(stableComponents);
      this.setCookie(visitorId);

      return {
        visitorId,
        components,
      };
    }

    return {
      visitorId,
      fromCookie: true,
    };
  }

  hashComponents(components) {
    const str = JSON.stringify(components.map((c) => c.value));
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// Core fingerprinting components
const components = {
  userAgent: class {
    get() {
      return { key: "userAgent", value: navigator.userAgent };
    }
  },

  webdriver: class {
    get() {
      return {
        key: "webdriver",
        value: navigator.webdriver || false,
      };
    }
  },

  language: class {
    get() {
      return { key: "language", value: navigator.language };
    }
  },

  colorDepth: class {
    get() {
      return {
        key: "colorDepth",
        value: window.screen.colorDepth,
      };
    }
  },

  deviceMemory: class {
    get() {
      return {
        key: "deviceMemory",
        value: navigator.deviceMemory,
      };
    }
  },

  pixelRatio: class {
    get() {
      return {
        key: "pixelRatio",
        value: window.devicePixelRatio,
      };
    }
  },

  hardwareConcurrency: class {
    get() {
      return {
        key: "hardwareConcurrency",
        value: navigator.hardwareConcurrency,
      };
    }
  },
};

// Canvas fingerprinting
class CanvasFingerprint {
  get() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Draw test shapes and text
    canvas.width = 240;
    canvas.height = 60;

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(100, 1, 62, 20);

    ctx.fillStyle = "#069";
    ctx.font = '11pt "Times New Roman"';
    const text = "Cwm fjordbank gly " + String.fromCharCode(55357, 56835);
    ctx.fillText(text, 2, 15);

    ctx.fillStyle = "rgba(102, 204, 0, 0.2)";
    ctx.font = "18pt Arial";
    ctx.fillText(text, 4, 45);

    return {
      key: "canvas",
      value: canvas.toDataURL(),
    };
  }
}

// Audio fingerprinting
class AudioFingerprint {
  async get() {
    try {
      const audioContext = new (window.OfflineAudioContext ||
        window.webkitOfflineAudioContext)(1, 44100, 44100);

      const oscillator = audioContext.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.value = 10000;

      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      oscillator.connect(compressor);
      compressor.connect(audioContext.destination);
      oscillator.start(0);

      const audioBuffer = await audioContext.startRendering();
      const samples = audioBuffer.getChannelData(0).subarray(4500);

      let sum = 0;
      for (let i = 0; i < samples.length; ++i) {
        sum += Math.abs(samples[i]);
      }

      return {
        key: "audio",
        value: sum,
      };
    } catch (error) {
      return {
        key: "audio",
        value: error.message,
      };
    }
  }
}

// WebGL fingerprinting
class WebGLFingerprint {
  get() {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return {
        key: "webgl",
        value: null,
      };
    }

    return {
      key: "webgl",
      value: {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        extensions: gl.getSupportedExtensions(),
      },
    };
  }
}

// Fonts detection
class FontFingerprint {
  get() {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const fontList = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Arial Rounded MT Bold",
      "Bookman Old Style",
      "Bradley Hand",
      "Calibri",
      "Cambria",
      "Cambria Math",
      "Comic Sans MS",
      "Consolas",
      "Courier",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Latin Modern Math",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Microsoft Sans Serif",
      "Monotype Corsiva",
      "MS Gothic",
      "MS Outlook",
      "MS PGothic",
      "MS Reference Sans Serif",
      "MS Sans Serif",
      "MS Serif",
      "Palatino Linotype",
      "Segoe Print",
      "Segoe Script",
      "Segoe UI",
      "Segoe UI Light",
      "Segoe UI Semibold",
      "Segoe UI Symbol",
      "Tahoma",
      "Times",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
      "Wingdings",
      "Wingdings 2",
      "Wingdings 3",
    ];

    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";
    const h = document.getElementsByTagName("body")[0];

    const baseFontsDiv = document.createElement("div");
    const fontsDiv = document.createElement("div");

    const defaultWidth = {};
    const defaultHeight = {};

    // Create spans for base fonts
    for (const baseFont of baseFonts) {
      const s = document.createElement("span");
      s.style.fontSize = testSize;
      s.style.fontFamily = baseFont;
      s.innerText = testString;
      baseFontsDiv.appendChild(s);
      defaultWidth[baseFont] = s.offsetWidth;
      defaultHeight[baseFont] = s.offsetHeight;
    }

    // Add spans to body
    h.appendChild(baseFontsDiv);
    h.appendChild(fontsDiv);

    const available = [];

    // Check available fonts
    for (const font of fontList) {
      const detected = baseFonts.some((baseFont) => {
        const s = document.createElement("span");
        s.style.fontSize = testSize;
        s.style.fontFamily = font + "," + baseFont;
        s.innerText = testString;
        fontsDiv.appendChild(s);
        return (
          s.offsetWidth !== defaultWidth[baseFont] ||
          s.offsetHeight !== defaultHeight[baseFont]
        );
      });

      if (detected) {
        available.push(font);
      }
    }

    // Cleanup
    h.removeChild(baseFontsDiv);
    h.removeChild(fontsDiv);

    return {
      key: "fonts",
      value: available,
    };
  }
}

// Plugin detection
class PluginFingerprint {
  get() {
    if (!navigator.plugins) {
      return {
        key: "plugins",
        value: null,
      };
    }

    const plugins = [];

    // Convert plugins to array
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      const mimeTypes = [];

      for (let j = 0; j < plugin.length; j++) {
        const mime = plugin[j];
        mimeTypes.push({
          type: mime.type,
          suffixes: mime.suffixes,
        });
      }

      plugins.push({
        name: plugin.name,
        description: plugin.description,
        mimeTypes: mimeTypes,
      });
    }

    return {
      key: "plugins",
      value: plugins,
    };
  }
}

// Touch support detection
class TouchSupportFingerprint {
  get() {
    let maxTouchPoints = 0;
    if (navigator.maxTouchPoints !== undefined) {
      maxTouchPoints = navigator.maxTouchPoints;
    } else if (navigator.msMaxTouchPoints !== undefined) {
      maxTouchPoints = navigator.msMaxTouchPoints;
    }

    try {
      document.createEvent("TouchEvent");
      var touchEvent = true;
    } catch (e) {
      var touchEvent = false;
    }

    const touchStart = "ontouchstart" in window;

    return {
      key: "touch",
      value: {
        maxTouchPoints,
        touchEvent,
        touchStart,
      },
    };
  }
}

// Hardware performance fingerprinting
class HardwareFingerprint {
  async get() {
    // Run computation-heavy tasks and measure timing
    const start = performance.now();

    // Heavy mathematical operations
    for (let i = 0; i < 1000000; i++) {
      Math.sin(Math.sqrt(Math.pow(i, 2)));
    }

    // Measure time taken for operations
    const end = performance.now();
    const performance_score = end - start;

    // Get hardware concurrency and memory
    const cores = navigator.hardwareConcurrency || "unknown";
    const memory = navigator.deviceMemory || "unknown";

    return {
      key: "hardware",
      value: {
        performance_score,
        cores,
        memory,
      },
    };
  }
}

// Battery fingerprinting
class BatteryFingerprint {
  async get() {
    if (!navigator.getBattery) {
      return {
        key: "battery",
        value: null,
      };
    }

    try {
      const battery = await navigator.getBattery();
      return {
        key: "battery",
        value: {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        },
      };
    } catch (e) {
      return {
        key: "battery",
        value: null,
      };
    }
  }
}

// Speech synthesis voices fingerprinting
class VoicesFingerprint {
  async get() {
    if (!window.speechSynthesis) {
      return {
        key: "voices",
        value: null,
      };
    }

    // Wait for voices to load
    await new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        resolve();
      } else {
        speechSynthesis.onvoiceschanged = resolve;
      }
    });

    const voices = speechSynthesis.getVoices();
    return {
      key: "voices",
      value: voices.map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        voiceURI: voice.voiceURI,
      })),
    };
  }
}

// WebRTC fingerprinting
class WebRTCFingerprint {
  async get() {
    if (!window.RTCPeerConnection) {
      return {
        key: "webrtc",
        value: null,
      };
    }

    try {
      const pc = new RTCPeerConnection();
      pc.createDataChannel("");

      const offer = await pc.createOffer();
      pc.close();

      // Extract fingerprinting info from SDP
      const sdp = offer.sdp;
      const matches = sdp.match(/fingerprint:(?:sha-256|sha-1) (.*)/);
      const fingerprint = matches ? matches[1] : null;

      return {
        key: "webrtc",
        value: {
          fingerprint,
          sdpFingerprint: this._hashSDP(sdp),
        },
      };
    } catch (e) {
      return {
        key: "webrtc",
        value: null,
      };
    }
  }

  _hashSDP(sdp) {
    let hash = 0;
    for (let i = 0; i < sdp.length; i++) {
      const char = sdp.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }
}

// CSS feature detection fingerprint
class CSSFeaturesFingerprint {
  get() {
    const features = {
      // Layout features
      grid: this._supports("display: grid"),
      flex: this._supports("display: flex"),
      columns: this._supports("columns: 2"),

      // Modern features
      backdropFilter: this._supports("backdrop-filter: blur(2px)"),
      css3d: this._supports("perspective: 1px"),
      cssMasks: this._supports("mask-image: none"),
      cssReflections: this._supports("box-reflect: right"),

      // Animations
      animations: this._supports("animation: name"),
      transitions: this._supports("transition: all"),
      transforms: this._supports("transform: rotate(1deg)"),

      // Effects
      filters: this._supports("filter: grayscale(1)"),
      clipPath: this._supports("clip-path: circle(1px)"),

      // Color features
      variables: this._supports("--test: 0"),
      colorGamut: {
        p3: matchMedia("(color-gamut: p3)").matches,
        srgb: matchMedia("(color-gamut: srgb)").matches,
        rec2020: matchMedia("(color-gamut: rec2020)").matches,
      },
    };

    return {
      key: "cssFeatures",
      value: features,
    };
  }

  _supports(property) {
    return CSS.supports(property);
  }
}

// Media devices fingerprint
class MediaDevicesFingerprint {
  async get() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return {
        key: "mediaDevices",
        value: null,
      };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        key: "mediaDevices",
        value: devices.map((device) => ({
          kind: device.kind,
          label: device.label ? device.label : "",
          deviceId: device.deviceId ? true : false,
          groupId: device.groupId,
        })),
      };
    } catch (e) {
      return {
        key: "mediaDevices",
        value: null,
      };
    }
  }
}

// Pressure sensor fingerprint
class PressureSensorFingerprint {
  get() {
    // Check if the Pressure API is available
    if (
      typeof GravitySensor !== "undefined" ||
      typeof AbsoluteOrientationSensor !== "undefined" ||
      typeof RelativeOrientationSensor !== "undefined"
    ) {
      const sensors = {
        gravity: typeof GravitySensor !== "undefined",
        absoluteOrientation: typeof AbsoluteOrientationSensor !== "undefined",
        relativeOrientation: typeof RelativeOrientationSensor !== "undefined",
      };

      return {
        key: "pressureSensor",
        value: sensors,
      };
    }

    return {
      key: "pressureSensor",
      value: null,
    };
  }
}

// GPU fingerprinting
class GPUFingerprint {
  async get() {
    if (!navigator.gpu) {
      return {
        key: "gpu",
        value: null,
      };
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      const info = {
        name: adapter.name,
        limits: {
          maxBindGroups: adapter.limits.maxBindGroups,
          maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
          maxComputeWorkgroupSizeY: adapter.limits.maxComputeWorkgroupSizeY,
          maxComputeWorkgroupSizeZ: adapter.limits.maxComputeWorkgroupSizeZ,
          maxComputeWorkgroupsPerDimension:
            adapter.limits.maxComputeWorkgroupsPerDimension,
        },
        features: Array.from(adapter.features).map((feature) => feature.name),
      };

      return {
        key: "gpu",
        value: info,
      };
    } catch (e) {
      return {
        key: "gpu",
        value: null,
      };
    }
  }
}

// Network behavior fingerprint
class NetworkFingerprint {
  async get() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    // Test download speed with a small resource
    const speedTest = await this._testSpeed();

    return {
      key: "network",
      value: {
        connectionType: connection ? connection.type : null,
        effectiveType: connection ? connection.effectiveType : null,
        downlink: connection ? connection.downlink : null,
        rtt: connection ? connection.rtt : null,
        saveData: connection ? connection.saveData : null,
        speedTest,
      },
    };
  }

  async _testSpeed() {
    const startTime = performance.now();
    try {
      const response = await fetch(
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      );
      const endTime = performance.now();
      return endTime - startTime;
    } catch (e) {
      return null;
    }
  }
}

// VideoCard info fingerprint via WebGL
class VideoCardFingerprint {
  get() {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return {
        key: "videoCard",
        value: null,
      };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    if (!debugInfo) {
      return {
        key: "videoCard",
        value: null,
      };
    }

    return {
      key: "videoCard",
      value: {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      },
    };
  }
}

// Main fingerprint generation
class Fingerprint {
  static async load(options = {}) {
    const bf = new BrowserFingerprint(options);

    // Add components
    bf.addComponent(new components.userAgent())
      .addComponent(new components.webdriver())
      .addComponent(new components.language())
      .addComponent(new components.colorDepth())
      .addComponent(new components.deviceMemory())
      .addComponent(new components.pixelRatio())
      .addComponent(new components.hardwareConcurrency())
      .addComponent(new CanvasFingerprint())
      .addComponent(new AudioFingerprint())
      .addComponent(new WebGLFingerprint())
      .addComponent(new FontFingerprint())
      .addComponent(new PluginFingerprint())
      .addComponent(new TouchSupportFingerprint())
      .addComponent(new HardwareFingerprint())
      .addComponent(new BatteryFingerprint())
      .addComponent(new VoicesFingerprint())
      .addComponent(new WebRTCFingerprint())
      .addComponent(new CSSFeaturesFingerprint())
      .addComponent(new MediaDevicesFingerprint())
      .addComponent(new PressureSensorFingerprint())
      .addComponent(new GPUFingerprint())
      .addComponent(new NetworkFingerprint())
      .addComponent(new VideoCardFingerprint());

    return bf;
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = Fingerprint;
} else if (typeof define === "function" && define.amd) {
  define(function () {
    return Fingerprint;
  });
} else {
  window.Fingerprint = Fingerprint;
}
