import { describe, expect, it } from 'vitest';

import { CABIN_SELECT_OPTIONS, STAY_OPTIONS, WORK_NEEDS } from './work-stays.data';

describe('work-stays.data', () => {
  it('lists six work needs', () => {
    expect(WORK_NEEDS).toHaveLength(6);
  });

  it('includes three stay options', () => {
    expect(STAY_OPTIONS).toHaveLength(3);
  });

  it('includes all cabins plus no preference in the select', () => {
    expect(CABIN_SELECT_OPTIONS[0]?.label).toBe('No preference');
    expect(CABIN_SELECT_OPTIONS.length).toBe(7);
  });
});