import { Layout } from "@/components/Layout";

/**
 * SketchForge — single-page canvas workspace.
 *
 * The app is a single-page canvas tool, so we render the Layout directly
 * rather than wiring up TanStack Router routes. The QueryClientProvider
 * and InternetIdentityProvider are already mounted in `main.tsx`.
 */
export default function App() {
  return <Layout />;
}
