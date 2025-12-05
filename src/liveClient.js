import { io } from 'socket.io-client'

export function createLiveClient(serverUrl = '', token = '') {
  const socket = io(serverUrl || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  const on = (event, handler) => socket.on(event, handler)
  const off = (event, handler) => socket.off(event, handler)
  const emit = (event, payload) => socket.emit(event, payload)
  const connected = () => socket && socket.connected
  const disconnect = () => socket.disconnect()

  return { socket, on, off, emit, connected, disconnect }
}
