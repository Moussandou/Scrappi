import { describe, it, expect, vi } from 'vitest';
import type { Scrapbook } from '@/domain/entities';

// Mock Firebase dependencies before importing the service
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('@/infra/db/firebase', () => ({
  db: {},
}));

import { aggregateUsers } from '@/infra/db/adminService';

// Mock types for inputs
type MockScrapbook = Scrapbook & { userId: string };
type UserProfile = {
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLoginAt?: { toDate: () => Date };
};

describe('aggregateUsers', () => {
  it('should correctly aggregate a single user with one scrapbook', () => {
    const scrapbooks: MockScrapbook[] = [
      {
        id: 'sb1',
        title: 'My Scrapbook',
        userId: 'user1',
        updatedAt: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        coverImage: '',
        coverZoom: 1,
        coverX: 50,
        coverY: 50,
        showPreview: true,
        binderColor: '#000000',
        binderGrain: 'leather'
      },
    ];
    const profiles = new Map<string, UserProfile>([
      ['user1', { email: 'test@example.com', displayName: 'Test User' }],
    ]);

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uid: 'user1',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: '',
      scrapbookCount: 1,
      latestActivity: '2023-01-01T00:00:00Z',
    });
  });

  it('should aggregate multiple scrapbooks for the same user', () => {
    const scrapbooks: MockScrapbook[] = [
      {
        id: 'sb1',
        title: 'SB 1',
        userId: 'user1',
        updatedAt: '2023-01-01T10:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        coverImage: '',
        coverZoom: 1,
        coverX: 50,
        coverY: 50,
        showPreview: true,
        binderColor: '#000000',
        binderGrain: 'leather'
      },
      {
        id: 'sb2',
        title: 'SB 2',
        userId: 'user1',
        updatedAt: '2023-01-02T10:00:00Z', // Later date
        createdAt: '2023-01-01T00:00:00Z',
        coverImage: '',
        coverZoom: 1,
        coverX: 50,
        coverY: 50,
        showPreview: true,
        binderColor: '#000000',
        binderGrain: 'leather'
      },
    ];
    const profiles = new Map<string, UserProfile>([
      ['user1', { email: 'test@example.com' }],
    ]);

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe('user1');
    expect(result[0].scrapbookCount).toBe(2);
    expect(result[0].latestActivity).toBe('2023-01-02T10:00:00Z');
  });

  it('should include users with profiles but no scrapbooks', () => {
    const scrapbooks: MockScrapbook[] = [];
    const profiles = new Map<string, UserProfile>([
      ['user2', {
        email: 'user2@example.com',
        lastLoginAt: { toDate: () => new Date('2023-01-05T00:00:00Z') }
      }],
    ]);

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uid: 'user2',
      email: 'user2@example.com',
      displayName: '',
      photoURL: '',
      scrapbookCount: 0,
      latestActivity: '2023-01-05T00:00:00.000Z',
    });
  });

  it('should handle users with profiles but no scrapbooks and no login date', () => {
    const scrapbooks: MockScrapbook[] = [];
    const profiles = new Map<string, UserProfile>([
      ['user3', { email: 'user3@example.com' }],
    ]);

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uid: 'user3',
      email: 'user3@example.com',
      displayName: '',
      photoURL: '',
      scrapbookCount: 0,
      latestActivity: '',
    });
  });

  it('should handle users with scrapbooks but missing profile', () => {
    const scrapbooks: MockScrapbook[] = [
      {
        id: 'sb3',
        userId: 'unknownUser',
        updatedAt: '2023-01-03T00:00:00Z',
        createdAt: '2023-01-03T00:00:00Z',
        title: 'Ghost SB',
        coverImage: '',
        coverZoom: 1,
        coverX: 50,
        coverY: 50,
        showPreview: true,
        binderColor: '#000000',
        binderGrain: 'leather'
      },
    ];
    const profiles = new Map<string, UserProfile>();

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uid: 'unknownUser',
      email: '',
      displayName: '',
      photoURL: '',
      scrapbookCount: 1,
      latestActivity: '2023-01-03T00:00:00Z',
    });
  });

  it('should ignore scrapbooks without a userId', () => {
    const scrapbooks: MockScrapbook[] = [
      {
        id: 'sb4',
        userId: '', // Missing userId
        updatedAt: '2023-01-04T00:00:00Z',
        createdAt: '2023-01-04T00:00:00Z',
        title: 'Orphan SB',
        coverImage: '',
        coverZoom: 1,
        coverX: 50,
        coverY: 50,
        showPreview: true,
        binderColor: '#000000',
        binderGrain: 'leather'
      },
    ];
    const profiles = new Map<string, UserProfile>();

    const result = aggregateUsers(scrapbooks, profiles);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty inputs', () => {
    const result = aggregateUsers([], new Map());
    expect(result).toEqual([]);
  });
});
