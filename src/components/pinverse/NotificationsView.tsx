'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, ArrowLeft, Heart, MessageCircle, UserPlus, Bookmark } from 'lucide-react'
import { useNotificationStore } from '@/stores/notification-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

function NotifIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'like':
      return <Heart className="w-4 h-4 text-red-500" />
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />
    case 'follow':
      return <UserPlus className="w-4 h-4 text-green-500" />
    case 'save':
      return <Bookmark className="w-4 h-4 text-yellow-500" />
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />
  }
}

export function NotificationsView() {
  const { notifications, unreadCount, loading, fetchNotifications, markAllRead, markOneRead } =
    useNotificationStore()
  const { user } = useAuthStore()
  const { goHome, selectPin } = useViewStore()

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user, fetchNotifications])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please log in to view notifications</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goHome} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="text-red-500 hover:text-red-600 rounded-full">
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground text-sm">
            You&apos;ll see likes, comments, and follows here when they happen.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif, i) => (
            <motion.button
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                markOneRead(notif.id)
                if (notif.pinId) selectPin(notif.pinId)
              }}
              className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                !notif.read
                  ? 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="relative shrink-0">
                {notif.fromUser ? (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notif.fromUser.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-red-100 text-red-600">
                      {notif.fromUser.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <NotifIcon type={notif.type} />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                  <NotifIcon type={notif.type} />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm leading-snug ${!notif.read ? 'font-medium' : ''}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
