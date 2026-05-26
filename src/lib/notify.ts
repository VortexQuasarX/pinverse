interface NotifyPayload {
  userId: string
  type: 'like' | 'comment' | 'follow'
  message: string
  fromUserId: string
  pinId?: string
}

// Push notification to realtime service (fire-and-forget)
// This is optional - if the realtime service is not running, notifications
// are still persisted in the database and available via the REST API.
export async function pushNotification(_payload: NotifyPayload): Promise<void> {
  // Realtime push is optional - notifications are stored in DB via the API routes
  // The realtime service (port 3003) can be enabled for live updates
  // For now, we skip the push and rely on REST polling
}
