# Qumu Cloud API Samples

This repository contains sample code demonstrating how to interact with the **Qumu Cloud** platform using its API.  

The examples provided can be used as standalone utilities for test purposes or as reference code for integration into other platforms.  

**These samples are neither endorsed or supported by Qumu.**


---

## 🔹 `QC_Bulk_Video_Upload.html`

**Purpose:**  
Bulk upload multiple videos to your Qumu instance. Supports 10 videos at a time to limit API requests.  
[**Screenshot**](./Screenshots/Bulk_Upload.png)

**Key Features:**
- Automatically uses the original filename as the Qumu Presentation title, with option to add prefix (eg "BULK").
- Streamlines the upload process for batches of media files.
- Drag and drop video files onto the UI to start the process.
- Works with Presentation Types that have custom metadata fields, including mandatory fields.
- Provides a downloadable CSV report of the uploaded videos.

**Important Notes:**  
Do not use Presentation Types that have **Creators Choice from All** in the workflow where there is no default defined. These will publish to **Draft** status and require manual processing to complete.

Video uploaded using Presentation Types with Approval workflows will have **STATUS: PENDING_APPROVAL** and require the usual approval by the designated approver.



---

## 🔹 `QC_Single_Video_Upload.html`

**Purpose:**  
Upload a **single video** to your Qumu instance.

**Use Case:**  
Can be used as sample code for integrating video uploads into platforms such as **WordPress** or other CMS solutions.
Works with Presentation Types that have custom metadata.

**Important Notes:**  
Do not use Presentation Types that have **Creators Choice from All** in the workflow where there is no default defined. These will publish to **Draft** status and require manual processing to complete.

Video uploaded using Presentation Types with Approval workflows will have **STATUS: PENDING_APPROVAL** and require the usual approval by the designated approver

---


## 🔹 `QC_Analytics.html`
**Purpose:**   
Shows how the Reporting API may be used to provide custom reports.  
After login select the folder and then a playlist within the folder and generate a viewing report for that playlist.  
Clicking View Report will provide detailed viewing for a single presentation.  
This sample shows how to identify presentations that have not been viewed recently.<br/>
This sample also shows how the api can be used to create detailed engagement reports such as viewer funnel, engagement over time and engagement quality.  
Sample Report:  [**Screenshot**](./Screenshots/Analytics_report.PNG)

**API**  
Uses the following API's:
- Folders API
- Smart Searches API
- Reporting API
- Presentation API
---

## 🔹 `QC_Duplicate_User_Search.html`

**Purpose:**  
Searches all users within the instance and shows possible duplicate users, eg users that may have a local account and also a SAML account, or same name but different email address.<br/>
The results table can be searched and also filtered by duplicates. A report may be downloaded for further analysis.<br/>
This utility uses Levenshtein distance–based fuzzy matching algorithm and the user can select Strict, Balanced or Loose in the search criteria.<br/> Loose will find more, but also generate false positives.  
This tool does not make any changes to the user database.

**API**  
Uses the following API's:
- Users API

**Important Notes:**  
Has not been tested with very large datasets, but for datasets over 10,000 users the results will only show duplicates by default.

---

## 🔹 `QC_Metadata_Editing.html`

**Purpose:**  
Shows how the Metadata API may be used to edit existing metadata for presentations in the CMS.  
This tool only updates the **Description** and **Tags** but can be adapted for other custom metadata fields that may be defined.

**API**  
Uses the following API's:
- Folders API
- Smart Searches API
- Metadata API


---

## ⚠️ Disclaimer

These Proof of Concept samples show how you could utilise the Qumu API.

This code is provided **as-is**, with **no warranties or guarantees** of any kind.  


---
## 🔐 Security Note

These samples use **basic local authentication** for simplicity and demonstration purposes.  
For production use it is recommended to implement **OAuth 2.0** for secure, standards-based authentication and authorization with the Qumu Cloud platform.

