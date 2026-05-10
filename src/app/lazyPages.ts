import { lazy } from 'react'

export const AuthCallbackPage = lazy(() =>
  import('../pages/AuthCallbackPage').then((module) => ({
    default: module.AuthCallbackPage,
  })),
)

export const GameRoomPage = lazy(() =>
  import('../pages/GameRoomPage').then((module) => ({
    default: module.GameRoomPage,
  })),
)

export const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((module) => ({
    default: module.LandingPage,
  })),
)

export const FriendsPage = lazy(() =>
  import('../pages/FriendsPage').then((module) => ({
    default: module.FriendsPage,
  })),
)

export const LobbyPage = lazy(() =>
  import('../pages/LobbyPage').then((module) => ({
    default: module.LobbyPage,
  })),
)

export const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

export const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
)

export const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)

export const ProfileSetupPage = lazy(() =>
  import('../pages/ProfileSetupPage').then((module) => ({
    default: module.ProfileSetupPage,
  })),
)

export const SignupPage = lazy(() =>
  import('../pages/SignupPage').then((module) => ({
    default: module.SignupPage,
  })),
)

export const SpectatorGamePage = lazy(() =>
  import('../pages/SpectatorGamePage').then((module) => ({
    default: module.SpectatorGamePage,
  })),
)

export const TableRoomPage = lazy(() =>
  import('../pages/TableRoomPage').then((module) => ({
    default: module.TableRoomPage,
  })),
)
