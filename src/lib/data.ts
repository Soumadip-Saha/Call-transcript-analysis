import Papa from 'papaparse';

export interface RawCallRecord {
  call_id: string | number;
  transcript: string;
  classification_status: string;
  intents_json: string | any[];
  num_intents: string | number;
  evidence?: string;
  [key: string]: any;
}

export interface FlattenedIntent {
  call_id: string;
  transcript: string;
  classification_status: string;
  evidence: string;
  reason: string;
  l1: string;
  l2: string;
}

function parseIntents(jsonStr: string | any[]): any[] {
  if (!jsonStr) return [];
  if (Array.isArray(jsonStr)) return jsonStr;
  if (typeof jsonStr !== 'string') return [jsonStr];
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    try {
      // Basic attempt to fix Python string representation of dicts
      const fixedStr = jsonStr.replace(/'/g, '"');
      return JSON.parse(fixedStr);
    } catch (e2) {
      console.error("Failed to parse intents:", jsonStr);
      return [];
    }
  }
}

export function processData(fileContent: string, fileName: string): FlattenedIntent[] {
  let parsedData: RawCallRecord[] = [];

  if (fileName.toLowerCase().endsWith('.json')) {
    try {
      parsedData = JSON.parse(fileContent);
    } catch (e) {
      console.error("Failed to parse JSON file", e);
      return [];
    }
  } else {
    const parsed = Papa.parse<RawCallRecord>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    parsedData = parsed.data;
  }

  const flattened: FlattenedIntent[] = [];

  for (const row of parsedData) {
    const intents = parseIntents(row.intents_json);
    
    if (intents.length === 0) {
      flattened.push({
        call_id: String(row.call_id || ''),
        transcript: row.transcript || '',
        classification_status: row.classification_status || 'Unknown',
        evidence: row.evidence || '',
        reason: 'Unknown',
        l1: 'Unknown',
        l2: 'Unknown',
      });
      continue;
    }

    for (const intent of intents) {
      flattened.push({
        call_id: String(row.call_id || ''),
        transcript: row.transcript || '',
        classification_status: row.classification_status || 'Unknown',
        evidence: intent.evidence || row.evidence || '',
        reason: intent.reason || 'Unknown',
        l1: intent.l1 || 'Unknown',
        l2: intent.l2 || 'Unknown',
      });
    }
  }

  return flattened;
}
