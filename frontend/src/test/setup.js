// Test setup file for Vitest
// This file runs before all tests and sets up the testing environment

import '@testing-library/jest-dom'

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock HTMLCanvasElement.getContext for Konva tests
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Array(4) }),
    putImageData: () => {},
    createImageData: () => new Array(4),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  }
}

// Mock WebRTC for voice chat tests
global.RTCPeerConnection = class RTCPeerConnection {
  constructor() {
    this.localDescription = null
    this.remoteDescription = null
  }
  
  createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })
  }
  
  createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })
  }
  
  setLocalDescription() {
    return Promise.resolve()
  }
  
  setRemoteDescription() {
    return Promise.resolve()
  }
  
  addIceCandidate() {
    return Promise.resolve()
  }
  
  close() {}
  
  addEventListener() {}
  removeEventListener() {}
}

global.navigator.mediaDevices = {
  getUserMedia: () => Promise.resolve({
    getTracks: () => [{ stop: () => {} }]
  })
}

// Mock Socket.IO client
global.io = () => ({
  on: () => {},
  emit: () => {},
  disconnect: () => {},
  connect: () => {}
})
