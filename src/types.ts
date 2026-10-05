export type IntelligenceMode = 'local_8b' | 'local_14b' | 'hybrid_gemini';

export type SecurityLevel = 0 | 1 | 2 | 3; // 0: Read, 1: Standard, 2: Sensitive, 3: Critical

export interface SystemStatus {
  online: boolean;
  modelMode: IntelligenceMode;
  uptimeSeconds: number;
  cpuLoad: number;
  npuLoad: number;
  vramUsedGb: number;
  vramTotalGb: number;
  temperatureC: number;
  tokensPerSec: number;
  contextWindowTokens: number;
  maxContextTokens: number;
  activeAgents: number;
  securityEnforced: boolean;
}

export interface InstalledApp {
  id: string;
  name: string;
  category: string;
  icon?: string;
  isLocked: boolean;
  lockType?: 'pin' | 'password' | 'biometric';
  lockCode?: string; // The authorized PIN/passcode required to unlock if locked
  isRunning: boolean;
  lastOpened?: number;
}

export interface PhoneCallState {
  isActive: boolean;
  contactName: string;
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  timestamp: number;
}

export interface PhoneMessage {
  id: string;
  app: 'signal' | 'whatsapp' | 'telegram' | 'sms';
  sender: string;
  recipient: string;
  phoneNumber?: string;
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface JarvisContact {
  id: string;
  name: string;
  phoneNumber: string; // E.164 international format e.g. +12125550144
  role?: string;
  isFavorite?: boolean;
}

export interface DeviceFeatures {
  volume?: number; // 0 - 100
  brightness?: number; // 0 - 100
  flashlight?: boolean;
  dnd?: boolean; // Do not disturb
  wifi?: boolean;
  bluetooth?: boolean;
  hotspot?: boolean;
  batterySaver?: boolean;
  ringerMode?: 'normal' | 'silent' | 'vibrate';
  cameraActive?: boolean;
  screenUnlocked?: boolean;
  activeCall?: PhoneCallState | null;
  recentMessages?: PhoneMessage[];
}

export interface MobilePairingSession {
  pairingCode: string;
  qrDataUrl?: string;
  directUrl: string;
  isPaired: boolean;
  pairedDeviceName?: string;
  pairedDeviceId?: string;
  connectedAt?: number;
  lastHeartbeat?: number;
}

export interface RealBluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryPercent?: number;
  services?: string[];
  pairedAt: number;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'laptop' | 'server' | 'phone' | 'smart_lock' | 'sensor_hub' | 'display' | 'robot_unit' | 'audio_node';
  protocol: 'Wi-Fi 6E' | 'BLE 5.3' | 'Zigbee' | 'Local Bus' | 'Wi-Fi (Real Mobile Link)' | 'BLE (Web Bluetooth)';
  address: string;
  status: 'connected' | 'syncing' | 'idle' | 'warning' | 'offline';
  batteryPercent?: number;
  signalStrengthDbm: number;
  requiredSecurityLevel: SecurityLevel;
  lastPingMs: number;
  isLocked?: boolean;
  lockType?: 'pin' | 'password' | 'pattern' | 'biometric';
  lockCode?: string; // Valid lock PIN or passcode
  installedApps?: InstalledApp[];
  features?: DeviceFeatures;
  isRealDevice?: boolean;
  isHostDevice?: boolean;
  hostPlatform?: string;
  realSessionId?: string;
  pairedAt?: number;
  data: {
    state?: boolean;
    value?: string | number;
    unit?: string;
    metrics?: Record<string, string | number>;
    isLocked?: boolean;
  };
}

export interface ExecutionTask {
  id: string;
  step: number;
  title: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'requires_authorization';
  requiredSecurityLevel: SecurityLevel;
  output?: string;
  error?: string;
  durationMs?: number;
}

export interface ExecutionPlan {
  id: string;
  userPrompt: string;
  intent: string;
  confidence: number;
  tasks: ExecutionTask[];
  status: 'planning' | 'executing' | 'completed' | 'paused_auth' | 'failed';
  summary?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: number;
  planId?: string;
  audioAvailable?: boolean;
  toolInvocations?: Array<{
    tool: string;
    params: any;
    result: any;
    status: 'success' | 'error' | 'denied';
  }>;
  securityPrompt?: {
    action: string;
    level: SecurityLevel;
    pendingTaskId: string;
  };
}

export interface WorkflowTrigger {
  type: 'voice_command' | 'time_schedule' | 'sensor_event' | 'device_status';
  config: string;
}

export interface WorkflowNode {
  id: string;
  title: string;
  tool: string;
  params: Record<string, any>;
  securityLevel: SecurityLevel;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  enabled: boolean;
  lastRunTimestamp?: number;
  lastStatus?: 'success' | 'failed' | 'running';
  executionCount: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'personal_context' | 'system_docs' | 'notes' | 'device_manual' | 'workflow_rule';
  content: string;
  indexedAt: number;
  tags: string[];
  sizeKb: number;
}

export interface SecurityAuthorizationRequest {
  id: string;
  action: string;
  target: string;
  level: SecurityLevel;
  requestedBy: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export interface VisionDetection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages
  category: 'person' | 'device' | 'object' | 'hazard' | 'text';
}

export interface VisionAnalysisResult {
  summary: string;
  detections: VisionDetection[];
  environmentalAnomalies: string[];
  recommendedActions: string[];
  timestamp: number;
}

export interface OfflineLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  road?: string;
  locality?: string;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  confidence: number;
  distanceToFeatureMeters: number;
  source: 'offline-spatial-db' | 'online-fallback';
}

export interface GeoLocationResult {
  success: boolean;
  location?: OfflineLocationData;
  speechText: string;
  error?: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported' | 'no_database_match';
}
