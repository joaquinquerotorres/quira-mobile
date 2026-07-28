import { describe, expect, test } from 'vitest';
import { getClientDetailStatus, getProDetailStatus } from './detailStatus';

describe('getClientDetailStatus', () => {
  test('maps request statuses', () => {
    expect(getClientDetailStatus('PENDING')).toEqual({ key: 'pending', label: 'Pendiente' });
    expect(getClientDetailStatus('ACCEPTED')).toEqual({ key: 'assigned', label: 'Asignado' });
    expect(getClientDetailStatus('COMPLETED')).toEqual({ key: 'completed', label: 'Finalizado' });
    expect(getClientDetailStatus('PENDING_APPROVAL')).toEqual({
      key: 'pending_approval',
      label: 'En revisión',
    });
  });
});

describe('getProDetailStatus', () => {
  test('available when no bid', () => {
    expect(getProDetailStatus({ isCompleted: false, isWinner: false, hasBid: false })).toEqual({
      key: 'available',
      label: 'Disponible',
    });
  });

  test('sent when has bid', () => {
    expect(getProDetailStatus({ isCompleted: false, isWinner: false, hasBid: true })).toEqual({
      key: 'sent',
      label: 'Propuesta Enviada',
    });
  });

  test('winner and completed take precedence', () => {
    expect(getProDetailStatus({ isCompleted: false, isWinner: true, hasBid: true })).toEqual({
      key: 'assigned',
      label: 'Trabajo Ganado',
    });
    expect(getProDetailStatus({ isCompleted: true, isWinner: true, hasBid: true })).toEqual({
      key: 'completed',
      label: 'Finalizado',
    });
  });
});
