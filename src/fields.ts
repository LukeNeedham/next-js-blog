/**
 * What the front matter of an article holds, by field name:
 * - `text`: a required string;
 * - `date`: a required date, `YYYY-MM-DD`;
 * - `image`: a required image of the content repo, as a path relative to its `images` folder (`junie.png`).
 */
export type FieldType = 'text' | 'date' | 'image'

export type Fields = Record<string, FieldType>
