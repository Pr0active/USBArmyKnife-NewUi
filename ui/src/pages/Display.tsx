import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { showToast } from '../utils/toast'

export default function Display() {
  const [images, setImages] = useState<string[]>([])
  const [text, setText] = useState('')
  const [x, setX] = useState('0')
  const [y, setY] = useState('0')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      const data = await api.getDeviceData()
      const imageFiles = (data.fileListing || []).filter(f => f.match(/\.(png|jpg|jpeg|gif)$/i))
      setImages(imageFiles)
    } catch (err) {
      console.error('Failed to load images:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShowImage = async (filename: string) => {
    setExecuting(true)
    try {
      await api.showImage(filename)
      showToast('Image displayed', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to show image', 'error')
    } finally {
      setExecuting(false)
    }
  }

  const handleShowText = async () => {
    if (!text.trim()) {
      showToast('Please enter text to display', 'error')
      return
    }

    setExecuting(true)
    try {
      await api.runRawCommand(`DISPLAY_TEXT ${x} ${y} ${text}`)
      showToast('Text displayed', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to show text', 'error')
    } finally {
      setExecuting(false)
    }
  }

  const handleClear = async () => {
    setExecuting(true)
    try {
      await api.runRawCommand('DISPLAY_CLEAR')
      showToast('Display cleared', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to clear display', 'error')
    } finally {
      setExecuting(false)
    }
  }

  const handleLED = async (color: 'R' | 'G' | 'B' | 'OFF') => {
    setExecuting(true)
    try {
      await api.runRawCommand(`LED_${color}`)
      showToast(
        `LED ${color === 'OFF' ? 'turned off' : 'set to ' + (color === 'R' ? 'red' : color === 'G' ? 'green' : 'blue')}`,
        'success'
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to set LED', 'error')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Display & LED Control</h1>
        <p className="mt-1 text-sm text-gray-500">Control device display and LED</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Display Images</h2>
            {loading ? (
              <div className="text-gray-500">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-gray-500">No image files found</div>
            ) : (
              <div className="space-y-2">
                {images.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">{file}</span>
                    <button
                      onClick={() => handleShowImage(file)}
                      disabled={executing}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Show
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Display Text</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                  <input
                    type="number"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to display"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={handleShowText}
                disabled={executing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Display Text
              </button>
              <button
                onClick={handleClear}
                disabled={executing}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Clear Display
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">LED Control</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLED('R')}
                disabled={executing}
                className="px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Red
              </button>
              <button
                onClick={() => handleLED('G')}
                disabled={executing}
                className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Green
              </button>
              <button
                onClick={() => handleLED('B')}
                disabled={executing}
                className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Blue
              </button>
              <button
                onClick={() => handleLED('OFF')}
                disabled={executing}
                className="px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Off
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
