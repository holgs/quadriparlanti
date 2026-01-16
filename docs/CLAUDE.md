# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuadriParlanti** is a static HTML prototype for a high school student portfolio website named "ISI Carlo Piaggia". The project consists of mockup screens designed with Tailwind CSS for showcasing student projects across different departments (Artistic, Scientific-Sports, Technical).

### Project Structure

```
stitch_high_school_student_portfolio_homepage/
├── high_school_student_portfolio_homepage/  # Public-facing homepage
├── student_project_detail_page/             # Individual project detail view
├── admin_access_page/                       # Admin login screen
├── admin_control_panel/                     # Admin dashboard
└── add_new_project_screen/                  # Project creation form
```

Each directory contains:
- `code.html` - The HTML mockup file
- `screen.png` - Visual reference/screenshot

## Technical Stack

- **Framework**: Static HTML pages (no build process required)
- **CSS**: Tailwind CSS via CDN (`https://cdn.tailwindcss.com?plugins=forms,container-queries`)
- **Fonts**: Google Fonts (Plus Jakarta Sans, Noto Sans, Lexend)
- **Icons**: Inline SVG icons (Phosphor icon style)

## Design System

### Color Palette
- **Background**: `#101323` (homepage), `#111218` (admin/internal pages)
- **Surface**: `#21284a`, `#272a3a`, `#1b1d27`
- **Primary Action**: `#607afb`, `#516dfb`, `#506dfb`
- **Text**: `#ffffff` (primary), `#8e99cc`, `#9ba0bb` (secondary)
- **Borders**: `#21284a`, `#272a3a`, `#3a3e55`

### Typography
- **Homepage**: Plus Jakarta Sans + Noto Sans fallback
- **Admin Screens**: Lexend + Noto Sans fallback
- Font weights: 400 (normal), 500 (medium), 700 (bold), 800-900 (extra bold)

### Key Components
- Responsive grid layouts using Tailwind's `@container` queries
- Dark theme (`dark` class on root)
- Card-based project displays with aspect-ratio backgrounds
- Form inputs with custom styling (`form-input` class)
- Navigation headers with logo + menu structure

## Screen Descriptions

### 1. Homepage (`high_school_student_portfolio_homepage/`)
- Hero section with "Showcasing Student Creativity" message
- Navigation: Artistic, Scientific-Sports, Technical, About Us
- Grid of recent project uploads (6 visible)
- Footer with admin access link

### 2. Project Detail Page (`student_project_detail_page/`)
- Header image with project theme
- Project title: "Sandro Pertini Project"
- List of student works with class information (e.g., "Class 4ALS 2025-26")

### 3. Admin Access (`admin_access_page/`)
- Simple login form with username/password
- "Forgot Password?" link
- Centered layout

### 4. Admin Control Panel (`admin_control_panel/`)
- Left sidebar navigation (Dashboard, Projects, Students, Settings)
- Main content area with action cards:
  - Add New Project
  - Manage Categories
  - View Recent Uploads
- Table of current projects with Department/Class/Date columns
- Edit/Delete actions per row

### 5. Add New Project Screen (`add_new_project_screen/`)
- Form fields:
  - Project Title (text input)
  - Project Description (textarea)
  - Main Image Upload (drag-and-drop area)
  - Department (dropdown/select)
  - Student Works section with Work Title and Class/Year
- Save/Cancel buttons

## Development Workflow

### Opening Files in Browser
Since these are static HTML files, simply open them directly in a browser:
```bash
open stitch_high_school_student_portfolio_homepage/high_school_student_portfolio_homepage/code.html
```

Or use a simple HTTP server:
```bash
python3 -m http.server 8000
# Then navigate to http://localhost:8000/stitch_high_school_student_portfolio_homepage/
```

### Making Changes
1. Edit the `code.html` files directly
2. Tailwind classes are loaded via CDN, so changes are immediately reflected
3. Refresh the browser to see updates

## Architecture Notes

### Current State: Static Prototypes
These are **non-functional mockups** - buttons and forms have no JavaScript behavior. They serve as design references for future implementation.

### Future Implementation Considerations
When converting to a functional application:

1. **Backend Requirements**:
   - Project CRUD operations
   - User authentication (admin vs. student)
   - File upload handling (images)
   - Database schema: Projects, Students, Departments, Works

2. **Frontend Architecture**:
   - Consider React/Vue/Next.js for component reusability
   - Maintain Tailwind CSS design system
   - Implement proper routing between screens
   - Add form validation and error handling

3. **Data Model** (inferred from mockups):
   ```
   Project:
     - title
     - description
     - mainImage
     - department (Artistic, Scientific-Sports, Technical)
     - uploadDate
     - works[] (child items)

   Work:
     - title
     - class/year (e.g., "Class 4ALS 2025-26")
     - projectId (foreign key)
   ```

4. **Admin Features**:
   - Project management (create, edit, delete)
   - Category organization
   - Recent uploads monitoring

## Key Patterns to Follow

1. **Dark Theme Consistency**: All screens use dark backgrounds - maintain the `#101323` / `#111218` palette
2. **Typography Hierarchy**: Bold headers (28px-32px) with lighter secondary text
3. **Spacing**: Consistent padding with `px-4`, `py-3`, `px-10` patterns
4. **Rounded Corners**: `rounded-xl` for cards, buttons, inputs (12px radius)
5. **Responsive Design**: Use `@container` queries and `@[480px]:` breakpoint prefixes
6. **Image Backgrounds**: Project thumbnails use `background-image` with `bg-cover` and `aspect-square` or `aspect-video`

## File Naming Convention

HTML files are named `code.html` consistently across all screens. When referencing or creating new screens, maintain this pattern with a descriptive parent folder name.
