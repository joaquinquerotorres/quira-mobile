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

  test('collectRequestMedia includes extra media after principal', () => {
    expect(
      collectRequestMedia({
        photoUrl: '/p.jpg',
        extraPhotoUrls: ['/p2.jpg', '  ', null],
        extraVideoUrls: ['/v2.mp4'],
        extraAudioUrls: ['/a2.mp3'],
      }),
    ).toEqual([
      { kind: 'photo', url: '/p.jpg' },
      { kind: 'photo', url: '/p2.jpg' },
      { kind: 'video', url: '/v2.mp4' },
      { kind: 'audio', url: '/a2.mp3' },
    ]);
  });

  test('collectRequestMedia works with extras only', () => {
    expect(
      collectRequestMedia({
        extraPhotoUrls: ['/extra.jpg'],
        extraAudioUrls: ['/extra.mp3'],
      }),
    ).toEqual([
      { kind: 'photo', url: '/extra.jpg' },
      { kind: 'audio', url: '/extra.mp3' },
    ]);
  });

  test('hasRequestMedia is false when empty', () => {
    expect(hasRequestMedia({})).toBe(false);
    expect(hasRequestMedia({ photoUrl: null, videoUrl: '', audioUrl: undefined })).toBe(
      false,
    );
    expect(hasRequestMedia({ photoUrl: '  null  ' })).toBe(false);
    expect(hasRequestMedia({ extraPhotoUrls: [null, ''] })).toBe(false);
  });

  test('hasRequestMedia is true when any media exists', () => {
    expect(hasRequestMedia({ audioUrl: '/a.mp3' })).toBe(true);
    expect(hasRequestMedia({ extraVideoUrls: ['/v.mp4'] })).toBe(true);
  });
});
