import { useState, useEffect } from "react";
import { api, DeviceData } from "../services/api";
import { getDeviceUrl } from "../utils/config";
import { getApiUrl } from "../utils/proxy";

export default function Dashboard() {
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const deviceData = await api.getDeviceData();
      setData(deviceData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load device data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading device data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-semibold">Connection Error</div>
        <div className="text-red-600 mt-1">{error}</div>
        <div className="text-sm text-red-500 mt-2">
          Device URL: {getDeviceUrl()}
        </div>
        <button
          onClick={loadData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const updateUrl = getApiUrl("/update");

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Device Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time device status and information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">💾</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    SD Card Usage
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.sdCardPercentFull}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.sdCardPercentFull}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⏱️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Uptime
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.uptime}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Status
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.status}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⚠️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Errors
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.errorCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🔌</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    USB Mode
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.USBmode}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🧠</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Heap Usage
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.heapUsagePc}%
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${data.heapUsagePc}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⬆️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Firmware Update
                  </dt>
                  <dd className="text-sm text-gray-600">
                    Open the OTA update page
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href={updateUrl}
                className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Open Update Page
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🤖</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Agent
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.agentConnected ? (
                      <span className="text-green-600">
                        Connected ({data.machineName})
                      </span>
                    ) : (
                      <span className="text-gray-400">Not Connected</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🔧</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Chip
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {data.chipModel}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Version
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 font-mono text-sm">
                    {data.version}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              System Info
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Free Heap</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.freeHeap.toLocaleString()} bytes
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Heap
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.heapSize.toLocaleString()} bytes
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">CPU Cores</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.numCores}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
