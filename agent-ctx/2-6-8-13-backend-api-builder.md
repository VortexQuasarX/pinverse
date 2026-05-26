---
Task ID: 2-6, 8-13
Agent: Backend API Builder
Task: Build additional backend API routes for Pinverse (Boards, Notifications, Pin Edit, Comment Delete, Rate Limiting, CSRF, Share, Notifications on actions)

Work Log:
- Read worklog.md and understood existing project context (Pinterest-like app with auth, pins, likes, saves, comments, follows)
- Read all existing route files that needed modification (like, comments, follow, pins/[id])
- Read Prisma schema confirming Board, BoardPin, Notification models already defined
- Read auth and db utility modules for import patterns

Files Created:
1. `src/lib/rate-limit.ts` - In-memory rate limiter: 100 req/60s per IP, returns 429 with Retry-After header
2. `src/lib/csrf.ts` - CSRF token utilities: generateCsrfToken (stores httpOnly cookie), getCsrfToken, validateCsrfToken (constant-time comparison)
3. `src/app/api/boards/route.ts` - GET (list user's boards), POST (create board with name/description/isPrivate, duplicate name check)
4. `src/app/api/boards/[id]/route.ts` - GET (board with pins, private board access control), PUT (update board, owner-only, duplicate name check), DELETE (owner-only)
5. `src/app/api/boards/[id]/pins/route.ts` - POST (add pin to board, owner-only, duplicate check), DELETE (remove pin from board, owner-only)
6. `src/app/api/notifications/route.ts` - GET (paginated notifications with fromUser enrichment and unreadCount)
7. `src/app/api/notifications/read/route.ts` - PUT (mark all as read)
8. `src/app/api/notifications/read/[id]/route.ts` - PUT (mark single notification as read, owner-only)
9. `src/app/api/comments/[id]/route.ts` - DELETE (delete comment, owner-only)
10. `src/app/api/pins/[id]/share/route.ts` - POST (returns Twitter/Facebook/Pinterest share links + copy link URL)
11. `src/app/api/users/[id]/boards/route.ts` - GET (public boards, or all boards if own profile)

Files Modified:
1. `src/app/api/pins/[id]/route.ts` - Added PUT handler for editing pins (title/description/category, owner-only)
2. `src/app/api/pins/[id]/like/route.ts` - Added notification creation on like (for pin author, if not self)
3. `src/app/api/pins/[id]/comments/route.ts` - Added notification creation on comment (for pin author, if not self)
4. `src/app/api/users/[id]/follow/route.ts` - Added notification creation on follow (for followed user)

Key Implementation Details:
- All mutating endpoints (POST, PUT, DELETE) have checkRateLimit() at the start
- Board CRUD enforces ownership checks (userId === session.id)
- Private boards are hidden from non-owners (returns 404)
- Board names are unique per user (userId_name unique constraint)
- Notifications include fromUser enrichment (separate query + map)
- Notification creation uses .catch() to avoid failing the main operation if notification fails
- CSRF utilities use constant-time comparison to prevent timing attacks
- Rate limiter includes periodic cleanup of expired entries
- All routes use proper error handling with console.error
- Lint passes clean, DB is in sync

Stage Summary:
- All 8 API route groups created/updated as specified
- Rate limiting middleware and CSRF protection utilities created
- Notification system integrated into like, comment, and follow actions
- All code passes ESLint, dev server running successfully
