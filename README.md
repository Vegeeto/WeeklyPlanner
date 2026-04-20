# Weekly Planner & Meal Organizer

A polished, interactive weekly calendar application designed to help you organize your meals, recipes, and shopping lists with ease.

## Features

- **Dark Mode**: Full support for light and dark themes with a persistent toggle.
- **Modern UI**: Polished design using a Salmon/Rose color palette, smooth animations, and responsive layouts.
- **Interactive Weekly Calendar**: Plan your Breakfast, Lunch, and Dinner for the entire week with horizontal scroll on desktop.
- **Hourly Planning**: Dedicated note sections between meals for workouts, tasks, or specific timing.
- **Recipe Manager**: Create and store your favorite recipes with ingredients and instructions.
- **Auto-Shop**: Automatically generate a shopping list based on the ingredients of the recipes planned for the week.
- **Mobile Optimized**: Collapsible accordion view for mobile devices and a unified sidebar navigation.
- **Google Authentication**: Secure login using your Google account via Firebase.
- **Real-time Sync**: Your data is synced across devices using Google Firestore.
- **Real URL Routing**: Clean navigation using React Router with full support for browser history and deep linking.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Base UI, Lucide React
- **Backend/Database**: Firebase (Auth & Firestore)
- **Animations**: Motion (formerly Framer Motion)
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd weekly-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   The application strictly uses environment variables (Secrets) for Firebase configuration. Create a `.env` file in the root directory for local development:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_ID=your_database_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
   *Note: In AI Studio, you MUST configure these in the **Secrets** panel.*

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

5. **Run tests**:
   ```bash
   npm test
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment (GitHub Pages)

This project is optimized for deployment on GitHub Pages using GitHub Actions.

### Configuration

1. **GitHub Secrets**: Add your Firebase configuration keys to your repository's **Settings > Secrets and variables > Actions**.
2. **Automatic Base Path**: The deployment workflow automatically detects your repository name and sets the `VITE_BASE_PATH` accordingly. This ensures that assets and routes work correctly even if the app is hosted in a subfolder (e.g., `https://username.github.io/repo-name/`).
3. **SPA Support**: A `404.html` script is included in the `public` folder to handle direct navigation to sub-routes (like `/recipes`) by redirecting them back to the main entry point while preserving the intended path.

### Manual Deployment
If you deploy manually, ensure you set the `VITE_BASE_PATH` environment variable to match your hosting subdirectory.

## Docker Configuration

You can also run the application using Docker.

### Build the image
```bash
docker build -t weekly-planner .
```

### Run the container
```bash
docker run -p 8080:80 weekly-planner
```
The app will be available at `http://localhost:8080`.

## License

MIT
