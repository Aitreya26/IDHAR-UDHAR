import { College } from '../types';

export const DEFAULT_SAFE_MEETUP_SPOTS: string[] = [
  'University Market',
  'Central Library',
  'UIET Main Building',
  'Mechanical Block',
  'Sports Complex Gate',
  'Boys Hostel Complex Gate',
  'Girls Hostel Complex Gate'
];

export const COLLEGES: College[] = [
  {
    id: 'uiet-kurukshetra',
    name: 'UIET Kurukshetra University',
    shortName: 'UIET Kurukshetra',
    city: 'Kurukshetra, Haryana',
    hostels: [
      'Day Scholar',
      'Shaheed Bhagat Singh Bhawan',
      'Narhari Bhawan',
      'Pratap Bhawan',
      'Bheem Bhawan',
      'Ch. Devi Lal Bhawan',
      'Hostel 7 (Charak Bhawan)',
      'Hostel 8 (Aryabhatta)',
      'Hostel 9 (Bhabha Bhawan)',
      'Bhagirathi Bhawan',
      'Kalpana Chawla Bhawan',
      'Laxmi Bai Bhawan',
      'Kasturba Bhawan',
      'Ganga Bhawan',
      'Yamuna Bhawan'
    ],
    safeMeetupSpots: [...DEFAULT_SAFE_MEETUP_SPOTS]
  },
  {
    id: 'nit-kurukshetra',
    name: 'NIT Kurukshetra',
    shortName: 'NIT KKR',
    city: 'Kurukshetra, Haryana',
    hostels: [
      'Hostel 10 (Aryabhatta Bhawan)',
      'Hostel 1 (Vishweshwaraya)',
      'Hostel 3 (Chanakya)',
      'Hostel 5 (Vivekananda)',
      'Kalpana Chawla Bhawan (Girls)',
      'Alaknanda Bhawan (Girls)',
      'Cauvery Bhawan'
    ],
    safeMeetupSpots: [...DEFAULT_SAFE_MEETUP_SPOTS]
  },
  {
    id: 'iit-delhi',
    name: 'IIT Delhi (Hauz Khas)',
    shortName: 'IIT Delhi',
    city: 'New Delhi',
    hostels: [
      'Nilgiri Hostel',
      'Zanskar Hostel',
      'Karakoram Hostel',
      'Aravali Hostel',
      'Himadri Girls Hostel',
      'Kailash Girls Hostel',
      'Kumaon Hostel',
      'Vindhyachal Hostel'
    ],
    safeMeetupSpots: [...DEFAULT_SAFE_MEETUP_SPOTS]
  },
  {
    id: 'dtu-delhi',
    name: 'Delhi Technological University (DTU)',
    shortName: 'DTU Delhi',
    city: 'Rohini, Delhi',
    hostels: [
      'Sir CV Raman Hostel',
      'Aryabhatta Hostel',
      'Homi Jehangir Bhabha Hostel',
      'Sir Visvesvaraya Hostel',
      'Sister Nivedita Girls Hostel',
      'Kalpana Chawla Hostel'
    ],
    safeMeetupSpots: [...DEFAULT_SAFE_MEETUP_SPOTS]
  }
];
