# 🏗️ Website Architecture Blueprint

## 📐 Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WEBSITE ECOSYSTEM                    │
└─────────────────────────────────────────────────────────────┘

                         GitHub Repository
                                │
                    ┌───────────┴───────────┐
                    │                       │
                  ROOT                   ASSETS
                    │                       │
        ┌───────────┼───────────┐          ├─── images/
        │           │           │          └─── docs/
     index.html   pages/     css/js/
                    │           │
                    │           ├─── style.css
                    │           ├─── main.js
                    │           └─── three-background.js
                    │
                    └─── works.html
```

---

## 🎯 Page Flow Diagram

```
┌──────────────┐
│  index.html  │  ← Landing Page (Homepage)
│   (Home)     │
└──────┬───────┘
       │
       ├──► Navigation Bar (Always visible)
       │    └─── Links to all pages
       │
       ├──► Hero Section (Name, Title)
       │
       ├──► About Me
       │
       ├──► Contact Info + Social Links
       │
       ├──► Research Focus
       │
       ├──► Core Expertise (Tags)
       │
       ├──► Research Impact (Stats)
       │
       └──► Footer

┌──────────────┐
│ works.html   │  ← Portfolio/Publications
│  (Works)     │
└──────┬───────┘
       │
       ├──► Hero Section
       │
       ├──► Publications Grid
       │    ├─── Work Card 1
       │    ├─── Work Card 2
       │    └─── Work Card n...
       │
       ├──► Collaborations Section
       │
       └──► Footer
```

---

## 🔄 User Journey Map

```
User lands on site
       ↓
Sees animated particles background
       ↓
Reads hero section (name, role)
       ↓
Scrolls down (parallax effect)
       ↓
Cards reveal with animation
       ↓
Explores sections
       ↓
Clicks "Works" in navigation
       ↓
Views research projects
       ↓
Clicks external links (GitHub, LinkedIn)
       ↓
Returns to home or downloads CV
```

---

## 🧩 Component Architecture

### Reusable Components

```
┌──────────────────────────────────────┐
│         SHARED COMPONENTS            │
├──────────────────────────────────────┤
│ • Navigation Bar (all pages)         │
│ • Custom Cursor (all pages)          │
│ • 3D Background (all pages)          │
│ • Footer (all pages)                 │
│ • Glass Cards (multiple uses)        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         PAGE-SPECIFIC                │
├──────────────────────────────────────┤
│ Home:                                │
│   • Stats Grid                       │
│   • Expertise Tags                   │
│   • Contact Grid                     │
│                                      │
│ Works:                               │
│   • Work Cards                       │
│   • Work Tags                        │
└──────────────────────────────────────┘
```

---

## 🎨 Style System

```
CSS Organization (style.css)
│
├── [1] Reset & Base Styles
│   └── Universal styles, body, html
│
├── [2] Custom Cursor
│   └── Cursor animation and states
│
├── [3] 3D Canvas
│   └── Background container
│
├── [4] Navigation
│   └── Nav bar, links, logo
│
├── [5] Hero Section
│   └── Title, subtitle, description
│
├── [6] Glass Cards
│   └── Transparent cards with blur
│
├── [7] Sections
│   └── Section containers and titles
│
├── [8] Grids & Layouts
│   └── Contact, info, stats, work grids
│
├── [9] Interactive Elements
│   └── Tags, buttons, links
│
├── [10] Footer
│   └── Footer styling
│
└── [11] Responsive Design
    └── Mobile breakpoints
```

---

## 📦 JavaScript Architecture

```
main.js (Core Interactions)
│
├── Custom Cursor
│   ├── Track mouse position
│   └── Animate cursor smoothly
│
├── Parallax Scrolling
│   ├── Listen to scroll
│   └── Move hero elements
│
├── Scroll Reveal
│   ├── Detect elements in viewport
│   └── Add 'reveal' class
│
├── Navigation State
│   └── Highlight active page
│
└── Data Fetching
    └── Load scholar metrics


three-background.js (3D Graphics)
│
├── Scene Setup
│   ├── Create scene
│   ├── Create camera
│   └── Create renderer
│
├── Particle System
│   ├── Custom shaders
│   ├── 10,000 particles
│   └── Mouse interaction
│
├── Background Sphere
│   ├── Large sphere
│   └── Gradient animation
│
└── Animation Loop
    ├── Update uniforms
    ├── Rotate objects
    └── Camera movement
```

---

## 🌐 Network & Dependencies

```
External Resources
│
├── CDN Resources
│   ├── Three.js (3D graphics)
│   └── Font Awesome (icons)
│
└── GitHub Pages
    ├── Free hosting
    ├── Custom domain support
    └── Automatic HTTPS
```

---

## 🔮 Future Expansion Blueprint

### Phase 1: Current ✅
- Home page
- Works page
- 3D background
- Responsive design

### Phase 2: Near Future 📅
```
pages/
├── works.html           ✅ Done
├── publications.html    ⬜ Add detailed publications
├── blog.html           ⬜ Add blog landing
└── blog/
    ├── post-1.html     ⬜ Individual posts
    └── post-2.html     ⬜ ...
```

### Phase 3: Advanced Features 🚀
```
Features to Add:
├── Contact Form         ⬜ Backend integration
├── Search Function      ⬜ Search works/blog
├── Dark Mode Toggle     ⬜ Theme switching
├── CMS Integration      ⬜ Easy content updates
└── Analytics           ⬜ Track visitors
```

### Phase 4: Interactive Features ⚡
```
Advanced:
├── Interactive Demos    ⬜ ML model visualizations
├── Code Playground     ⬜ Embed code examples
├── Data Visualizations ⬜ Research data charts
└── Publication PDFs    ⬜ Embedded readers
```

---

## 📊 Data Flow

```
User Action → JavaScript → DOM Update → Visual Change

Example: Scroll Event
    │
    ├──> main.js detects scroll
    │
    ├──> Calculates new positions
    │
    ├──> Updates transform styles
    │
    └──> Browser animates smoothly


Example: Page Load
    │
    ├──> HTML loads
    │
    ├──> CSS applies styles
    │
    ├──> main.js initializes
    │
    ├──> three-background.js starts
    │
    ├──> 3D scene renders
    │
    └──> Scroll reveal checks viewport
```

---

## 🎯 Performance Strategy

```
Optimization Layers
│
├── Browser Caching
│   ├── CSS cached separately
│   ├── JS cached separately
│   └── Reused across pages
│
├── Asset Optimization
│   ├── Compress images (WebP)
│   ├── Minify CSS/JS
│   └── Lazy load images
│
├── 3D Rendering
│   ├── Limit particle count
│   ├── Use efficient shaders
│   └── Reduce draw calls
│
└── Code Splitting
    ├── Separate files
    ├── Load only needed JS
    └── Async loading
```

---

## 🔐 Security Model

```
Static Site = Secure by Default
│
├── No Backend → No SQL Injection
├── No Forms → No CSRF
├── No User Data → No Data Breach
├── GitHub Pages → DDoS Protection
└── HTTPS → Encrypted Traffic
```

---

## 🛠️ Development Workflow

```
Local Development
    ↓
Edit files
    ↓
Test in browser
    ↓
Git commit
    ↓
Git push to GitHub
    ↓
GitHub Pages auto-deploys
    ↓
Live in 1-2 minutes!
```

---

## 📱 Responsive Breakpoints

```
Desktop (> 768px)
├── Full navigation
├── Grid layouts
├── Custom cursor
└── All animations

Mobile (≤ 768px)
├── Stacked navigation
├── Single column
├── Native cursor
└── Simplified animations
```

---

## 🎨 Design System

```
Colors
├── Primary: #49c5b6 (Cyan)
├── Secondary: #FF9398 (Pink)
├── Background: #000 (Black)
└── Text: #fff (White)

Typography
├── Headers: 100-700 weight
├── Body: 300 weight
└── Font: Helvetica Neue

Spacing
├── Sections: 4rem padding
├── Cards: 3rem padding
├── Grid gaps: 1.5-2rem
└── Mobile: Reduced by ~30%

Effects
├── Glass: backdrop-filter blur(10px)
├── Opacity: rgba(255,255,255,0.05)
├── Shadows: 0 20px 60px rgba(...)
└── Transitions: 0.3-0.5s ease
```

---

## 🎬 Animation Timeline

```
Page Load (0-2s)
├── 0.0s: HTML loads
├── 0.1s: CSS applies
├── 0.3s: 3D background starts
├── 0.5s: Hero fades in
└── 0.8s: Cursor activates

User Scrolls
├── Parallax: Continuous
├── Reveal: When in viewport (80%)
└── Camera: Smooth follow

User Hovers
├── Cards: Lift up (-10px)
├── Links: Color change
├── Tags: Scale (1.05)
└── Cursor: Scale (1.5)
```

---

This blueprint gives you a complete overview of how everything connects! 🎉
