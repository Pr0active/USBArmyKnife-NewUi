import { Link, useLocation } from "react-router-dom";
import { getDeviceUrl } from "../utils/config";
import { getApiUrl } from "../utils/proxy";
import { useState, useEffect, useRef } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [deviceUrl, setDeviceUrl] = useState(getDeviceUrl());
  const [isConnected, setIsConnected] = useState(false);
  const [commandsDropdownOpen, setCommandsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDeviceUrl(getDeviceUrl());
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCommandsDropdownOpen(false);
      }
    };

    if (commandsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [commandsDropdownOpen]);

  const checkConnection = async () => {
    try {
      const response = await fetch(getApiUrl("/data.json?_t=" + Date.now()), {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/files", label: "Files", icon: "📁" },
    { path: "/scripts", label: "Scripts", icon: "⚡" },
    { path: "/display", label: "Display", icon: "🖥️" },
    { path: "/logs", label: "Logs", icon: "📝" },
    { path: "/update", label: "Update", icon: "⬆️" },
    { path: "/docs", label: "API Docs", icon: "📚" },
  ];

  const commandItems = [
    { path: "/marauder", label: "Marauder", icon: "🎯" },
    { path: "/keyboard", label: "DuckyScript/Keyboard", icon: "⌨️" },
    { path: "/agent", label: "Agent", icon: "🤖" },
    { path: "/microphone", label: "Microphone", icon: "🎤" },
  ];

  const isCommandsPage = commandItems.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">
                  USBArmyKnife
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div className="relative inline-flex items-center" ref={dropdownRef}>
                  <button
                    onClick={() => setCommandsDropdownOpen(!commandsDropdownOpen)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isCommandsPage
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <span className="mr-2">⚡</span>
                    Commands
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${
                        commandsDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {commandsDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {commandItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setCommandsDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              location.pathname === item.path
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">{deviceUrl}</span>
              </div>
              <Link
                to="/settings"
                className="text-gray-500 hover:text-gray-700"
              >
                ⚙️
              </Link>
            </div>
          </div>
        </div>
        <div className="sm:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="px-3 py-2">
              <div className="text-base font-medium text-gray-700 mb-1">Commands</div>
              <div className="pl-4 space-y-1">
                {commandItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
