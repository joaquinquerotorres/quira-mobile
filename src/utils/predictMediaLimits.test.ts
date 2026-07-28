import { describe, expect, it } from 'vitest';
import {
  PREDICT_AUDIO_MAX_BYTES,
  PREDICT_IMAGE_MAX_BYTES,
  PREDICT_VIDEO_MAX_BYTES,
  formatPredictMediaLimitMb,
  maxBytesForPredictMedia,
} from './predictMediaLimits';

describe('predictMediaLimits', () => {
  it('expone 10 / 12 / 40 MB (decimal) como el API PredictMediaLimits', () => {
    expect(PREDICT_IMAGE_MAX_BYTES).toBe(10_000_000);
    expect(PREDICT_AUDIO_MAX_BYTES).toBe(12_000_000);
    expect(PREDICT_VIDEO_MAX_BYTES).toBe(40_000_000);
  });

  it('maxBytesForPredictMedia mapea photo/image/audio/video', () => {
    expect(maxBytesForPredictMedia('photo')).toBe(PREDICT_IMAGE_MAX_BYTES);
    expect(maxBytesForPredictMedia('image')).toBe(PREDICT_IMAGE_MAX_BYTES);
    expect(maxBytesForPredictMedia('audio')).toBe(PREDICT_AUDIO_MAX_BYTES);
    expect(maxBytesForPredictMedia('video')).toBe(PREDICT_VIDEO_MAX_BYTES);
  });

  it('formatPredictMediaLimitMb redondea a MB decimales', () => {
    expect(formatPredictMediaLimitMb(PREDICT_IMAGE_MAX_BYTES)).toBe('10');
    expect(formatPredictMediaLimitMb(PREDICT_AUDIO_MAX_BYTES)).toBe('12');
    expect(formatPredictMediaLimitMb(PREDICT_VIDEO_MAX_BYTES)).toBe('40');
  });
});
