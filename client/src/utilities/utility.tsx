export function ObjectComparison(
  initial: { [key: string]: any },
  changed: { [key: string]: any }
): { [key: string]: any } {
  let result: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(changed)) {
    if (initial[key] !== value) {
      result[key] = value;
    }
  }

  console.log(result);
  return result;
}
