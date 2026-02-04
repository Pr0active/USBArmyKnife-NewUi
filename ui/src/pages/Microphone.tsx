import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { getApiUrl, shouldUseProxy } from "../utils/proxy";
import { getDeviceUrl } from "../utils/config";

const DB_NAME = "ArrayBufferDatabase";
const STORE_NAME = "buffers";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearAudioCache(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

async function addAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(buffer);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

async function getAllAudioBuffers(): Promise<ArrayBuffer> {
  const db = await openDatabase();
  const buffers = await new Promise<ArrayBuffer[]>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as ArrayBuffer[]);
    request.onerror = () => reject(request.error);
  });
  db.close();

  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return merged.buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function convertPcmToWav(pcmBuffer: ArrayBuffer): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmBuffer.byteLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcmBuffer.byteLength, true);

  const wav = new Uint8Array(header.byteLength + pcmBuffer.byteLength);
  wav.set(new Uint8Array(header), 0);
  wav.set(new Uint8Array(pcmBuffer), header.byteLength);
  return wav.buffer;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function toWebSocketUrl(): string {
  const endpoint = "/audio";
  const httpUrl = getApiUrl(endpoint);
  if (httpUrl.startsWith("http://")) {
    return httpUrl.replace("http://", "ws://");
  }
  if (httpUrl.startsWith("https://")) {
    return httpUrl.replace("https://", "wss://");
  }

  if (shouldUseProxy()) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}${httpUrl}`;
  }

  const deviceUrl = getDeviceUrl();
  const protocol = deviceUrl.startsWith("https://") ? "wss" : "ws";
  const host = deviceUrl.replace(/^https?:\/\//, "");
  return `${protocol}://${host}${endpoint}`;
}

export default function Microphone() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState("Idle");
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getDeviceData()
      .then((data) => {
        if (!mounted) return;
        setIsSupported(data.capabilities?.includes("MIC") ?? false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsSupported(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const playNext = useCallback(async () => {
    if (isPlayingRef.current) return;
    const next = audioQueueRef.current.shift();
    if (!next) return;
    isPlayingRef.current = true;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const wavBuffer = convertPcmToWav(next);
      const decoded = await audioContextRef.current.decodeAudioData(wavBuffer.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decoded;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNext();
      };
      source.start();
    } catch {
      isPlayingRef.current = false;
      playNext();
    }
  }, []);

  const openWebSocket = useCallback(() => {
    const wsUrl = toWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => setStatus("Connected");
    ws.onclose = () => setStatus("Disconnected");
    ws.onerror = () => setStatus("Error");
    ws.onmessage = async (event) => {
      const buffer = event.data as ArrayBuffer;
      audioQueueRef.current.push(buffer);
      await addAudioBuffer(buffer);
      playNext();
    };
    wsRef.current = ws;
  }, [playNext]);

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const toggleMic = async () => {
    const next = !isEnabled;
    setIsEnabled(next);
    setStatus(next ? "Starting..." : "Stopping...");
    await api.setMic(next);
    if (next) {
      openWebSocket();
    } else {
      closeWebSocket();
      setStatus("Idle");
    }
  };

  const handleSave = async () => {
    const pcm = await getAllAudioBuffers();
    const wav = convertPcmToWav(pcm);
    downloadBlob(new Blob([wav], { type: "application/octet-stream" }), "audio.wav");
  };

  const handleClear = async () => {
    await clearAudioCache();
  };

  useEffect(() => {
    return () => {
      closeWebSocket();
      api.setMic(false).catch(() => undefined);
    };
  }, [closeWebSocket]);

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Microphone</h1>
        <p className="mt-1 text-sm text-gray-500">Live capture with hot mic playback</p>
      </div>

      {isSupported === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="text-yellow-800 font-semibold">Microphone not supported</div>
          <div className="text-yellow-700 mt-1">
            This device does not advertise the MIC capability.
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Hot Mic</div>
            <div className="text-sm text-gray-600">Status: {status}</div>
          </div>
          <button
            onClick={toggleMic}
            disabled={isSupported === false}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isEnabled
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } ${isSupported === false ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isEnabled ? "Stop" : "Start"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
          >
            Save Audio as WAV
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
          >
            Clear Audio Cache
          </button>
        </div>
      </div>
    </div>
  );
}
