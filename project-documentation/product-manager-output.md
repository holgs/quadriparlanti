# Product Specification Document
## Repository Lavori Studenti (Student Work Repository)

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Product Manager**: Claude Agent
**Status**: Final Specification for MVP Development

---

## Executive Summary

### Elevator Pitch
A QR-powered digital gallery that brings school corridor displays to life by connecting physical artworks to rich multimedia portfolios created by students and managed by teachers.

### Problem Statement
Schools display student work in corridors but visitors cannot access the digital context, process documentation, or multimedia components. Teachers lack a simple way to showcase the full scope of student projects, and administrators struggle to maintain updated displays without reprinting materials.

### Target Audience

**Primary Users:**
1. **Teachers (Content Creators)**: K-12 educators aged 25-60, varying digital literacy, need simple tools to showcase student work without technical barriers
2. **Administrators (Content Managers)**: School staff responsible for displays, need approval workflows and analytics to measure engagement
3. **Visitors (Content Consumers)**: Parents, students, community members aged 8-80, accessing via smartphones in school corridors

**Secondary Users:**
- Students (viewing their own and peers' work)
- District administrators (reviewing school initiatives)
- Prospective parents during open houses

### Unique Selling Proposition
Unlike static QR codes linking to PDFs, this system provides:
- Dynamic QR codes that update content without reprinting
- Structured workflow preventing premature publication
- Multilingual access for diverse communities
- Privacy-first design protecting student identities
- Rich multimedia support (video, external links, documents)

### Success Metrics

**North Star Metric**: Monthly Active Scans (QR code scans per month)

**Primary KPIs:**
- QR Code Scan Rate: Target 100+ scans/month by month 3
- Work Approval Cycle Time: <3 days from submission to publication
- Teacher Adoption: 60% of teaching staff creating works in first semester
- Content Diversity: 50%+ of works include multimedia (not just images)

**Secondary KPIs:**
- Average works per theme: >3
- Visitor engagement: >40% click-through from theme page to work detail
- Accessibility compliance: 100% WCAG 2.1 AA conformance
- System uptime: >99.5%

---

## User Personas

### Persona 1: Maria - The Engaged Teacher
**Demographics**: 42, middle school art teacher, 15 years experience
**Tech Comfort**: Moderate (uses Google Classroom, basic Canva)
**Goals**: Showcase student creativity beyond physical displays, document project evolution
**Pain Points**: Lacks time for complex tools, concerned about student privacy
**Motivation**: Recognition for innovative teaching, parent engagement

### Persona 2: Roberto - The Administrator
**Demographics**: 55, vice principal, manages school communications
**Tech Comfort**: High (manages school website, social media)
**Goals**: Control content quality, measure community engagement, minimize overhead
**Pain Points**: Teachers post inappropriate content, outdated displays, reprint costs
**Motivation**: School reputation, data-driven decision making

### Persona 3: Elena - The Visiting Parent
**Demographics**: 38, parent of 5th grader, visits during parent-teacher conference
**Tech Comfort**: High (smartphone native user)
**Goals**: See child's work in context, understand teaching methods
**Pain Points**: Limited corridor time, language barriers (speaks limited Italian)
**Motivation**: Child's educational success, school involvement

---

## Detailed User Stories

### VISITORS (Anonymous Access)

#### V-001: Scan QR Code to Access Theme
**As a** visitor scanning a QR code in the school corridor
**I want to** immediately see the theme page with all related student works
**So that I can** explore digital content connected to the physical display

**Acceptance Criteria:**
- Given a valid QR code affixed to a physical work
- When I scan the code with any smartphone camera app
- Then I am redirected to the theme page within 2 seconds
- And the page loads without requiring authentication
- And the scan is logged anonymously (hashed IP + timestamp)
- And the page displays correctly on iOS and Android browsers

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- QR code generation system operational
- Short link service configured
- Theme pages publicly accessible

**Technical Constraints**:
- QR codes must work with native camera apps (no special app required)
- URLs must be HTTPS for iOS camera app compatibility
- Short URLs must remain permanent (no expiration)

**Edge Cases**:
- QR code linked to unpublished/deleted theme → show friendly 404 with school branding
- Network timeout during scan → show cached error page with retry button
- QR code tampered/invalid → redirect to school homepage with error message

---

#### V-002: View Theme Page with Work List
**As a** visitor on a theme page
**I want to** see an overview of the theme and browse all associated works
**So that I can** decide which works to explore in detail

**Acceptance Criteria:**
- Given I have accessed a theme page via QR or direct link
- When the page loads
- Then I see:
  - Theme title in current language (IT/EN)
  - Theme description (min 50, max 500 characters)
  - Representative image (optimized for mobile)
  - Count of associated works (e.g., "12 lavori")
  - Grid/list of work preview cards
- And each work card displays:
  - Work title
  - Thumbnail image (if available) or default icon by content type
  - Class identifier (e.g., "3A")
  - School year (e.g., "2024-25")
  - Content type icon (PDF, video, link, image)
- And the page is responsive (mobile-first design)
- And images load progressively (skeleton screens)

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Theme data model with multilingual fields
- Work-theme relationship established
- Image optimization service configured

**Technical Constraints**:
- Page must achieve <2s First Contentful Paint on 3G
- Images must be served via CDN with WebP format
- Maximum 50 works displayed per page (pagination for more)

**UX Considerations**:
- Default sort: newest first
- Sticky filter bar on scroll
- "No works yet" empty state with illustration

**Edge Cases**:
- Theme has no published works → show empty state with message
- Theme image fails to load → show color gradient placeholder
- Very long theme description → truncate with "Read more" expansion

---

#### V-003: Filter Works by Criteria
**As a** visitor browsing a theme page
**I want to** filter works by class, teacher, year, or content type
**So that I can** quickly find relevant content

**Acceptance Criteria:**
- Given I am on a theme page with multiple works
- When I tap the "Filter" button
- Then a filter panel appears with options:
  - Class (multi-select checkboxes, e.g., "1A", "1B", "2A")
  - Teacher (single-select dropdown, alphabetical)
  - School Year (single-select dropdown, newest first)
  - Content Type (multi-select chips: Video, PDF, Image, Link)
- And I can select multiple filters simultaneously
- And the work list updates in real-time (no page reload)
- And active filters are visually indicated (chip badges)
- And I can clear all filters with one tap ("Clear All" button)
- And filter state persists on back navigation

**Priority**: P1 (High - Enhances usability)

**Dependencies**:
- Work metadata includes all filterable fields
- Client-side filtering logic for performance

**Technical Constraints**:
- Filter must work with JavaScript disabled (fallback to form submission)
- Maximum 100 filter combinations cached client-side

**UX Considerations**:
- Filters show count of matching works (e.g., "Video (3)")
- Disabled filters when no matches (greyed out)
- Mobile: filter panel as bottom sheet
- Desktop: filter sidebar

**Edge Cases**:
- No works match filter combination → show empty state with suggestion to broaden filters
- Filter values change after page load (new work published) → maintain filter until refresh
- URL with invalid filter parameters → ignore invalid, apply valid ones

---

#### V-004: Search Works by Keyword
**As a** visitor looking for specific content
**I want to** search works by title or description
**So that I can** find content without browsing all works

**Acceptance Criteria:**
- Given I am on a theme page or global works page
- When I type in the search input field
- Then results appear after 300ms debounce
- And search matches:
  - Work title (exact and partial matches)
  - Work description (full-text)
  - Tags (exact matches)
- And search is case-insensitive
- And special characters are normalized (e.g., "è" matches "e")
- And results highlight matching terms
- And search works in both Italian and English content

**Priority**: P1 (High - Enhances usability)

**Dependencies**:
- Full-text search index on works table
- Supabase FTS (Full-Text Search) configured

**Technical Constraints**:
- Search must return results <500ms for <1000 works
- Minimum 3 characters required to trigger search
- Maximum 100 results displayed

**UX Considerations**:
- Search placeholder: "Cerca lavori..." (IT) / "Search works..." (EN)
- Show search result count
- Clear button appears when text entered
- Recent searches stored in localStorage (max 5)

**Edge Cases**:
- Search with no results → show "No works found" with suggestion to check spelling
- Search with special SQL characters → sanitize input to prevent injection
- Very long search query (>100 chars) → truncate and warn user

---

#### V-005: View Work Detail Page
**As a** visitor who clicked on a work
**I want to** see complete information and access all content
**So that I can** fully experience the student project

**Acceptance Criteria:**
- Given I have clicked on a work preview card
- When the detail page loads
- Then I see:
  - Work title (H1)
  - Work description (markdown formatted)
  - Class, teacher, school year metadata
  - All uploaded files (PDFs, images) with download links
  - All external links (YouTube, Vimeo, Drive) as embedded players or open buttons
  - Tags as clickable chips (link to filtered view)
  - Creative Commons license badge (if selected)
  - "Back to theme" navigation link
  - Language toggle (if content available in both languages)
- And embedded videos autoplay on user interaction (not on load)
- And PDF files open in browser viewer (not forced download)
- And images display in lightbox gallery on click
- And metadata is displayed in a readable card/table format

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Work data model with all fields populated
- File storage with public access URLs
- Markdown renderer for descriptions

**Technical Constraints**:
- Page must load core content <1.5s, media lazy-loaded
- Video embeds must be responsive (16:9 aspect ratio)
- Maximum 10 attachments per work (UI degrades gracefully beyond)

**UX Considerations**:
- Breadcrumb navigation: Home > Theme > Work
- Social share buttons (WhatsApp, email)
- "Related works" section (same theme/class)
- Print-friendly CSS

**Edge Cases**:
- Work has no attachments or links → show description only with note
- External link is broken (404) → display with warning icon, still allow click
- Work is unpublished while user viewing → show "This work is no longer available"
- Image file corrupted → show placeholder with error message

---

#### V-006: Switch Language
**As a** non-Italian speaking visitor
**I want to** switch the interface to English
**So that I can** navigate and understand content in my preferred language

**Acceptance Criteria:**
- Given I am on any page of the application
- When I click the language toggle (IT/EN icon in header)
- Then all interface elements change to selected language
- And user-generated content (titles, descriptions) displays in selected language if available
- And if content not available in selected language, show original with language indicator
- And language preference is stored in localStorage
- And language preference persists across sessions
- And URL reflects language (e.g., /en/theme/123 vs /it/theme/123)

**Priority**: P0 (Critical - Accessibility requirement)

**Dependencies**:
- next-intl configured with IT/EN locales
- All UI strings externalized to translation files
- Database fields support multilingual content (title_it, title_en, description_it, description_en)

**Technical Constraints**:
- Language switch must not require page reload (client-side routing)
- SEO: hreflang tags for both languages
- Default language: IT (school's primary language)

**UX Considerations**:
- Language toggle as flag icons or "IT | EN" text toggle
- Persistent position in header (top-right)
- Indicate missing translations with (IT) or (EN) suffix

**Edge Cases**:
- Content only exists in Italian → show in Italian with note "Available in Italian only"
- URL language parameter conflicts with localStorage preference → URL takes precedence
- Invalid language code in URL → fallback to Italian

---

### TEACHERS (Authenticated - "docente" role)

#### T-001: Teacher Authentication
**As a** teacher
**I want to** log in with my email and password
**So that I can** access the work creation area

**Acceptance Criteria:**
- Given I have navigated to /login
- When I enter valid email and password
- Then I am authenticated via Supabase Auth
- And I am redirected to the teacher dashboard (/dashboard/teacher)
- And my role ("docente") is verified via RLS policies
- And I see a welcome message with my name
- And I can log out from any page (header button)

**Priority**: P0 (Critical - Security requirement)

**Dependencies**:
- Supabase Auth configured
- User table with "role" column (enum: "docente", "admin")
- RLS policies enforce role-based access

**Technical Constraints**:
- Passwords must meet minimum requirements (8 chars, 1 uppercase, 1 number)
- Session expires after 7 days of inactivity
- Email verification required on first login

**UX Considerations**:
- "Forgot password" link triggers Supabase password reset email
- "Remember me" checkbox extends session to 30 days
- Login errors display specific messages (invalid email vs. wrong password)

**Edge Cases**:
- Account not verified → show "Check your email" message with resend link
- Too many login attempts → implement rate limiting (5 attempts per 15 min)
- User has "admin" role → redirect to admin dashboard instead
- Session expired mid-action → save draft and redirect to login

---

#### T-002: Create New Work
**As a** teacher
**I want to** create a new work with all relevant information
**So that I can** submit it for admin approval

**Acceptance Criteria:**
- Given I am logged in as a teacher
- When I click "New Work" button on dashboard
- Then I see a multi-step form with sections:
  1. **Basic Info**:
     - Title (required, max 100 chars, IT and EN fields)
     - Description (required, max 2000 chars, markdown supported, IT and EN)
     - Class (required, dropdown: 1A-5C, populated from config)
     - Teacher name (auto-filled, editable)
     - School year (required, dropdown: current and previous 3 years)
  2. **Content**:
     - Upload files (PDF, images: JPG/PNG, max 10MB per file)
     - Add external links (text input for URL, auto-detect type: YouTube, Vimeo, Drive, Other)
     - Link preview generated on blur
  3. **Categorization**:
     - Associate with themes (multi-select searchable dropdown)
     - Tags (comma-separated, autocomplete from existing)
     - License (optional, radio buttons: None, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA)
- And I can save as draft at any step (auto-save every 30 seconds)
- And I can preview before submitting
- And validation errors are inline and specific
- And I receive confirmation email upon submission

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Supabase Storage bucket for file uploads
- Works table with all fields
- Themes table with active themes
- Email service configured (Supabase Auth emails)

**Technical Constraints**:
- File upload chunk size: 5MB for reliability
- Maximum 5 files + 5 links per work
- Markdown sanitization to prevent XSS
- URL validation: must be HTTPS, check domain whitelist for safety

**UX Considerations**:
- Progress indicator (step 1/3)
- "Save Draft" vs "Submit for Review" clearly differentiated
- File upload shows progress bar and thumbnail preview
- Link validation happens on blur (show green checkmark or error)
- Mobile-friendly: single-column form, large touch targets

**Edge Cases**:
- Network interruption during upload → resume from last chunk
- Duplicate title warning (not blocking)
- Attempting to submit with missing required fields → scroll to first error, focus input
- File type not allowed → show error immediately, suggest correct types
- External link is dead (404) → warn but allow submission
- Theme selection empty → require at least one theme
- Tags with special characters → sanitize and normalize

---

#### T-003: Upload Files and Add Links
**As a** teacher creating a work
**I want to** upload files and add external links
**So that I can** provide multiple ways to access content

**Acceptance Criteria:**
- Given I am on the "Content" step of work creation
- When I click "Upload File"
- Then a file picker opens
- And I can select multiple files (Shift/Cmd+click)
- And only allowed file types are selectable (PDF, JPG, PNG)
- And each file uploads with progress indicator
- And uploaded files appear as removable cards with:
  - File name
  - File size
  - File type icon
  - Remove (X) button
- When I paste or type a URL in "Add Link" field
- Then the system detects the link type (YouTube, Vimeo, Drive, generic)
- And displays appropriate icon
- And validates URL format (must start with http:// or https://)
- And I can add a custom label (optional, defaults to URL)
- And links appear as removable cards with preview

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Supabase Storage configured with public bucket
- Link metadata extractor (for titles/thumbnails)
- Attachments and Links tables

**Technical Constraints**:
- Max file size: 10MB per file
- Max total upload size per work: 50MB
- Supported file types: .pdf, .jpg, .jpeg, .png
- Link validation regex for common video platforms
- Storage quota per teacher: 500MB (soft limit, admin can increase)

**UX Considerations**:
- Drag-and-drop file upload area
- Bulk file selection
- Visual feedback: uploading (spinner), success (green check), error (red X)
- File size shown in human-readable format (5.2 MB not 5242880 bytes)
- Link preview shows favicon and title if fetchable

**Edge Cases**:
- File exceeds 10MB → show error, suggest compression
- Upload fails mid-way → retry button, option to remove failed file
- File with non-Latin characters in name → sanitize filename
- Duplicate file name → auto-rename with (1), (2) suffix
- Invalid URL format → inline error message
- YouTube short link (youtu.be) → normalize to full URL
- Private Drive link → warning that visitors may not access
- Too many files (>5) → disable upload button, show limit message

---

#### T-004: Associate Work with Themes
**As a** teacher creating a work
**I want to** link my work to one or more themes
**So that visitors can find it when scanning relevant QR codes

**Acceptance Criteria:**
- Given I am on the "Categorization" step of work creation
- When I click the "Associate Themes" field
- Then a searchable multi-select dropdown appears
- And I see all active themes (published by admins)
- And each theme displays: title, description preview, associated QR count
- And I can select multiple themes (checkboxes)
- And selected themes appear as removable chips above the field
- And I must select at least one theme to submit
- And search filters themes by title (case-insensitive)

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Themes table with published themes
- Work-theme junction table (many-to-many relationship)

**Technical Constraints**:
- Maximum 5 themes per work (prevent over-categorization)
- Themes must be "published" status to appear in dropdown
- Real-time sync: if admin unpublishes theme, remove from selection options

**UX Considerations**:
- Default sort: alphabetical by theme title
- Show theme thumbnail for visual recognition
- Empty state: "No themes yet - ask admin to create some"
- Selected count indicator: "3 of 5 themes selected"

**Edge Cases**:
- No published themes exist → show message to contact admin, disable submit
- Theme is unpublished after work is associated → work remains linked but hidden from that theme page
- Attempting to submit without theme → validation error
- Search returns no results → "No themes match your search"

---

#### T-005: Submit Work for Review
**As a** teacher who has completed a work
**I want to** submit it for administrator approval
**So that it can be published for visitors

**Acceptance Criteria:**
- Given I have filled all required fields in the work creation form
- When I click "Submit for Review" button
- Then the work status changes from "draft" to "pending_review"
- And the work appears in the admin review queue
- And I receive a confirmation message: "Work submitted! You'll receive an email when it's reviewed."
- And I receive a confirmation email with work title and submission timestamp
- And I can no longer edit the work (view-only mode)
- And I can see submission status on my dashboard ("Pending Review" badge)
- And admins receive a notification (email) about new submission

**Priority**: P0 (Critical - Core workflow)

**Dependencies**:
- Work status enum: draft, pending_review, published, rejected
- Email notification service
- RLS policy: teachers can only submit their own works

**Technical Constraints**:
- Submission triggers DB transaction (status update + notification insert)
- Email sent asynchronously (don't block UI)
- Rollback if email fails (work remains draft)

**UX Considerations**:
- Confirmation modal before submit: "Ready to submit? You won't be able to edit until reviewed."
- Disable submit button after click (prevent double-submit)
- Success message with link to dashboard

**Edge Cases**:
- Network failure during submit → show error, work stays in draft
- Email service down → work submits successfully, log email failure
- Admin reviews work before teacher sees confirmation → status shows as "Published" on refresh
- Teacher navigates away mid-submit → warn about unsaved changes

---

#### T-006: View Submission Status and History
**As a** teacher
**I want to** see the status of all my submitted works
**So that I know what has been published or needs revision

**Acceptance Criteria:**
- Given I am logged in as a teacher
- When I navigate to my dashboard (/dashboard/teacher)
- Then I see a table/list of all my works with columns:
  - Title (clickable to view details)
  - Status badge (Draft, Pending Review, Published, Needs Revision)
  - Submission date
  - Last updated date
  - Actions (View, Edit, Delete)
- And I can filter by status (tabs or dropdown)
- And I can sort by date (newest first by default)
- And "Needs Revision" works show admin comments
- And "Published" works show view count (if analytics enabled)
- And I can click a work to see full details

**Priority**: P0 (Critical - Core workflow)

**Dependencies**:
- Works table includes status, created_at, updated_at
- Review comments stored in work_reviews table
- Analytics integration for view counts

**Technical Constraints**:
- Pagination: 20 works per page
- Real-time updates: poll status every 30s or use Supabase Realtime
- RLS policy: teachers see only their own works

**UX Considerations**:
- Color-coded status badges (grey: draft, yellow: pending, green: published, red: needs revision)
- Empty state for new teachers: "You haven't created any works yet"
- Quick actions: duplicate work, delete draft
- Bulk actions: delete multiple drafts

**Edge Cases**:
- Work is published while teacher viewing dashboard → update status in real-time
- Work with unread admin comments → highlight row
- Very long work title → truncate with ellipsis
- No works in selected filter → "No [status] works"

---

#### T-007: Receive Notification When Work Published
**As a** teacher who submitted a work
**I want to** receive an email when my work is published
**So that I can share it with students and parents

**Acceptance Criteria:**
- Given my work status changes from "pending_review" to "published"
- When an admin approves it
- Then I receive an email within 5 minutes containing:
  - Work title
  - Approval message from admin (if provided)
  - Direct link to published work
  - List of themes where it appears
  - QR codes for those themes (images attached)
- And the email is mobile-friendly (responsive)
- And the email includes unsubscribe link (preference center)

**Priority**: P1 (High - Engagement driver)

**Dependencies**:
- Email template with placeholders
- Supabase Auth email service or external (SendGrid, Postmark)
- QR code generation service

**Technical Constraints**:
- Email sent via background job (Supabase Edge Function or webhook)
- Retry logic: 3 attempts with exponential backoff
- Email size limit: <2MB (compress QR images if needed)

**UX Considerations**:
- Clear subject line: "[School Name] Your work '[Title]' is now published!"
- CTA button: "View Your Published Work"
- Plain text alternative for email clients without HTML support

**Edge Cases**:
- Email bounces (invalid address) → log error, notify admin
- Work unpublished shortly after publishing → send follow-up email
- Multiple works published simultaneously → single digest email
- Teacher's email preference is "no notifications" → respect preference

---

#### T-008: Revise and Resubmit Rejected Work
**As a** teacher whose work needs revision
**I want to** see admin feedback and make changes
**So that I can resubmit for approval

**Acceptance Criteria:**
- Given my work status is "needs_revision"
- When I view the work on my dashboard
- Then I see a prominent "Needs Revision" banner
- And I see admin comments in a highlighted section
- And I can click "Edit" to return to the form
- And all previously entered data is pre-filled
- And I can make changes to any field
- And I can resubmit using "Submit for Review" button
- And the work enters "pending_review" status again
- And admin sees it as a resubmission (with edit history)

**Priority**: P1 (High - Core workflow)

**Dependencies**:
- Work status includes "needs_revision"
- Review comments stored with timestamp and admin name
- Edit history tracking (optional for MVP)

**Technical Constraints**:
- Comments support markdown (for formatting feedback)
- Maximum 500 chars per comment
- Soft delete: previous versions retained for 30 days

**UX Considerations**:
- Comments displayed in modal or expandable section
- Edit button prominent on needs-revision works
- Version indicator: "Resubmission 2" (if not first resubmit)

**Edge Cases**:
- Admin deletes comment before teacher sees it → show generic message
- Teacher edits but doesn't change anything → allow resubmit (admin can reject again)
- Work simultaneously edited by admin and teacher → last save wins, show conflict warning

---

### ADMINISTRATORS (Authenticated - "admin" role)

#### A-001: Administrator Authentication
**As an** administrator
**I want to** log in with my email and password
**So that I can** access the admin dashboard

**Acceptance Criteria:**
- Given I have navigated to /login
- When I enter valid admin credentials
- Then I am authenticated and redirected to /dashboard/admin
- And my role ("admin") is verified via RLS policies
- And I see admin-specific navigation (Review Queue, Themes, QR Codes, Analytics)
- And I can access all teacher functions (create works) in addition to admin functions

**Priority**: P0 (Critical - Security requirement)

**Dependencies**:
- Supabase Auth with role-based access
- RLS policies for admin-only tables/operations

**Technical Constraints**:
- Admin role assigned manually (DB insert, not self-registerable)
- Admin sessions log more detailed audit trail (IP, action timestamps)

**UX Considerations**:
- Distinct admin dashboard UI (different color scheme)
- Quick stats on dashboard: pending reviews, total works, total scans

**Edge Cases**:
- Admin account locked after failed attempts → manual unlock by superadmin
- Admin tries to access teacher-submitted work directly → allowed (admins see all)

---

#### A-002: View and Filter Review Queue
**As an** administrator
**I want to** see all works awaiting review
**So that I can** prioritize and process them efficiently

**Acceptance Criteria:**
- Given I am logged in as admin
- When I navigate to /dashboard/admin/review-queue
- Then I see a table of works with status "pending_review" showing:
  - Work title
  - Teacher name (clickable to filter by teacher)
  - Submission date (days ago indicator)
  - Themes associated
  - Preview button
  - Actions: Approve, Request Changes
- And I can filter by:
  - Submission date (last 7 days, last 30 days, all time)
  - Teacher (dropdown)
  - Theme (dropdown)
- And I can sort by:
  - Submission date (oldest first = default)
  - Teacher name (alphabetical)
- And urgent items (>7 days pending) are highlighted

**Priority**: P0 (Critical - Core workflow)

**Dependencies**:
- Works table with status filtering
- Users table for teacher names
- RLS policy: admins see all pending works

**Technical Constraints**:
- Real-time updates: use Supabase Realtime or poll every 60s
- Pagination: 50 works per page
- Export queue as CSV for reporting

**UX Considerations**:
- Badge showing pending count in navigation
- Empty state: "All caught up! No works pending review."
- Bulk actions: approve multiple works (with confirmation)

**Edge Cases**:
- Work is edited by admin while in queue → show "modified by admin" indicator
- Teacher withdraws work while admin reviewing → remove from queue
- Very long teacher name or title → truncate with tooltip

---

#### A-003: Review and Approve Work
**As an** administrator
**I want to** approve a submitted work
**So that** it becomes visible to visitors

**Acceptance Criteria:**
- Given I have selected a work from the review queue
- When I click "Preview" or work title
- Then I see a detailed view with:
  - All work fields (title, description, files, links)
  - Teacher info
  - Submission date and edit history (if resubmission)
  - Associated themes
- And I can click "Approve" button
- Then a confirmation modal appears: "Approve this work? It will be published immediately."
- When I confirm
- Then work status changes to "published"
- And teacher receives email notification
- And work appears on associated theme pages within 30s (ISR)
- And I see success message: "Work approved and published!"
- And the work is removed from my review queue

**Priority**: P0 (Critical - Core workflow)

**Dependencies**:
- Status update triggers email notification
- ISR revalidation for theme pages
- Audit log records approval (admin_id, timestamp)

**Technical Constraints**:
- Approval is atomic (DB transaction)
- Theme pages regenerated via on-demand ISR
- Approval cannot be undone (must manually unpublish)

**UX Considerations**:
- Preview opens in modal or side panel (not new tab)
- Large "Approve" button (green, prominent)
- Optional approval message field (sent to teacher)

**Edge Cases**:
- Work content violates policy (admin discretion) → use "Request Changes" instead
- Work references unpublished theme → warn admin, allow approval (theme may publish later)
- Admin approves then immediately regrets → provide "Unpublish" quick action

---

#### A-004: Request Changes to Work
**As an** administrator
**I want to** send a work back to the teacher with comments
**So that** they can make necessary revisions

**Acceptance Criteria:**
- Given I am reviewing a work
- When I click "Request Changes" button
- Then a modal appears with:
  - Text area for comments (required, max 500 chars)
  - Markdown preview
  - Send button
- When I submit comments
- Then work status changes to "needs_revision"
- And teacher receives email with comments
- And work moves out of my review queue
- And teacher can edit and resubmit
- And comments are stored with timestamp and admin name

**Priority**: P0 (Critical - Core workflow)

**Dependencies**:
- Work_reviews table for comments
- Email notification with comment content
- Status change updates dashboard

**Technical Constraints**:
- Comments support basic markdown (bold, italic, lists, links)
- XSS prevention: sanitize markdown output
- Comments editable by admin for 24h after sending

**UX Considerations**:
- Preset comment templates (common issues): "Please add more description", "File quality too low", etc.
- Character count indicator
- "Send and Next" button to continue to next work

**Edge Cases**:
- Admin submits empty comment → validation error
- Work is edited by teacher before admin comment sent → status conflict, show warning
- Multiple admins review same work → first action wins, second sees "already reviewed" message

---

#### A-005: Create and Manage Themes
**As an** administrator
**I want to** create themes representing physical displays
**So that** teachers can associate works and QR codes can be generated

**Acceptance Criteria:**
- Given I am on /dashboard/admin/themes
- When I click "New Theme" button
- Then I see a form with fields:
  - Title (required, IT and EN, max 100 chars)
  - Description (required, IT and EN, max 500 chars, markdown)
  - Featured image (upload, recommended size 1200x630px)
  - Status (draft, published)
  - Display order (integer, for sorting on homepage)
- And I can save as draft or publish immediately
- And I can edit existing themes (table with edit/delete actions)
- And I can reorder themes via drag-and-drop (changes display order)
- And deleting a theme shows warning: "X works are associated. Proceed?"

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- Themes table with multilingual fields
- Work-theme relationship checks on delete
- Image optimization service

**Technical Constraints**:
- Maximum 50 active themes (prevent overwhelming teachers)
- Slug auto-generated from title (used in URLs)
- Soft delete: themes referenced by works cannot be hard-deleted

**UX Considerations**:
- Preview button shows theme page as visitor would see it
- Duplicate theme button for quick variations
- Filter themes by status (draft, published, archived)

**Edge Cases**:
- Theme title conflicts with existing slug → auto-append number
- Featured image upload fails → allow saving without image, use placeholder
- Theme has no works → show on theme page with "Coming soon" message
- Attempting to delete theme with published works → prevent deletion, show error

---

#### A-006: Generate QR Codes for Themes
**As an** administrator
**I want to** generate QR codes linked to themes
**So that** I can print and affix them to physical displays

**Acceptance Criteria:**
- Given I have created a published theme
- When I navigate to theme detail page
- Then I see a "Generate QR Code" section with:
  - Preview of QR code (SVG, scannable)
  - Short URL displayed (e.g., school.app/q/abc123)
  - Download buttons: SVG, PNG (high-res), PDF
  - Copy link button
- And I can regenerate QR code (creates new short URL, old still works)
- And I can see scan statistics (total scans, last scan date)
- And downloaded QR codes include theme title and school logo (for context)

**Priority**: P0 (Critical - Core functionality)

**Dependencies**:
- QR code generation library (qrcode.js or server-side)
- Short URL service (DB table: short_code -> theme_id)
- QR scans tracking table

**Technical Constraints**:
- QR code error correction: Level M (15% redundancy)
- Short codes: 6 alphanumeric chars, collision-resistant
- High-res PNG: minimum 2000x2000px for print quality
- PDF includes cut marks and instructions

**UX Considerations**:
- QR code preview scans correctly (test with camera)
- Bulk download: select multiple themes, generate ZIP
- Print template includes theme title and "Scan me" text in both languages

**Edge Cases**:
- Theme title changes after QR printed → URL remains valid, points to updated content
- Short URL collision (extremely rare) → regenerate until unique
- QR code printed incorrectly (too small, low contrast) → provide size guidelines (min 3x3 cm)
- Visitor scans invalid/old QR → redirect to homepage with message

---

#### A-007: View Analytics Dashboard
**As an** administrator
**I want to** see usage statistics
**So that I can** measure engagement and report to stakeholders

**Acceptance Criteria:**
- Given I am on /dashboard/admin/analytics
- Then I see widgets with:
  - **Total QR Scans**: Count, sparkline graph (last 30 days)
  - **Total Work Views**: Count, trend vs. previous period
  - **Most Scanned Themes**: Top 5 themes with scan counts
  - **Most Viewed Works**: Top 5 works with view counts
  - **Activity Timeline**: Graph of scans and views by day (last 90 days)
  - **Teacher Contributions**: Count of published works per teacher (table)
- And I can filter by date range (last 7, 30, 90 days, all time)
- And I can export data as CSV
- And graphs are interactive (hover for details)

**Priority**: P1 (High - Stakeholder reporting)

**Dependencies**:
- QR_scans table (theme_id, scanned_at, hashed_ip)
- Work_views table (work_id, viewed_at, hashed_ip)
- Aggregation queries or materialized views for performance

**Technical Constraints**:
- Real-time data not required (refresh on page load)
- Graphs use Chart.js or Recharts
- Max data points: 90 days (longer periods aggregate by week)
- IP hashing: SHA-256(IP + daily_salt) for privacy

**UX Considerations**:
- Default view: last 30 days
- Large numbers formatted with commas (1,234)
- Empty state for new deployments: "Data will appear after first scan"

**Edge Cases**:
- No scans yet → show 0 with encouraging message
- Single outlier day (100x normal scans) → detect and annotate (event day?)
- Export fails → retry button, error message

---

#### A-008: Manage User Accounts
**As an** administrator
**I want to** create and manage teacher accounts
**So that** I control who can submit works

**Acceptance Criteria:**
- Given I am on /dashboard/admin/users
- When I click "Invite Teacher"
- Then I see a form with:
  - Email (required, validated)
  - Name (optional, for display)
  - Role (default: docente, option: admin)
- And I click "Send Invitation"
- Then an invitation email is sent with temporary password or magic link
- And the user appears in users table with status "invited"
- And I can see all users with columns:
  - Name/Email
  - Role
  - Status (active, invited, suspended)
  - Last login
  - Works count
  - Actions (Edit, Suspend, Delete)
- And I can suspend a teacher (disables login, hides works)
- And I can delete a teacher (requires reassigning or deleting their works)

**Priority**: P2 (Medium - Can manage manually via DB initially)

**Dependencies**:
- User management UI (not built into Supabase by default)
- Invitation email template
- RLS policies for user CRUD

**Technical Constraints**:
- Admins cannot delete own account (prevent lockout)
- Deleted teacher's works can be reassigned to another teacher
- Suspended accounts can be reactivated

**UX Considerations**:
- Bulk invite: CSV upload with email,name columns
- Search/filter users by name, email, role, status
- Confirmation before destructive actions

**Edge Cases**:
- Invitation email bounces → mark as "invitation_failed", show error
- Teacher already exists with that email → show error
- Admin suspends themselves → prevent with error message
- Delete teacher with 50+ works → require confirmation + reassignment workflow

---

## Feature Breakdown

### Feature 1: Dynamic QR Code System

#### Functionality Overview
Generate persistent short URLs linked to themes, encoded as QR codes, which redirect to updated content without reprinting.

#### Sub-Features

**F1.1: QR Code Generation**
- Input: Theme ID
- Output: SVG and PNG QR codes + short URL
- Technical approach: Generate short code (6 chars, base62), store in qr_codes table with theme_id
- QR library: qrcode.js (client-side) or qrcode (Node.js server-side)

**F1.2: Short URL Redirection**
- Route: /q/:shortCode
- Middleware: Lookup theme_id from short_code, increment scan counter, redirect to /themes/:themeId
- Fallback: Invalid code → 404 with school branding

**F1.3: QR Code Download Formats**
- SVG: Vector, scalable for any print size
- PNG: 2000x2000px, 300 DPI for professional printing
- PDF: A4 page with QR centered, theme title, school logo, cut marks

**F1.4: QR Code Regeneration**
- Allow admin to create new short URL for same theme (e.g., if original printed incorrectly)
- Old URLs remain valid (no breakage)
- Track "active" vs "legacy" QR codes

**F1.5: Scan Tracking**
- On redirect, log: short_code, theme_id, scanned_at timestamp, hashed_ip (privacy)
- Aggregate for analytics: scans per theme, scans per day
- GDPR compliance: Hash IP with daily salt, cannot reverse-identify users

#### Acceptance Criteria Summary
- QR codes scan correctly with iOS and Android native cameras
- Short URLs remain permanent (no expiration)
- Scan tracking works without JavaScript (server-side redirect)
- High-res downloads suitable for print (tested at 3x3cm minimum)

#### Technical Constraints
- Short codes must be collision-resistant (check uniqueness before insert)
- Error correction level M for QR codes (balance size/reliability)
- CDN caching for /q/:shortCode → 1 hour (balance analytics freshness vs. performance)

#### Edge Cases
- Short code collision → regenerate until unique (max 3 attempts)
- Theme deleted → QR redirects to 404 with "This display has been removed"
- Visitor scans multiple times → each scan logged (no deduplication)

---

### Feature 2: Work Submission and Approval Workflow

#### Functionality Overview
Multi-step process: Teacher creates work (draft) → submits for review (pending) → Admin approves (published) or requests changes (needs revision) → Teacher revises and resubmits.

#### Sub-Features

**F2.1: Draft Creation**
- Auto-save: Save form data to localStorage every 30s (client-side) and DB every 2 min (server-side)
- Restore draft on return (modal: "You have an unsaved draft. Resume?")
- Draft indicator: "Draft" badge on dashboard

**F2.2: Submission for Review**
- Validation: Check all required fields, at least 1 theme, at least 1 content (file or link)
- Status change: draft → pending_review
- Email notification: Send to all admins (configurable list)
- Teacher notification: Confirmation email

**F2.3: Admin Review Interface**
- Side-by-side view: Work preview + action buttons
- Approve: One-click, optional message to teacher
- Request changes: Required comment field (min 20 chars)
- Preview mode: See work exactly as visitor would

**F2.4: Approval and Publishing**
- Status change: pending_review → published
- ISR revalidation: Clear cache for associated theme pages
- Email notification: Teacher receives "Your work is live!" email
- Audit log: Record admin_id, action, timestamp

**F2.5: Revision Workflow**
- Status change: pending_review → needs_revision
- Comments attached to work (work_reviews table)
- Teacher re-edit: Pre-filled form, all data retained
- Resubmission: Status returns to pending_review, flagged as resubmission (edit_count incremented)

**F2.6: Email Notifications**
- Teacher on submission: "We've received your work [Title]. We'll review it soon!"
- Admin on new submission: "[Teacher] submitted [Title] for review"
- Teacher on approval: "Your work [Title] is now published!"
- Teacher on rejection: "[Title] needs revision. See admin comments."

#### Acceptance Criteria Summary
- Draft auto-save prevents data loss on accidental navigation
- Submission validation prevents incomplete works entering queue
- Admin can approve in <30 seconds (minimal clicks)
- Teacher receives feedback within 3 business days (organizational goal)

#### Technical Constraints
- Form validation: Client-side (immediate feedback) + server-side (security)
- Email delivery: Asynchronous, retry on failure (3 attempts, exponential backoff)
- ISR revalidation: On-demand only for published works (not drafts)
- Concurrency: Optimistic locking (version field) to prevent simultaneous edits

#### Edge Cases
- Teacher submits, immediately edits draft → show "Cannot edit, pending review"
- Admin approves while teacher edits → status conflict, admin action wins
- Email service down → work still submits, email queued for retry
- Work references theme that admin deletes → work hidden from theme page, still accessible via direct link

---

### Feature 3: Content Management (Upload & Link Handling)

#### Functionality Overview
Support multiple content types: uploaded files (PDF, images) and external links (YouTube, Vimeo, Drive, generic URLs).

#### Sub-Features

**F3.1: File Upload (PDF, Images)**
- Allowed types: .pdf, .jpg, .jpeg, .png
- Max file size: 10MB per file
- Max files per work: 5
- Storage: Supabase Storage, public bucket (work_attachments)
- File naming: {work_id}_{timestamp}_{original_name} (prevent conflicts)
- Thumbnail generation: Auto-generate for images (300x300px for previews)

**F3.2: External Link Handling**
- Link types detected via regex:
  - YouTube: youtube.com/watch?v= or youtu.be/
  - Vimeo: vimeo.com/
  - Google Drive: drive.google.com/
  - Other: Any https:// URL
- Validation: Must start with https://, valid URL format
- Link preview: Fetch title and thumbnail (opengraph metadata) on blur
- Embedding: YouTube/Vimeo render as iframe, others as button "Open Link"

**F3.3: Drag-and-Drop Upload**
- Drop zone: Dashed border area, "Drag files here or click to browse"
- Visual feedback: Highlight on drag-over, show uploading spinner
- Multi-file support: Drop multiple files simultaneously

**F3.4: Upload Progress and Error Handling**
- Progress bar: Per-file, shows percentage
- Success state: Green checkmark, file size displayed
- Error state: Red X, error message (e.g., "File too large"), retry button
- Network interruption: Resume from last chunk (chunked upload)

**F3.5: Content Display on Detail Page**
- PDFs: Inline viewer (iframe with PDF.js fallback), download button
- Images: Lightbox gallery (click to enlarge, swipe navigation)
- Videos: Responsive iframe (16:9 aspect ratio), autoplay on interaction
- Links: Button with icon, opens in new tab, external link indicator

**F3.6: Content Moderation**
- Admin preview: See all files/links before approval
- File type verification: Server-side MIME type check (prevent .exe renamed to .pdf)
- Link safety: Check against URL blacklist (malware, phishing domains)

#### Acceptance Criteria Summary
- Files upload reliably on 3G connection (chunked upload, resume on failure)
- External links embed correctly 95% of the time (handle edge cases gracefully)
- Content displays responsively on mobile (320px width) and desktop (1920px width)

#### Technical Constraints
- Total storage per teacher: 500MB soft limit (warn at 400MB)
- Image optimization: Auto-convert to WebP, serve via CDN
- PDF rendering: Use PDF.js for browser compatibility (some mobile browsers lack native support)
- Video embedding: Use privacy-enhanced mode (YouTube: youtube-nocookie.com)

#### Edge Cases
- File upload fails at 99% → show retry, don't force re-upload from 0%
- YouTube link is to private video → embed shows "Video unavailable", warn teacher during upload
- Google Drive link is private → warn "Visitors may not be able to access this"
- File name has non-Latin characters (e.g., Chinese) → sanitize to ASCII
- Image is portrait (not landscape) → crop to square thumbnail, preserve original for detail
- PDF with 100+ pages → warn about large file size, suggest splitting

---

### Feature 4: Filtering and Search

#### Functionality Overview
Enable visitors to narrow down works by class, teacher, year, content type, or search keywords for quick discovery.

#### Sub-Features

**F4.1: Filter UI (Mobile and Desktop)**
- Mobile: Bottom sheet (slide up from bottom), chips for active filters at top
- Desktop: Sidebar (left side), collapsible sections
- Filter types:
  - Class: Multi-select checkboxes (e.g., 1A, 1B, 2A, 2B)
  - Teacher: Single-select dropdown (alphabetical)
  - School Year: Single-select dropdown (newest first, e.g., 2024-25, 2023-24)
  - Content Type: Multi-select chips (Video, PDF, Image, Link)

**F4.2: Real-Time Filtering**
- On filter selection, update work list without page reload (client-side filtering if <100 works, server-side if more)
- Loading state: Skeleton cards while fetching
- URL state: Filters reflected in URL query params (e.g., ?class=1A,1B&type=video) for shareability

**F4.3: Filter Counts and Disabled States**
- Show count next to each filter option (e.g., "Video (3)")
- Disable filters with 0 matches (greyed out)
- Update counts when other filters change

**F4.4: Clear Filters**
- "Clear All" button visible when ≥1 filter active
- Resets all filters, returns to default view (all works, newest first)

**F4.5: Full-Text Search**
- Search input: Prominent, top of page (sticky on scroll)
- Search scope: Work title, description, tags
- Search behavior:
  - Case-insensitive
  - Partial match (e.g., "sci" matches "science")
  - Accent-insensitive (e.g., "é" matches "e")
- Search results: Highlight matching terms in results
- No results: "No works found for '[query]'. Try different keywords."

**F4.6: Search with Filters Combined**
- Filters + search work together (AND logic: match all conditions)
- Example: Search "robot" + filter "Class: 2A" → only works from 2A containing "robot"

**F4.7: Search Performance**
- Debounce: 300ms after user stops typing
- Minimum length: 3 characters (prevent overwhelming results)
- Use Postgres full-text search (tsvector) for performance
- Index: Create GIN index on tsvector column

#### Acceptance Criteria Summary
- Filters update results in <500ms
- Search returns results in <500ms for <1000 works
- Filter state persists on back navigation (stored in session)
- URL shareable (copy-paste URL → same filtered view)

#### Technical Constraints
- Client-side filtering: Max 100 works (store in state)
- Server-side filtering: >100 works (API call with query params)
- Search index: Rebuild on work publish/unpublish (Supabase trigger)

#### Edge Cases
- No works match filter combination → "No works match your filters. Try adjusting them."
- Filter values change after page load (new work published) → don't auto-update until refresh
- URL with invalid filter params (e.g., ?class=invalid) → ignore invalid, show validation message
- Search with SQL injection attempt (e.g., "'; DROP TABLE works;") → sanitize input, no SQL execution

---

### Feature 5: Analytics and Tracking

#### Functionality Overview
Track QR scans and work views anonymously to measure engagement without compromising visitor privacy.

#### Sub-Features

**F5.1: QR Scan Tracking**
- Trigger: On /q/:shortCode redirect, before navigating to theme page
- Data logged:
  - short_code (linked to theme_id)
  - scanned_at (timestamp, UTC)
  - hashed_ip (SHA-256(IP + daily_salt))
  - user_agent (device type: mobile/desktop, browser)
- Privacy: No raw IPs stored, hash changes daily (cannot track across days)

**F5.2: Work View Tracking**
- Trigger: On work detail page load (client-side event or server-side)
- Data logged:
  - work_id
  - viewed_at (timestamp, UTC)
  - hashed_ip (same method as scans)
  - referrer (theme page, direct link, external)
- Deduplication: Same user viewing same work within 1 hour → count as 1 view

**F5.3: Analytics Dashboard (Admin)**
- Widgets:
  - Total QR Scans: Aggregate count, line chart (last 30 days)
  - Total Work Views: Aggregate count, comparison to previous period (+15%)
  - Top Themes: Bar chart (top 5 by scan count)
  - Top Works: Table (top 10 by view count, with title and teacher)
  - Activity Timeline: Dual-axis chart (scans and views by day)
  - Teacher Contributions: Table (teacher name, published works count)

**F5.4: Date Range Filtering**
- Dropdown: Last 7 days, Last 30 days, Last 90 days, All time
- Default: Last 30 days
- Update all widgets on selection

**F5.5: Data Export**
- CSV export: "Export Analytics" button
- Columns: Date, QR Scans, Work Views, Most Scanned Theme, Most Viewed Work
- File name: analytics_[start_date]_to_[end_date].csv

**F5.6: Real-Time Updates (Optional for MVP)**
- Use Supabase Realtime subscriptions to update dashboard live (every 10s)
- Show "Live" indicator badge

#### Acceptance Criteria Summary
- Scans and views logged reliably (99%+ success rate)
- No PII (Personally Identifiable Information) stored (GDPR compliant)
- Analytics dashboard loads in <2s
- Export generates file in <5s for 90 days of data

#### Technical Constraints
- Hashing algorithm: SHA-256 (strong, irreversible)
- Daily salt: Generated at midnight UTC, stored in config table
- Database indexes: Index on scanned_at, viewed_at for fast aggregation
- Retention: Keep raw logs for 1 year, aggregate monthly after

#### Edge Cases
- User scans same QR 10 times in 1 minute → all logged (no deduplication for scans, only views)
- Clock skew: Timestamp on server, not client (avoid time zone issues)
- Bot traffic (crawler scanning QR) → filter by user_agent (exclude bots)
- No scans in selected date range → show "No data for this period"
- Export with 0 data → generate empty CSV with headers

---

### Feature 6: Multilingual Support (IT/EN)

#### Functionality Overview
Provide interface and content in Italian (primary) and English (secondary) for accessibility to non-Italian speakers.

#### Sub-Features

**F6.1: Language Toggle**
- Position: Top-right corner of header (persistent across all pages)
- Options: IT (default) | EN
- Visual: Flag icons or text toggle
- Behavior: Switch language without page reload (Next.js i18n routing)

**F6.2: URL-Based Localization**
- Routes: /it/* and /en/*
- Example: /it/themes/123 vs /en/themes/123
- Default: /it (redirect root / → /it)
- SEO: hreflang tags in <head> for both languages

**F6.3: Interface Translation**
- All UI strings externalized to JSON files:
  - /locales/it.json
  - /locales/en.json
- Keys: Namespaced (e.g., "common.submit", "dashboard.title")
- Library: next-intl for React i18n

**F6.4: Content Translation**
- Database schema: Multilingual fields (title_it, title_en, description_it, description_en)
- Fallback: If EN content missing, show IT with indicator "(Disponibile solo in italiano)"
- Admin form: Side-by-side tabs for IT and EN content entry

**F6.5: Language Preference Persistence**
- Store: localStorage (key: "preferred_language")
- Restore: On page load, check localStorage → set language
- Override: URL language takes precedence (e.g., visiting /en link overrides IT preference)

**F6.6: Date and Number Formatting**
- Dates: Use locale-specific format (IT: 07/11/2025, EN: 11/07/2025)
- Numbers: Locale-specific separators (IT: 1.234,56, EN: 1,234.56)
- Library: Intl.DateTimeFormat and Intl.NumberFormat (browser native)

#### Acceptance Criteria Summary
- All interface elements translate correctly (no hardcoded strings)
- User can switch language mid-session, preference persists
- Missing translations show fallback with clear indicator
- SEO: Both languages indexed separately by search engines

#### Technical Constraints
- Translation coverage: 100% for MVP (no missing keys)
- Translation source: Initially manual, future: Crowdin or similar for community contributions
- Content fields: All user-facing strings must have IT and EN versions

#### Edge Cases
- Visiting /de (unsupported language) → redirect to /it (default)
- Content exists only in IT, user in EN mode → show IT content with "(IT only)" badge
- Admin submits form with only IT content, EN blank → validation allows (EN optional in MVP)
- Language toggle mid-form entry → prompt "Switch language? Unsaved changes may be lost."

---

### Feature 7: Accessibility (WCAG 2.1 AA)

#### Functionality Overview
Ensure application is usable by people with disabilities, meeting WCAG 2.1 Level AA standards.

#### Sub-Features

**F7.1: Keyboard Navigation**
- All interactive elements (buttons, links, inputs) accessible via Tab
- Focus indicators: Visible outline (2px solid, high contrast)
- Skip links: "Skip to main content" at top for screen reader users
- Modals: Trap focus (Tab cycles within modal), Esc to close

**F7.2: Screen Reader Support**
- Semantic HTML: Use <nav>, <main>, <article>, <aside>, <button>, not <div onclick>
- ARIA labels: Add aria-label where text not visible (e.g., icon-only buttons)
- ARIA live regions: Announce dynamic content changes (e.g., filter results update)
- Alt text: All images have descriptive alt attributes (for works, use title or description)

**F7.3: Color Contrast**
- Text contrast: Minimum 4.5:1 for normal text, 3:1 for large text (18pt+)
- Interactive elements: 3:1 contrast for borders/icons
- Testing tool: Use Contrast Checker (WebAIM) during design

**F7.4: Responsive Text Sizing**
- Allow text zoom up to 200% without layout breaking
- No fixed pixel widths, use rem/em units
- Test at 200% zoom in browser

**F7.5: Form Accessibility**
- Labels: All inputs have associated <label> (explicit or aria-label)
- Error messages: Link errors to fields via aria-describedby
- Required fields: Indicate with asterisk and aria-required="true"
- Error summary: At top of form, announce with aria-live

**F7.6: Media Accessibility**
- Videos: Require captions (admin guidelines, not enforced in MVP)
- Images: Mandatory alt text in upload form
- Audio: If added in future, require transcripts

**F7.7: Focus Management**
- On page navigation: Focus moves to main heading (H1)
- After modal close: Focus returns to trigger button
- After inline error: Focus moves to first error field

#### Acceptance Criteria Summary
- Lighthouse Accessibility score ≥90
- Manual screen reader test (NVDA/JAWS) passes all flows
- Keyboard-only navigation completes all user tasks
- Color contrast meets WCAG AA on all pages

#### Technical Constraints
- Automated testing: Add axe-core to CI/CD (fails build on violations)
- Manual testing: QA checklist for each major feature
- Design system: Pre-audited components (buttons, inputs, modals)

#### Edge Cases
- User zooms text to 200% → horizontal scrolling allowed, vertical content reflows
- Screen reader user on filter panel → announce count of results after filter
- Keyboard user on image gallery → arrow keys navigate images
- High contrast mode (Windows) → ensure all elements still visible

---

## Data Models

### Database Schema (Supabase Postgres)

#### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('docente', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  storage_used_mb INTEGER DEFAULT 0
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Relationships:**
- 1:N with works (teacher)
- 1:N with work_reviews (admin)

**Indexes:**
- `idx_users_email` on (email) for login lookups
- `idx_users_role` on (role) for admin queries

---

#### Table: themes
```sql
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  description_it TEXT NOT NULL,
  description_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- RLS Policies
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Themes viewable by all (public)" ON themes FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage themes" ON themes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update updated_at on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Relationships:**
- 1:N with qr_codes
- N:M with works (via work_themes junction table)

**Indexes:**
- `idx_themes_slug` on (slug) for URL lookups
- `idx_themes_status_order` on (status, display_order) for homepage queries

---

#### Table: works
```sql
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  description_it TEXT NOT NULL,
  description_en TEXT,
  class_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  school_year TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'needs_revision', 'archived')),
  license TEXT CHECK (license IN ('none', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA')),
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0, -- Incremented on resubmission
  search_vector TSVECTOR -- Full-text search
);

-- RLS Policies
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published works viewable by all" ON works FOR SELECT USING (status = 'published');
CREATE POLICY "Teachers view own works" ON works FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Admins view all works" ON works FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Teachers insert own works" ON works FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Teachers update own drafts" ON works FOR UPDATE USING (
  created_by = auth.uid() AND status IN ('draft', 'needs_revision')
);
CREATE POLICY "Admins update all works" ON works FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update search_vector on insert/update
CREATE OR REPLACE FUNCTION works_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title_it, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_it, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER works_search_vector_trigger BEFORE INSERT OR UPDATE ON works
FOR EACH ROW EXECUTE FUNCTION works_search_vector_update();

-- Trigger: Update updated_at
CREATE TRIGGER update_works_updated_at BEFORE UPDATE ON works
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Relationships:**
- N:1 with users (created_by)
- 1:N with work_attachments
- 1:N with work_links
- N:M with themes (via work_themes)
- 1:N with work_reviews
- 1:N with work_views

**Indexes:**
- `idx_works_status` on (status) for dashboard queries
- `idx_works_created_by` on (created_by) for teacher dashboard
- `idx_works_published_at` on (published_at DESC) for homepage sorting
- `idx_works_search_vector` GIN index on (search_vector) for full-text search

---

#### Table: work_themes (Junction Table)
```sql
CREATE TABLE work_themes (
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (work_id, theme_id)
);

-- RLS Policies
ALTER TABLE work_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Work-theme associations viewable by all" ON work_themes FOR SELECT USING (true);
CREATE POLICY "Teachers manage own work associations" ON work_themes FOR ALL USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_themes.work_id AND created_by = auth.uid())
);
CREATE POLICY "Admins manage all associations" ON work_themes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Indexes:**
- `idx_work_themes_theme_id` on (theme_id) for theme page queries

---

#### Table: work_attachments
```sql
CREATE TABLE work_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'image'
  mime_type TEXT NOT NULL, -- 'application/pdf', 'image/jpeg', etc.
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  thumbnail_path TEXT, -- For images
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE work_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attachments viewable with published works" ON work_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_attachments.work_id AND status = 'published')
);
CREATE POLICY "Teachers manage own work attachments" ON work_attachments FOR ALL USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_attachments.work_id AND created_by = auth.uid())
);
CREATE POLICY "Admins manage all attachments" ON work_attachments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Relationships:**
- N:1 with works

**Indexes:**
- `idx_attachments_work_id` on (work_id)

---

#### Table: work_links
```sql
CREATE TABLE work_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('youtube', 'vimeo', 'drive', 'other')),
  custom_label TEXT,
  preview_title TEXT, -- Fetched via opengraph
  preview_thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (same as work_attachments)
ALTER TABLE work_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Links viewable with published works" ON work_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_links.work_id AND status = 'published')
);
CREATE POLICY "Teachers manage own work links" ON work_links FOR ALL USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_links.work_id AND created_by = auth.uid())
);
CREATE POLICY "Admins manage all links" ON work_links FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Relationships:**
- N:1 with works

**Indexes:**
- `idx_links_work_id` on (work_id)

---

#### Table: qr_codes
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL, -- 6-char alphanumeric
  is_active BOOLEAN DEFAULT true, -- For regeneration tracking
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR codes viewable by all (for redirection)" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Admins manage QR codes" ON qr_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Relationships:**
- N:1 with themes

**Indexes:**
- `idx_qr_codes_short_code` UNIQUE on (short_code) for fast lookups
- `idx_qr_codes_theme_id` on (theme_id)

---

#### Table: qr_scans (Analytics)
```sql
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT -- 'mobile', 'desktop', 'tablet'
);

-- RLS Policies
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all scans" ON qr_scans FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Public can insert scans (logging)" ON qr_scans FOR INSERT WITH CHECK (true);
```

**Indexes:**
- `idx_qr_scans_scanned_at` on (scanned_at DESC) for analytics queries
- `idx_qr_scans_theme_id` on (theme_id) for theme-specific stats

---

#### Table: work_views (Analytics)
```sql
CREATE TABLE work_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  referrer TEXT, -- 'theme_page', 'direct', 'external'
  user_agent TEXT
);

-- RLS Policies (same as qr_scans)
ALTER TABLE work_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all views" ON work_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Public can insert views (logging)" ON work_views FOR INSERT WITH CHECK (true);
```

**Indexes:**
- `idx_work_views_viewed_at` on (viewed_at DESC)
- `idx_work_views_work_id` on (work_id)

---

#### Table: work_reviews (Admin Feedback)
```sql
CREATE TABLE work_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments TEXT, -- Required for rejection, optional for approval
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE work_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view reviews of own works" ON work_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM works WHERE id = work_reviews.work_id AND created_by = auth.uid())
);
CREATE POLICY "Admins view all reviews" ON work_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins insert reviews" ON work_reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

**Relationships:**
- N:1 with works
- N:1 with users (reviewer)

**Indexes:**
- `idx_work_reviews_work_id` on (work_id)
- `idx_work_reviews_reviewed_at` on (reviewed_at DESC)

---

#### Table: config (Application Settings)
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config readable by all" ON config FOR SELECT USING (true);
CREATE POLICY "Admins update config" ON config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Seed data
INSERT INTO config (key, value) VALUES
  ('daily_salt', gen_random_uuid()::TEXT), -- For IP hashing
  ('school_name_it', 'Scuola Esempio'),
  ('school_name_en', 'Example School'),
  ('max_file_size_mb', '10'),
  ('max_files_per_work', '5'),
  ('teacher_storage_quota_mb', '500');
```

---

### Supabase Storage Buckets

**Bucket: work_attachments** (public)
- Purpose: Store PDFs and images uploaded by teachers
- Access: Public read, authenticated write (RLS on uploads)
- Structure: `/{work_id}/{timestamp}_{filename}`
- Policies:
  - Allow upload: Teachers (own works), admins (all)
  - Allow download: Public (for published works)

**Bucket: theme_images** (public)
- Purpose: Store featured images for themes
- Access: Public read, admin write
- Structure: `/{theme_id}/{filename}`

**Bucket: qr_codes** (public)
- Purpose: Store generated QR code images (PNG, SVG, PDF)
- Access: Public read, admin write
- Structure: `/{theme_id}/{short_code}.{format}`

---

## Edge Cases and Error Handling

### Authentication and Authorization

**Edge Case**: User session expires while editing work
- **Handling**: Save draft to localStorage, show "Session expired" modal, redirect to login, restore draft after re-authentication

**Edge Case**: Teacher tries to access admin route directly
- **Handling**: Middleware checks role, redirect to /dashboard/teacher with message "Admins only"

**Edge Case**: Admin accidentally deletes own account
- **Handling**: Prevent deletion if last admin, show error "Cannot delete last admin account"

---

### Work Creation and Submission

**Edge Case**: File upload fails at 99% due to network issue
- **Handling**: Resume upload from last chunk (chunked upload with retry logic), show "Resuming..." indicator

**Edge Case**: Teacher submits work with external link to private Google Drive file
- **Handling**: Show warning during link addition: "This link may not be accessible to visitors. Ensure sharing is set to 'Anyone with link'."

**Edge Case**: Work references theme that admin deletes after submission
- **Handling**: Work remains in database, hidden from deleted theme's page, still accessible via direct link and other themes

**Edge Case**: Two teachers create works with identical titles
- **Handling**: Allow (no uniqueness constraint), disambiguate with teacher name and ID in URL slug

**Edge Case**: Teacher navigates away from form mid-upload
- **Handling**: Browser prompt "Leave site? Uploads in progress will be cancelled." with option to stay

**Edge Case**: File has virus or malware
- **Handling**: Future enhancement (not MVP) - integrate virus scanner (ClamAV), reject infected files

---

### Admin Review and Approval

**Edge Case**: Admin approves work while teacher is simultaneously editing draft
- **Handling**: Optimistic locking - use version field, whichever saves first wins, other gets conflict error

**Edge Case**: Work has 10 themes associated, admin deletes 5 of them
- **Handling**: Work remains on 5 remaining themes, association records for deleted themes cascade delete

**Edge Case**: Admin approves work but email notification fails to send
- **Handling**: Work still publishes (don't block on email), log email error, retry 3 times, alert admin if all fail

**Edge Case**: Two admins review same work simultaneously
- **Handling**: First action commits, second gets "Already reviewed by [Admin Name]" message with refresh option

---

### QR Code Generation and Scanning

**Edge Case**: Short code collision (extremely rare, 62^6 = 56 billion combinations)
- **Handling**: On generation, check uniqueness, if collision, regenerate (max 3 attempts), error if all fail

**Edge Case**: Visitor scans QR code for theme that was just unpublished
- **Handling**: Redirect to 404 page with message "This display is no longer available" and link to homepage

**Edge Case**: QR code printed incorrectly (too small, damaged, low contrast)
- **Handling**: Provide print guidelines (min 3x3cm, high contrast), test scan before printing

**Edge Case**: Malicious actor replaces QR sticker with phishing link
- **Handling**: Physical security (school responsibility), digital: monitor for unusual redirects (future enhancement)

---

### Filtering and Search

**Edge Case**: User applies filter that returns 0 results
- **Handling**: Show empty state: "No works match your filters. Try: [Clear Filters] or [Broaden Search]"

**Edge Case**: Search query contains SQL injection attempt
- **Handling**: Use parameterized queries (Supabase client handles), no raw SQL concatenation

**Edge Case**: User types very long search query (>100 characters)
- **Handling**: Truncate to 100 chars, show warning "Search limited to 100 characters"

**Edge Case**: Full-text search index out of sync with work data
- **Handling**: Trigger automatically updates search_vector on INSERT/UPDATE, manual reindex command for admins

---

### Content Display

**Edge Case**: PDF file is corrupted or unreadable
- **Handling**: PDF.js shows error, provide download button as fallback, allow user to report issue

**Edge Case**: YouTube video embed is deleted or set to private
- **Handling**: Embed shows "Video unavailable", don't block page load, show message "Contact teacher to update"

**Edge Case**: Image upload is extremely large (9.9MB, just under limit)
- **Handling**: Allow upload, auto-compress for web display (WebP, 1920px max width), retain original for download

**Edge Case**: Work has no content (0 files, 0 links)
- **Handling**: Validation prevents submission, if somehow saved (DB insert), show "Content coming soon" placeholder

---

### Multilingual

**Edge Case**: Admin enters Italian content but forgets English translation
- **Handling**: Allow submission (EN optional in MVP), show fallback with "(IT only)" badge on EN site

**Edge Case**: User switches language mid-form entry
- **Handling**: Prompt "Switch language? Changes to [current language] fields may be lost." with confirm/cancel

**Edge Case**: URL language parameter conflicts with localStorage preference
- **Handling**: URL takes precedence (explicit intent), update localStorage to match

---

### Analytics

**Edge Case**: Bot traffic (crawlers) inflates scan/view counts
- **Handling**: Filter by user_agent (exclude common bots: Googlebot, Bingbot), consider CAPTCHA for suspicious patterns

**Edge Case**: User scans same QR 100 times in 1 day (testing)
- **Handling**: Log all scans (no deduplication), analytics can filter outliers (e.g., >10 scans from same hashed_ip per day)

**Edge Case**: Clock skew between server and client
- **Handling**: Always use server timestamp (DB NOW()), ignore client Date()

---

### Performance and Scalability

**Edge Case**: Theme page has 500 associated works
- **Handling**: Implement pagination (50 per page), lazy load images, consider infinite scroll

**Edge Case**: Database query timeout (>30s) on analytics dashboard
- **Handling**: Use materialized views for aggregations (refresh hourly), show cached data with timestamp

**Edge Case**: Supabase Storage reaches quota limit
- **Handling**: Monitor usage, alert admin at 80%, implement teacher quotas (500MB per teacher)

---

## Success Metrics and KPIs

### Measurement Strategy

**Data Collection Methods:**
1. **QR Scans**: Logged server-side on /q/:shortCode redirect (qr_scans table)
2. **Work Views**: Logged client-side on work detail page mount (work_views table)
3. **User Engagement**: Track clicks (theme → work, filter usage) via analytics library (optional: PostHog, Plausible)
4. **Teacher Activity**: Monitor work submissions, approval cycle time via database queries
5. **System Performance**: Track via Vercel Analytics (Core Web Vitals), Supabase logs

---

### North Star Metric

**Monthly Active Scans (QR code scans per calendar month)**

**Target Progression:**
- Month 1 (launch): 20 scans (soft launch, limited QR codes)
- Month 3: 100 scans (full deployment, 10 themes)
- Month 6: 250 scans (word of mouth, parent engagement)
- Month 12: 500 scans (sustained engagement, events)

**Rationale**: Scans are the primary entry point for visitors, indicating real-world engagement with physical displays. High scan count = successful integration of digital and physical.

---

### Primary KPIs

#### 1. QR Code Scan Rate
**Definition**: Number of QR code scans per month
**Target**: 100+ scans/month by month 3
**Measurement**: Count rows in qr_scans table grouped by month
**Query**:
```sql
SELECT
  DATE_TRUNC('month', scanned_at) AS month,
  COUNT(*) AS scan_count
FROM qr_scans
GROUP BY month
ORDER BY month DESC;
```
**Success Criteria**: Increasing trend month-over-month (>10% growth)

---

#### 2. Work Approval Cycle Time
**Definition**: Average time from submission to publication (in days)
**Target**: <3 days (72 hours)
**Measurement**:
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (published_at - submitted_at)) / 86400) AS avg_days
FROM works
WHERE status = 'published' AND submitted_at IS NOT NULL;
```
**Success Criteria**: 80% of works published within 3 days

**Actionable Insights**:
- If >3 days: Increase admin capacity or streamline review process
- If <1 day: Excellent, maintain quality checks

---

#### 3. Teacher Adoption Rate
**Definition**: Percentage of teaching staff who have created at least one published work
**Target**: 60% adoption in first semester (assuming 30 teachers = 18 active)
**Measurement**:
```sql
SELECT
  COUNT(DISTINCT created_by) AS active_teachers,
  (SELECT COUNT(*) FROM users WHERE role = 'docente') AS total_teachers,
  ROUND(100.0 * COUNT(DISTINCT created_by) / (SELECT COUNT(*) FROM users WHERE role = 'docente'), 2) AS adoption_rate
FROM works
WHERE status = 'published';
```
**Success Criteria**: 60% by month 6, 80% by month 12

**Engagement Strategy**:
- Months 1-2: Onboarding workshops, 1-on-1 training
- Months 3-4: Feature spotlight emails, showcase exemplary works
- Months 5-6: Gamification (leaderboard of most-viewed works)

---

#### 4. Content Diversity
**Definition**: Percentage of works that include multimedia (videos, links) vs. only PDFs/images
**Target**: 50%+ multimedia
**Measurement**:
```sql
SELECT
  COUNT(*) FILTER (WHERE has_multimedia) AS multimedia_works,
  COUNT(*) AS total_works,
  ROUND(100.0 * COUNT(*) FILTER (WHERE has_multimedia) / COUNT(*), 2) AS diversity_rate
FROM (
  SELECT
    w.id,
    EXISTS (SELECT 1 FROM work_links WHERE work_id = w.id) AS has_multimedia
  FROM works w
  WHERE status = 'published'
) sub;
```
**Success Criteria**: Increasing trend, target 50% by month 6

---

### Secondary KPIs

#### 5. Average Works per Theme
**Definition**: Mean number of published works associated with each theme
**Target**: >3 works per theme
**Measurement**:
```sql
SELECT
  AVG(work_count) AS avg_works_per_theme
FROM (
  SELECT theme_id, COUNT(*) AS work_count
  FROM work_themes wt
  JOIN works w ON wt.work_id = w.id
  WHERE w.status = 'published'
  GROUP BY theme_id
) sub;
```
**Rationale**: Ensures themes are well-populated, valuable to visitors

---

#### 6. Visitor Engagement (Click-Through Rate)
**Definition**: Percentage of theme page visitors who click to view at least one work detail
**Target**: >40% CTR
**Measurement**:
- Theme page views: Log in analytics (PostHog, Plausible)
- Work detail views: Count in work_views table
**Calculation**: (Total work views) / (Total theme page views) × 100

**Success Criteria**: Sustained >40% CTR indicates compelling content

---

#### 7. Accessibility Compliance
**Definition**: Percentage of pages meeting WCAG 2.1 AA
**Target**: 100% compliance
**Measurement**:
- Automated: Lighthouse CI score ≥90 on all routes
- Manual: Quarterly audit with screen reader (NVDA)
**Tracking**: Pass/fail checklist, issue tracker for violations

---

#### 8. System Uptime
**Definition**: Percentage of time application is available
**Target**: >99.5% uptime (max 3.6 hours downtime per month)
**Measurement**: Vercel deployment logs, Supabase status API
**Monitoring**: Set up alerts (PagerDuty, email) for downtime >5 min

---

### Reporting Cadence

**Daily** (Auto-generated, email to admins):
- QR scans yesterday
- New works submitted
- Works pending review (alert if >10)

**Weekly** (Dashboard view for admins):
- Scans and views trend (last 7 days vs. previous 7 days)
- Top 5 themes and works
- Teacher activity (who submitted, who hasn't)

**Monthly** (Exported report for stakeholders):
- All primary KPIs with targets
- Content growth (total works, themes)
- User feedback summary (if feedback form added)
- Action items for next month

**Quarterly** (Strategic review):
- Analyze trends, identify underperforming areas
- Plan feature enhancements based on data
- Teacher and visitor surveys

---

### A/B Testing Opportunities (Post-MVP)

1. **Theme Page Layout**: Grid vs. list view for works → measure CTR
2. **Filter Position**: Sidebar vs. top bar → measure filter usage rate
3. **QR Code Call-to-Action**: "Scan me" text vs. icon-only → measure scan rate
4. **Work Card Design**: Image-first vs. title-first → measure click rate

---

## Implementation Priorities

### P0: Must-Have for MVP (Launch Blockers)

**Backend:**
- [x] Supabase project setup (Auth, Database, Storage)
- [x] Database schema creation (all tables, RLS policies, indexes)
- [x] User authentication (email/password, role-based access)
- [x] Work CRUD operations (create, read, update, delete with RLS)
- [x] File upload to Supabase Storage
- [x] Theme CRUD operations
- [x] QR code generation and short URL redirection
- [x] Work approval workflow (status changes, email notifications)
- [x] Basic analytics logging (qr_scans, work_views)

**Frontend:**
- [x] Next.js app setup (App Router, TypeScript)
- [x] Multilingual routing (next-intl, /it and /en routes)
- [x] Public pages: Homepage, Theme page, Work detail page
- [x] Teacher dashboard: Work list, create/edit form
- [x] Admin dashboard: Review queue, theme management, QR generation
- [x] Authentication UI (login, logout)
- [x] Responsive design (mobile-first)
- [x] Basic accessibility (semantic HTML, keyboard navigation)

**Total Estimated Effort**: 6-8 weeks (2 developers)

---

### P1: Should-Have for Launch (Enhances Usability)

- [x] Full-text search functionality
- [x] Advanced filtering (class, teacher, year, type)
- [x] Email notifications (submission, approval, rejection)
- [x] Analytics dashboard (scan/view stats, charts)
- [x] Work revision workflow (needs_revision status, comments)
- [x] User account management (invite teachers, suspend)
- [x] PDF preview in browser
- [x] Video embed support (YouTube, Vimeo)

**Total Estimated Effort**: 3-4 weeks (added to initial 8 weeks = 11-12 weeks)

---

### P2: Nice-to-Have (Post-Launch Enhancements)

- [ ] PWA support (offline theme pages, service worker)
- [ ] Bulk QR code generation (download ZIP for all themes)
- [ ] Teacher analytics (own work views)
- [ ] Work duplication (copy as template)
- [ ] Draft auto-save (localStorage + DB sync)
- [ ] Advanced admin controls (featured works, work ordering)
- [ ] CSV export for all data (works, scans, users)
- [ ] Internationalization for more languages (FR, DE, ES)

**Total Estimated Effort**: 4-6 weeks (post-launch, based on feedback)

---

### Out of Scope for MVP (Future Roadmap)

- [ ] Native mobile app (iOS/Android)
- [ ] Social features (comments, likes on works)
- [ ] Student accounts (self-submission with teacher approval)
- [ ] Integration with LMS (Google Classroom, Moodle)
- [ ] AI-powered content recommendations
- [ ] Video transcoding (upload large videos, auto-compress)
- [ ] Advanced theming (color schemes, fonts)
- [ ] Multi-school support (tenant architecture)

---

## Technical Implementation Notes

### Architecture Decisions

**1. Next.js App Router vs. Pages Router**
- **Decision**: App Router
- **Rationale**:
  - Server Components reduce client JS bundle
  - Native support for ISR and streaming
  - Better i18n routing with next-intl
  - Future-proof (recommended by Vercel)

**2. Supabase vs. Firebase vs. Custom Backend**
- **Decision**: Supabase
- **Rationale**:
  - Postgres (powerful querying, full-text search)
  - RLS provides fine-grained security
  - Integrated Auth, Storage, Realtime
  - Open-source, self-hostable if needed
  - Lower cost for MVP

**3. ISR (Incremental Static Regeneration) Strategy**
- **Decision**: On-demand ISR for theme pages
- **Rationale**:
  - Theme pages are mostly static (change when work published)
  - Fast first load (pre-rendered)
  - Update on work approval (revalidatePath in API)
  - Reduce DB load for public pages

**4. Client-Side vs. Server-Side Filtering**
- **Decision**: Hybrid approach
- **Rationale**:
  - <100 works: Client-side (instant filtering, no API calls)
  - >100 works: Server-side (pagination, reduce memory usage)
  - Detect count on page load, choose strategy

**5. Email Service**
- **Decision**: Supabase Auth emails for MVP, migrate to SendGrid if volume grows
- **Rationale**:
  - Supabase provides transactional email out-of-box
  - Free tier sufficient for MVP (<1000 emails/month)
  - SendGrid for advanced analytics, templates

---

### Security Considerations

**Authentication:**
- Use Supabase Auth (built-in rate limiting, session management)
- Enforce strong passwords (min 8 chars, 1 uppercase, 1 number)
- Email verification required (prevent fake accounts)
- 2FA optional (future enhancement for admins)

**Authorization:**
- RLS policies enforce role-based access (teachers see own works, admins see all)
- Middleware checks role before rendering admin routes
- API routes validate user role server-side (never trust client)

**Input Validation:**
- Sanitize markdown (DOMPurify) to prevent XSS
- Validate file MIME types server-side (don't trust client extensions)
- Parameterized queries for all DB operations (Supabase client handles)
- Rate limiting on file uploads (max 10 uploads/minute per user)

**Privacy:**
- Hash visitor IPs before storing (SHA-256 with daily salt)
- No PII collected (names, emails only for authenticated users)
- GDPR-compliant: Right to deletion (admin can purge user data)

**Content Security:**
- Serve uploaded files from separate domain (prevent same-origin attacks)
- Set Content-Security-Policy headers (restrict script sources)
- Virus scanning (future): Integrate ClamAV or VirusTotal API

---

### Performance Optimizations

**Images:**
- Auto-convert to WebP (next/image handles)
- Lazy loading (native `loading="lazy"`)
- Responsive images (srcset for different sizes)
- CDN delivery (Vercel Edge Network)

**Videos:**
- Embed YouTube/Vimeo (offload bandwidth)
- Privacy-enhanced mode (youtube-nocookie.com)
- Lazy load iframes (click to load)

**Fonts:**
- Self-host Google Fonts (GDPR compliance, faster load)
- Subset fonts (Latin only for IT/EN)
- Font-display: swap (prevent invisible text)

**Database:**
- Indexes on frequently queried columns (status, created_by, theme_id)
- Connection pooling (Supabase default: 60 connections)
- Query optimization (avoid N+1, use JOINs)
- Materialized views for analytics (refresh hourly)

**Caching:**
- ISR for public pages (revalidate on content change)
- CDN caching for static assets (immutable, 1 year)
- API route caching (stale-while-revalidate for non-critical data)

---

### Deployment Strategy

**Environments:**
1. **Development** (local): `npm run dev`, local Supabase or cloud dev project
2. **Staging** (Vercel preview): Auto-deploy on PR, test before merge
3. **Production** (Vercel): Deploy on merge to `main`, ISR enabled

**CI/CD Pipeline:**
- GitHub Actions workflow:
  1. Run tests (Jest for unit, Playwright for E2E)
  2. Run linter (ESLint, Prettier)
  3. Build Next.js app
  4. Run Lighthouse CI (fail if accessibility <90)
  5. Deploy to Vercel (auto on success)

**Monitoring:**
- Vercel Analytics (Core Web Vitals, errors)
- Supabase Dashboard (DB performance, storage usage)
- Sentry (error tracking, optional for MVP)

**Rollback Plan:**
- Git revert + redeploy (Vercel keeps previous deployments)
- Database migrations: Keep "down" migrations for rollback
- Test rollback process quarterly

---

### Testing Strategy

**Unit Tests (Jest):**
- Utility functions (slugify, hash IP, validate URL)
- React components (isolated, mocked props)
- Database queries (mock Supabase client)
- Target: 80% code coverage

**Integration Tests (Playwright):**
- Critical flows:
  - Visitor: Scan QR → view theme → filter works → view detail
  - Teacher: Login → create work → submit → receive email
  - Admin: Login → review work → approve → work published
- Run on PR (block merge on failure)

**Manual Testing Checklist (QA):**
- [ ] Accessibility (screen reader, keyboard-only)
- [ ] Cross-browser (Chrome, Safari, Firefox, Edge)
- [ ] Cross-device (iOS, Android, desktop)
- [ ] Multilingual (all pages in IT and EN)
- [ ] Edge cases (see section above)

**User Acceptance Testing (UAT):**
- Invite 3 teachers, 1 admin, 5 visitors (parents)
- Observe usage, collect feedback
- Iterate based on pain points
- Repeat before launch

---

## Appendix

### Glossary

- **ISR**: Incremental Static Regeneration (Next.js feature for updating static pages without rebuild)
- **RLS**: Row-Level Security (Postgres feature for fine-grained access control)
- **WCAG**: Web Content Accessibility Guidelines
- **JWT**: JSON Web Token (used by Supabase Auth for sessions)
- **CDN**: Content Delivery Network
- **FTS**: Full-Text Search (Postgres feature for text search)
- **P0/P1/P2**: Priority levels (0 = critical, 1 = high, 2 = medium)

### Acronyms

- **PRD**: Product Requirements Document
- **MVP**: Minimum Viable Product
- **KPI**: Key Performance Indicator
- **CTR**: Click-Through Rate
- **GDPR**: General Data Protection Regulation
- **XSS**: Cross-Site Scripting
- **MIME**: Multipurpose Internet Mail Extensions
- **DPI**: Dots Per Inch (print resolution)
- **QA**: Quality Assurance
- **UAT**: User Acceptance Testing

---

## Document Change Log

| Version | Date       | Author        | Changes                     |
|---------|------------|---------------|-----------------------------|
| 1.0     | 2025-11-07 | Claude Agent  | Initial specification       |

---

## Approval Sign-Off

**Product Manager**: _____________________  Date: __________

**Tech Lead**: _____________________  Date: __________

**Stakeholder (Principal)**: _____________________  Date: __________

---

**End of Document**

Total Pages: 47
Total Word Count: ~18,000
Estimated Reading Time: 60 minutes

---

## Next Steps

1. **Review and Approval**: Circulate this document to stakeholders for feedback (deadline: 2 weeks)
2. **Technical Design**: Tech lead creates architecture diagrams and API specifications (1 week)
3. **Sprint Planning**: Break down P0 features into 2-week sprints (6 sprints total)
4. **Kickoff Meeting**: Align team on goals, timelines, success criteria (week of MM/DD)
5. **Development Start**: Sprint 1 begins (target: MM/DD/2025)

**Questions or Feedback**: Contact [Product Manager Email]
