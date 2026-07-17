import { google } from "googleapis";
import { isGoogleConfigured } from "@/lib/config";

/**
 * Google API clients, authenticated as the service account configured via
 * GOOGLE_SERVICE_ACCOUNT_JSON. Server-only — never imported by client code.
 *
 * Returns null when not configured so callers can no-op gracefully, exactly
 * like createServerSupabase()/isSupabaseConfigured elsewhere in this app.
 */
function getAuth() {
  if (!isGoogleConfigured) return null;
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

export function getSheetsClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

export function getDriveClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
export const DRIVE_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
