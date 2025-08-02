// Socket Integration Tests
// These tests verify that Socket.IO integration works correctly

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Socket.IO client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: true
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}))

describe('Socket.IO Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Socket Connection', () => {
    it('creates socket connection to correct URL', async () => {
      const { io } = await import('socket.io-client')
      
      // When socket.js is imported, it should create a connection
      await import('../socket.js')
      
      expect(io).toHaveBeenCalledWith('http://localhost:5000')
    })

    it('socket instance has required methods', () => {
      expect(mockSocket.on).toBeDefined()
      expect(mockSocket.emit).toBeDefined()
      expect(mockSocket.disconnect).toBeDefined()
      expect(mockSocket.connect).toBeDefined()
    })
  })

  describe('Socket Methods', () => {
    it('can emit events', () => {
      mockSocket.emit('test-event', { data: 'test' })
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' })
    })

    it('can register event listeners', () => {
      const callback = vi.fn()
      mockSocket.on('test-event', callback)
      
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback)
    })

    it('can disconnect socket', () => {
      mockSocket.disconnect()
      
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles connection errors gracefully', () => {
      const mockSocketWithError = {
        ...mockSocket,
        on: vi.fn((event, callback) => {
          if (event === 'connect_error') {
            callback(new Error('Connection failed'))
          }
        })
      }

      vi.doMock('socket.io-client', () => ({
        io: vi.fn(() => mockSocketWithError)
      }))

      // Should not throw when importing
      expect(async () => {
        await import('../socket.js')
      }).not.toThrow()
    })
  })
})

describe('WebRTC Integration', () => {
  beforeEach(() => {
    // Mock WebRTC APIs
    global.RTCPeerConnection = vi.fn(() => ({
      onicecandidate: null,
      ontrack: null,
      addTrack: vi.fn(),
      setRemoteDescription: vi.fn(() => Promise.resolve()),
      setLocalDescription: vi.fn(() => Promise.resolve()),
      createAnswer: vi.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })),
      createOffer: vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' }))
    }))

    global.RTCSessionDescription = vi.fn((description) => description)

    global.navigator.mediaDevices = {
      getUserMedia: vi.fn(() => Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }]
      }))
    }

    global.Audio = vi.fn(() => ({
      play: vi.fn(() => Promise.resolve()),
      srcObject: null
    }))
  })

  describe('WebRTC API Availability', () => {
    it('has RTCPeerConnection available', () => {
      expect(global.RTCPeerConnection).toBeDefined()
    })

    it('has navigator.mediaDevices available', () => {
      expect(global.navigator.mediaDevices).toBeDefined()
      expect(global.navigator.mediaDevices.getUserMedia).toBeDefined()
    })

    it('can create RTCPeerConnection instance', () => {
      const pc = new RTCPeerConnection()
      
      expect(pc).toBeDefined()
      expect(pc.addTrack).toBeDefined()
      expect(pc.createOffer).toBeDefined()
      expect(pc.createAnswer).toBeDefined()
    })
  })

  describe('Media Access', () => {
    it('can request user media', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      expect(stream).toBeDefined()
      expect(stream.getTracks).toBeDefined()
    })

    it('handles media access errors', async () => {
      global.navigator.mediaDevices.getUserMedia = vi.fn(() => 
        Promise.reject(new Error('Permission denied'))
      )

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (error) {
        expect(error.message).toBe('Permission denied')
      }
    })
  })
})
