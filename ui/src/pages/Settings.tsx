import { useState, useEffect } from "react";
import { getDeviceUrl, setDeviceUrl, validateUrl } from "../utils/config";
import { getApiUrl, shouldUseProxy } from "../utils/proxy";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { reloadIfNeeded } from "../utils/reload";

interface Setting {
  name: string;
  value: string | boolean;
  type?: number | string;
  default?: string;
  state?: string;
}

interface SettingCategory {
  category: string;
  settings: Setting[];
}

export default function Settings() {
  const [url, setUrl] = useState(getDeviceUrl());
  const [error, setError] = useState<string | null>(null);
  const [deviceSettings, setDeviceSettings] = useState<SettingCategory[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUrl(getDeviceUrl());
    loadDeviceSettings();
  }, []);

  const loadDeviceSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getDeviceData();
      if (data.settingCategories && Array.isArray(data.settingCategories)) {
        setDeviceSettings(data.settingCategories);
      }
    } catch (err) {
      console.error("Failed to load device settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!validateUrl(url)) {
      setError("Invalid URL format. Must be http:// or https://");
      return;
    }

    setDeviceUrl(url);
    setError(null);
    navigate("/");
  };

  const handleTest = async () => {
    setError(null);
    try {
      const response = await fetch(getApiUrl("/data.json?_t=" + Date.now()), {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        try {
          const data = await response.json();
          const proxyStatus = shouldUseProxy()
            ? " (via proxy)"
            : " (direct connection - CORS bypass active)";
          alert(
            `Connection successful! Device version: ${
              data.version || "unknown"
            }${proxyStatus}`
          );
        } catch {
          const proxyStatus = shouldUseProxy()
            ? " (via proxy)"
            : " (direct connection - CORS bypass active)";
          alert(`Connection successful${proxyStatus}`);
        }
      } else {
        setError(`Connection failed: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("Failed to fetch")
      ) {
        if (shouldUseProxy()) {
          setError(
            "Connection failed even with proxy enabled. Check that VITE_PROXY_TARGET in .env matches your device URL."
          );
        } else {
          setError(null);
          alert(
            "Connection test: Server is reachable!\n\n" +
              "CORS error detected (expected in production). " +
              "The app will use page reload to bypass CORS after actions.\n\n" +
              "For development with smooth UX, enable proxy:\n" +
              "1. Create a .env file (copy from .env.example)\n" +
              "2. Set VITE_USE_PROXY=true\n" +
              "3. Set VITE_PROXY_TARGET to your device URL\n" +
              "4. Restart the dev server"
          );
        }
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("aborted")
      ) {
        setError(
          `Connection timeout: Device not reachable at ${getDeviceUrl()}`
        );
      } else {
        setError(`Connection failed: ${errorMessage}`);
      }
    }
  };

  const handleInputChange = (settingName: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [settingName]: value,
    }));
  };

  const HEX_UINT16_SETTINGS = new Set([
    "usbdevicevid",
    "usbdevicepid",
    "usbversion",
    "usbdeviceversion",
    "usbdevicetype",
    "usbclasstype",
  ]);

  const normalizeHexUInt16 = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return value;

    const isHex = /^0x/i.test(trimmed);
    const parsed = Number.parseInt(trimmed, isHex ? 16 : 10);
    if (Number.isNaN(parsed)) return value;

    const masked = parsed & 0xffff;
    return `0x${masked.toString(16).toUpperCase().padStart(4, "0")}`;
  };

  const getSettingValue = (
    settingName: string,
    originalValue: string | boolean
  ) => {
    if (editedValues[settingName] !== undefined) {
      const edited = String(editedValues[settingName]);
      if (HEX_UINT16_SETTINGS.has(settingName.toLowerCase())) {
        return normalizeHexUInt16(edited);
      }
      return editedValues[settingName];
    }
    if (typeof originalValue === "boolean") {
      return originalValue ? "true" : "false";
    }
    if (HEX_UINT16_SETTINGS.has(settingName.toLowerCase())) {
      return normalizeHexUInt16(String(originalValue));
    }
    return originalValue;
  };

  const hasChanges = (settingName: string) => {
    return editedValues[settingName] !== undefined;
  };

  const isBoolean = (setting: Setting) => {
    const type = setting.type;
    return (
      type === 1 ||
      type === "1" ||
      (typeof type === "string" && type.toLowerCase() === "bool")
    );
  };

  const handleBooleanToggle = (settingName: string, currentValue: string) => {
    const isTrue = currentValue === "true" || currentValue === "1";
    handleInputChange(settingName, isTrue ? "false" : "true");
  };

  const handleSettingChange = async (settingName: string, newValue: string) => {
    setSaving(settingName);
    try {
      const setting = deviceSettings
        .flatMap((cat) => cat.settings)
        .find((s) => s.name === settingName);

      let formattedValue = newValue;

      if (setting && isBoolean(setting)) {
        const boolValue = newValue === "true" || newValue === "1";
        formattedValue = boolValue ? "1" : "0";
      } else if (HEX_UINT16_SETTINGS.has(settingName.toLowerCase())) {
        formattedValue = normalizeHexUInt16(newValue);
      }

      await api.setSetting(settingName, formattedValue);

      setDeviceSettings((prev) =>
        prev.map((cat) => ({
          ...cat,
          settings: cat.settings.map((s) =>
            s.name === settingName ? { ...s, value: formattedValue } : s
          ),
        }))
      );

      setEditedValues((prev) => {
        const updated = { ...prev };
        delete updated[settingName];
        return updated;
      });

      reloadIfNeeded();
    } catch (err) {
      console.error("Failed to save setting:", err);
      alert(
        `Failed to save setting: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveSetting = async (settingName: string) => {
    if (!confirm(`Remove setting "${settingName}"?`)) return;

    setSaving(settingName);
    try {
      await api.setSetting(settingName);
      reloadIfNeeded();
    } catch (err) {
      console.error("Failed to remove setting:", err);
      alert(
        `Failed to remove setting: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setSaving(null);
    }
  };

  const getSettingType = (
    setting: Setting
  ): "BOOL" | "INT16" | "UINT16" | "STRING" => {
    const type = setting.type;

    if (
      type === 1 ||
      type === "1" ||
      (typeof type === "string" && type.toLowerCase() === "bool")
    ) {
      return "BOOL";
    }

    if (
      type === 2 ||
      type === "2" ||
      (typeof type === "string" && type.toLowerCase().includes("int16"))
    ) {
      return "INT16";
    }

    if (
      type === 3 ||
      type === "3" ||
      (typeof type === "string" && type.toLowerCase().includes("uint"))
    ) {
      return "UINT16";
    }

    return "STRING";
  };

  const handleSaveAll = async () => {
    const changedSettings = Object.keys(editedValues);
    if (changedSettings.length === 0) {
      alert("No changes to save");
      return;
    }

    if (!confirm(`Save ${changedSettings.length} setting(s)?`)) return;

    setSavingAll(true);

    try {
      const commands: string[] = [];

      for (const settingName of changedSettings) {
        const newValue = editedValues[settingName];
        const setting = deviceSettings
          .flatMap((cat) => cat.settings)
          .find((s) => s.name === settingName);

        if (!setting) continue;

        const settingType = getSettingType(setting);
        let formattedValue: string;

        if (settingType === "BOOL") {
          const boolValue = newValue === "true" || newValue === "1";
          formattedValue = boolValue ? "1" : "0";
        } else if (HEX_UINT16_SETTINGS.has(settingName.toLowerCase())) {
          formattedValue = normalizeHexUInt16(String(newValue));
        } else {
          formattedValue = String(newValue);
        }

        commands.push(
          `SET_SETTING_${settingType} ${settingName} ${formattedValue}`
        );
      }

      const commandString = commands.join("\n");
      await api.runRawCommand(commandString);

      setDeviceSettings((prev) =>
        prev.map((cat) => ({
          ...cat,
          settings: cat.settings.map((s) =>
            editedValues[s.name] !== undefined
              ? { ...s, value: editedValues[s.name] }
              : s
          ),
        }))
      );

      setEditedValues({});
      if (!reloadIfNeeded()) {
        alert(`Successfully saved ${changedSettings.length} setting(s).`);
      }
    } catch (err) {
      alert(
        `Failed to save settings: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setSavingAll(false);
    }
  };

  const hasAnyChanges = () => {
    return Object.keys(editedValues).length > 0;
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure device connection and device settings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Web App Configuration
          </h2>
          <div>
            <label
              htmlFor="device-url"
              className="block text-sm font-medium text-gray-700"
            >
              Device URL
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="device-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="http://4.3.2.1:8080"
              />
              <button
                onClick={handleTest}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100"
              >
                Test
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-sm text-gray-500">
              Enter the URL of your USBArmyKnife device. Default is{" "}
              <code className="bg-gray-100 px-1 rounded">
                http://4.3.2.1:8080
              </code>{" "}
              for AP mode.
              {shouldUseProxy() && (
                <span className="block mt-1 text-green-600">
                  ✓ Proxy enabled - requests routed through dev server to avoid
                  CORS
                </span>
              )}
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Device Settings
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAll}
                disabled={!hasAnyChanges() || savingAll || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAll
                  ? "Saving..."
                  : `Save All (${Object.keys(editedValues).length})`}
              </button>
              <button
                onClick={() => setShowDocsModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📖 Settings Reference
              </button>
              <button
                onClick={loadDeviceSettings}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {loading && deviceSettings.length === 0 ? (
            <p className="text-gray-500 text-sm">Loading device settings...</p>
          ) : deviceSettings.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No device settings available. Make sure you're connected to the
              device.
            </p>
          ) : (
            <div className="space-y-6">
              {deviceSettings.map((category) => (
                <div key={category.category}>
                  <h3 className="text-md font-medium text-gray-800 mb-3 pb-2 border-b">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.settings.map((setting) => {
                      const currentValue = getSettingValue(
                        setting.name,
                        setting.value
                      );
                      const isBooleanField = isBoolean(setting);

                      return (
                        <div
                          key={setting.name}
                          className="flex flex-col sm:flex-row sm:items-center gap-2"
                        >
                          <label className="block text-sm font-medium text-gray-700 w-full sm:w-48 flex-shrink-0">
                            {setting.name}
                          </label>
                          {isBooleanField ? (
                            <div className="flex-1 flex items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleBooleanToggle(
                                    setting.name,
                                    currentValue
                                  )
                                }
                                disabled={saving === setting.name}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  currentValue === "true" ||
                                  currentValue === "1"
                                    ? "bg-blue-600"
                                    : "bg-gray-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    currentValue === "true" ||
                                    currentValue === "1"
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <span className="ml-3 text-sm text-gray-600">
                                {currentValue === "true" || currentValue === "1"
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) =>
                                handleInputChange(setting.name, e.target.value)
                              }
                              disabled={saving === setting.name}
                              className="flex-1 min-w-0 w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-wait"
                            />
                          )}
                          <div className="flex flex-row gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleSettingChange(setting.name, currentValue)
                              }
                              disabled={
                                saving === setting.name ||
                                !hasChanges(setting.name) ||
                                savingAll
                              }
                              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => handleRemoveSetting(setting.name)}
                              disabled={savingAll || saving === setting.name}
                              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDocsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                USBArmyKnife Settings Reference
              </h3>
              <button
                onClick={() => setShowDocsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="space-y-8">
                <div key="wifi-settings">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    WiFi Settings
                  </h4>
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Setting Key
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Default
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          wifi-ap-mode
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Bool
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          true
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Enable AP mode (true) or Station mode (false)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          wifi-ap
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          String
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          iPhone14
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          WiFi SSID (used for both AP and Station mode)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          wifi-pwd
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          String
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          password
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          WiFi password (used for both AP and Station mode)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          wifi-bootstate
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Bool
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          true
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          WiFi enabled on boot
                        </td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>

                <div key="usb-settings">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    USB Device Settings
                  </h4>
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Setting Key
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Default
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDeviceType
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Serial
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB device type
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbClassType
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">HID</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB class type
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDeviceVID
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          0xcafe
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB Vendor ID
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDevicePID
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          0x403f
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB Product ID
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbVersion
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          0x0101
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB specification version
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDeviceVersion
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          UInt16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          0x0101
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB device version
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDeviceManufacturer
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          String
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Espressif Systems
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB manufacturer string
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbDeviceProductDescriptor
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          String
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          TinyUSB Device
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          USB product description
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          usbSerialRaw
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Bool
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          false
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Enable raw serial mode
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          pcapNcmOnStart
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Bool
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          false
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Start PCAP capture on NCM start
                        </td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>

                <div key="agent-settings">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Agent Settings
                  </h4>
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Setting Key
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Default
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          agentPollingEnabled
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Bool
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          true
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Enable agent polling
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                          agentPollingTime
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Int16
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">15</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Agent polling interval in seconds
                        </td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>

                <div
                  key="notes"
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6"
                >
                  <h5 className="font-semibold text-blue-900 mb-2">
                    Important Notes:
                  </h5>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>
                      <strong>WiFi Mode Logic:</strong> The same{" "}
                      <code className="bg-blue-100 px-1 rounded">wifi-ap</code>{" "}
                      and{" "}
                      <code className="bg-blue-100 px-1 rounded">wifi-pwd</code>{" "}
                      settings are used for both AP and Station modes
                    </li>
                    <li>
                      <strong>DuckyScript Commands:</strong> Use{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        SET_SETTING_BOOL
                      </code>
                      ,{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        SET_SETTING_INT16
                      </code>
                      ,{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        SET_SETTING_UINT16
                      </code>
                      , or{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        SET_SETTING_STRING
                      </code>{" "}
                      depending on the type
                    </li>
                    <li>
                      <strong>Persistence:</strong> All settings are saved to
                      ESP32 flash memory and persist across reboots
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
