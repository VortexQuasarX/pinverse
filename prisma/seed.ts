import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

const CATEGORIES = ['Architecture', 'Art', 'Food', 'Nature', 'Photography', 'Travel', 'Design', 'Fashion', 'Technology']

const PIN_IMAGES = [
  'https://picsum.photos/seed/pin1/600/800',
  'https://picsum.photos/seed/pin2/600/900',
  'https://picsum.photos/seed/pin3/600/700',
  'https://picsum.photos/seed/pin4/600/850',
  'https://picsum.photos/seed/pin5/600/750',
  'https://picsum.photos/seed/pin6/600/950',
  'https://picsum.photos/seed/pin7/600/650',
  'https://picsum.photos/seed/pin8/600/880',
  'https://picsum.photos/seed/pin9/600/720',
  'https://picsum.photos/seed/pin10/600/900',
  'https://picsum.photos/seed/pin11/600/800',
  'https://picsum.photos/seed/pin12/600/850',
  'https://picsum.photos/seed/pin13/600/780',
  'https://picsum.photos/seed/pin14/600/920',
  'https://picsum.photos/seed/pin15/600/680',
  'https://picsum.photos/seed/pin16/600/860',
  'https://picsum.photos/seed/pin17/600/740',
  'https://picsum.photos/seed/pin18/600/900',
  'https://picsum.photos/seed/pin19/600/810',
  'https://picsum.photos/seed/pin20/600/870',
  'https://picsum.photos/seed/arch1/600/900',
  'https://picsum.photos/seed/art1/600/800',
  'https://picsum.photos/seed/food1/600/750',
  'https://picsum.photos/seed/nature1/600/850',
  'https://picsum.photos/seed/photo1/600/900',
  'https://picsum.photos/seed/travel1/600/800',
  'https://picsum.photos/seed/design1/600/780',
  'https://picsum.photos/seed/fashion1/600/860',
  'https://picsum.photos/seed/tech1/600/720',
  'https://picsum.photos/seed/arch2/600/880',
]

const PIN_TITLES = [
  'Modern Architecture Skyline',
  'Abstract Art Composition',
  'Delicious Homemade Pasta',
  'Serene Mountain Landscape',
  'Golden Hour Photography',
  'Wanderlust Travel Dreams',
  'Minimal Design Inspiration',
  'Fashion Forward Looks',
  'Future Tech Concepts',
  'Cozy Interior Design',
  'Street Photography Moments',
  'Tropical Paradise Views',
  'Creative Workspace Ideas',
  'Vintage Style Collection',
  'Innovation & Technology',
  'Urban Architecture Details',
  'Watercolor Art Gallery',
  'Gourmet Food Presentation',
  'Forest Trail Adventure',
  'Portrait Photography Tips',
  'Sustainable Architecture',
  'Contemporary Art Pieces',
  'Sushi Artistry',
  'Ocean Waves at Sunset',
  'Black & White Photography',
  'European City Breaks',
  'UI/UX Design Trends',
  'Runway Style Highlights',
  'AI & Machine Learning',
  'Brutalist Architecture',
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const demoPassword = await hashPassword('demo123')
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pinverse.com' },
    update: {},
    create: {
      email: 'demo@pinverse.com',
      name: 'Demo User',
      password: demoPassword,
      avatar: 'https://i.pravatar.cc/150?u=demo',
      bio: 'Welcome to Pinverse! This is a demo account to explore all features.',
    },
  })

  // Create additional users
  const users: any[] = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `creator${i}@pinverse.com` },
      update: {},
      create: {
        email: `creator${i}@pinverse.com`,
        name: `Creator ${i}`,
        password: await hashPassword('password123'),
        avatar: `https://i.pravatar.cc/150?u=creator${i}`,
        bio: `Hi! I'm Creator ${i}. I love sharing creative ideas!`,
      },
    })
    users.push(user)
  }

  // Create demo board
  const inspirationBoard = await prisma.board.upsert({
    where: { id: 'demo-board-inspiration' },
    update: {},
    create: {
      id: 'demo-board-inspiration',
      name: 'Inspiration',
      description: 'My favorite creative inspirations',
      userId: demoUser.id,
    },
  })

  const travelBoard = await prisma.board.upsert({
    where: { id: 'demo-board-travel' },
    update: {},
    create: {
      id: 'demo-board-travel',
      name: 'Travel Goals',
      description: 'Places I want to visit',
      userId: demoUser.id,
    },
  })

  // Create pins
  const allUsers = [demoUser, ...users]
  const pins: any[] = []

  for (let i = 0; i < PIN_TITLES.length; i++) {
    const author = allUsers[i % allUsers.length]
    const category = CATEGORIES[i % CATEGORIES.length]
    const pin = await prisma.pin.create({
      data: {
        title: PIN_TITLES[i],
        description: `A beautiful ${category.toLowerCase()} pin to inspire your creativity.`,
        imageUrl: PIN_IMAGES[i],
        category,
        authorId: author.id,
      },
    })
    pins.push(pin)
  }

  // Add some likes
  for (let i = 0; i < 30; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    try {
      await prisma.like.create({ data: { userId, pinId } })
    } catch {
      // Skip duplicates
    }
  }

  // Add some saves
  for (let i = 0; i < 20; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    try {
      await prisma.save.create({ data: { userId, pinId } })
    } catch {
      // Skip duplicates
    }
  }

  // Add some comments
  const commentTexts = [
    'This is absolutely stunning! 😍',
    'Love the composition here',
    'So inspiring!',
    'Where was this taken?',
    'Beautiful colors and lighting',
    'This gives me so many ideas',
    'Amazing work!',
    'I need to visit this place',
    'The detail is incredible',
    'Saving this for later!',
  ]
  for (let i = 0; i < 15; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    await prisma.comment.create({
      data: {
        content: commentTexts[i % commentTexts.length],
        userId,
        pinId,
      },
    })
  }

  // Add some follows
  for (const user of users) {
    try {
      await prisma.follow.create({
        data: { followerId: demoUser.id, followingId: user.id },
      })
    } catch {
      // Skip duplicates
    }
  }

  // Add pins to boards
  for (let i = 0; i < 5; i++) {
    try {
      await prisma.boardPin.create({
        data: { boardId: inspirationBoard.id, pinId: pins[i].id },
      })
    } catch {
      // Skip duplicates
    }
  }
  for (let i = 5; i < 10; i++) {
    try {
      await prisma.boardPin.create({
        data: { boardId: travelBoard.id, pinId: pins[i].id },
      })
    } catch {
      // Skip duplicates
    }
  }

  // Add some notifications for demo user
  const notifData = [
    { type: 'LIKE', message: 'Creator 1 liked your pin "Cozy Interior Design"', fromUserId: users[0].id, toUserId: demoUser.id, pinId: pins[10].id },
    { type: 'COMMENT', message: 'Creator 2 commented on your pin "Street Photography Moments"', fromUserId: users[1].id, toUserId: demoUser.id, pinId: pins[11].id },
    { type: 'FOLLOW', message: 'Creator 3 started following you', fromUserId: users[2].id, toUserId: demoUser.id },
    { type: 'LIKE', message: 'Creator 4 liked your pin "Modern Architecture Skyline"', fromUserId: users[3].id, toUserId: demoUser.id, pinId: pins[0].id },
    { type: 'FOLLOW', message: 'Creator 5 started following you', fromUserId: users[4].id, toUserId: demoUser.id },
  ]
  for (const n of notifData) {
    await prisma.notification.create({ data: n }).catch(() => {})
  }

  console.log('✅ Database seeded successfully!')
  console.log(`   - ${allUsers.length} users created`)
  console.log(`   - ${pins.length} pins created`)
  console.log(`   - 2 boards created for demo user`)
  console.log(`   - Demo login: demo@pinverse.com / demo123`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
