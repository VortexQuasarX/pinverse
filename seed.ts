import { db } from './src/lib/db'

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const demoPassword = await hashPassword('demo123')
  const demoUser = await db.user.upsert({
    where: { email: 'demo@pinverse.com' },
    update: {},
    create: {
      email: 'demo@pinverse.com',
      name: 'Demo User',
      password: demoPassword,
      avatar: null,
      bio: 'Welcome to Pinverse! This is a demo account.',
    },
  })

  // Create additional users
  const users = []
  const userNames = ['Alice Chen', 'Marco Rivera', 'Yuki Tanaka', 'Sarah Miller', 'Liam O\'Brien']
  for (const name of userNames) {
    const pw = await hashPassword('password123')
    const user = await db.user.create({
      data: {
        email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@pinverse.com`,
        name,
        password: pw,
        bio: `Hi, I'm ${name.split(' ')[0]}! I love discovering and sharing creative ideas.`,
      },
    })
    users.push(user)
  }

  const allUsers = [demoUser, ...users]

  // Create pins with beautiful placeholder images from Unsplash
  const pinData = [
    { title: 'Minimalist Architecture', desc: 'Clean lines and modern design', cat: 'Architecture', seed: 'arch1' },
    { title: 'Golden Hour Sunset', desc: 'Capturing the beauty of dusk', cat: 'Photography', seed: 'sunset2' },
    { title: 'Fresh Pasta Making', desc: 'Homemade Italian cuisine at its finest', cat: 'Food', seed: 'pasta3' },
    { title: 'Mountain Lake Reflection', desc: 'Peaceful waters in the wilderness', cat: 'Nature', seed: 'lake4' },
    { title: 'Tokyo Street Life', desc: 'Vibrant energy of Japanese urban culture', cat: 'Travel', seed: 'tokyo5' },
    { title: 'Abstract Watercolor', desc: 'Flowing colors and organic shapes', cat: 'Art', seed: 'watercolor6' },
    { title: 'Scandinavian Interior', desc: 'Cozy minimalist living space', cat: 'Design', seed: 'interior7' },
    { title: 'Spring Garden Bloom', desc: 'Colorful flowers in full bloom', cat: 'Nature', seed: 'garden8' },
    { title: 'Street Fashion NYC', desc: 'Urban style on the streets of New York', cat: 'Fashion', seed: 'fashion9' },
    { title: 'Drone Photography Tips', desc: 'Aerial views that take your breath away', cat: 'Photography', seed: 'drone10' },
    { title: 'Modern Glass Building', desc: 'Reflections in contemporary architecture', cat: 'Architecture', seed: 'glass11' },
    { title: 'Sushi Artistry', desc: 'Japanese culinary perfection', cat: 'Food', seed: 'sushi12' },
    { title: 'Northern Lights', desc: 'Aurora borealis dancing in the sky', cat: 'Nature', seed: 'aurora13' },
    { title: 'Santorini Blue', desc: 'White and blue dreams in Greece', cat: 'Travel', seed: 'santorini14' },
    { title: 'Oil Painting Landscape', desc: 'Classic technique meets modern vision', cat: 'Art', seed: 'painting15' },
    { title: 'UX Design Principles', desc: 'Creating intuitive digital experiences', cat: 'Design', seed: 'ux16' },
    { title: 'Autumn Forest Path', desc: 'Golden leaves and peaceful trails', cat: 'Nature', seed: 'autumn17' },
    { title: 'Runway Elegance', desc: 'Haute couture from Milan Fashion Week', cat: 'Fashion', seed: 'runway18' },
    { title: 'Macro Flower Photography', desc: 'Intricate details up close', cat: 'Photography', seed: 'macro19' },
    { title: 'Brutalist Architecture', desc: 'Raw concrete and bold forms', cat: 'Architecture', seed: 'brutalist20' },
    { title: 'Artisan Bread Baking', desc: 'The art of sourdough', cat: 'Food', seed: 'bread21' },
    { title: 'Tropical Paradise', desc: 'Crystal clear waters and white sand', cat: 'Travel', seed: 'tropical22' },
    { title: 'Digital Art Composition', desc: 'Futuristic visuals and creative coding', cat: 'Art', seed: 'digital23' },
    { title: 'Smart Home Tech', desc: 'The future of connected living', cat: 'Technology', seed: 'tech24' },
    { title: 'Coastal Cliff View', desc: 'Dramatic ocean landscapes', cat: 'Nature', seed: 'cliff25' },
    { title: 'Vintage Film Camera', desc: 'The charm of analog photography', cat: 'Photography', seed: 'camera26' },
    { title: 'Japanese Garden Design', desc: 'Zen and harmony in landscape', cat: 'Design', seed: 'zen27' },
    { title: 'Rainbow Smoothie Bowl', desc: 'Healthy and beautiful breakfast', cat: 'Food', seed: 'smoothie28' },
    { title: 'AI Generated Art', desc: 'Where technology meets creativity', cat: 'Technology', seed: 'aiart29' },
    { title: 'Moroccan Medina', desc: 'Colors and patterns of Marrakech', cat: 'Travel', seed: 'morocco30' },
    { title: 'Cabin in the Woods', desc: 'Cozy retreat among the trees', cat: 'Architecture', seed: 'cabin31' },
    { title: 'Pottery Making', desc: 'Hands in clay, creating beauty', cat: 'Art', seed: 'pottery32' },
    { title: 'Street Style Seoul', desc: 'Korean fashion inspiration', cat: 'Fashion', seed: 'seoul33' },
    { title: 'Underwater World', desc: 'Life beneath the surface', cat: 'Nature', seed: 'underwater34' },
    { title: 'Cyberpunk Cityscape', desc: 'Neon-lit futuristic urban scene', cat: 'Technology', seed: 'cyber35' },
    { title: 'Mediterranean Cuisine', desc: 'Fresh flavors from the coast', cat: 'Food', seed: 'mediterranean36' },
    { title: 'Bali Rice Terraces', desc: 'Emerald green landscapes of Indonesia', cat: 'Travel', seed: 'bali37' },
    { title: 'Ceramic Design', desc: 'Beautiful functional art', cat: 'Design', seed: 'ceramic38' },
    { title: 'Starry Night Sky', desc: 'Milky Way captured in long exposure', cat: 'Photography', seed: 'stars39' },
    { title: 'Sustainable Fashion', desc: 'Eco-friendly style choices', cat: 'Fashion', seed: 'sustainable40' },
  ]

  // Use picsum.photos for beautiful placeholder images with varied sizes
  const pins = []
  for (let i = 0; i < pinData.length; i++) {
    const pin = pinData[i]
    const author = allUsers[i % allUsers.length]
    // Vary image heights for masonry effect
    const heights = [400, 500, 600, 700, 450, 550, 650]
    const height = heights[i % heights.length]
    
    const createdPin = await db.pin.create({
      data: {
        title: pin.title,
        description: pin.desc,
        imageUrl: `https://picsum.photos/seed/${pin.seed}/400/${height}`,
        category: pin.cat,
        authorId: author.id,
      },
    })
    pins.push(createdPin)
  }

  // Create some likes and saves
  for (let i = 0; i < 60; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    try {
      await db.like.create({ data: { userId, pinId } })
    } catch { /* unique constraint, skip */ }
  }

  for (let i = 0; i < 40; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    try {
      await db.save.create({ data: { userId, pinId } })
    } catch { /* unique constraint, skip */ }
  }

  // Create some comments
  const commentTexts = [
    'This is absolutely stunning! 😍',
    'Love the composition and colors',
    'Where was this taken?',
    'Adding this to my inspiration board!',
    'So beautiful, this is exactly what I was looking for',
    'The lighting is perfect here',
    'I need to visit this place!',
    'Amazing work, keep it up!',
    'This gives me such good vibes',
    'Would love to learn how to create something like this',
    'Incredible attention to detail',
    'This is going in my saved collection for sure',
    'The colors are so vibrant!',
    'Perfect aesthetic',
    'This is goals ✨',
  ]

  for (let i = 0; i < 30; i++) {
    const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const pinId = pins[Math.floor(Math.random() * pins.length)].id
    const content = commentTexts[Math.floor(Math.random() * commentTexts.length)]
    await db.comment.create({
      data: { userId, pinId, content },
    })
  }

  // Create some follows
  for (let i = 0; i < 10; i++) {
    const followerId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    const followingId = allUsers[Math.floor(Math.random() * allUsers.length)].id
    if (followerId !== followingId) {
      try {
        await db.follow.create({ data: { followerId, followingId } })
      } catch { /* unique constraint, skip */ }
    }
  }

  console.log(`✅ Created ${allUsers.length} users, ${pins.length} pins, likes, saves, comments, and follows`)
  console.log('📧 Demo login: demo@pinverse.com / demo123')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
