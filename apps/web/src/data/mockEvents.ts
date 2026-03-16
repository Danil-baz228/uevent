export type EventPreview = {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: string;
  attendance: string;
  mood: 'sunrise' | 'mint' | 'night';
};

export const mockEvents: EventPreview[] = [
  {
    id: 'evt-product-night',
    title: 'Product Night for Curious Builders',
    category: 'Networking',
    city: 'Kharkiv',
    startsAt: 'Apr 8, 2026 • 18:30',
    price: 'Free',
    attendance: '92 attending',
    mood: 'sunrise',
  },
  {
    id: 'evt-design-jam',
    title: 'Design Jam for Community Organizers',
    category: 'Workshop',
    city: 'Kyiv',
    startsAt: 'Apr 12, 2026 • 16:00',
    price: '$15',
    attendance: '41 attending',
    mood: 'mint',
  },
  {
    id: 'evt-sound-and-code',
    title: 'Sound and Code Meetup',
    category: 'Meetup',
    city: 'Lviv',
    startsAt: 'Apr 19, 2026 • 19:15',
    price: 'Free',
    attendance: '68 attending',
    mood: 'night',
  },
];
