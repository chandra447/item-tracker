# Item Price Tracker

A web application to track prices of items over time, built with Next.js, PocketBase, Shadcn UI, and Recharts.

## Features

- **User Authentication**: Secure login and signup with email/password
- **Authentication Middleware**: Route protection using Next.js middleware 
- **Item Management**: Create, view, and delete items
- **Price Tracking**: Record price changes over time for each item
- **Statistics**: View min, max, average prices and number of entries
- **Data Visualization**: Chart price trends for each item
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes

## Tech Stack

- **Frontend**: Next.js 14+, React 19, TypeScript
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Database**: PocketBase (self-hosted BaaS)
- **Authentication**: Cookie-based auth with Next.js middleware
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PocketBase server (download from [pocketbase.io](https://pocketbase.io/))

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/item-tracker.git
   cd item-tracker
   ```

2. Run the setup script:
   ```
   node setup.js
   ```

   This will:
   - Create a `.env` file with default values
   - Install dependencies
   - Provide instructions for setting up PocketBase

3. Start PocketBase server (in a separate terminal):
   ```
   ./pocketbase serve
   ```

4. Access PocketBase Admin UI:
   - Open `http://127.0.0.1:8090/_/` in your browser
   - Create an admin account
   - Create the required collections:
     - `users` (auth collection with name field)
     - `items` (name: text, User: relation to users) - Note the capital 'U' in User field
     - `prices` (item: relation to items, price: number)

5. Start the development server:
   ```
   pnpm dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Authentication and Middleware

The application uses Next.js middleware for route protection:

- Protected routes (dashboard, items, profile) redirect to login if user is not authenticated
- Auth routes (login, register) redirect to dashboard if user is already authenticated
- Authentication state is stored in cookies for server-side validation
- The middleware reads the `pb_auth` cookie to determine authentication status

## PocketBase Schema

### Users Collection (Auth)
- `id` (auto-generated)
- `name` (text, required)
- `email` (text, required, unique)
- `password` (text, required)
- `avatar` (file, optional)

### Items Collection
- `id` (auto-generated)
- `name` (text, required)
- `User` (relation to users, required) - Note: This field must be capitalized as "User"
- `created` (date, auto)
- `updated` (date, auto)

### Prices Collection
- `id` (auto-generated)
- `item` (relation to items, required)
- `price` (number, required)
- `created` (date, auto)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [PocketBase](https://pocketbase.io/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
