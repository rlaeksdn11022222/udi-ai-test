import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { UsageLimitProvider } from './contexts/UsageLimitContext';

export default function App() {
  return (
    <AuthProvider>
      <ConversationProvider>
        <CategoryProvider>
          <UsageLimitProvider>
            <RouterProvider router={router} />
          </UsageLimitProvider>
        </CategoryProvider>
      </ConversationProvider>
    </AuthProvider>
  );
}