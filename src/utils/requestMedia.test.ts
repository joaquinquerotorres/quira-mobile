import { collectRequestMedia, hasRequestMedia } from './requestMedia';

describe('requestMedia', () => {
  test('collectRequestMedia returns photo, video and audio in order', () => {
    expect(
      collectRequestMedia({
        photoUrl: '/p.jpg',
        videoUrl: '/v.mp4',
        audioUrl: '/a.mp3',
      }),
    ).toEqual([
      { kind: 'photo', url: '/p.jpg' },
      { kind: 'video', url: '/v.mp4' },
      { kind: 'audio', url: '/a.mp3' },
    ]);
  });

  test('hasRequestMedia is false when empty', () => {
    expect(hasRequestMedia({})).toBe(false);
    expect(hasRequestMedia({ photoUrl: null, videoUrl: '', audioUrl: undefined })).toBe(
      false,
    );
    expect(hasRequestMedia({ photoUrl: '  null  ' })).toBe(false);
  });

  test('hasRequestMedia is true when any media exists', () => {
    expect(hasRequestMedia({ audioUrl: '/a.mp3' })).toBe(true);
  });
});
