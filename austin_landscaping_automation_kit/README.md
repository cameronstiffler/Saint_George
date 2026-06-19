# Austin Landscaping Automation Kit

This package contains the first working version of a low-cost lead-generation and outreach system for an Austin-area landscaping company.

## Files

- `Austin_Landscaping_Lead_CRM.xlsx`
  - Spreadsheet CRM template with Leads, Dashboard, Categories, and Bid Opportunities tabs.
- `google_apps_script_outreach.gs`
  - Gmail / Google Sheets automation script for daily outreach, follow-ups, and JSON export.
- `website_index.html`
  - One-page static website for GitHub Pages or any cheap host.
- `lead_schema.json`
  - JSON schema for lead records.
- `sample_leads.json`
  - Example lead JSON file.
- `automation_prompts.md`
  - Prompts for lead finding, enrichment, scoring, and outreach drafting.

## Setup Order

1. Fill in the Dashboard tab in the spreadsheet:
   - Business name
   - Sender name
   - Phone
   - Website
   - Booking link
   - Physical mailing address
   - Sender email

2. Create a Google Form for quote requests.
   Suggested fields:
   - Name
   - Email
   - Phone
   - Property name
   - Property address
   - Property type
   - Services needed
   - Preferred walkthrough time
   - Permission to call/text about this request

3. Create a booking link:
   - Google Calendar Appointment Schedule
   - or Cal.com free plan

4. Edit `website_index.html`:
   Replace all placeholders:
   - `{{LandscapingCompanyName}}`
   - `{{Phone}}`
   - `{{PhoneLink}}`
   - `{{Email}}`
   - `{{QuoteFormLink}}`
   - `{{BookingLink}}`
   - `{{PhysicalMailingAddress}}`

5. Publish the website:
   - Create a GitHub repository.
   - Upload `website_index.html`.
   - Rename it to `index.html`.
   - Enable GitHub Pages.

6. In Google Sheets:
   - Go to Extensions > Apps Script.
   - Paste `google_apps_script_outreach.gs`.
   - Keep `dryRun: true`.
   - Keep `testMode: true` while developing so only `cameronstiffler@gmail.com` can receive test emails.
   - Run `sendDailyOutreach`.
   - Check logs.
   - Only change `dryRun` to `false` after test output is correct.
   - Only change `testMode` to `false` when real leads are reviewed, the physical mailing address is filled in, and live sending is approved.

## Outreach Safety

Do not use this for automated cold texting.

Cold email should include:
- honest sender details
- real business contact info
- physical mailing address
- clear opt-out line
- no deceptive subject line

When someone opts out, mark:
- `Opted Out = TRUE`
- `Status = Do Not Contact`

## Bid Sources to Register

- City of Austin vendor registration / solicitations
- Travis County purchasing / BidNet
- Austin ISD Bonfire
- Texas CMBL

Suggested search terms:
- landscape
- landscaping
- grounds maintenance
- mowing
- lawn care
- right of way mowing
- vegetation management
- parks maintenance
