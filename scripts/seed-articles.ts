import mysql from 'mysql2/promise'
import { loadEnvFile } from './load-env'

loadEnvFile()

const articles = [
  {
    title: "The Power of Starting Small: How Tiny Habits Lead to Massive Change",
    slug: "power-of-starting-small",
    body: `We often underestimate the power of small actions. We think that to make a real difference in our lives, we need dramatic, sweeping changes. But the truth is quite the opposite.

The Japanese philosophy of Kaizen teaches us that small, continuous improvements lead to significant results over time. When you commit to reading just one page a day, exercising for just five minutes, or writing just one sentence, you're not just doing something small – you're rewiring your brain to build consistency.

Research shows that habits are formed through repetition, not intensity. It's better to do something small every day than to do something big once in a while. The key is to make the habit so easy that you can't say no.

Start with two minutes. Want to read more? Start by reading for two minutes before bed. Want to meditate? Start with two minutes of deep breathing. Want to exercise? Start with two minutes of stretching.

Once the habit is established, you can gradually increase the duration. But the foundation – the habit itself – is what matters most.

Remember: you don't rise to the level of your goals, you fall to the level of your systems. Build the system first, and the results will follow.`,
    excerpt: "Discover how tiny daily actions can transform your life through the power of consistent habits.",
    author: "Sarah Chen",
    category: "Personal Growth",
    tags: JSON.stringify(["habits", "personal development", "mindset", "productivity"]),
    image_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
    reading_time: 4
  },
  {
    title: "Finding Peace in Uncertainty: A Guide to Embracing the Unknown",
    slug: "finding-peace-in-uncertainty",
    body: `Life is inherently uncertain. No matter how much we plan, prepare, and try to control our circumstances, the future remains fundamentally unknowable. And yet, so many of us spend our lives fighting against this basic truth.

The ancient Stoics understood something profound: the only thing we can truly control is our own mind, our own reactions, our own choices. Everything else – external events, other people's actions, the twists of fate – lies outside our sphere of control.

When we accept this, something remarkable happens. Instead of anxiety about the future, we find a deep sense of peace. Not because we've given up on our goals or stopped caring about outcomes, but because we've learned to focus our energy where it can actually make a difference.

This doesn't mean becoming passive or fatalistic. On the contrary, it frees us to take bold action. When we're not paralyzed by fear of failure or obsessed with controlling every variable, we can act with clarity and purpose.

Practice sitting with uncertainty. When anxious thoughts arise about the future, notice them without judgment. Remind yourself: "I don't know what will happen, and that's okay. What I can do is show up fully today."

The peace you seek isn't found in certainty. It's found in accepting what is and doing what you can.`,
    excerpt: "Learn to find calm and clarity by embracing life's fundamental uncertainty.",
    author: "Marcus Webb",
    category: "Mindfulness",
    tags: JSON.stringify(["mindfulness", "stoicism", "anxiety", "peace", "acceptance"]),
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    reading_time: 5
  },
  {
    title: "The Art of Deep Work: Finding Focus in a Distracted World",
    slug: "art-of-deep-work",
    body: `In an age of constant notifications, endless scrolling, and the cult of busyness, the ability to focus deeply on meaningful work has become both rare and incredibly valuable.

Cal Newport calls this skill "Deep Work" – the ability to focus without distraction on a cognitively demanding task. It's the kind of focused concentration that produces our best thinking, most creative ideas, and highest quality output.

But deep work is under assault. Every app, platform, and device is designed to capture and hold our attention. We've trained ourselves to seek constant stimulation, to fill every moment of silence with something – a podcast, a video, a scroll through social media.

The first step to reclaiming deep work is recognizing what we've lost. When was the last time you spent two hours completely focused on a single important task? For many of us, the answer is sobering.

Here's how to start recovering your capacity for deep work:

1. Schedule it: Block specific times for deep work on your calendar. Treat these blocks as non-negotiable.

2. Eliminate distractions: During deep work sessions, put your phone in another room. Close all unnecessary browser tabs. Consider using website blockers.

3. Build your tolerance: Start with shorter sessions (30-60 minutes) and gradually extend them. Deep focus is a skill that improves with practice.

4. Create rituals: Develop a routine that signals to your brain it's time for deep work. This might include a specific location, a cup of tea, or a particular playlist.

The ability to perform deep work is becoming the superpower of the knowledge economy. Those who cultivate it will thrive. Those who don't will struggle to compete.`,
    excerpt: "Master the increasingly rare skill of sustained focus to produce your best work.",
    author: "James Liu",
    category: "Productivity",
    tags: JSON.stringify(["focus", "productivity", "deep work", "concentration", "work"]),
    image_url: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800",
    reading_time: 6
  },
  {
    title: "Gratitude as a Practice: Rewiring Your Brain for Happiness",
    slug: "gratitude-as-practice",
    body: `Happiness, we're told, comes from achievement. Get the promotion, buy the house, find the relationship – then you'll be happy. But research consistently shows that this formula is backwards.

Gratitude – the simple practice of noticing and appreciating what's good in your life – is one of the most powerful predictors of wellbeing. People who regularly practice gratitude report higher levels of positive emotions, better sleep, more compassion, and even stronger immune systems.

The key word here is "practice." Gratitude isn't a feeling that spontaneously arises; it's a skill that can be developed and strengthened over time. Like a muscle, the more you use it, the stronger it gets.

Start simple: each night before bed, write down three things you're grateful for. They don't need to be big things. The warmth of your coffee this morning. A kind word from a colleague. The sunset you noticed on your way home.

The magic happens not in the things themselves, but in the attention you give them. By deliberately focusing on what's good, you're training your brain to notice more of it. You're literally rewiring your neural pathways.

Over time, this practice shifts your baseline. You begin to move through the world with a greater sense of appreciation, noticing beauty and goodness that was always there but somehow invisible.

This isn't about toxic positivity or ignoring real problems. It's about balance. Our brains have a negativity bias – we're wired to notice threats and problems. Gratitude practice helps correct this imbalance, ensuring we see the full picture of our lives.

Start tonight. Three things. That's all it takes to begin.`,
    excerpt: "Discover how a simple daily gratitude practice can fundamentally shift your experience of life.",
    author: "Elena Rodriguez",
    category: "Wellness",
    tags: JSON.stringify(["gratitude", "happiness", "wellbeing", "mental health", "positivity"]),
    image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800",
    reading_time: 5
  },
  {
    title: "The Courage to Be Imperfect: Embracing Vulnerability",
    slug: "courage-to-be-imperfect",
    body: `We live in a culture obsessed with perfection. Perfect bodies, perfect careers, perfect families – all curated and displayed on social media for the world to admire. But this pursuit of perfection comes at a cost.

Brené Brown's research on vulnerability has shown that the people who live the most fulfilling lives aren't the ones who appear to have it all together. They're the ones who have the courage to be imperfect, to show up authentically, to let themselves be truly seen.

Vulnerability is not weakness. It takes tremendous courage to say "I don't know," to admit a mistake, to ask for help, to express how you really feel. These acts of vulnerability are actually the foundation of meaningful connection and genuine self-worth.

When we hide our imperfections, we also hide our authentic selves. We create distance between who we really are and how we present ourselves to the world. This gap is exhausting to maintain and prevents us from experiencing true belonging.

Here's the paradox: the things we try hardest to hide are often the very things that make us most relatable. Our struggles, our failures, our doubts – these are universal human experiences. When we share them, we give others permission to do the same.

Start small. Share something you're struggling with with a trusted friend. Admit when you don't have the answer. Let go of the need to appear perfect.

Remember: you are worthy of love and belonging exactly as you are, not as some idealized version of yourself. The courage to be imperfect is the courage to be real.`,
    excerpt: "Why showing up authentically, flaws and all, is the key to true connection and fulfillment.",
    author: "Maya Johnson",
    category: "Personal Growth",
    tags: JSON.stringify(["vulnerability", "authenticity", "self-acceptance", "courage", "connection"]),
    image_url: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=800",
    reading_time: 5
  },
  {
    title: "Morning Routines: How the First Hour Shapes Your Day",
    slug: "morning-routines-first-hour",
    body: `How you spend the first hour of your day sets the tone for everything that follows. Yet most of us start our mornings in reactive mode – checking email, scrolling social media, immediately responding to other people's agendas.

The world's most successful people understand this. They've designed intentional morning routines that put them in control, that prepare their minds and bodies for the challenges ahead.

This doesn't mean you need to wake up at 4 AM or follow some elaborate multi-hour ritual. The key is intentionality – consciously choosing how you begin your day rather than letting it happen to you.

A powerful morning routine might include:

Movement: Even 10 minutes of stretching, yoga, or a short walk can energize your body and clear your mind.

Mindfulness: A few minutes of meditation or deep breathing helps you start the day centered and calm rather than anxious and scattered.

Planning: Review your priorities for the day. What's the one thing that, if accomplished, would make today a success?

Learning: Read a few pages of an inspiring book. Feed your mind with ideas worth thinking about.

Nourishment: Eat a healthy breakfast. Your brain needs fuel to function at its best.

The most important rule: protect this time. Don't let email, phone calls, or other people's emergencies invade your morning routine. Those things can wait. Your mental preparation cannot.

Experiment to find what works for you. The perfect morning routine is the one you'll actually do consistently. Start with just one or two elements and build from there.

How you start your day is how you live your day. How you live your day is how you live your life.`,
    excerpt: "Design an intentional morning routine that sets you up for daily success.",
    author: "David Park",
    category: "Productivity",
    tags: JSON.stringify(["morning routine", "productivity", "habits", "success", "wellness"]),
    image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    reading_time: 5
  },
  {
    title: "The Science of Rest: Why Doing Less Can Help You Achieve More",
    slug: "science-of-rest",
    body: `We worship at the altar of productivity. Hustle culture tells us that success comes from working harder, longer, faster. But the science tells a different story.

Rest is not the opposite of productivity – it's a necessary component of it. Our brains aren't designed for continuous focus. They need regular periods of rest to consolidate learning, process information, and restore cognitive resources.

The most creative insights often come not during focused work, but during periods of rest – in the shower, on a walk, just before sleep. This is because rest allows the brain's default mode network to activate, making connections between disparate ideas that we might not see otherwise.

Elite performers understand this. Studies of top athletes, musicians, and chess players show they rarely practice more than four hours a day of intense, focused work. The rest of their time is devoted to rest and recovery.

Here's how to incorporate more restorative rest into your life:

Take real breaks: Step away from your desk. Go outside. Give your mind a true rest, not just a different kind of stimulation.

Protect your sleep: This is the most important form of rest. Prioritize seven to eight hours of quality sleep above almost everything else.

Schedule downtime: Block time in your calendar for activities that restore you – time with loved ones, hobbies, time in nature.

Embrace boredom: Some of the most valuable rest comes from doing nothing at all. Resist the urge to fill every moment with stimulation.

Take vacations: Real ones, where you actually disconnect from work. Your brain needs extended periods of rest to fully recover.

Rest is not laziness. It's wisdom. It's understanding that sustainable high performance requires periods of recovery. The goal isn't to do more – it's to do your best work, and that requires knowing when to stop.`,
    excerpt: "Discover why strategic rest is essential for peak performance and creativity.",
    author: "Dr. Sarah Mitchell",
    category: "Wellness",
    tags: JSON.stringify(["rest", "productivity", "sleep", "recovery", "wellbeing"]),
    image_url: "https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800",
    reading_time: 6
  },
  {
    title: "Building Resilience: How to Bounce Back from Life's Challenges",
    slug: "building-resilience",
    body: `Life will knock you down. This isn't pessimism – it's reality. Setbacks, failures, losses, and disappointments are inevitable parts of the human experience. What matters is not whether you'll face adversity, but how you'll respond to it.

Resilience – the ability to recover from difficulties and adapt to change – is not a fixed trait you either have or don't have. It's a skill that can be developed, strengthened, and cultivated over time.

Research shows that resilient people share certain characteristics:

They maintain perspective. While acknowledging that their situation is difficult, they don't catastrophize. They remember that setbacks are temporary and that they've overcome challenges before.

They stay connected. Rather than isolating themselves, resilient people reach out to their support networks during difficult times. They're not afraid to ask for help.

They take action. Instead of feeling paralyzed by circumstances, they look for what they can control and take small steps forward. Action builds momentum and self-efficacy.

They practice self-compassion. They treat themselves with the same kindness they would offer a good friend. They don't add suffering by berating themselves for struggling.

They find meaning. Even in the darkest moments, resilient people look for lessons, growth, and purpose. They ask not "Why is this happening to me?" but "What can I learn from this?"

Building resilience is a practice. Each time you face a challenge and work through it, you strengthen your resilience muscles. You build confidence in your ability to handle whatever comes next.

Remember: you are more capable than you know. Every difficulty you've survived is evidence of your resilience. Trust that you can handle this too.`,
    excerpt: "Learn the practices and mindsets that help you recover stronger from life's inevitable challenges.",
    author: "Michael Torres",
    category: "Personal Growth",
    tags: JSON.stringify(["resilience", "adversity", "mental strength", "growth", "mindset"]),
    image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    reading_time: 6
  },
  {
    title: "The Art of Saying No: Setting Boundaries for a Better Life",
    slug: "art-of-saying-no",
    body: `Every yes is a no to something else. When you say yes to a commitment you don't truly want, you're saying no to the things that matter most to you. Your time, energy, and attention are finite resources. How you allocate them is one of the most important decisions you make.

Yet many of us struggle terribly with saying no. We fear disappointing others. We worry about being seen as selfish or unhelpful. We've been conditioned to believe that being a good person means always being available, always accommodating, always agreeable.

But boundaries aren't walls – they're gates. They're how we define what we will and won't accept, what we have capacity for and what we don't. They're essential for maintaining our wellbeing and honoring our priorities.

Learning to say no starts with getting clear on what matters to you. What are your values? What are your goals? What brings you energy and what drains it? When you know what you're saying yes to, saying no becomes easier.

Here are some ways to say no gracefully:

"I appreciate you thinking of me, but I can't commit to this right now."

"That sounds interesting, but it doesn't fit with my current priorities."

"I'm not the right person for this, but perhaps [name] could help."

"I need to check my calendar and get back to you." (This gives you time to decide without pressure.)

Notice that you don't need to justify or explain your no. A simple, kind refusal is enough.

Saying no gets easier with practice. Each time you do it, you reinforce your boundaries and your self-respect. You teach others how to treat you. You create space for what truly matters.

Remember: every no is a yes to yourself.`,
    excerpt: "Master the essential skill of setting boundaries to protect your time and energy.",
    author: "Rachel Kim",
    category: "Personal Growth",
    tags: JSON.stringify(["boundaries", "self-care", "priorities", "communication", "empowerment"]),
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    reading_time: 5
  },
  {
    title: "Finding Your Purpose: A Journey of Self-Discovery",
    slug: "finding-your-purpose",
    body: `The search for purpose is one of humanity's oldest quests. We long to know that our lives matter, that we're here for a reason, that our existence contributes something meaningful to the world.

But here's what many get wrong about purpose: it's not something you find. It's something you create. Purpose isn't hidden somewhere, waiting to be discovered. It emerges from the intersection of what you love, what you're good at, what the world needs, and what you can be rewarded for.

The Japanese concept of Ikigai captures this beautifully. Your purpose lies at the center of four overlapping circles: your passion, your vocation, your profession, and your mission.

Finding purpose is less about a single "aha!" moment and more about patient exploration. It requires asking yourself difficult questions and sitting with the answers:

What activities make you lose track of time?
What problems in the world break your heart?
What would you do if money weren't a consideration?
What do people regularly ask for your help with?
When do you feel most alive?

Purpose can also change over time. The calling that drives you in your twenties may evolve as you age and grow. This isn't failure – it's natural evolution.

Some people find purpose in their careers. Others find it in raising children, creating art, serving their communities, or caring for loved ones. There's no hierarchy of purposes, no right or wrong answer. What matters is that it feels meaningful to you.

Finally, remember that purpose doesn't need to be grandiose. Sometimes purpose is simply being kind to the people you encounter, doing your work with integrity, and making your small corner of the world a little better.

Your purpose is already within you. It's not something to find but something to uncover.`,
    excerpt: "A practical guide to uncovering what gives your life meaning and direction.",
    author: "Thomas Anderson",
    category: "Self-Discovery",
    tags: JSON.stringify(["purpose", "meaning", "ikigai", "self-discovery", "life direction"]),
    image_url: "https://images.unsplash.com/photo-1502101872923-d48509bff386?w=800",
    reading_time: 7
  },
  {
    title: "The Power of Mindful Breathing: Your Anchor in the Storm",
    slug: "power-of-mindful-breathing",
    body: `Your breath is always with you. It's the most portable, accessible tool for managing stress, anxiety, and overwhelm. And yet most of us pay no attention to it until something goes wrong.

Mindful breathing – the practice of consciously observing and regulating your breath – has profound effects on both body and mind. When you slow your breathing, you activate the parasympathetic nervous system, triggering a cascade of calming effects: lower heart rate, reduced blood pressure, decreased cortisol, and a quieter mind.

This isn't just ancient wisdom – it's backed by modern science. Studies show that regular breathing practices can reduce anxiety, improve focus, enhance sleep quality, and even strengthen the immune system.

Here's a simple practice to start:

Box Breathing (used by Navy SEALs):
1. Inhale slowly for 4 counts
2. Hold your breath for 4 counts
3. Exhale slowly for 4 counts
4. Hold empty for 4 counts
5. Repeat 4-6 times

You can do this anywhere – at your desk, in a meeting, in traffic, in bed. No one needs to know you're doing it.

The magic of breath work is that it gives your mind something to focus on. Instead of spiraling into anxious thoughts, you anchor your attention to the sensation of breathing. This simple redirection can break the cycle of stress.

Start small. Take three conscious breaths before checking your email. Pause for a breathing break between meetings. End your day with five minutes of slow, deep breathing.

Your breath is a bridge between your conscious and unconscious mind, between doing and being, between stress and peace. Learn to use it, and you carry a powerful tool with you wherever you go.`,
    excerpt: "Learn simple breathing techniques that can calm your mind and body in minutes.",
    author: "Dr. Lisa Chang",
    category: "Mindfulness",
    tags: JSON.stringify(["breathing", "mindfulness", "stress relief", "anxiety", "meditation"]),
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    reading_time: 5
  },
  {
    title: "Digital Detox: Reclaiming Your Attention in the Age of Distraction",
    slug: "digital-detox",
    body: `The average person checks their phone 96 times a day. That's once every 10 minutes during waking hours. We've become addicted to our devices, and it's affecting our mental health, relationships, and ability to do meaningful work.

This isn't an accident. Billions of dollars have been spent engineering apps and platforms to be as addictive as possible. Variable rewards, infinite scroll, social validation – these are all techniques borrowed from casinos and designed to keep you coming back.

The first step to breaking free is awareness. Start noticing your patterns. When do you reach for your phone? What triggers the urge? How do you feel before, during, and after scrolling?

For many of us, the phone has become a pacifier – something we reach for whenever we feel bored, anxious, lonely, or uncomfortable. But by constantly filling these moments with stimulation, we never develop the capacity to sit with ourselves.

Here are practical steps for a digital detox:

Start with boundaries: No phone in the bedroom. No phone at meals. No phone for the first hour after waking.

Create friction: Remove social media apps from your phone. Log out after each use. Make it harder to mindlessly scroll.

Find replacements: When you feel the urge to check your phone, do something else instead – take a breath, look around, talk to someone nearby.

Schedule device-free time: Block out periods each day when you're completely offline. Protect this time fiercely.

Audit your notifications: Turn off all non-essential notifications. You don't need to know instantly about every like, comment, or email.

The goal isn't to become a Luddite or reject technology entirely. It's to use technology intentionally, as a tool that serves you rather than a master that controls you.

Your attention is your most valuable resource. Take it back.`,
    excerpt: "Practical strategies for breaking free from smartphone addiction and reclaiming your focus.",
    author: "Alex Rivera",
    category: "Wellness",
    tags: JSON.stringify(["digital detox", "technology", "attention", "focus", "mental health"]),
    image_url: "https://images.unsplash.com/photo-1529604278261-8bfcdb00a7b9?w=800",
    reading_time: 6
  }
]

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'inspirational_articles',
  })

  console.log('Connected to database')

  for (const article of articles) {
    try {
      await connection.execute(
        `INSERT INTO articles (title, slug, body, excerpt, author, category, tags, image_url, reading_time, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE title = title`,
        [
          article.title,
          article.slug,
          article.body,
          article.excerpt,
          article.author,
          article.category,
          article.tags,
          article.image_url,
          article.reading_time,
        ]
      )
      console.log(`Inserted: ${article.title}`)
    } catch (error) {
      console.error(`Error inserting ${article.title}:`, error)
    }
  }

  console.log('Seeding complete!')
  await connection.end()
}

seed().catch(console.error)
