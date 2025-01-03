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

export function reorderCards(cards: any[]) {
  let sorted = cards.map((card) => ({ ...card })).toSorted((a, b) => a.order - b.order);
  let updatedCards = [];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].order !== i) {
      console.log('Card: ', sorted[i].order);
      console.log('Index: ', i);

      sorted[i].order = i;
      updatedCards.push(sorted[i]);
    }
  }

  return { sorted, updatedCards };
}

export function buildMutation(original: string[], updated: string[]) {
  const toDelete = original.filter((person) => !updated.includes(person));
  const toCreate = updated.filter((person) => !original.includes(person));

  return { toDelete, toCreate };
}
