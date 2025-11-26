import { describe, it, expect } from 'vitest';
import { shuffleArray } from '../shuffle';

describe('shuffleArray', () => {
    it('returns an array with the same elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const shuffled = shuffleArray(arr);

        // same length
        expect(shuffled).toHaveLength(arr.length);

        // contains same values (multiset equality)
        const sortA = [...arr].sort();
        const sortB = [...shuffled].sort();
        expect(sortB).toEqual(sortA);

        // should not be the same reference
        expect(shuffled).not.toBe(arr);
    });

    it('handles empty and single element arrays', () => {
        expect(shuffleArray([])).toEqual([]);
        expect(shuffleArray([42])).toEqual([42]);
    });
});
