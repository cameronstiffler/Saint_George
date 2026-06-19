/**
 * Austin Landscaping Outreach Automation
 * Paste this into Google Apps Script attached to the lead CRM Sheet.
 *
 * Required sheet names:
 * - Leads
 * - Dashboard
 *
 * Important:
 * - Start with a low daily send limit.
 * - Use only public business emails.
 * - Do not use this for cold SMS.
 * - Honor unsubscribe / opt-out requests immediately.
 */

const CONFIG = {
  leadsSheetName: "Leads",
  dashboardSheetName: "Dashboard",
  dailySendLimit: 5,
  followUpDelayDays: 7,
  dryRun: true, // Logs email output without sending or changing lead status.
  testMode: true, // While true, only the testRecipientEmail can receive email.
  testRecipientEmail: "cameronstiffler@gmail.com"
};

const COL = {
  ID: 1,
  BUSINESS_NAME: 2,
  PROPERTY_TYPE: 3,
  PRIORITY_SCORE: 4,
  STREET: 5,
  CITY: 6,
  STATE: 7,
  ZIP: 8,
  WEBSITE: 9,
  CONTACT_NAME: 10,
  CONTACT_ROLE: 11,
  EMAIL: 12,
  PHONE: 13,
  CONTACT_PAGE: 14,
  SOURCE: 15,
  LARGE_LAWN_LIKELY: 16,
  NOTES: 17,
  STATUS: 18,
  LAST_CONTACTED: 19,
  NEXT_FOLLOWUP: 20,
  OPTED_OUT: 21,
  REPLY_RECEIVED: 22,
  SOURCE_URLS: 23
};

function sendDailyOutreach() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.leadsSheetName);
  const settings = readSettings_();
  const values = sheet.getDataRange().getValues();
  let sent = 0;
  const today = new Date();

  for (let i = 1; i < values.length && sent < settings.dailySendLimit; i++) {
    const row = values[i];
    const status = row[COL.STATUS - 1];
    const email = row[COL.EMAIL - 1];
    const optedOut = row[COL.OPTED_OUT - 1] === true;

    if (status !== "Ready to Email" || !email || optedOut) continue;
    if (CONFIG.testMode && !isTestRecipient_(email)) continue;

    const lead = rowToLead_(row);
    const subject = "Commercial lawn care for your Austin property";
    const body = buildInitialEmail_(lead, settings);

    if (CONFIG.dryRun) {
      Logger.log("DRY RUN - would send to " + email + "\n" + subject + "\n" + body);
    } else {
      GmailApp.sendEmail(email, subject, body, {
        name: settings.senderName || settings.businessName || "Landscaping Services"
      });
    }

    if (CONFIG.dryRun) {
      sent++;
      continue;
    }

    const sheetRow = i + 1;
    sheet.getRange(sheetRow, COL.STATUS).setValue("Emailed");
    sheet.getRange(sheetRow, COL.LAST_CONTACTED).setValue(today);
    sheet.getRange(sheetRow, COL.NEXT_FOLLOWUP).setValue(addDays_(today, settings.followUpDelayDays));
    sent++;
  }

  Logger.log("Outreach complete. Sent/would-send count: " + sent);
}

function sendFollowUps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.leadsSheetName);
  const settings = readSettings_();
  const values = sheet.getDataRange().getValues();
  let sent = 0;
  const today = new Date();

  for (let i = 1; i < values.length && sent < settings.dailySendLimit; i++) {
    const row = values[i];
    const status = row[COL.STATUS - 1];
    const email = row[COL.EMAIL - 1];
    const optedOut = row[COL.OPTED_OUT - 1] === true;
    const replyReceived = row[COL.REPLY_RECEIVED - 1] === true;
    const nextFollowup = row[COL.NEXT_FOLLOWUP - 1];

    if (status !== "Emailed" || !email || optedOut || replyReceived) continue;
    if (!(nextFollowup instanceof Date) || nextFollowup > today) continue;
    if (CONFIG.testMode && !isTestRecipient_(email)) continue;

    const lead = rowToLead_(row);
    const subject = "Following up on lawn care quote";
    const body = buildFollowUpEmail_(lead, settings);

    if (CONFIG.dryRun) {
      Logger.log("DRY RUN - would follow up to " + email + "\n" + subject + "\n" + body);
    } else {
      GmailApp.sendEmail(email, subject, body, {
        name: settings.senderName || settings.businessName || "Landscaping Services"
      });
    }

    if (CONFIG.dryRun) {
      sent++;
      continue;
    }

    const sheetRow = i + 1;
    sheet.getRange(sheetRow, COL.STATUS).setValue("Follow-up Sent");
    sheet.getRange(sheetRow, COL.LAST_CONTACTED).setValue(today);
    sent++;
  }

  Logger.log("Follow-up complete. Sent/would-send count: " + sent);
}

function exportLeadsJsonToDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.leadsSheetName);
  const values = sheet.getDataRange().getValues();
  const leads = [];

  for (let i = 1; i < values.length; i++) {
    if (!values[i][COL.BUSINESS_NAME - 1]) continue;
    leads.push(rowToLead_(values[i]));
  }

  const json = JSON.stringify(leads, null, 2);
  const fileName = "austin_landscaping_leads_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss") + ".json";
  DriveApp.createFile(fileName, json, MimeType.PLAIN_TEXT);
  Logger.log("Exported " + leads.length + " leads to " + fileName);
}

function rowToLead_(row) {
  return {
    id: row[COL.ID - 1],
    business_name: row[COL.BUSINESS_NAME - 1],
    property_type: row[COL.PROPERTY_TYPE - 1],
    priority_score: row[COL.PRIORITY_SCORE - 1],
    address: {
      street: row[COL.STREET - 1],
      city: row[COL.CITY - 1],
      state: row[COL.STATE - 1],
      zip: row[COL.ZIP - 1]
    },
    website: row[COL.WEBSITE - 1],
    contact: {
      contact_name: row[COL.CONTACT_NAME - 1] || null,
      role: row[COL.CONTACT_ROLE - 1] || null,
      email: row[COL.EMAIL - 1] || null,
      phone: row[COL.PHONE - 1] || null,
      contact_page: row[COL.CONTACT_PAGE - 1] || null,
      source: row[COL.SOURCE - 1] || null
    },
    property_clues: {
      large_lawn_likely: row[COL.LARGE_LAWN_LIKELY - 1] === true,
      notes: row[COL.NOTES - 1] || null
    },
    outreach: {
      status: row[COL.STATUS - 1] || "New",
      last_contacted: formatDateOrNull_(row[COL.LAST_CONTACTED - 1]),
      next_followup: formatDateOrNull_(row[COL.NEXT_FOLLOWUP - 1]),
      opted_out: row[COL.OPTED_OUT - 1] === true,
      reply_received: row[COL.REPLY_RECEIVED - 1] === true
    },
    source_urls: splitUrls_(row[COL.SOURCE_URLS - 1]),
    created_at: "",
    updated_at: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")
  };
}

function buildInitialEmail_(lead, settings) {
  const greeting = lead.contact.contact_name ? "Hi " + lead.contact.contact_name + "," : "Hi " + contactTeamLabel_(lead) + ",";
  return [
    greeting,
    "",
    "I’m reaching out from " + settings.businessName + ". We help Austin-area properties keep their grounds clean, cut, and presentable with recurring lawn care and exterior maintenance.",
    "",
    "We’re currently looking to add a few larger commercial properties to our service route, including apartment communities, churches, schools, offices, and other properties with regular mowing needs.",
    "",
    "If your team is open to comparing options, we’d be happy to walk the property, discuss the scope, and provide a simple quote.",
    "",
    "Request a visit here:",
    settings.bookingLink,
    "",
    "Or reply directly with the best person to speak with.",
    "",
    "Thank you,",
    settings.senderName,
    settings.businessName,
    settings.phone,
    settings.website,
    settings.physicalAddress,
    "",
    "To opt out of future emails from us, reply with “unsubscribe.”"
  ].join("\n");
}

function buildFollowUpEmail_(lead, settings) {
  const greeting = lead.contact.contact_name ? "Hi " + lead.contact.contact_name + "," : "Hi " + contactTeamLabel_(lead) + ",";
  return [
    greeting,
    "",
    "Just following up in case your property needs help with mowing, edging, cleanup, or recurring grounds maintenance.",
    "",
    "We’re local to the Austin area and are looking for larger properties where we can provide reliable scheduled service.",
    "",
    "Booking link:",
    settings.bookingLink,
    "",
    "Thank you,",
    settings.senderName,
    settings.businessName,
    settings.phone,
    "",
    "To opt out of future emails from us, reply with “unsubscribe.”"
  ].join("\n");
}

function contactTeamLabel_(lead) {
  if (lead.property_type === "church") return "Church Office";
  if (lead.property_type === "school") return "Facilities Team";
  if (lead.property_type === "apartment_complex") return "Property Management Team";
  return "Team";
}

function isTestRecipient_(email) {
  return String(email).trim().toLowerCase() === CONFIG.testRecipientEmail.toLowerCase();
}

function readSettings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.dashboardSheetName);
  const data = sheet.getRange("D4:F12").getValues();
  const map = {};
  data.forEach(row => map[row[0]] = row[1]);

  return {
    dailySendLimit: Number(map["Daily send limit"] || CONFIG.dailySendLimit),
    followUpDelayDays: Number(map["Follow-up delay days"] || CONFIG.followUpDelayDays),
    businessName: map["Business name"] || "{{LandscapingCompanyName}}",
    senderName: map["Sender name"] || "{{SenderName}}",
    phone: map["Business phone"] || "{{Phone}}",
    website: map["Business website"] || "{{Website}}",
    bookingLink: map["Booking link"] || "{{BookingLink}}",
    physicalAddress: map["Physical address"] || "{{PhysicalMailingAddress}}",
    senderEmail: map["Sender email"] || ""
  };
}

function addDays_(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateOrNull_(value) {
  if (!(value instanceof Date)) return null;
  return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function splitUrls_(value) {
  if (!value) return [];
  return String(value).split(/\s+/).filter(Boolean);
}
