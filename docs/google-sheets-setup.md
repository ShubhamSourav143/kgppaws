# Google Sheets Setup for KGP PAWS

All form submissions go to Google Sheets. The donor wall on the donate page can also read from a Google Sheet.

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it **KGP PAWS Submissions**.
3. Create these tabs with headers in row 1:

**Reports** tab:
`ID | Timestamp | Animal | Problem | Severity | Location | Description | Contact`

**Volunteers** tab:
`Timestamp | Name | Phone | Email | Affiliation | Hall | Work Options`

**Adoptions** tab:
`ID | Timestamp | Animal Name | Animal Slug | Name | Email | Phone | Address | Maps Link | Concern`

**Bite Reports** tab:
`Timestamp | Full Name | Phone | Location | Incident Date | Incident Time | Maps Link | Dog Photo | Wound Photo | Medical Report | Description`

The Dog Photo / Wound Photo / Medical Report columns hold the original filenames the reporter attached — the binaries stay on the reporter's device until a Storage bucket is wired up. A follow-up call from the volunteer team collects the actual files.

**Donors** tab (for the donate page to read):
`Name | Date | Amount`

Date column: use ISO format `YYYY-MM-DD` (e.g. `2026-08-03`) — the wall parses this into a real date, sorts newest first, and gracefully shows "—" for any row where the date is missing or malformed. Amount is a plain integer in rupees, no currency symbol or commas.

## Step 2: Deploy the Apps Script

1. In the Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code and paste the script below.
3. Click **Deploy > New deployment**.
4. Choose **Web app** as the type.
5. Set **Execute as** to **Me**.
6. Set **Who has access** to **Anyone**.
7. Click **Deploy** and copy the URL.

### Apps Script Code

```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var form = payload.form;
    var data = payload.data;

    if (form === "report") {
      var sheet = ss.getSheetByName("Reports");
      if (!sheet) {
        sheet = ss.insertSheet("Reports");
        sheet.appendRow(["ID", "Timestamp", "Animal", "Problem", "Severity", "Location", "Description", "Contact"]);
      }
      sheet.appendRow([
        data.id || "",
        data.timestamp || "",
        data.animal || "",
        data.problem || "",
        data.severity || "",
        data.location || "",
        data.description || "",
        data.contact || ""
      ]);
    }

    if (form === "volunteer") {
      var sheet = ss.getSheetByName("Volunteers");
      if (!sheet) {
        sheet = ss.insertSheet("Volunteers");
        sheet.appendRow(["Timestamp", "Name", "Phone", "Email", "Affiliation", "Hall", "Work Options"]);
      }
      sheet.appendRow([
        data.timestamp || "",
        data.name || "",
        data.phone || "",
        data.email || "",
        data.affiliation || "",
        data.hall || "",
        data.workOptions || ""
      ]);
    }

    if (form === "adoption") {
      var sheet = ss.getSheetByName("Adoptions");
      if (!sheet) {
        sheet = ss.insertSheet("Adoptions");
        sheet.appendRow(["ID", "Timestamp", "Animal Name", "Animal Slug", "Name", "Email", "Phone", "Address", "Maps Link", "Concern"]);
      }
      sheet.appendRow([
        data.id || "",
        data.timestamp || "",
        data.animalName || "",
        data.animalSlug || "",
        data.name || "",
        data.email || "",
        data.phone || "",
        data.address || "",
        data.mapsLink || "",
        data.concern || ""
      ]);
    }

    if (form === "bite") {
      var sheet = ss.getSheetByName("Bite Reports");
      if (!sheet) {
        sheet = ss.insertSheet("Bite Reports");
        sheet.appendRow(["Timestamp", "Full Name", "Phone", "Location", "Incident Date", "Incident Time", "Maps Link", "Dog Photo", "Wound Photo", "Medical Report", "Description"]);
      }
      sheet.appendRow([
        data.timestamp || "",
        data.fullName || "",
        data.phone || "",
        data.location || "",
        data.incidentDate || "",
        data.incidentTime || "",
        data.mapsLink || "",
        data.dogPhoto || "",
        data.woundPhoto || "",
        data.medicalReport || "",
        data.description || ""
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 3: Publish the Donors tab as CSV

This lets the donate page read donor data from Google Sheets.

1. In the Google Sheet, go to **File > Share > Publish to web**.
2. Select the **Donors** tab and choose **CSV** format.
3. Click **Publish** and copy the URL.

## Step 4: Add URLs to `.env.local`

```
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_SHEET_DONORS_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=DONORS_TAB_GID&single=true&output=csv
```

Restart the dev server after adding the env variables.

## How it works

**Form submissions (write):**
Report, Volunteer, Adoption and Bite Report forms POST to `/api/sheets`, which forwards data to the Google Apps Script. The script writes a row to the matching tab. Submissions are fire-and-forget — users see the success screen immediately, so if you add a fifth form you MUST also add a matching `if (form === "...")` branch to the Apps Script before submissions will land in the sheet; without one, the script returns `{success:true}` and silently drops the row.

**Donor wall (read):**
The donate page fetches the published Donors CSV at build time (revalidates every 5 minutes). If the CSV URL is not configured, the page falls back to demo donor data. To add a real donor, just add a row in the Donors tab of the Google Sheet.

If the webhook URL is not set, all forms still work — data saves to localStorage as before.
