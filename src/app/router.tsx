import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute'
import { RouteLoadingFallback } from '../components/layout/RouteLoadingFallback'
import {
  AuthCallbackPage,
  FriendsPage,
  GameRoomPage,
  LandingPage,
  LobbyPage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  ProfileSetupPage,
  SignupPage,
  SpectatorGamePage,
  TableRoomPage,
} from './lazyPages'

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: lazyRoute(<LandingPage />),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        {lazyRoute(<LoginPage />)}
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicOnlyRoute>
        {lazyRoute(<SignupPage />)}
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/auth/callback',
    element: lazyRoute(<AuthCallbackPage />),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        {lazyRoute(<ProfilePage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/setup',
    element: (
      <ProtectedRoute requireProfile={false}>
        {lazyRoute(<ProfileSetupPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/lobby',
    element: (
      <ProtectedRoute>
        {lazyRoute(<LobbyPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/friends',
    element: (
      <ProtectedRoute>
        {lazyRoute(<FriendsPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/tables/:tableId',
    element: (
      <ProtectedRoute>
        {lazyRoute(<TableRoomPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/games/:gameId',
    element: (
      <ProtectedRoute>
        {lazyRoute(<GameRoomPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/spectate/games/:gameId',
    element: (
      <ProtectedRoute>
        {lazyRoute(<SpectatorGamePage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: lazyRoute(<NotFoundPage />),
  },
])
