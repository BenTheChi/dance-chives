export function ObjectComparison(
  initial: { [key: string]: any },
  changed: { [key: string]: any }
): { [key: string]: any } {
  let result: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(changed)) {
    if (Array.isArray(initial[key]) && Array.isArray(value)) {
      if (JSON.stringify(initial[key]) !== JSON.stringify(value)) {
        result[key] = value;
      }
    } else if (initial[key] !== value) {
      result[key] = value;
    }
  }

  return result;
}

export function ArrayComparison(initial: any[], changed: any[]): any[] {
  let result: any[] = [];

  for (let i = 0; i < changed.length; i++) {
    if (JSON.stringify(initial[i]) !== JSON.stringify(changed[i])) {
      result.push(changed[i]);
    }
  }

  return result;
}

type Difference = {
  added: any;
  removed: any;
};

export function deepDiff(initial: any, changed: any): Difference {
  // Base case: if either value is not an object, compare directly
  if (!initial || !changed || typeof initial !== 'object' || typeof changed !== 'object') {
    if (initial === changed) return { added: {}, removed: {} };
    return {
      added: changed === undefined ? {} : changed,
      removed: initial === undefined ? {} : initial,
    };
  }

  // Handle arrays
  if (Array.isArray(initial) || Array.isArray(changed)) {
    return compareArrays(initial || [], changed || []);
  }

  const difference: Difference = {
    added: {},
    removed: {},
  };

  // Check all keys in both objects
  const allKeys = new Set([...Object.keys(initial), ...Object.keys(changed)]);

  for (const key of allKeys) {
    const initialValue = initial[key];
    const changedValue = changed[key];

    // Skip if values are identical
    if (JSON.stringify(initialValue) === JSON.stringify(changedValue)) {
      continue;
    }

    // Recursively compare values
    const nestedDiff = deepDiff(initialValue, changedValue);

    // Only add non-empty differences
    if (Object.keys(nestedDiff.added).length > 0) {
      difference.added[key] = nestedDiff.added;
    }
    if (Object.keys(nestedDiff.removed).length > 0) {
      difference.removed[key] = nestedDiff.removed;
    }
  }

  return difference;
}

function compareArrays(initial: any[], changed: any[]): Difference {
  const result: Difference = {
    added: [],
    removed: [],
  };

  // Find added items (in changed but not in initial)
  const addedItems = changed.filter((changedItem) => {
    return !initial.some(
      (initialItem) => JSON.stringify(initialItem) === JSON.stringify(changedItem)
    );
  });

  // Find removed items (in initial but not in changed)
  const removedItems = initial.filter((initialItem) => {
    return !changed.some(
      (changedItem) => JSON.stringify(initialItem) === JSON.stringify(changedItem)
    );
  });

  if (addedItems.length > 0) {
    result.added = addedItems;
  }

  if (removedItems.length > 0) {
    result.removed = removedItems;
  }

  // Convert empty arrays to empty objects for consistency
  if (result.added.length === 0) result.added = {};
  if (result.removed.length === 0) result.removed = {};

  return result;
}
