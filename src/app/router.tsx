import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute'
import { GameRoomPage } from '../pages/GameRoomPage'
import { LandingPage } from '../pages/LandingPage'
import { LobbyPage } from '../pages/LobbyPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProfileSetupPage } from '../pages/ProfileSetupPage'
import { SignupPage } from '../pages/SignupPage'
import { TableRoomPage } from '../pages/TableRoomPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicOnlyRoute>
        <SignupPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/setup',
    element: (
      <ProtectedRoute requireProfile={false}>
        <ProfileSetupPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/lobby',
    element: (
      <ProtectedRoute>
        <LobbyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tables/:tableId',
    element: (
      <ProtectedRoute>
        <TableRoomPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/games/:gameId',
    element: (
      <ProtectedRoute>
        <GameRoomPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
