import { getApiUrl } from "../utils/proxy";
import { getDeviceUrl } from "../utils/config";

export default function Update() {
  const updateUrl = getApiUrl("/update");
  const deviceUrl = getDeviceUrl();

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Firmware Update</h1>
        <p className="mt-1 text-sm text-gray-500">
          Perform an OTA firmware update using the device update page.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⬆️</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              OTA Update Portal
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This opens the device update page at <span className="font-medium">{deviceUrl}</span>.
              You will need a valid <span className="font-medium">firmware.bin</span> for your hardware revision.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-800">Warning</div>
          <div className="text-sm text-red-700 mt-1">
            No checking is performed to ensure you are using the correct firmware.
            Flashing the wrong file can brick the device.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={updateUrl}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Open OTA Update Page
          </a>
          <a
            href={updateUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
          >
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}
