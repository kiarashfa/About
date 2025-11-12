# Kiarash Farajzadehahary - Personal Website

A modern, interactive personal website featuring 3D WebGL animations, parallax scrolling, and a clean, professional design.

## 🌟 Features

- **3D Interactive Background**: Custom Three.js particle system with shader effects
- **Parallax Scrolling**: Smooth scroll-based animations
- **Scroll Reveal**: Content fades in as you scroll
- **Glass Morphism Design**: Modern transparent card effects with backdrop blur
- **Responsive Design**: Fully responsive across all devices
- **Fast Performance**: Optimized assets and code splitting
- **SEO Optimized**: Proper meta tags and semantic HTML

## 📁 Project Structure

```
website/
├── index.html              # Main homepage
├── css/
│   └── style.css          # All styles (organized by sections)
├── js/
│   ├── main.js            # Main interactions (cursor, parallax, scroll reveal)
│   └── three-background.js # Three.js 3D background initialization
├── pages/
│   └── works.html         # Research works and publications page
├── assets/
│   ├── images/            # Images and graphics
│   └── docs/              # Documents (CV, papers, etc.)
└── README.md              # This file
```

## 🚀 Quick Start

### Option 1: Single File (Current Deployment)
The simplest option for GitHub Pages - just upload `index.html` from the outputs folder.

### Option 2: Organized Structure (Recommended for Future)
For better maintainability and scalability:

1. **Clone or download the structured version**
2. **Upload to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/yourrepo.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main
   - Folder: / (root)
   - Save

## 📦 File Organization

### CSS Structure (`css/style.css`)
- Reset & Base Styles
- Custom Cursor
- 3D Canvas Background
- Navigation
- Hero Section
- Glass Cards
- Sections
- Contact Links & Grids
- Stats & Tags
- Works/Projects Styles
- Footer
- Responsive Breakpoints

### JavaScript Structure

**`js/main.js`** - Core interactions:
- Custom cursor animation
- Parallax scrolling
- Scroll reveal animations
- Navigation active states
- Google Scholar data fetching

**`js/three-background.js`** - 3D visualization:
- Three.js scene setup
- Particle system with custom shaders
- Background sphere
- Mouse interactivity
- Camera animations

## 🎨 Customization

### Colors
Main color variables are in `css/style.css`:
- Primary Cyan: `#49c5b6`
- Primary Pink: `#FF9398`
- Background: `#000`

### Particle Count
In `js/three-background.js`, line ~73:
```javascript
const particleCount = 10000; // Adjust for performance
```

### Parallax Speed
In `js/main.js`, lines 20-30:
```javascript
const speed = 0.5; // parallax-fast
const speed = 0.2; // parallax-slow
```

## 🔧 Adding New Pages

1. **Create HTML file** in `pages/` directory
2. **Copy structure** from `pages/works.html`
3. **Update navigation** in all files
4. **Adjust relative paths** for CSS/JS:
   ```html
   <link rel="stylesheet" href="../css/style.css">
   <script type="module">
       import { initThreeJS } from '../js/three-background.js';
   </script>
   ```

## 📱 Mobile Optimization

The site automatically:
- Disables custom cursor on mobile
- Adjusts font sizes
- Stacks grid layouts
- Hides non-essential decorative elements

## 🌐 Deployment Options

### GitHub Pages (Recommended)
- Free hosting
- Custom domain support
- Automatic HTTPS
- Easy updates via git push

### Alternative Platforms
- **Netlify**: Drag & drop deployment
- **Vercel**: Git integration
- **Cloudflare Pages**: Fast global CDN

## 📈 Future Enhancements

### Recommended Additions:
1. **Blog Section**: Add markdown-based blog
2. **Publications Detail Pages**: Individual pages for each work
3. **Dark/Light Mode Toggle**: Theme switching
4. **Contact Form**: Backend integration
5. **Analytics**: Google Analytics or similar
6. **Performance Monitoring**: Lighthouse CI
7. **CMS Integration**: For easy content updates

### Suggested Structure for Blog:
```
pages/
├── works.html
├── blog.html
└── blog/
    ├── post-1.html
    ├── post-2.html
    └── ...
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling, animations, grid, flexbox
- **JavaScript (ES6+)**: Modern JS features
- **Three.js**: 3D graphics and WebGL
- **Font Awesome**: Icons
- **Google Fonts**: Typography (system fonts)

## ⚡ Performance Tips

1. **Optimize Images**: Use WebP format, compress images
2. **Lazy Loading**: Add for images below fold
3. **CDN**: Use CDN for Three.js (already implemented)
4. **Minification**: Minify CSS/JS for production
5. **Caching**: Set proper cache headers

## 📝 Content Management

### Updating Research Metrics
Edit in `js/main.js` (lines ~60-65):
```javascript
document.getElementById('citations-count').textContent = '50+';
document.getElementById('h-index').textContent = '4';
```

### Adding Works
Edit `pages/works.html`, copy a work-card div:
```html
<div class="work-card">
    <h3>Your Work Title</h3>
    <p>Description...</p>
    <div class="work-tags">
        <span class="work-tag">Tag1</span>
    </div>
    <a href="#" class="work-link">
        Read More <i class="fas fa-arrow-right"></i>
    </a>
</div>
```

## 🔒 Security

- No backend = No security vulnerabilities
- Static site = Fast and secure
- GitHub Pages has built-in DDoS protection

## 📞 Support

For questions or issues:
- Email: KiarashFa@Gmail.com
- GitHub: [@KiarashFa](https://github.com/KiarashFa)

## 📄 License

© 2025 Kiarash Farajzadehahary. All rights reserved.

---

**Built with ❤️ using Three.js, modern CSS, and vanilla JavaScript**
