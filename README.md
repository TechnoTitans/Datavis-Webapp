# DataVisWA

A data visualization web application built with React and Vite, featuring interactive charts and team analysis capabilities.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/Jiayu-W/dataviswa.git
cd dataviswa
```

2. Install dependencies
```bash
npm install
# or if you use yarn
yarn
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```
Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase project credentials.

### Development

To run the application in development mode:
```bash
npm run dev
# or
yarn dev
```
The application will be available at http://localhost:5173

### Building for Production

To create a production build:
```bash
npm run build
# or
yarn build
```

To preview the production build locally:
```bash
npm run preview
# or
yarn preview
```

## Technology Stack

- React 19
- Vite 7
- Supabase for backend
- Recharts for data visualization
- React Router for navigation

## Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_KEY` | Your Supabase anonymous key |

You can obtain these values from your Supabase project settings.
