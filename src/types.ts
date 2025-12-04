import { Timestamp } from 'firebase/firestore';

export interface Story {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  status: 'ongoing' | 'completed';
  summary: string;
  coverUrl?: string;
  genre?: string;
}

export interface Contribution {
  id: string;
  storyId: string;
  parentId: string | null;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  likes: number;
  isCanon: boolean;
  tags: {
    characters: string[];
    location: string;
    time: string;
  };
  createdAt: Timestamp;
}

export interface AIReview {
  id: string;
  rank: number;
  reason: string;
}
