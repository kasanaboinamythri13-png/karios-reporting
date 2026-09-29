// Checks a head's report data against their department's form (formFields.js).
// Owner: Member 1
//
// Rules for every field type:
//   text / textarea → string, trimmed, max 2000 characters (required ones can't be empty)
//   number          → whole number, 0 or more
//   currency        → number, 0 or more, at most 2 decimals, below 1 trillion
//   Unknown keys are rejected, so nothing unexpected is stored.
import { z } from 'zod';
import { getFormFields } from './formFields.js';
import { BadRequest } from '../../utils/errors.js';

const MAX_TEXT = 2000;
const MAX_MONEY = 999_999_999_999.99; // fits NUMERIC(15,2)

const hasAtMostTwoDecimals = (v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;

// "Sales is required" when the field is missing, "Sales must be a number" when it has the wrong type.
const typeError = (label, expected) => (issue) =>
  issue.input === undefined ? `${label} is required` : `${label} must be ${expected}`;

function fieldSchema(field) {
  let schema;

  switch (field.type) {
    case 'number':
      schema = z.number({ error: typeError(field.label, 'a number') }).int(`${field.label} must be a whole number`).min(0, `${field.label} cannot be negative`);
      break;
    case 'currency':
      schema = z
        .number({ error: typeError(field.label, 'a number') })
        .min(0, `${field.label} cannot be negative`)
        .max(MAX_MONEY, `${field.label} is too large`)
        .refine(hasAtMostTwoDecimals, `${field.label} can have at most 2 decimals`);
      break;
    default: // text, textarea
      schema = z.string({ error: typeError(field.label, 'text') }).trim().max(MAX_TEXT, `${field.label} is too long (max ${MAX_TEXT} characters)`);
      if (field.required) schema = schema.min(1, `${field.label} is required`);
  }

  return field.required ? schema : schema.optional();
}

const schemaCache = new Map();

function schemaFor(department) {
  if (!schemaCache.has(department)) {
    const fields = getFormFields(department);
    if (!fields) return null;
    const shape = Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)]));
    schemaCache.set(department, z.object(shape).strict());
  }
  return schemaCache.get(department);
}

/**
 * Validates report data for a department.
 * Returns the cleaned data (trimmed strings) or throws 400 with every problem listed.
 */
export function validateReportData(department, data) {
  const schema = schemaFor(department);
  if (!schema) {
    throw BadRequest(`No report form exists for department ${department}`);
  }

  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const messages = result.error.issues.map((issue) =>
      issue.code === 'unrecognized_keys' ? `Unknown field(s): ${issue.keys.join(', ')}` : issue.message,
    );
    throw BadRequest(messages.join('; '));
  }

  return result.data;
}

/**
 * Copies the dashboard values (blockers, revenue, spend, leads, collections)
 * out of the form data into the matching reports-table columns.
 */
export function extractSummaryColumns(department, data) {
  const columns = { blockers: null, revenue_closed: 0, marketing_spend: 0, leads: 0, collections: 0 };

  for (const field of getFormFields(department) || []) {
    if (field.column && data[field.key] !== undefined && data[field.key] !== '') {
      columns[field.column] = data[field.key];
    }
  }

  return columns;
}
