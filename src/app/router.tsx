import { createBrowserRouter } from 'react-router-dom'
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
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/profile/setup',
    element: <ProfileSetupPage />,
  },
  {
    path: '/lobby',
    element: <LobbyPage />,
  },
  {
    path: '/tables/:tableId',
    element: <TableRoomPage />,
  },
  {
    path: '/games/:gameId',
    element: <GameRoomPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
