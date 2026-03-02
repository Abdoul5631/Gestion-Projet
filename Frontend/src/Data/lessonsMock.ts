export interface Lesson {
  id: number;
  title: string;
  subject: string;
  level: string;
  progress: number;
}

export const lessonsMock: Lesson[] = [
  {
    id: 1,
    title: 'Addition simple',
    subject: 'Mathématiques',
    level: 'CP1',
    progress: 80,
  },
  {
    id: 2,
    title: 'Soustraction simple',
    subject: 'Mathématiques',
    level: 'CP1',
    progress: 40,
  },
  {
    id: 3,
    title: 'Lecture des syllabes',
    subject: 'Français',
    level: 'CP1',
    progress: 60,
  },
  {
    id: 4,
    title: 'Nombres de 1 à 100',
    subject: 'Mathématiques',
    level: 'CP2',
    progress: 0,
  },
];
