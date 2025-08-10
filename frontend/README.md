# Frontend - Power Plant Dashboard

A modern Next.js dashboard application for global power plant data visualization.

## Features

- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Collapsible Sidebar** with navigation
- **Responsive Design** for all devices
- **Modern UI Components** with hover effects
- **Professional Dashboard Layout**

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Lucide React Icons
- PostCSS & Autoprefixer

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── app/
│   ├── layout.js          # Root layout with Inter font
│   ├── page.js            # Main dashboard page
│   └── globals.css        # Global styles with Tailwind
├── components/
│   └── ui/
│       └── card.jsx       # Card component
├── lib/
│   └── utils.js           # Utility functions
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── next.config.js         # Next.js configuration
```

## Dashboard Features

- **Collapsible Sidebar** with smooth animations
- **Professional Header** with user info and timestamps
- **Card-based Layout** with hover effects
- **Responsive Grid System**
- **Footer** with company information
- **Modern Color Scheme** with custom CSS variables

## Customization

The dashboard uses a custom color scheme defined in `globals.css`:
- Primary: `#3d4a5d`
- Accent colors for charts and UI elements
- Custom CSS classes for consistent styling