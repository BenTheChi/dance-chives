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
