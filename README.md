# Crispy Chat

A brief chat application built with Nuxt.js and Supabase.

## Prerequisites

-   **Node.js** (version 18.x or higher)
-   **npm**, **yarn**, **pnpm**, or **bun** package manager

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mehdi-n-p/crispychat.git
cd crispy-chat
```

### 2. Install dependencies

```bash
# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install

# Using bun
bun install
```

### 3. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials
(Sent by email)

```env
SUPABASE_URL=supabase_project_url
SUPABASE_KEY=supabase_anon_key
```

### 4. Run the development server

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

Application will be available at `http://localhost:3000`

## Technologies

-   **Nuxt.js 4** - Vue.js framework
-   **Vue 3** - Progressive JavaScript framework
-   **Supabase** - Backend
-   **Pinia** - State management
-   **SCSS** - CSS preprocessor
