let ioInstance = null;
export const setControllerSocket = (io) => {
  ioInstance = io;
};
export const getIoInstance = () => {
  if (!ioInstance) {
    console.warn("⚠️ Socket.IO instance not initialized yet!");
  }
  return ioInstance;
};
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return console.warn("⚠️ No socket instance found to emit event.");
  ioInstance.to(userId.toString()).emit(event, data);
  console.log(`📤 Emitted "${event}" to user ${userId}`);
};
export const broadcastEvent = (event, data) => {
  if (!ioInstance) return console.warn("⚠️ No socket instance found to broadcast.");
  ioInstance.emit(event, data);
  console.log(`📢 Broadcasted "${event}" to all clients.`);
};
