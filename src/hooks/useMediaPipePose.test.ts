import { act, renderHook, waitFor } from '@testing-library/react'
import { useMediaPipePose } from './useMediaPipePose'
import type { PoseLandmark } from '../lib/poseMetrics'

const poseMocks = vi.hoisted(() => ({
  constructor: vi.fn(),
  setOptions: vi.fn(),
  onResults: vi.fn(),
  send: vi.fn(),
  resultsHandler: null as ((results: { poseLandmarks?: PoseLandmark[] }) => void) | null,
}))

vi.mock('@mediapipe/pose', () => ({
  Pose: vi.fn(function PoseMock() {
    poseMocks.constructor()
    return {
      setOptions: poseMocks.setOptions,
      onResults: vi.fn((handler: (results: { poseLandmarks?: PoseLandmark[] }) => void) => {
        poseMocks.resultsHandler = handler
        poseMocks.onResults(handler)
      }),
      send: poseMocks.send,
    }
  }),
}))

function landmark(x: number, y: number, visibility = 0.95): PoseLandmark {
  return { x, y, visibility }
}

function makeLandmarks() {
  const landmarks = Array.from({ length: 33 }, () => landmark(0, 0))

  landmarks[0] = landmark(0.5, 0.1)
  landmarks[11] = landmark(0.4, 0.3)
  landmarks[12] = landmark(0.6, 0.3)
  landmarks[13] = landmark(0.35, 0.45)
  landmarks[14] = landmark(0.65, 0.45)
  landmarks[15] = landmark(0.3, 0.6)
  landmarks[16] = landmark(0.7, 0.6)
  landmarks[23] = landmark(0.45, 0.6)
  landmarks[24] = landmark(0.55, 0.6)
  landmarks[25] = landmark(0.45, 0.78)
  landmarks[26] = landmark(0.55, 0.78)
  landmarks[27] = landmark(0.45, 0.94)
  landmarks[28] = landmark(0.55, 0.94)

  return landmarks
}

function canvasContext() {
  return {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 48 })),
    set strokeStyle(_value: string) {},
    set fillStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {},
    set font(_value: string) {},
    set textAlign(_value: CanvasTextAlign) {},
  }
}

function attachMediaElements(result: ReturnType<typeof renderHook<typeof useMediaPipePose>>['result']) {
  const video = document.createElement('video')
  Object.defineProperties(video, {
    readyState: { value: HTMLMediaElement.HAVE_CURRENT_DATA, configurable: true },
    videoWidth: { value: 640, configurable: true },
    videoHeight: { value: 480, configurable: true },
    play: { value: vi.fn(() => Promise.resolve()), configurable: true },
    pause: { value: vi.fn(), configurable: true },
  })

  const canvas = document.createElement('canvas')
  vi.spyOn(canvas, 'getContext').mockReturnValue(canvasContext() as unknown as CanvasRenderingContext2D)

  act(() => {
    result.current.videoRef.current = video
    result.current.canvasRef.current = canvas
  })

  return { video, canvas }
}

describe('useMediaPipePose', () => {
  beforeEach(() => {
    poseMocks.constructor.mockClear()
    poseMocks.setOptions.mockClear()
    poseMocks.onResults.mockClear()
    poseMocks.send.mockClear()
    poseMocks.resultsHandler = null
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          {
            deviceId: 'camera-1',
            groupId: 'group-1',
            kind: 'videoinput',
            label: 'FaceTime HD Camera',
            toJSON: () => ({}),
          },
        ]),
        getUserMedia: vi.fn(),
      },
      configurable: true,
    })
  })

  it('initializes MediaPipe Pose and lists video devices', async () => {
    const { result } = renderHook(() => useMediaPipePose())

    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(poseMocks.constructor).toHaveBeenCalled()
    expect(poseMocks.setOptions).toHaveBeenCalledWith(expect.objectContaining({
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
    }))
    expect(poseMocks.onResults).toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.videoDevices).toHaveLength(1)
    })
  })

  it('starts and stops the camera stream', async () => {
    const stopTrack = vi.fn()
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [
        {
          label: 'FaceTime HD Camera',
          getSettings: () => ({ deviceId: 'camera-1' }),
        },
      ],
    } as unknown as MediaStream
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(stream)

    const { result } = renderHook(() => useMediaPipePose())
    attachMediaElements(result)

    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: true,
    })
    expect(result.current.cameraActive).toBe(true)

    act(() => {
      result.current.stopCamera()
    })

    expect(stopTrack).toHaveBeenCalled()
    expect(result.current.cameraActive).toBe(false)
  })

  it('collects metrics while detecting and generates a report when stopped', async () => {
    const { result } = renderHook(() => useMediaPipePose())
    attachMediaElements(result)

    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => {
      result.current.startDetection()
    })
    await waitFor(() => expect(result.current.isDetecting).toBe(true))

    act(() => {
      poseMocks.resultsHandler?.({ poseLandmarks: makeLandmarks() })
    })

    await waitFor(() => {
      expect(result.current.currentMetrics?.kneeAngle.left).toBe(180)
    })

    act(() => {
      result.current.stopDetection()
    })

    expect(result.current.isDetecting).toBe(false)
    expect(result.current.report?.metrics).toHaveLength(1)
    expect(result.current.report?.summary.postureQuality).toBe('excellent')
  })

  it('surfaces a user-facing camera error when getUserMedia is denied', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new DOMException('denied', 'NotAllowedError'))

    const { result } = renderHook(() => useMediaPipePose())
    attachMediaElements(result)

    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.startCamera()
    })

    expect(result.current.error).toBe('无法访问摄像头，请检查浏览器权限，或确认没有其他应用正在占用摄像头')
    expect(result.current.cameraActive).toBe(false)
  })
})
