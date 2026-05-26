interface NotifyPayload {
  userId: string
  type: 'like' | 'comment' | 'follow'
  message: string
  fromUserId: string
  pinId?: string
}

export async function pushNotification(payload: NotifyPayload): Promise<void> {
  try {
    await fetch('http://localhost:3003/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Failed to push notification to realtime service:', error)
  }
}
