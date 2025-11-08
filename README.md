# QuadriParlanti

Digital repository for student works with QR codes - A Next.js 14 + Supabase application for Liceo Leonardo.

## 🎯 Project Vision

Create a digital showcase where physical works displayed in school corridors are linked to QR codes, allowing visitors to access digital content produced by students and uploaded by teachers. The application serves as an archive, digital museum, and educational tool that is multilingual and accessible.

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Guidance for Claude Code when working with this repository
- **[PRD](./prd.md)** - Product Requirements Document (Italian)
- **[Product Specifications](./project-documentation/product-manager-output.md)** - Detailed functional specifications
- **[Technical Architecture](./project-documentation/architecture-output.md)** - Complete technical blueprint

## 🏗️ Project Structure

```
QuadriParlanti/
├── project-documentation/          # Complete specs and architecture
│   ├── product-manager-output.md  # Product specifications (47 pages)
│   └── architecture-output.md     # Technical architecture (5,515 lines)
├── stitch_high_school_student_portfolio_homepage/  # UI prototypes
│   ├── high_school_student_portfolio_homepage/     # Public homepage
│   ├── student_project_detail_page/                # Work detail view
│   ├── admin_access_page/                          # Admin login
│   ├── admin_control_panel/                        # Admin dashboard
│   └── add_new_project_screen/                     # Work creation form
├── prd.md                          # Product Requirements Document
├── CLAUDE.md                       # Development guidance
└── README.md                       # This file
```

## 🚀 Key Features

- **Dynamic QR Codes**: Link physical works to digital content without reprinting
- **Approval Workflow**: Draft → Review → Published
- **Multimedia Support**: PDFs, images, videos (YouTube, Vimeo), Google Drive links
- **Advanced Search**: Full-text search with filters (class, year, teacher, tags)
- **Multilingual**: Italian and English support
- **Accessibility**: WCAG 2.1 AA compliant
- **Privacy-First**: No student personal data, GDPR compliant
- **Analytics**: Anonymous tracking of QR scans and work views

## 👥 User Roles

- **Visitors**: Scan QR codes, browse themes, view student works
- **Teachers** (Docenti): Create and submit works for approval
- **Administrators**: Review/approve works, manage themes, generate QR codes, view analytics

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel + Supabase
- **Internationalization**: next-intl (IT/EN)
- **QR Generation**: node-qrcode
- **Validation**: Zod schemas

## 📊 Current Status

**Phase**: Planning & Design Complete ✅

### Completed:
- ✅ Product Requirements Document (PRD)
- ✅ UI/UX Prototypes (5 screens)
- ✅ Product Specifications (47 user stories, data models, KPIs)
- ✅ Technical Architecture (complete implementation blueprint)
- ✅ Database Schema (11 tables with RLS policies)
- ✅ API Contracts & Server Actions
- ✅ Security & Privacy Design (GDPR compliant)

### Next Steps:
1. Initialize Next.js application
2. Deploy database schema to Supabase
3. Implement core features (authentication, work CRUD, QR system)
4. Build UI components based on prototypes
5. Testing & QA
6. Production deployment

## 🎨 Design System

The UI prototypes in `stitch_high_school_student_portfolio_homepage/` showcase the visual design:

- **Color Palette**: Dark theme with blues (#101323, #111218, #607afb)
- **Typography**: Plus Jakarta Sans, Lexend, Noto Sans
- **Components**: Cards, forms, tables with Tailwind CSS
- **Responsive**: Mobile-first design with container queries

## 📝 MVP Scope

- Work creation and approval workflow
- Theme pages with associated works
- Work detail pages with multimedia content
- Dynamic QR code generation
- Basic analytics dashboard
- Multilingual support (IT/EN)
- WCAG 2.1 AA accessibility

## 🔐 Privacy & Security

- No student names or faces in public content
- IP address hashing for analytics
- Row Level Security (RLS) in Supabase
- HTTPS enforcement
- GDPR compliant data handling

## 📈 Success Metrics

- **North Star Metric**: Monthly Active QR Scans
- **Primary KPIs**:
  - Published works count
  - QR scan rate
  - Average time to approval
  - Teacher adoption rate

## 🤝 Contributing

This is an educational project for Liceo Leonardo. Development guidelines are available in [CLAUDE.md](./CLAUDE.md).

## 📄 License

[To be determined]

## 📞 Contact

For questions or support, contact the development team.

---

**Repository**: https://github.com/holgs/quadriparlanti
**Last Updated**: January 2025
