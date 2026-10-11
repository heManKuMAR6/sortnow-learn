// Every interactive answer is reduced to ONE whole number, so the database can keep grading
// with a plain "does the number match" and the browser never sees the right answer.
//   choice / spot : the index tapped
//   sort / fill   : one digit per card or gap, packed into a number
//   order         : the position chosen for each step, packed into a number

/** Largest code the API accepts. 6 digits in base 6 is 46,655, well under this. */
export const MAX_CODE = 100_000;

/** digits[0] is the lowest digit. */
export function pack(digits: number[], radix: number): number {
  let n = 0;
  for (let i = digits.length - 1; i >= 0; i -= 1) n = n * radix + (digits[i] as number);
  return n;
}

export function unpack(code: number, radix: number, count: number): number[] {
  const out: number[] = [];
  let n = code;
  for (let i = 0; i < count; i += 1) {
    out.push(n % radix);
    n = Math.floor(n / radix);
  }
  return out;
}
