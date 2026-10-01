import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Set security & permissions policy headers
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "bluetooth=(self), camera=*, microphone=*");
  next();
});

// Real-time Server-Sent Events (SSE) Client Pool for Wi-Fi mobile & desktop sync
interface SSEClient {
  id: string;
  res: express.Response;
  clientType: "desktop" | "mobile";
  sessionId?: string;
}

let sseClients: SSEClient[] = [];

export function broadcastSSE(eventType: string, data: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Active Wi-Fi real-time mobile pairing session state
let activePairingSession = {
  pairingCode: "JRV-4892",
  isPaired: false,
  pairedDeviceId: null as string | null,
  pairedDeviceName: null as string | null,
  connectedAt: null as number | null,
  lastHeartbeat: Date.now(),
};

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory state for local intelligence OS
let serverStartTime = Date.now();

// Initial connected device mesh with full device functions, screen locks, and installed app controls
let connectedDevices: Array<any> = [
  {
    id: "dev-laptop-01",
    name: "MacBook Pro M3 Max",
    type: "laptop",
    protocol: "Wi-Fi 6E",
    address: "192.168.1.104",
    status: "connected",
    batteryPercent: 88,
    signalStrengthDbm: -42,
    requiredSecurityLevel: 1,
    lastPingMs: 4,
    isLocked: false,
    lockType: "password",
    lockCode: "stark2026",
    features: {
      volume: 60,
      brightness: 90,
      wifi: true,
      bluetooth: true,
      dnd: false,
      screenUnlocked: true,
    },
    installedApps: [
      {
        id: "app-mac-term",
        name: "Terminal (Zsh Shell)",
        category: "System",
        isLocked: false,
        isRunning: true,
      },
      {
        id: "app-mac-code",
        name: "VS Code Sovereign Studio",
        category: "Developer",
        isLocked: false,
        isRunning: true,
      },
      {
        id: "app-mac-pwd",
        name: "1Password Enclave Vault",
        category: "Security",
        isLocked: true,
        lockType: "password",
        lockCode: "vault42",
        isRunning: false,
      },
      {
        id: "app-mac-web",
        name: "Hardened Chromium",
        category: "Web",
        isLocked: false,
        isRunning: true,
      },
    ],
    data: {
      state: true,
      isLocked: false,
      metrics: { cpu: "14%", ram: "28/64GB", disk: "1.2TB Free", os: "macOS Sonoma 14.5" },
    },
  },
  {
    id: "dev-server-01",
    name: "Primary Neural Rig (Local RTX 4090)",
    type: "server",
    protocol: "Local Bus",
    address: "127.0.0.1:8080",
    status: "connected",
    signalStrengthDbm: 0,
    requiredSecurityLevel: 2,
    lastPingMs: 1,
    isLocked: false,
    features: {
      volume: 0,
      brightness: 100,
      wifi: true,
      bluetooth: false,
    },
    data: {
      state: true,
      metrics: { vram: "18.4/24 GB", temp: "44°C", model: "Llama-3.3-8B-Q4_K_M (Local)" },
    },
  },
  {
    id: "dev-lock-01",
    name: "Front Access Smart Deadbolt",
    type: "smart_lock",
    protocol: "BLE 5.3",
    address: "BLE:88:E2:01:BC:4A",
    status: "connected",
    batteryPercent: 94,
    signalStrengthDbm: -56,
    requiredSecurityLevel: 2,
    lastPingMs: 18,
    isLocked: true,
    lockType: "pin",
    lockCode: "0451",
    data: {
      state: true,
      isLocked: true,
    },
  },
  {
    id: "dev-sensor-01",
    name: "Laboratory Climate & Optical Hub",
    type: "sensor_hub",
    protocol: "Zigbee",
    address: "0x4A1F",
    status: "connected",
    batteryPercent: 100,
    signalStrengthDbm: -48,
    requiredSecurityLevel: 0,
    lastPingMs: 12,
    data: {
      value: "21.8°C | 45% Humidity",
      metrics: { temp: "21.8°C", humidity: "45%", co2: "410 ppm", voc: "Normal" },
    },
  },
  {
    id: "dev-phone-01",
    name: "Pixel 9 Pro Mobile Unit",
    type: "phone",
    protocol: "Wi-Fi 6E",
    address: "192.168.1.115",
    status: "connected",
    batteryPercent: 76,
    signalStrengthDbm: -50,
    requiredSecurityLevel: 1,
    lastPingMs: 9,
    isLocked: true, // Phone screen is currently locked
    lockType: "pin",
    lockCode: "4892", // Authorized PIN code
    features: {
      volume: 75,
      brightness: 85,
      flashlight: false,
      dnd: false,
      wifi: true,
      bluetooth: true,
      hotspot: false,
      batterySaver: false,
      ringerMode: "normal",
      cameraActive: false,
      screenUnlocked: false,
    },
    installedApps: [
      {
        id: "app-signal",
        name: "Signal Encrypted Messenger",
        category: "Secure Messaging",
        isLocked: true,
        lockType: "pin",
        lockCode: "7701",
        isRunning: false,
      },
      {
        id: "app-banking",
        name: "Stark Financial & Vault",
        category: "Finance",
        isLocked: true,
        lockType: "password",
        lockCode: "ALPHA9",
        isRunning: false,
      },
      {
        id: "app-photos",
        name: "Private Vault & Gallery",
        category: "Media",
        isLocked: true,
        lockType: "pin",
        lockCode: "1234",
        isRunning: false,
      },
      {
        id: "app-notes",
        name: "Encrypted Notes Vault",
        category: "Productivity",
        isLocked: true,
        lockType: "password",
        lockCode: "stark",
        isRunning: false,
      },
      {
        id: "app-camera",
        name: "Pro HDR Camera",
        category: "System",
        isLocked: false,
        isRunning: false,
      },
      {
        id: "app-maps",
        name: "Satellite GPS Navigation",
        category: "Navigation",
        isLocked: false,
        isRunning: true,
      },
      {
        id: "app-terminal",
        name: "Termux Dev Shell",
        category: "Developer",
        isLocked: false,
        isRunning: false,
      },
      {
        id: "app-health",
        name: "Neural Health & Biometrics",
        category: "Biometrics",
        isLocked: true,
        lockType: "pin",
        lockCode: "9900",
        isRunning: true,
      },
      {
        id: "app-settings",
        name: "OS Settings & Security Enclave",
        category: "System",
        isLocked: false,
        isRunning: false,
      },
    ],
    data: {
      state: true,
      isLocked: true,
      metrics: { network: "5G Ultra", sync: "Up to date", location: "Home Base Lab" },
    },
  },
  {
    id: "dev-robot-01",
    name: "Autonomous Patrol Rover (Unit-X)",
    type: "robot_unit",
    protocol: "Wi-Fi 6E",
    address: "192.168.1.180",
    status: "idle",
    batteryPercent: 92,
    signalStrengthDbm: -60,
    requiredSecurityLevel: 3,
    lastPingMs: 24,
    data: {
      state: false,
      value: "Docked at Charging Station A",
      metrics: { mode: "Standby", camera: "Active", lidar: "Calibrated" },
    },
  },
];

// Knowledge Documents (Local Memory)
let knowledgeDocs = [
  {
    id: "doc-01",
    title: "User Profile & Security Clearance",
    category: "personal_context",
    content: "User: Dr. Stark / Primary Operator. Biometric Voice ID: Verified. Default Security Level: Tier 3 Access. Focus: Autonomous Computing, Robotics, System Architecture.",
    indexedAt: Date.now() - 86400000 * 3,
    tags: ["profile", "clearance", "biometrics"],
    sizeKb: 1.8,
  },
  {
    id: "doc-02",
    title: "Local Device Mesh Protocols & IP Allocations",
    category: "system_docs",
    content: "Local Subnet: 192.168.1.0/24. Gateway: 192.168.1.1. BLE Mesh ID: JARVIS-SEC-MESH-09. All Level 2 and Level 3 actuation commands require zero-trust cryptographic challenge tokens.",
    indexedAt: Date.now() - 86400000 * 2,
    tags: ["network", "mesh", "protocols", "security"],
    sizeKb: 3.2,
  },
  {
    id: "doc-03",
    title: "Laboratory Environmental Baseline Parameters",
    category: "notes",
    content: "Ideal Lab Temperature: 21.0°C - 23.0°C. Maximum CO2 threshold: 800 ppm. Automatic ventilation triggers when VOC index exceeds 150. Night lockdown protocol initiates at 23:00 local time.",
    indexedAt: Date.now() - 86400000,
    tags: ["environment", "lab", "thresholds"],
    sizeKb: 2.1,
  },
];

// Automation Workflows
interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: { type: string; config: string };
  nodes: Array<{ id: string; title: string; tool: string; params: Record<string, any>; securityLevel: number }>;
  enabled: boolean;
  lastRunTimestamp?: number;
  lastStatus?: string;
  executionCount: number;
}

let workflows: WorkflowItem[] = [
  {
    id: "wf-lockdown",
    name: "Emergency Facility Lockdown",
    description: "Engages all smart deadbolts, dims lighting to alert mode, triggers perimeter sensors, and locks unauthorized local terminal sessions.",
    trigger: { type: "voice_command", config: "Execute Protocol Red / Lockdown" },
    nodes: [
      { id: "n1", title: "Secure Deadbolts", tool: "device_control", params: { deviceId: "dev-lock-01", isLocked: true }, securityLevel: 2 },
      { id: "n2", title: "Activate Perimeter Sensors", tool: "device_control", params: { deviceId: "dev-sensor-01", mode: "high_sensitivity" }, securityLevel: 1 },
      { id: "n3", title: "Deploy Patrol Rover", tool: "device_control", params: { deviceId: "dev-robot-01", state: true, task: "perimeter_scan" }, securityLevel: 3 },
      { id: "n4", title: "Audit Log & Notify Phone", tool: "system_command", params: { action: "send_push", message: "Lockdown engaged" }, securityLevel: 1 },
    ],
    enabled: true,
    lastRunTimestamp: Date.now() - 3600000 * 5,
    lastStatus: "success",
    executionCount: 14,
  },
  {
    id: "wf-morning",
    name: "Morning Workspace & Diagnostic Briefing",
    description: "Powers on neural workstations, runs local latency checks, pulls calendar/weather diagnostics, and provides audio summary.",
    trigger: { type: "time_schedule", config: "Every Day at 07:30 AM" },
    nodes: [
      { id: "n1", title: "Wake Neural Rig & Verify VRAM", tool: "system_command", params: { command: "check_hardware" }, securityLevel: 1 },
      { id: "n2", title: "Scan Device Mesh Ping", tool: "network_scan", params: { range: "192.168.1.0/24" }, securityLevel: 0 },
      { id: "n3", title: "Synthesize Audio Briefing", tool: "knowledge_retrieval", params: { topic: "morning_summary" }, securityLevel: 0 },
    ],
    enabled: true,
    lastRunTimestamp: Date.now() - 3600000 * 18,
    lastStatus: "success",
    executionCount: 88,
  },
  {
    id: "wf-backup",
    name: "Autonomous Code & Memory Vault Sync",
    description: "Encrypted diff snapshot across primary laptop, server RAID, and local offline cold storage vault.",
    trigger: { type: "time_schedule", config: "Every 4 Hours" },
    nodes: [
      { id: "n1", title: "Create Snapshot Hash", tool: "file_system", params: { action: "hash", path: "/vault" }, securityLevel: 1 },
      { id: "n2", title: "Sync to Server", tool: "file_system", params: { action: "sync", source: "dev-laptop-01", target: "dev-server-01" }, securityLevel: 2 },
    ],
    enabled: true,
    lastRunTimestamp: Date.now() - 3600000 * 2,
    lastStatus: "success",
    executionCount: 312,
  },
];

// API: System Health & Telemetry
app.get("/api/health", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  
  res.json({
    online: true,
    status: "optimal",
    uptimeSeconds,
    hasGeminiKey,
    deviceCount: connectedDevices.length,
    workflowCount: workflows.length,
    knowledgeDocCount: knowledgeDocs.length,
    systemLoad: {
      cpu: Math.floor(18 + Math.random() * 12),
      npu: Math.floor(45 + Math.sin(Date.now() / 10000) * 15),
      vramUsedGb: +(14.2 + Math.random() * 0.8).toFixed(1),
      vramTotalGb: 24.0,
      temperatureC: Math.floor(42 + Math.random() * 5),
      tokensPerSec: 68.4,
      contextWindowTokens: 4120,
      maxContextTokens: 32768,
      activeAgents: 3,
    },
  });
});

// API: Devices
app.get("/api/jarvis/devices", (req, res) => {
  res.json({ devices: connectedDevices });
});

// API: Real-Time Server-Sent Events (SSE) Stream for Mobile & Desktop
app.get("/api/jarvis/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const clientType = (req.query.type as "desktop" | "mobile") || "desktop";
  const client: SSEClient = { id: clientId, res, clientType, sessionId: (req.query.session as string) || undefined };
  sseClients.push(client);

  // Send initial handshake state
  res.write(
    `event: init\ndata: ${JSON.stringify({
      devices: connectedDevices,
      pairingSession: activePairingSession,
      serverTime: Date.now(),
      clientId,
    })}\n\n`
  );

  // Heartbeat to keep connection alive across proxies
  const keepAlive = setInterval(() => {
    try {
      res.write(`: keepalive\n\n`);
    } catch {
      clearInterval(keepAlive);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// API: Real-Time Wi-Fi Mobile Pairing Session & QR Code Generator
app.get("/api/jarvis/mobile/session", async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const baseUrl = `${protocol}://${host}`;
  const mobileUrl = `${baseUrl}/?mode=mobile_node&session=${activePairingSession.pairingCode}`;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(mobileUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#06b6d4",
        light: "#030712",
      },
    });
  } catch (err: any) {
    console.warn("QR code generation warning:", err.message);
  }

  res.json({
    pairingCode: activePairingSession.pairingCode,
    directUrl: mobileUrl,
    qrDataUrl,
    isPaired: activePairingSession.isPaired,
    pairedDeviceId: activePairingSession.pairedDeviceId,
    pairedDeviceName: activePairingSession.pairedDeviceName,
    connectedAt: activePairingSession.connectedAt,
  });
});

// API: Real Mobile Phone Handshake & Wi-Fi Pairing
app.post("/api/jarvis/mobile/pair", (req, res) => {
  const { pairingCode, deviceName, batteryPercent, screenResolution, platform, userAgent } = req.body;

  if (pairingCode && pairingCode !== activePairingSession.pairingCode) {
    return res.status(400).json({ error: "Invalid mobile pairing code." });
  }

  const phoneDev = connectedDevices.find((d) => d.id === "dev-phone-01" || d.type === "phone");
  const realName = deviceName || (platform ? `Mobile Unit (${platform})` : "Operator's Mobile Device");

  if (phoneDev) {
    phoneDev.name = realName;
    phoneDev.protocol = "Wi-Fi (Real Mobile Link)";
    phoneDev.status = "connected";
    phoneDev.isRealDevice = true;
    phoneDev.pairedAt = Date.now();
    phoneDev.lastPingMs = 3;
    if (batteryPercent !== undefined && batteryPercent !== null) {
      phoneDev.batteryPercent = Math.round(batteryPercent);
    }
    phoneDev.data.metrics = {
      ...(phoneDev.data.metrics || {}),
      link: "Real-Time Wi-Fi Sync",
      resolution: screenResolution || "Native Screen",
      platform: platform || "Mobile OS",
      status: "Tethered & Verified",
    };
  }

  activePairingSession.isPaired = true;
  activePairingSession.pairedDeviceId = phoneDev ? phoneDev.id : "dev-phone-01";
  activePairingSession.pairedDeviceName = realName;
  activePairingSession.connectedAt = Date.now();
  activePairingSession.lastHeartbeat = Date.now();

  broadcastSSE("device_paired", {
    device: phoneDev,
    session: activePairingSession,
    message: `Real mobile device "${realName}" successfully tethered via real-time Wi-Fi!`,
  });
  broadcastSSE("devices_updated", { devices: connectedDevices });

  res.json({
    success: true,
    device: phoneDev,
    session: activePairingSession,
    message: `Connected to JARVIS Core. Real-time Wi-Fi pairing established.`,
  });
});

// API: Real Mobile Phone Telemetry & Status Heartbeat
app.post("/api/jarvis/mobile/telemetry", (req, res) => {
  const { batteryPercent, isLocked, activeAppId, screenResolution } = req.body;
  const phoneDev = connectedDevices.find((d) => d.id === "dev-phone-01" || d.type === "phone");

  if (phoneDev) {
    if (batteryPercent !== undefined) phoneDev.batteryPercent = Math.round(batteryPercent);
    if (isLocked !== undefined) {
      phoneDev.isLocked = isLocked;
      phoneDev.data.isLocked = isLocked;
      if (phoneDev.features) phoneDev.features.screenUnlocked = !isLocked;
    }
    if (activeAppId) {
      phoneDev.installedApps?.forEach((a: any) => {
        a.isRunning = a.id === activeAppId;
      });
    }
    activePairingSession.lastHeartbeat = Date.now();
  }

  broadcastSSE("devices_updated", { devices: connectedDevices });
  res.json({ success: true });
});

// API: Real Web Bluetooth Peripheral Pairing
app.post("/api/jarvis/bluetooth/pair", (req, res) => {
  const { id, name, type, services, batteryPercent, rssi, lockCode, isLocked } = req.body;

  const existingIdx = connectedDevices.findIndex((d) => d.id === id || d.address === id);
  const btName = name || "Real BLE Peripheral Device";
  const devType = type || "smart_lock";

  const newBtDevice = {
    id: id || `ble-real-${Date.now()}`,
    name: btName,
    type: devType,
    protocol: "BLE (Web Bluetooth)",
    address: id ? `BLE:${id.substring(0, 14)}` : "BLE:GATT:PAIRED",
    status: "connected",
    batteryPercent: batteryPercent !== undefined ? Math.round(batteryPercent) : 95,
    signalStrengthDbm: rssi || -46,
    requiredSecurityLevel: 2,
    lastPingMs: 4,
    isRealDevice: true,
    pairedAt: Date.now(),
    isLocked: isLocked !== undefined ? isLocked : (devType === 'smart_lock' ? true : false),
    lockType: "pin",
    lockCode: lockCode || (devType === 'smart_lock' ? "0451" : undefined),
    features: {
      volume: 80,
      brightness: 85,
      flashlight: false,
      dnd: false,
      screenUnlocked: !(isLocked !== undefined ? isLocked : (devType === 'smart_lock' ? true : false)),
    },
    data: {
      state: true,
      isLocked: isLocked !== undefined ? isLocked : (devType === 'smart_lock' ? true : false),
      value: "Live Web Bluetooth Connection",
      metrics: {
        gatt: "GATT Server Connected",
        services: Array.isArray(services) && services.length > 0 ? services.slice(0, 3).join(", ") : "Standard BLE Profiles",
      },
    },
  };

  if (existingIdx >= 0) {
    connectedDevices[existingIdx] = { ...connectedDevices[existingIdx], ...newBtDevice };
  } else {
    connectedDevices.push(newBtDevice);
  }

  broadcastSSE("bluetooth_paired", {
    device: newBtDevice,
    message: `Physical Bluetooth device "${btName}" paired via Web Bluetooth API.`,
  });
  broadcastSSE("devices_updated", { devices: connectedDevices });

  res.json({ success: true, device: newBtDevice });
});

app.post("/api/jarvis/devices/action", (req, res) => {
  const { deviceId, action, params } = req.body;
  const dev = connectedDevices.find((d) => d.id === deviceId);
  if (!dev) {
    return res.status(404).json({ error: "Device not found" });
  }

  const broadcastAndRespond = (statusCode: number, data: any) => {
    if (data.success) {
      broadcastSSE("device_action", {
        deviceId,
        action,
        params,
        device: dev,
        timestamp: Date.now(),
      });
      broadcastSSE("devices_updated", { devices: connectedDevices });
    }
    return res.status(statusCode).json(data);
  };

  // 1. Device Lock / Unlock with Specified PIN/Passcode
  if (action === "unlock_device") {
    const lockCode = params?.lockCode || params?.pin || params?.passcode;
    const force = params?.force;
    if (dev.isLocked) {
      if (!dev.lockCode || lockCode === dev.lockCode || force) {
        dev.isLocked = false;
        dev.data.isLocked = false;
        if (dev.features) dev.features.screenUnlocked = true;
        return broadcastAndRespond(200, { 
          success: true, 
          device: dev, 
          message: `${dev.name} screen and biometric lock successfully unlocked using specified lock credential.` 
        });
      } else {
        return broadcastAndRespond(401, { 
          success: false, 
          error: `Invalid lock code specified for ${dev.name}. Security authentication failed.`,
          expectedType: dev.lockType || 'pin'
        });
      }
    } else {
      return broadcastAndRespond(200, { success: true, device: dev, message: `${dev.name} is already unlocked.` });
    }
  } else if (action === "lock_device") {
    dev.isLocked = true;
    dev.data.isLocked = true;
    if (dev.features) dev.features.screenUnlocked = false;
    return broadcastAndRespond(200, { success: true, device: dev, message: `${dev.name} screen locked and biometrics engaged.` });
  }

  // 2. Installed App Unlock & Lock
  else if (action === "unlock_app") {
    const { appId, lockCode } = params || {};
    const app = dev.installedApps?.find((a: any) => a.id === appId || a.name.toLowerCase().includes((appId || '').toLowerCase()));
    if (!app) {
      return broadcastAndRespond(404, { error: "Application not found on this device." });
    }
    if (app.isLocked) {
      if (!app.lockCode || lockCode === app.lockCode || params?.force) {
        app.isLocked = false;
        app.isRunning = true;
        app.lastOpened = Date.now();
        return broadcastAndRespond(200, { 
          success: true, 
          device: dev, 
          app, 
          message: `${app.name} unlocked with specified lock credential and loaded in foreground.` 
        });
      } else {
        return broadcastAndRespond(401, { 
          success: false, 
          error: `Invalid lock code specified for ${app.name}. Expected valid ${app.lockType || 'passcode'}.` 
        });
      }
    } else {
      app.isRunning = true;
      app.lastOpened = Date.now();
      return broadcastAndRespond(200, { success: true, device: dev, app, message: `${app.name} is already unlocked and running.` });
    }
  } else if (action === "lock_app") {
    const { appId } = params || {};
    const app = dev.installedApps?.find((a: any) => a.id === appId || a.name.toLowerCase().includes((appId || '').toLowerCase()));
    if (!app) return broadcastAndRespond(404, { error: "Application not found." });
    app.isLocked = true;
    app.isRunning = false;
    return broadcastAndRespond(200, { success: true, device: dev, app, message: `${app.name} has been locked.` });
  } else if (action === "launch_app") {
    const { appId, lockCode } = params || {};
    const app = dev.installedApps?.find((a: any) => a.id === appId || a.name.toLowerCase().includes((appId || '').toLowerCase()));
    if (!app) return broadcastAndRespond(404, { error: "Application not found." });
    if (app.isLocked) {
      if (lockCode === app.lockCode || params?.force) {
        app.isLocked = false;
        app.isRunning = true;
        app.lastOpened = Date.now();
        return broadcastAndRespond(200, { success: true, device: dev, app, message: `${app.name} unlocked and launched.` });
      } else {
        return broadcastAndRespond(403, { success: false, error: `${app.name} is locked. Specify lock passcode to unlock and launch.` });
      }
    } else {
      app.isRunning = true;
      app.lastOpened = Date.now();
      return broadcastAndRespond(200, { success: true, device: dev, app, message: `${app.name} launched.` });
    }
  } else if (action === "close_app") {
    const { appId } = params || {};
    const app = dev.installedApps?.find((a: any) => a.id === appId || a.name.toLowerCase().includes((appId || '').toLowerCase()));
    if (app) app.isRunning = false;
    return broadcastAndRespond(200, { success: true, device: dev, app, message: `${app?.name || 'App'} closed.` });
  }

  // 3. Hardware & Peripheral Functions
  else if (action === "toggle_flashlight") {
    if (!dev.features) dev.features = {};
    dev.features.flashlight = !dev.features.flashlight;
    return broadcastAndRespond(200, { 
      success: true, 
      device: dev, 
      flashlight: dev.features.flashlight,
      message: `Flashlight ${dev.features.flashlight ? 'activated at full intensity' : 'turned off'}.` 
    });
  } else if (action === "set_volume") {
    const vol = Math.max(0, Math.min(100, Number(params?.volume ?? 75)));
    if (!dev.features) dev.features = {};
    dev.features.volume = vol;
    return broadcastAndRespond(200, { success: true, device: dev, volume: vol, message: `Volume adjusted to ${vol}%.` });
  } else if (action === "set_brightness") {
    const b = Math.max(0, Math.min(100, Number(params?.brightness ?? 80)));
    if (!dev.features) dev.features = {};
    dev.features.brightness = b;
    return broadcastAndRespond(200, { success: true, device: dev, brightness: b, message: `Display brightness set to ${b}%.` });
  } else if (action === "toggle_dnd") {
    if (!dev.features) dev.features = {};
    dev.features.dnd = !dev.features.dnd;
    return broadcastAndRespond(200, { success: true, device: dev, dnd: dev.features.dnd, message: `Do Not Disturb ${dev.features.dnd ? 'enabled' : 'disabled'}.` });
  } else if (action === "ring_phone") {
    return broadcastAndRespond(200, { 
      success: true, 
      device: dev, 
      ringing: true, 
      message: `Audible locator beacon sounding at 100% volume on ${dev.name}.` 
    });
  } else if (action === "toggle_wifi") {
    if (!dev.features) dev.features = {};
    dev.features.wifi = !dev.features.wifi;
    return broadcastAndRespond(200, { success: true, device: dev, message: `Wi-Fi ${dev.features.wifi ? 'enabled' : 'disabled'}.` });
  } else if (action === "toggle_bluetooth") {
    if (!dev.features) dev.features = {};
    dev.features.bluetooth = !dev.features.bluetooth;
    return broadcastAndRespond(200, { success: true, device: dev, message: `Bluetooth ${dev.features.bluetooth ? 'enabled' : 'disabled'}.` });
  } else if (action === "toggle_battery_saver") {
    if (!dev.features) dev.features = {};
    dev.features.batterySaver = !dev.features.batterySaver;
    return broadcastAndRespond(200, { success: true, device: dev, message: `Battery saver mode ${dev.features.batterySaver ? 'active' : 'disabled'}.` });
  }

  // 4. Basic device toggles
  else if (action === "toggle_lock") {
    dev.data.isLocked = !dev.data.isLocked;
    dev.isLocked = dev.data.isLocked;
  } else if (action === "toggle_power") {
    dev.data.state = !dev.data.state;
    dev.status = dev.data.state ? "connected" : "idle";
  } else if (action === "sync") {
    dev.status = "syncing";
    setTimeout(() => {
      dev.status = "connected";
    }, 1500);
  } else if (action === "ping") {
    dev.lastPingMs = Math.floor(Math.random() * 15 + 2);
  }

  broadcastSSE("device_action", { deviceId, action, params, device: dev });
  broadcastSSE("devices_updated", { devices: connectedDevices });
  res.json({ success: true, device: dev });
});

app.post("/api/jarvis/devices/scan", (req, res) => {
  // Discovery scan
  setTimeout(() => {
    res.json({
      discovered: [
        {
          id: "dev-drone-02",
          name: "Aerial Sensor Drone Alpha",
          type: "robot_unit",
          protocol: "BLE 5.3",
          address: "BLE:FA:44:90:11",
          signalStrengthDbm: -68,
          batteryPercent: 84,
          requiredSecurityLevel: 3,
        },
        {
          id: "dev-display-02",
          name: "Holographic Workspace Canvas",
          type: "display",
          protocol: "Wi-Fi 6E",
          address: "192.168.1.192",
          signalStrengthDbm: -38,
          requiredSecurityLevel: 1,
        },
      ],
    });
  }, 800);
});

// API: Workflows
app.get("/api/jarvis/workflows", (req, res) => {
  res.json({ workflows });
});

app.post("/api/jarvis/workflows/run", (req, res) => {
  const { workflowId } = req.body;
  const wf = workflows.find((w) => w.id === workflowId);
  if (!wf) return res.status(404).json({ error: "Workflow not found" });

  wf.lastStatus = "running";
  wf.lastRunTimestamp = Date.now();
  wf.executionCount += 1;

  // Execute nodes step-by-step
  setTimeout(() => {
    wf.lastStatus = "success";
  }, 1200);

  res.json({
    success: true,
    workflow: wf,
    message: `Workflow "${wf.name}" initiated. Executing ${wf.nodes.length} subroutines.`,
  });
});

app.post("/api/jarvis/workflows/create", (req, res) => {
  const { name, description, trigger, nodes } = req.body;
  const newWf = {
    id: `wf-${Date.now()}`,
    name: name || "Custom Automation Routine",
    description: description || "User-defined autonomous pipeline",
    trigger: trigger || { type: "voice_command", config: "Trigger routine" },
    nodes: nodes || [
      { id: "n1", title: "Diagnostic Step", tool: "system_command", params: {}, securityLevel: 1 },
    ],
    enabled: true,
    executionCount: 0,
  };
  workflows.push(newWf);
  res.json({ success: true, workflow: newWf });
});

// API: Knowledge Base
app.get("/api/jarvis/knowledge", (req, res) => {
  res.json({ documents: knowledgeDocs });
});

app.post("/api/jarvis/knowledge/query", (req, res) => {
  const { query } = req.body;
  if (!query) return res.json({ results: knowledgeDocs });

  const qLower = query.toLowerCase();
  const matched = knowledgeDocs.filter(
    (d) =>
      d.title.toLowerCase().includes(qLower) ||
      d.content.toLowerCase().includes(qLower) ||
      d.tags.some((t) => t.toLowerCase().includes(qLower))
  );

  res.json({ results: matched.length > 0 ? matched : knowledgeDocs });
});

app.post("/api/jarvis/knowledge/add", (req, res) => {
  const { title, category, content, tags } = req.body;
  const newDoc = {
    id: `doc-${Date.now()}`,
    title: title || "Untitled Memory Node",
    category: category || "notes",
    content: content || "",
    indexedAt: Date.now(),
    tags: Array.isArray(tags) ? tags : ["manual_entry"],
    sizeKb: +((content?.length || 100) / 1024).toFixed(1),
  };
  knowledgeDocs.push(newDoc);
  res.json({ success: true, document: newDoc });
});

// Helper for local reasoning & multi-step execution across user devices and applications
function executeJarvisDeviceFunction(prompt: string) {
  const p = prompt.toLowerCase();
  const phone = connectedDevices.find((d) => d.id === "dev-phone-01" || d.type === "phone");
  const laptop = connectedDevices.find((d) => d.id === "dev-laptop-01" || d.type === "laptop");
  const deadbolt = connectedDevices.find((d) => d.id === "dev-lock-01" || d.type === "smart_lock");

  // Extract lock code if specified: e.g. "pin 4892", "code ALPHA9", "passcode 7701", "pin: 1234", "password stark"
  // Use word boundary \b to prevent "unlock" matching as "lock"
  const pinMatch = prompt.match(/\b(?:pin|passcode|password|code|key)\s*(?:is|:)?\s*([a-zA-Z0-9_-]+)/i) ||
                   prompt.match(/\block\s*(?:code|pin)?\s*(?:is|:)?\s*([a-zA-Z0-9_-]+)/i);
  // Also check for standalone 4-6 digit sequence if not matched above
  const numberMatch = prompt.match(/\b(\d{4,6})\b/);
  const rawMatch = pinMatch ? pinMatch[1] : (numberMatch ? numberMatch[1] : null);
  const stopWords = new Set(["my", "the", "a", "an", "all", "phone", "pixel", "device", "app", "screen", "is", "for"]);
  const specifiedLock = rawMatch && !stopWords.has(rawMatch.toLowerCase()) ? rawMatch : (numberMatch ? numberMatch[1] : null);

  // 1. UNLOCKING PHONE OR MOBILE DEVICE
  const isPhoneUnlock = (p.includes("unlock") || p.includes("open")) && 
                        (p.includes("phone") || p.includes("pixel") || p.includes("mobile") || p.includes("handset") || p.includes("device"));
  
  if (isPhoneUnlock && phone) {
    if (specifiedLock) {
      const isMatch = specifiedLock.toLowerCase() === (phone.lockCode || "").toLowerCase() || specifiedLock === "4892";
      if (isMatch) {
        // Unlock phone
        phone.isLocked = false;
        phone.data.isLocked = false;
        if (phone.features) {
          phone.features.screenUnlocked = true;
        }

        // If user also requested to open an app (e.g. "unlock phone with pin 4892 and open camera")
        let secondaryAction = "";
        if (p.includes("camera")) {
          const cam = phone.installedApps?.find((a: any) => a.id === "app-camera");
          if (cam) cam.isRunning = true;
          secondaryAction = " and launched Pro HDR Camera";
        } else if (p.includes("map")) {
          const map = phone.installedApps?.find((a: any) => a.id === "app-maps");
          if (map) map.isRunning = true;
          secondaryAction = " and loaded Satellite Navigation";
        }

        return {
          intent: `Unlock Mobile Device (${phone.name}) with Specified PIN`,
          confidence: 0.99,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Validate Specified Security PIN [${specifiedLock.replace(/./g, '•')}]`,
              tool: "device_control",
              parameters: { deviceId: phone.id, action: "validate_lock", lockCode: specifiedLock },
              status: "completed",
              requiredSecurityLevel: 1,
              output: `Cryptographic challenge passed. PIN hash verified in Secure Enclave.`,
            },
            {
              id: `task-${Date.now()}-2`,
              step: 2,
              title: `Disengage Screen Guard & Unlock ${phone.name}`,
              tool: "device_control",
              parameters: { deviceId: phone.id, action: "unlock_device", lockCode: specifiedLock },
              status: "completed",
              requiredSecurityLevel: 1,
              output: `Screen unlocked. Ambient display transitioned to active Home Screen.`,
            },
            {
              id: `task-${Date.now()}-3`,
              step: 3,
              title: `Synchronize Device Telemetry to Central Mesh`,
              tool: "network_scan",
              parameters: { deviceId: phone.id },
              status: "completed",
              requiredSecurityLevel: 0,
              output: `Mesh node status updated: UNLOCKED / ACTIVE.`,
            },
          ],
          reply: `I have verified your specified passcode [${specifiedLock}] and unlocked your ${phone.name}${secondaryAction}, sir. All device functions and applications are at your disposal.`,
        };
      } else {
        // Specified code does not match
        return {
          intent: `Unlock Mobile Device (${phone.name}) — Security Mismatch`,
          confidence: 0.95,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Validate Specified Security PIN [${specifiedLock}]`,
              tool: "device_control",
              parameters: { deviceId: phone.id, action: "validate_lock", lockCode: specifiedLock },
              status: "failed",
              requiredSecurityLevel: 2,
              output: `Authentication failure: specified lock code does not match device secure enclave PIN.`,
            },
          ],
          reply: `Access denied, sir. The security PIN you specified (${specifiedLock}) does not match the registered credential for ${phone.name}. Screen lock remains engaged to preserve device privacy.`,
        };
      }
    } else {
      // User asked to unlock phone, but did NOT specify the lock
      return {
        intent: `Unlock Mobile Device (${phone.name}) — PIN Authorization Required`,
        confidence: 0.94,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            step: 1,
            title: `Challenge Device Security Barrier`,
            tool: "device_control",
            parameters: { deviceId: phone.id, action: "unlock_device" },
            status: "requires_authorization",
            requiredSecurityLevel: 2,
            output: `Device is locked by PIN. Awaiting specified lock passcode or biometric token from operator.`,
          },
        ],
        reply: `Sir, your ${phone.name} is protected by a security PIN. Please specify the lock PIN (or authorize via biometric clearance) so I may execute the unlock sequence for you.`,
      };
    }
  }

  // 2. UNLOCKING SPECIFIC APPS ON USER'S DEVICE
  const isAppUnlock = (p.includes("unlock") || p.includes("launch") || p.includes("open")) && 
                      (p.includes("app") || p.includes("signal") || p.includes("bank") || p.includes("photos") || p.includes("notes") || p.includes("1password") || p.includes("health") || p.includes("vault"));
  
  if (isAppUnlock && (phone || laptop)) {
    // Find target app
    const allApps = [...(phone?.installedApps || []), ...(laptop?.installedApps || [])];
    let targetApp: any = null;
    let targetDev = phone;

    if (p.includes("signal")) {
      targetApp = allApps.find((a) => a.id === "app-signal");
      targetDev = phone;
    } else if (p.includes("bank") || p.includes("stark financial")) {
      targetApp = allApps.find((a) => a.id === "app-banking");
      targetDev = phone;
    } else if (p.includes("photo") || p.includes("gallery")) {
      targetApp = allApps.find((a) => a.id === "app-photos");
      targetDev = phone;
    } else if (p.includes("note") || p.includes("keychain")) {
      targetApp = allApps.find((a) => a.id === "app-notes");
      targetDev = phone;
    } else if (p.includes("1password") || p.includes("pwd") || p.includes("password vault")) {
      targetApp = allApps.find((a) => a.id === "app-mac-pwd");
      targetDev = laptop;
    } else if (p.includes("health") || p.includes("biometric")) {
      targetApp = allApps.find((a) => a.id === "app-health");
      targetDev = phone;
    } else {
      // General app
      targetApp = allApps.find((a) => p.includes(a.name.toLowerCase()));
    }

    if (targetApp) {
      if (!targetApp.isLocked) {
        targetApp.isRunning = true;
        targetApp.lastOpened = Date.now();
        return {
          intent: `Launch Application (${targetApp.name})`,
          confidence: 0.98,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Launch ${targetApp.name}`,
              tool: "device_control",
              parameters: { deviceId: targetDev?.id, appId: targetApp.id, action: "launch_app" },
              status: "completed",
              requiredSecurityLevel: 1,
              output: `${targetApp.name} is running in foreground.`,
            },
          ],
          reply: `${targetApp.name} is already unlocked and is now running in the foreground on your ${targetDev?.name}, sir.`,
        };
      }

      // App is locked — check if user specified the lock
      if (specifiedLock) {
        const isMatch = specifiedLock.toLowerCase() === (targetApp.lockCode || "").toLowerCase() || specifiedLock.toUpperCase() === (targetApp.lockCode || "").toUpperCase();
        if (isMatch) {
          targetApp.isLocked = false;
          targetApp.isRunning = true;
          targetApp.lastOpened = Date.now();
          if (targetDev && targetDev.isLocked) {
            // Also unlock the phone screen if opening an app
            targetDev.isLocked = false;
            targetDev.data.isLocked = false;
          }

          return {
            intent: `Unlock & Launch Application (${targetApp.name}) with Specified Passcode`,
            confidence: 0.99,
            tasks: [
              {
                id: `task-${Date.now()}-1`,
                step: 1,
                title: `Authenticate App Sandbox Security Lock [${specifiedLock.replace(/./g, '•')}]`,
                tool: "device_control",
                parameters: { deviceId: targetDev?.id, appId: targetApp.id, action: "unlock_app", lockCode: specifiedLock },
                status: "completed",
                requiredSecurityLevel: 2,
                output: `Application cryptographic container unlocked with specified code.`,
              },
              {
                id: `task-${Date.now()}-2`,
                step: 2,
                title: `Launch ${targetApp.name} on ${targetDev?.name}`,
                tool: "device_control",
                parameters: { deviceId: targetDev?.id, appId: targetApp.id, action: "launch_app" },
                status: "completed",
                requiredSecurityLevel: 1,
                output: `Process dispatched. UI rendered to mobile viewport.`,
              },
            ],
            reply: `Credential [${specifiedLock}] validated, sir. ${targetApp.name} has been unlocked and launched onto your ${targetDev?.name}.`,
          };
        } else {
          return {
            intent: `Unlock Application (${targetApp.name}) — Mismatch`,
            confidence: 0.95,
            tasks: [
              {
                id: `task-${Date.now()}-1`,
                step: 1,
                title: `Validate Lock Credential for ${targetApp.name}`,
                tool: "device_control",
                parameters: { deviceId: targetDev?.id, appId: targetApp.id, lockCode: specifiedLock },
                status: "failed",
                requiredSecurityLevel: 2,
                output: `Specified lock code does not match application secure container.`,
              },
            ],
            reply: `Access denied, sir. The lock code you specified (${specifiedLock}) is invalid for ${targetApp.name}. The application remains encrypted.`,
          };
        }
      } else {
        // App is locked, no code specified
        return {
          intent: `Unlock Application (${targetApp.name}) — Code Required`,
          confidence: 0.92,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Challenge App Security Layer (${targetApp.name})`,
              tool: "device_control",
              parameters: { deviceId: targetDev?.id, appId: targetApp.id },
              status: "requires_authorization",
              requiredSecurityLevel: 2,
              output: `Application requires explicit lock passcode (Format: ${targetApp.lockType || 'PIN'}).`,
            },
          ],
          reply: `${targetApp.name} is protected by an application lock (${targetApp.lockType || 'passcode'}). Please specify the lock code (e.g. ${targetApp.lockCode ? `code: ${targetApp.lockCode}` : 'PIN'}) to unlock it, sir.`,
        };
      }
    }
  }

  // 3. HARDWARE & PERIPHERAL FUNCTIONS ACROSS DEVICES
  // A. Ring / Locate Phone
  if (p.includes("ring") || p.includes("find my phone") || p.includes("locate phone") || p.includes("beep phone") || p.includes("sound alert")) {
    return {
      intent: "Locate & Ring Mobile Unit",
      confidence: 0.99,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: "Override Silent Profile & Route to Device Speakers",
          tool: "device_control",
          parameters: { deviceId: "dev-phone-01", action: "ring_phone" },
          status: "completed",
          requiredSecurityLevel: 1,
          output: "Hardware buzzer triggered at 100% audio gain.",
        },
      ],
      reply: "Audible locator beacon activated, sir. Your Pixel 9 Pro is now sounding at maximum volume.",
    };
  }

  // B. Flashlight
  if (p.includes("flashlight") || p.includes("torch")) {
    const turnOn = !p.includes("off") && (p.includes("on") || p.includes("turn") || p.includes("enable") || p.includes("activate"));
    if (phone && phone.features) {
      phone.features.flashlight = turnOn;
    }
    return {
      intent: `Toggle Flashlight on Mobile Unit (${turnOn ? "ON" : "OFF"})`,
      confidence: 0.98,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: `Set Flashlight State: ${turnOn ? "ENABLED" : "DISABLED"}`,
          tool: "device_control",
          parameters: { deviceId: "dev-phone-01", action: "toggle_flashlight", state: turnOn },
          status: "completed",
          requiredSecurityLevel: 1,
          output: `Rear LED strobe set to ${turnOn ? "Active (High Lumen)" : "Inactive"}.`,
        },
      ],
      reply: turnOn 
        ? "Flashlight module engaged on your Pixel 9 Pro at maximum lumen output, sir."
        : "Flashlight deactivated on Pixel 9 Pro, sir.",
    };
  }

  // C. Volume Control
  if (p.includes("volume") || p.includes("mute") || p.includes("sound")) {
    let targetVol = 75;
    const volMatch = p.match(/(\d{1,3})\s*%/);
    if (volMatch) {
      targetVol = Math.max(0, Math.min(100, parseInt(volMatch[1], 10)));
    } else if (p.includes("mute") || p.includes("silent") || p.includes("zero")) {
      targetVol = 0;
    } else if (p.includes("max") || p.includes("full") || p.includes("100")) {
      targetVol = 100;
    }
    if (phone && phone.features) phone.features.volume = targetVol;

    return {
      intent: `Adjust Device Audio Volume (${targetVol}%)`,
      confidence: 0.96,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: `Calibrate Audio Output to ${targetVol}%`,
          tool: "device_control",
          parameters: { deviceId: "dev-phone-01", action: "set_volume", volume: targetVol },
          status: "completed",
          requiredSecurityLevel: 1,
          output: `DAC output gain calibrated to ${targetVol}%.`,
        },
      ],
      reply: `Device volume on your Pixel 9 Pro has been adjusted to ${targetVol}%, sir.`,
    };
  }

  // D. Brightness Control
  if (p.includes("brightness") || p.includes("dim screen") || p.includes("display")) {
    let targetBright = 85;
    const bMatch = p.match(/(\d{1,3})\s*%/);
    if (bMatch) {
      targetBright = Math.max(0, Math.min(100, parseInt(bMatch[1], 10)));
    } else if (p.includes("dim") || p.includes("low")) {
      targetBright = 25;
    } else if (p.includes("max") || p.includes("high") || p.includes("100")) {
      targetBright = 100;
    }
    if (phone && phone.features) phone.features.brightness = targetBright;

    return {
      intent: `Set Display Brightness (${targetBright}%)`,
      confidence: 0.95,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: `Adjust OLED Panel Brightness to ${targetBright}%`,
          tool: "device_control",
          parameters: { deviceId: "dev-phone-01", action: "set_brightness", brightness: targetBright },
          status: "completed",
          requiredSecurityLevel: 1,
          output: `Luminance adjusted to ${targetBright}%.`,
        },
      ],
      reply: `Pixel 9 Pro display brightness calibrated to ${targetBright}%, sir.`,
    };
  }

  // D2. Unlocking Smart Deadbolt or Bluetooth Lock
  const isDeadboltUnlock = (p.includes("unlock") || p.includes("disengage") || p.includes("open")) && 
                           (p.includes("deadbolt") || p.includes("door") || p.includes("smart lock") || p.includes("perimeter") || p.includes("gate"));
  if (isDeadboltUnlock && deadbolt) {
    if (specifiedLock) {
      const authorizedPin = deadbolt.lockCode || "0451";
      if (specifiedLock === authorizedPin || specifiedLock === "0451") {
        deadbolt.isLocked = false;
        deadbolt.data.isLocked = false;
        deadbolt.data.state = true;
        if (deadbolt.features) deadbolt.features.screenUnlocked = true;
        broadcastSSE("devices_updated", { devices: connectedDevices });
        return {
          intent: `Unlock Smart Deadbolt (${deadbolt.name}) with Authorized PIN`,
          confidence: 0.99,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Disengage Physical Deadbolt Servo [PIN: ${specifiedLock}]`,
              tool: "device_control",
              parameters: { deviceId: deadbolt.id, action: "unlock_device", lockCode: specifiedLock },
              status: "completed",
              requiredSecurityLevel: 2,
              output: `Electromechanical lock disengaged. Perimeter entry authorized.`,
            },
          ],
          reply: `PIN [${specifiedLock}] verified, sir. ${deadbolt.name} has been unlocked and the mechanical deadbolt is retracted.`,
        };
      } else {
        return {
          intent: `Unlock Smart Deadbolt (${deadbolt.name}) — PIN Mismatch`,
          confidence: 0.95,
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              step: 1,
              title: `Challenge Deadbolt Security Enclave`,
              tool: "device_control",
              parameters: { deviceId: deadbolt.id, lockCode: specifiedLock },
              status: "failed",
              requiredSecurityLevel: 2,
              output: `Authentication failure: specified PIN does not match deadbolt security code.`,
            },
          ],
          reply: `Access denied, sir. The PIN you entered (${specifiedLock}) does not match the security key for ${deadbolt.name}. Perimeter deadbolt remains sealed.`,
        };
      }
    } else {
      return {
        intent: `Unlock Smart Deadbolt (${deadbolt.name}) — PIN Required`,
        confidence: 0.93,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            step: 1,
            title: `Challenge Smart Deadbolt Access Enclave`,
            tool: "device_control",
            parameters: { deviceId: deadbolt.id, action: "unlock_device" },
            status: "requires_authorization",
            requiredSecurityLevel: 2,
            output: `Deadbolt requires authorized PIN (Default: ${deadbolt.lockCode || '0451'}).`,
          },
        ],
        reply: `Sir, the ${deadbolt.name} is sealed. Please provide the authorized 4-digit PIN (${deadbolt.lockCode || '0451'}) to retract the physical deadbolt.`,
      };
    }
  }

  // E. Lock Device / Lock All Devices
  if ((p.includes("lock") || p.includes("secure")) && (p.includes("phone") || p.includes("device") || p.includes("app") || p.includes("all"))) {
    if (phone) {
      phone.isLocked = true;
      phone.data.isLocked = true;
      phone.installedApps?.forEach((a: any) => {
        if (a.lockCode) a.isLocked = true;
        a.isRunning = false;
      });
    }
    if (deadbolt) {
      deadbolt.isLocked = true;
      deadbolt.data.isLocked = true;
    }

    return {
      intent: "Secure All Devices, Smart Deadbolts & Enclaves",
      confidence: 0.99,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: "Engage Mobile Screen Lock & Lock Encrypted Apps",
          tool: "device_control",
          parameters: { deviceId: "dev-phone-01", action: "lock_device" },
          status: "completed",
          requiredSecurityLevel: 1,
          output: "Phone locked. Background processes sandboxed.",
        },
        {
          id: `task-${Date.now()}-2`,
          step: 2,
          title: "Engage Smart Deadbolt BLE Latch",
          tool: "device_control",
          parameters: { deviceId: "dev-lock-01", action: "toggle_lock" },
          status: "completed",
          requiredSecurityLevel: 2,
          output: "Smart deadbolt locked.",
        },
      ],
      reply: "All mobile devices, secure applications, and physical deadbolts have been locked and sealed, sir.",
    };
  }

  return null;
}

// Helper for local mock reasoning when Gemini is not configured or in Local Mode
function generateLocalJarvisPlan(prompt: string) {
  // First check device-specific functions and unlocks
  const deviceFuncPlan = executeJarvisDeviceFunction(prompt);
  if (deviceFuncPlan) {
    return deviceFuncPlan;
  }

  const p = prompt.toLowerCase();

  // Task generation matching intent
  if (p.includes("lockdown") || p.includes("security") || p.includes("lock")) {
    return {
      intent: "Facility Security & Device Lockdown",
      confidence: 0.98,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: "Audit Perimeter Lock State",
          tool: "device_control",
          parameters: { deviceId: "dev-lock-01", action: "check_state" },
          status: "completed",
          requiredSecurityLevel: 1,
          output: "Smart deadbolt engaged. Perimeter sealed.",
        },
        {
          id: `task-${Date.now()}-2`,
          step: 2,
          title: "Engage Zero-Trust Node Isolation",
          tool: "system_command",
          parameters: { command: "isolate_network_ports", profile: "strict" },
          status: "completed",
          requiredSecurityLevel: 2,
          output: "Ports filtered to verified MAC addresses.",
        },
        {
          id: `task-${Date.now()}-3`,
          step: 3,
          title: "Deploy Autonomous Rover Surveillance",
          tool: "device_control",
          parameters: { deviceId: "dev-robot-01", action: "patrol" },
          status: "requires_authorization",
          requiredSecurityLevel: 3,
          output: "Awaiting Level 3 Biometric Confirmation for physical rover actuation.",
        },
      ],
      reply:
        "Security protocols engaged, sir. Perimeter smart deadbolt is locked, network ports are filtered, and Rover Unit-X is primed awaiting your Level 3 biometric authorization to deploy.",
    };
  }

  if (p.includes("sync") || p.includes("backup") || p.includes("file")) {
    return {
      intent: "Cross-Device File Synchronization & Integrity Hash",
      confidence: 0.95,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: "Scan Local Knowledge & Codebase Diff",
          tool: "file_system",
          parameters: { directory: "/workspace/core", checksum: "SHA-256" },
          status: "completed",
          requiredSecurityLevel: 1,
          output: "Identified 4 modified files (2.4 MB diff).",
        },
        {
          id: `task-${Date.now()}-2`,
          step: 2,
          title: "Transmit Encrypted Delta to Neural Rig",
          tool: "device_control",
          parameters: { targetDevice: "dev-server-01", protocol: "Local Bus" },
          status: "completed",
          requiredSecurityLevel: 2,
          output: "Sync completed with 0 errors in 184ms.",
        },
      ],
      reply:
        "File synchronization complete, sir. 4 modified files have been verified and mirrored to your Neural Rig storage matrix.",
    };
  }

  if (p.includes("device") || p.includes("status") || p.includes("diagnostic") || p.includes("system")) {
    return {
      intent: "Comprehensive Diagnostic Sweep",
      confidence: 0.99,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          step: 1,
          title: "Ping Mesh Endpoints (Wi-Fi 6E / BLE / Zigbee)",
          tool: "network_scan",
          parameters: { nodes: 6 },
          status: "completed",
          requiredSecurityLevel: 0,
          output: "All 6 registered nodes responding. Average latency: 9.4ms.",
        },
        {
          id: `task-${Date.now()}-2`,
          step: 2,
          title: "Inspect NPU Neural Inference Pipeline",
          tool: "system_command",
          parameters: { metric: "load_vram_thermal" },
          status: "completed",
          requiredSecurityLevel: 1,
          output: "VRAM: 18.4/24 GB allocated. Thermal: 44°C stable. Inference rate: 68 tokens/sec.",
        },
      ],
      reply:
        "All systems operating at peak nominal capacity. All 6 mesh nodes are synchronized with sub-10ms latency, and local neural weights are ready for command execution.",
    };
  }

  // General task breakdown
  return {
    intent: "Natural Language Command Execution",
    confidence: 0.92,
    tasks: [
      {
        id: `task-${Date.now()}-1`,
        step: 1,
        title: "Deconstruct Context & Query Local Memory",
        tool: "knowledge_retrieval",
        parameters: { query: prompt },
        status: "completed",
        requiredSecurityLevel: 0,
        output: "Synthesized context from user memory bank.",
      },
      {
        id: `task-${Date.now()}-2`,
        step: 2,
        title: "Dispatch Action Subroutine",
        tool: "system_command",
        parameters: { instruction: prompt },
        status: "completed",
        requiredSecurityLevel: 1,
        output: "Subroutine executed successfully.",
      },
    ],
    reply: `I have analyzed your directive regarding "${prompt}". The task sequence has been planned, validated against your local security clearance, and executed across the device network.`,
  };
}

// API: Main JARVIS Chat & Command Planning Endpoint
app.post("/api/jarvis/chat", async (req, res) => {
  const { prompt, mode = "hybrid_gemini", chatHistory = [] } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = getGenAI();

  // If Gemini API is available and mode is hybrid_gemini or local needs smart reasoning
  if (ai && (mode === "hybrid_gemini" || mode === "local_14b")) {
    try {
      const systemInstruction = `You are JARVIS (Just A Rather Very Intelligent System), a locally hosted, sovereign personal autonomous intelligence OS and centralized intelligence layer for the user's computing devices and physical lab.
You speak with professional, articulate, calm poise—loyal, precise, proactive, and technically supreme (like the iconic Jarvis).
You understand natural language, maintain conversational context, plan multi-step tasks across devices (MacBook Pro, Neural Rig, Pixel 9 Pro Mobile Unit, BLE Smart Locks, Climate Hubs, Rover Units, File systems), and verify security clearances.

CONNECTED DEVICES & APPS:
- "Pixel 9 Pro Mobile Unit" (phone, id: "dev-phone-01"): Screen is secured by 4-digit PIN [4892]. Features: Volume, Brightness, Flashlight, Ring Phone, Wi-Fi, Bluetooth, DND, Battery Saver.
  Installed Apps:
  - "Signal Encrypted Messenger" (app-signal): LOCKED by PIN [7701].
  - "Stark Financial & Vault" (app-banking): LOCKED by passcode [ALPHA9].
  - "Private Vault & Gallery" (app-photos): LOCKED by PIN [1234].
  - "Encrypted Notes Vault" (app-notes): LOCKED by password [stark].
  - "Neural Health & Biometrics" (app-health): LOCKED by PIN [9900].
  - "Pro HDR Camera" (app-camera): Unlocked.
  - "Satellite GPS Navigation" (app-maps): Unlocked.
  - "Termux Dev Shell" (app-terminal): Unlocked.
  - "OS Settings & Security Enclave" (app-settings): Unlocked.
- "MacBook Pro M3 Max" (laptop, id: "dev-laptop-01"): Password [stark2026]. Apps: Terminal, VS Code, 1Password [vault42], Chromium.
- "Front Access Smart Deadbolt" (smart_lock, id: "dev-lock-01"): PIN [0451].

FULL DEVICE CAPABILITY & LOCK RULES:
You have complete authorization to perform ANY function across the user's devices:
1. UNLOCKING PHONES & APPS:
   - If the user specifies the lock code/PIN (e.g. "unlock my phone with pin 4892", "unlock signal with code 7701", "unlock stark banking with ALPHA9"):
     - Validate the specified lock against the registered device/app lock.
     - If it matches: emit a task with tool 'device_control' (action: 'unlock_device' or 'unlock_app') with status 'completed', and confirm in your reply that the device or app has been unlocked and made ready.
     - If the user specifies an incorrect lock: emit a task with status 'failed', and reply that the specified credential was rejected by the device enclave.
     - If the user asks to unlock without specifying the lock code/PIN: emit a task with status 'requires_authorization' and politely prompt the user to specify the security lock passcode or provide biometric authorization.
2. OTHER DEVICE FUNCTIONS:
   - Locating/ringing phones ("ring my phone", "find my phone")
   - Toggling flashlight / torch
   - Adjusting volume (0-100%) or muting
   - Adjusting display brightness (0-100%)
   - Launching or closing any application
   - Securing/locking phones and applications
   - System diagnostics and mesh synchronization

Security Levels:
- Level 0: Read-only info / queries
- Level 1: Standard state change (flashlight, volume, pings, launch unlocked app, verified pin unlock)
- Level 2: Sensitive action (door lock/unlock, encrypted app unlock, camera)
- Level 3: Critical (system reboot, rover actuation, facility lockdown)

When the user asks you something or gives a command, you MUST formulate a JSON response matching the following schema:
- intent: short summary of the user's goal
- confidence: number between 0.8 and 1.0
- tasks: array of multi-step execution tasks to satisfy the request. Each task has:
    - id: string
    - step: integer (1, 2, 3...)
    - title: short step description
    - tool: one of ['device_control', 'file_system', 'system_command', 'knowledge_retrieval', 'vision_analyze', 'network_scan', 'automation_trigger']
    - parameters: object with relevant parameters
    - status: 'completed' | 'requires_authorization' | 'failed'
    - requiredSecurityLevel: 0 | 1 | 2 | 3
    - output: brief result of the step
- reply: Jarvis's spoken conversational response to the user. Keep it natural, polite, respectful, and concise (addressing the user as "sir" or by title when natural, without being repetitive).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          ...chatHistory.slice(-4).map((m: any) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    step: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    tool: { type: Type.STRING },
                    parameters: { type: Type.OBJECT },
                    status: { type: Type.STRING },
                    requiredSecurityLevel: { type: Type.INTEGER },
                    output: { type: Type.STRING },
                  },
                  required: ["step", "title", "tool", "status", "requiredSecurityLevel"],
                },
              },
              reply: { type: Type.STRING },
            },
            required: ["intent", "confidence", "tasks", "reply"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      // Also execute any device mutations directly into connectedDevices state
      executeJarvisDeviceFunction(prompt);

      return res.json({
        success: true,
        source: "gemini-3.7-flash",
        plan: {
          id: `plan-${Date.now()}`,
          userPrompt: prompt,
          intent: parsed.intent || "Autonomous Execution",
          confidence: parsed.confidence || 0.96,
          tasks: (parsed.tasks || []).map((t: any, idx: number) => ({
            ...t,
            id: t.id || `task-${Date.now()}-${idx + 1}`,
          })),
          status: "completed",
          createdAt: Date.now(),
        },
        reply: parsed.reply || "Directive executed, sir.",
      });
    } catch (err: any) {
      console.warn("Gemini call failed or timed out, falling back to local core:", err.message);
    }
  }

  // Fallback to local intelligence model emulation
  const localPlan = generateLocalJarvisPlan(prompt);
  return res.json({
    success: true,
    source: "local-neural-core",
    plan: {
      id: `plan-${Date.now()}`,
      userPrompt: prompt,
      intent: localPlan.intent,
      confidence: localPlan.confidence,
      tasks: localPlan.tasks,
      status: "completed",
      createdAt: Date.now(),
    },
    reply: localPlan.reply,
  });
});

// API: Computer Vision & Optical Analysis
app.post("/api/jarvis/vision-analyze", async (req, res) => {
  const { imageBase64, mode = "standard" } = req.body;
  const ai = getGenAI();

  if (ai && imageBase64) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      };

      const prompt = `Analyze this live laboratory/room camera frame from the perspective of the JARVIS OS Optical System.
Detect objects, humans, devices, and any physical anomalies.
Return a JSON object matching this schema:
- summary: one-sentence description of the visual scene
- detections: array of detected entities with:
    - label: string (e.g. 'Primary Operator', 'Workstation Display', 'Hardware PCB', 'Smartphone')
    - confidence: number (0.5 to 0.99)
    - bbox: [ymin, xmin, ymax, xmax] in percentages 0-100
    - category: 'person' | 'device' | 'object' | 'hazard' | 'text'
- environmentalAnomalies: array of strings (e.g. 'Low ambient light', 'Unidentified BLE beacon in range', 'Thermal hotspot')
- recommendedActions: array of strings (e.g. 'Increase laboratory lumen output', 'Activate workspace lock')`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              detections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    bbox: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                    },
                    category: { type: Type.STRING },
                  },
                  required: ["label", "confidence", "bbox", "category"],
                },
              },
              environmentalAnomalies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["summary", "detections", "environmentalAnomalies", "recommendedActions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        success: true,
        source: "gemini-3.7-flash-vision",
        result: {
          summary: parsed.summary || "Optical frame processed with zero perimeter violations.",
          detections: parsed.detections || [],
          environmentalAnomalies: parsed.environmentalAnomalies || [],
          recommendedActions: parsed.recommendedActions || [],
          timestamp: Date.now(),
        },
      });
    } catch (err: any) {
      console.warn("Vision API error, using optical simulator:", err.message);
    }
  }

  // Simulated Optical Vision Core
  return res.json({
    success: true,
    source: "local-optical-engine",
    result: {
      summary: "Operator detected in primary workspace. Hardware and terminal displays nominal.",
      detections: [
        { label: "Primary Operator", confidence: 0.97, bbox: [15, 25, 80, 65], category: "person" },
        { label: "Neural Workstation", confidence: 0.94, bbox: [40, 10, 85, 45], category: "device" },
        { label: "Mobile Communication Device", confidence: 0.89, bbox: [65, 60, 88, 75], category: "device" },
      ],
      environmentalAnomalies: ["Ambient lux at 340 lm (Optimal)", "0 thermal anomalies detected"],
      recommendedActions: ["Maintain active eye-comfort display profile", "Device mesh tethered via BLE"],
      timestamp: Date.now(),
    },
  });
});

// API: Tool Execution & Task Dispatcher
app.post("/api/jarvis/execute-task", (req, res) => {
  const { tool, parameters, securityLevel = 0 } = req.body;

  let resultOutput = "";
  let success = true;

  switch (tool) {
    case "device_control": {
      const dev = connectedDevices.find((d) => d.id === parameters?.deviceId);
      if (dev && parameters?.action === "unlock_device") {
        dev.isLocked = false;
        dev.data.isLocked = false;
        if (dev.features) dev.features.screenUnlocked = true;
        resultOutput = `${dev.name} screen and biometric lock successfully unlocked.`;
      } else if (dev && parameters?.action === "unlock_app") {
        const app = dev.installedApps?.find((a: any) => a.id === parameters?.appId);
        if (app) {
          app.isLocked = false;
          app.isRunning = true;
          resultOutput = `${app.name} unlocked and launched on ${dev.name}.`;
        } else {
          resultOutput = `Application unlocked on ${dev.name}.`;
        }
      } else {
        resultOutput = `Command dispatched to device ${dev?.name || parameters?.deviceId || "target"}. State synchronized.`;
      }
      break;
    }
    case "file_system":
      resultOutput = `Local file system operation [${parameters.action || "read"}] executed with SHA-256 integrity seal.`;
      break;
    case "system_command":
      resultOutput = `Sandboxed system routine finished with exit code 0. Execution time: 24ms.`;
      break;
    case "knowledge_retrieval":
      resultOutput = `Retrieved 3 indexed memory chunks from local vector store.`;
      break;
    case "network_scan":
      resultOutput = `Mesh network scan complete: 6 active nodes verified.`;
      break;
    case "automation_trigger":
      resultOutput = `Autonomous workflow triggered and scheduled.`;
      break;
    default:
      resultOutput = `Tool [${tool}] executed successfully.`;
  }

  res.json({
    success,
    tool,
    output: resultOutput,
    timestamp: Date.now(),
  });
});

// Vite middleware in dev / Static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JARVIS Autonomous Intelligence Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
