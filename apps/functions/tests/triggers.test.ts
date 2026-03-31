import { describe, expect, it } from 'vitest';

function deriveShipmentStatus(pieceStatuses: string[]): string {
  if (pieceStatuses.every((s) => s === 'picked_up')) return 'picked_up';
  if (pieceStatuses.every((s) => s === 'delivered' || s === 'picked_up')) return 'delivered';
  if (pieceStatuses.some((s) => s === 'delivered' || s === 'picked_up')) return 'partially_delivered';
  if (pieceStatuses.some((s) => s === 'in_transit')) return 'in_transit';
  return 'created';
}

describe('deriveShipmentStatus', () => {
  it('returns created when all pieces are created', () => {
    expect(deriveShipmentStatus(['created', 'created', 'created'])).toBe('created');
  });

  it('returns in_transit when any piece is in_transit', () => {
    expect(deriveShipmentStatus(['created', 'in_transit', 'created'])).toBe('in_transit');
  });

  it('returns partially_delivered when some pieces delivered', () => {
    expect(deriveShipmentStatus(['created', 'delivered', 'created'])).toBe('partially_delivered');
  });

  it('returns delivered when all pieces are delivered or picked_up', () => {
    expect(deriveShipmentStatus(['delivered', 'delivered', 'picked_up'])).toBe('delivered');
  });

  it('returns picked_up when all pieces are picked_up', () => {
    expect(deriveShipmentStatus(['picked_up', 'picked_up'])).toBe('picked_up');
  });
});
