import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import * as yaml from "js-yaml";
import { getDeviceUrl } from "../utils/config";
import { shouldUseProxy, PROXY_PREFIX, getApiUrl } from "../utils/proxy";

export default function Docs() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "API Documentation - USBArmyKnife ";
    const basePath = import.meta.env.BASE_URL || "/";
    fetch(`${basePath}swagger.yaml`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch swagger.yaml");
        return res.text();
      })
      .then((yamlText) => {
        const parsed = yaml.load(yamlText) as any;
        if (parsed) {
          if (shouldUseProxy()) {
            parsed.servers = [
              { url: PROXY_PREFIX, description: "Current Device (via proxy)" },
            ];
          } else {
            parsed.servers = [
              { url: getDeviceUrl(), description: "Current Device" },
              {
                url: "http://4.3.2.1:8080",
                description: "Device AP mode (default)",
              },
              {
                url: "http://{ip}:8080",
                description: "Device Station mode",
                variables: { ip: { default: "192.168.1.100" } },
              },
            ];
          }
          setSpec(parsed);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load swagger.yaml:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading API documentation...</div>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Failed to load API documentation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete API reference for USBArmyKnife{" "}
        </p>
      </div>
      <div className="mb-6 bg-white shadow rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⬆️</div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Firmware Update
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Open the device OTA update page to upload a new firmware image.
            </p>
          </div>
          <a
            href={getApiUrl("/update")}
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Open Update Page
          </a>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <SwaggerUI spec={spec} />
      </div>
    </div>
  );
}
