import type { Level } from '@/lib/core/levels'

export type Role = 'A' | 'B'

export interface DialogueLine {
  speaker: Role
  text: string
}

export interface Dialogue {
  slug: string
  level: Level
  title: string
  /** 120-160 characters, used as the meta description. */
  summary: string
  roles: Record<Role, string>
  lines: DialogueLine[]
  phrases: { phrase: string; meaning: string }[]
}

export const DIALOGUES: Dialogue[] = [
  {
    slug: 'ordering-coffee',
    level: 'A1',
    title: 'Ordering coffee in a café',
    summary: 'Practise ordering a drink, choosing a size and paying in a café. Listen to the dialogue, then play one role and speak your lines aloud.',
    roles: { A: 'Barista', B: 'Customer' },
    lines: [
      { speaker: 'A', text: 'Good morning! What can I get you?' },
      { speaker: 'B', text: 'Hello. Can I have a latte, please?' },
      { speaker: 'A', text: 'Sure. Small, medium or large?' },
      { speaker: 'B', text: 'Medium, please.' },
      { speaker: 'A', text: 'Would you like anything to eat?' },
      { speaker: 'B', text: 'Yes, a chocolate muffin, please.' },
      { speaker: 'A', text: 'That’s six dollars fifty.' },
      { speaker: 'B', text: 'Here you are. Thank you!' },
    ],
    phrases: [
      { phrase: 'What can I get you?', meaning: 'A polite way to ask what someone wants to order.' },
      { phrase: 'Can I have ..., please?', meaning: 'The most common way to order food or drink.' },
      { phrase: 'Would you like anything to eat?', meaning: 'Offering extra items politely.' },
      { phrase: 'Here you are.', meaning: 'Said when you hand something to someone.' },
    ],
  },
  {
    slug: 'asking-for-directions',
    level: 'A2',
    title: 'Asking for directions',
    summary: 'Learn the phrases for asking the way and giving directions in a city, then practise both roles and check your pronunciation.',
    roles: { A: 'Tourist', B: 'Local' },
    lines: [
      { speaker: 'A', text: 'Excuse me, could you tell me how to get to the museum?' },
      { speaker: 'B', text: 'Of course. Go straight on and turn left at the traffic lights.' },
      { speaker: 'A', text: 'Is it far from here?' },
      { speaker: 'B', text: 'No, it’s about five minutes on foot.' },
      { speaker: 'A', text: 'And is there a bank near the museum?' },
      { speaker: 'B', text: 'Yes, there’s one opposite the entrance.' },
      { speaker: 'A', text: 'Great, thanks so much for your help.' },
      { speaker: 'B', text: 'You’re welcome. Enjoy your visit!' },
    ],
    phrases: [
      { phrase: 'Could you tell me how to get to ...?', meaning: 'A polite request for directions.' },
      { phrase: 'Turn left at the traffic lights.', meaning: 'A typical direction with a landmark.' },
      { phrase: 'It’s about five minutes on foot.', meaning: 'Describing distance by walking time.' },
      { phrase: 'opposite the entrance', meaning: 'On the other side, facing it.' },
    ],
  },
  {
    slug: 'hotel-check-in',
    level: 'A2',
    title: 'Checking in at a hotel',
    summary: 'Practise a hotel check-in conversation: confirming a booking, asking about breakfast and getting your room key. Speak and get instant feedback.',
    roles: { A: 'Receptionist', B: 'Guest' },
    lines: [
      { speaker: 'A', text: 'Good evening. Do you have a reservation?' },
      { speaker: 'B', text: 'Yes, it’s under the name Petrov, for two nights.' },
      { speaker: 'A', text: 'Let me check. Yes, a double room with a view of the park.' },
      { speaker: 'B', text: 'Lovely. What time is breakfast?' },
      { speaker: 'A', text: 'Breakfast is from seven to ten in the restaurant.' },
      { speaker: 'B', text: 'And is there Wi-Fi in the room?' },
      { speaker: 'A', text: 'Yes, the password is on your key card. Here’s your key.' },
      { speaker: 'B', text: 'Thank you very much.' },
    ],
    phrases: [
      { phrase: 'Do you have a reservation?', meaning: 'Asking if a booking was made in advance.' },
      { phrase: 'under the name ...', meaning: 'The name the booking was made with.' },
      { phrase: 'for two nights', meaning: 'The length of the stay.' },
      { phrase: 'Let me check.', meaning: 'Said while looking something up.' },
    ],
  },
  {
    slug: 'doctors-appointment',
    level: 'B1',
    title: 'At the doctor’s',
    summary: 'Describe symptoms, answer a doctor’s questions and understand advice. A B1 dialogue with key health phrases and speaking practice.',
    roles: { A: 'Doctor', B: 'Patient' },
    lines: [
      { speaker: 'A', text: 'Come in and sit down. What seems to be the problem?' },
      { speaker: 'B', text: 'I’ve had a sore throat and a headache since Monday.' },
      { speaker: 'A', text: 'Do you have a temperature?' },
      { speaker: 'B', text: 'I took it this morning and it was thirty-eight degrees.' },
      { speaker: 'A', text: 'I see. Are you allergic to any medication?' },
      { speaker: 'B', text: 'No, not that I know of.' },
      { speaker: 'A', text: 'I’ll prescribe something for the infection. You should rest and drink plenty of water.' },
      { speaker: 'B', text: 'How long before I start feeling better?' },
      { speaker: 'A', text: 'A few days. Come back if it hasn’t improved by Friday.' },
    ],
    phrases: [
      { phrase: 'What seems to be the problem?', meaning: 'A doctor’s standard opening question.' },
      { phrase: 'I’ve had ... since Monday.', meaning: 'Present perfect for symptoms that started in the past and continue.' },
      { phrase: 'Are you allergic to any medication?', meaning: 'A routine safety question.' },
      { phrase: 'not that I know of', meaning: 'A cautious way to say no.' },
    ],
  },
  {
    slug: 'job-interview',
    level: 'B1',
    title: 'A job interview',
    summary: 'Answer common interview questions about experience, strengths and goals. Practise both roles and improve your pronunciation with instant feedback.',
    roles: { A: 'Interviewer', B: 'Candidate' },
    lines: [
      { speaker: 'A', text: 'Thanks for coming in. Could you start by telling me a little about yourself?' },
      { speaker: 'B', text: 'Of course. I’ve worked in customer service for four years, and I’m looking for a role with more responsibility.' },
      { speaker: 'A', text: 'What would you say is your greatest strength?' },
      { speaker: 'B', text: 'I’m good at staying calm under pressure and solving problems quickly.' },
      { speaker: 'A', text: 'And where do you see yourself in five years?' },
      { speaker: 'B', text: 'I’d like to be leading a small team and helping others develop.' },
      { speaker: 'A', text: 'Do you have any questions for us?' },
      { speaker: 'B', text: 'Yes. What does a typical week look like in this role?' },
    ],
    phrases: [
      { phrase: 'Tell me a little about yourself.', meaning: 'The classic opening interview request.' },
      { phrase: 'under pressure', meaning: 'In a stressful, demanding situation.' },
      { phrase: 'Where do you see yourself in five years?', meaning: 'A question about career goals.' },
      { phrase: 'I’m looking for a role with more responsibility.', meaning: 'Explaining why you want a new job.' },
    ],
  },
  {
    slug: 'returning-a-product',
    level: 'B2',
    title: 'Returning a faulty product',
    summary: 'Explain a problem politely, ask for a refund and negotiate an outcome. A B2 customer-service dialogue with useful phrases and speaking practice.',
    roles: { A: 'Shop assistant', B: 'Customer' },
    lines: [
      { speaker: 'A', text: 'Hello, how can I help you today?' },
      { speaker: 'B', text: 'I bought these headphones last week, but the left earpiece has stopped working.' },
      { speaker: 'A', text: 'I’m sorry to hear that. Do you have the receipt with you?' },
      { speaker: 'B', text: 'I do. I’d like a refund, if possible, rather than a replacement.' },
      { speaker: 'A', text: 'Normally we only offer an exchange, but I can make an exception since it’s within seven days.' },
      { speaker: 'B', text: 'That would be great. I’d appreciate that.' },
      { speaker: 'A', text: 'The money will go back onto your card within five working days.' },
      { speaker: 'B', text: 'Perfect. Thank you for sorting this out so quickly.' },
    ],
    phrases: [
      { phrase: 'has stopped working', meaning: 'Present perfect for a sudden change of state.' },
      { phrase: 'a refund rather than a replacement', meaning: 'Stating a preference clearly.' },
      { phrase: 'make an exception', meaning: 'Allow something that is normally against the rules.' },
      { phrase: 'sort this out', meaning: 'Solve a problem.' },
    ],
  },
]

export const getDialogue = (slug: string): Dialogue | undefined => DIALOGUES.find((d) => d.slug === slug)
