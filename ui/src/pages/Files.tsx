import { useState, useEffect } from "react";
import { api } from "../services/api";
import { showToast } from "../utils/toast";
import { reloadIfNeeded } from "../utils/reload";

interface FileEditorModalProps {
  filename: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

function FileEditorModal({
  filename,
  content,
  onSave,
  onClose,
}: FileEditorModalProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedContent);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] h-[95vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit File: {filename}
          </h2>
          <button
            onClick={onClose}
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

        <div className="flex-1 p-6 overflow-hidden min-h-0">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full min-h-[500px] font-mono text-sm border border-gray-300 rounded p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-auto"
            spellCheck={false}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ImageViewerModalProps {
  filename: string;
  imageUrl: string;
  onClose: () => void;
}

function ImageViewerModal({
  filename,
  imageUrl,
  onClose,
}: ImageViewerModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{filename}</h2>
          <button
            onClick={onClose}
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

        <div className="p-6 overflow-auto">
          <img src={imageUrl} alt={filename} className="max-w-full h-auto" />
        </div>
      </div>
    </div>
  );
}

export default function Files() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorModal, setEditorModal] = useState<{
    filename: string;
    content: string;
  } | null>(null);
  const [imageModal, setImageModal] = useState<{
    filename: string;
    url: string;
  } | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await api.getDeviceData();
      setFiles(data.fileListing || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await api.downloadFile(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.split("/").pop() || filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("File downloaded", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to download",
        "error"
      );
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await api.deleteFile(filename);
      showToast("File deleted", "success");
      if (!reloadIfNeeded()) {
        await loadFiles();
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error"
      );
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadFile(file);
      showToast("File uploaded", "success");
      e.target.value = "";
      if (!reloadIfNeeded()) {
        await loadFiles();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to upload";
      if (errorMsg.includes("404")) {
        showToast("Upload not supported by device firmware", "error");
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRun = async (filename: string) => {
    if (!confirm(`Run script ${filename}?`)) return;

    setExecuting(filename);
    try {
      await api.runFile(filename);
      showToast("Script executed", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to run script",
        "error"
      );
    } finally {
      setExecuting(null);
    }
  };

  const handleEdit = async (filename: string) => {
    try {
      const blob = await api.downloadFile(filename);
      const content = await blob.text();
      setEditorModal({ filename, content });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load file",
        "error"
      );
    }
  };

  const handleSaveEdit = async (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const file = new File([blob], filename.split("/").pop() || filename);
    try {
      await api.uploadFile(file, filename);
      showToast("File saved", "success");
      if (!reloadIfNeeded()) {
        await loadFiles();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save";
      if (errorMsg.includes("404")) {
        throw new Error(
          "File upload not supported by device firmware. Changes cannot be saved."
        );
      } else {
        throw new Error(errorMsg);
      }
    }
  };

  const handleViewImage = async (filename: string) => {
    try {
      const blob = await api.downloadFile(filename);
      const url = window.URL.createObjectURL(blob);
      setImageModal({ filename, url });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load image",
        "error"
      );
    }
  };

  const handleDisplayImage = async (filename: string) => {
    setExecuting(filename);
    try {
      await api.showImage(filename);
      showToast("Image displayed on device", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to display image",
        "error"
      );
    } finally {
      setExecuting(null);
    }
  };

  const isScriptFile = (filename: string) => filename.endsWith(".ds");
  const isImageFile = (filename: string) =>
    filename.match(/\.(png|jpg|jpeg|gif|bmp)$/i);
  const isEditableFile = (filename: string) =>
    filename.match(
      /\.(ds|txt|json|xml|html|css|js|py|sh|md|csv|log|ini|conf|cfg)$/i
    );

  return (
    <>
      <div className="px-4 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              File Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage files on device SD card
            </p>
          </div>
          <div>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
              {uploading ? "Uploading..." : "Upload File"}
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading files...</div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No files found
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 break-all text-sm font-medium text-gray-900">
                        {file}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isScriptFile(file) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Script
                          </span>
                        )}
                        {isImageFile(file) && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            Image
                          </span>
                        )}
                        {!isScriptFile(file) &&
                          !isImageFile(file) &&
                          isEditableFile(file) && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              Text
                            </span>
                          )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium whitespace-normal">
                        <div className="flex flex-wrap justify-end gap-2">
                        {isScriptFile(file) && (
                          <button
                            onClick={() => handleRun(file)}
                            disabled={executing === file}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {executing === file ? "Running..." : "Run"}
                          </button>
                        )}
                        {isImageFile(file) && (
                          <>
                            <button
                              onClick={() => handleViewImage(file)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDisplayImage(file)}
                              disabled={executing === file}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            >
                              {executing === file ? "Displaying..." : "Display"}
                            </button>
                          </>
                        )}
                        {isEditableFile(file) && (
                          <button
                            onClick={() => handleEdit(file)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(file)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editorModal && (
        <FileEditorModal
          filename={editorModal.filename}
          content={editorModal.content}
          onSave={(content) => handleSaveEdit(editorModal.filename, content)}
          onClose={() => setEditorModal(null)}
        />
      )}

      {imageModal && (
        <ImageViewerModal
          filename={imageModal.filename}
          imageUrl={imageModal.url}
          onClose={() => {
            if (imageModal.url) {
              window.URL.revokeObjectURL(imageModal.url);
            }
            setImageModal(null);
          }}
        />
      )}
    </>
  );
}
