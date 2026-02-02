import { useState, useEffect } from "react";
import { api } from "../services/api";
import { reloadIfNeeded } from "../utils/reload";

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getDeviceData();
      setLogs(data.logMessages || []);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear all logs?")) return;

    try {
      await api.clearLogs();
      if (!reloadIfNeeded()) {
        setLogs([]);
        await loadLogs();
      }
    } catch (err) {
      alert(
        `Failed to clear logs: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Device Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            View device log messages and errors
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {loading && logs.length === 0 ? (
            <div className="text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No log messages
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 border-b border-gray-100 hover:bg-gray-50 font-mono text-sm"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
