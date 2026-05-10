import {
  Bell,
  Check,
  Eye,
  Gamepad2,
  Home,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Search,
  Table2,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { Button } from '../components/common/Button'
import { StateCard } from '../components/ui/StateCard'
import {
  canJoinFriend,
  canSpectateFriend,
  getFriendlyFriendsError,
  getSearchResultAction,
  normalizeFriendSearch,
  type FriendHubFriend,
  type FriendRequest,
  type FriendSearchResult,
} from '../features/friends/friendsUtils'
import {
  friendSearchMinLength,
  useCancelFriendRequest,
  useFriendSearch,
  useFriendsHub,
  useFriendsRealtime,
  useRemoveFriend,
  useRespondFriendRequest,
  useSendFriendRequest,
} from '../features/friends/useFriendsHub'
import { useProfile } from '../features/profiles/useProfile'
import { cn } from '../lib/cn'

type FriendsTab = 'online' | 'requests' | 'all' | 'messages'

const panelClass =
  'rounded-xl border border-[#4f4633] bg-[#241f15] shadow-[0_22px_64px_rgba(0,0,0,0.34)]'
const goldRimClass = 'bg-[linear-gradient(45deg,#fbbf24,#78350f,#fbbf24)] p-px'
const innerPanelClass = 'h-full w-full rounded-[inherit] bg-[#241f15]'

export function FriendsPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const friendsHub = useFriendsHub()
  const sendRequest = useSendFriendRequest()
  const respondRequest = useRespondFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const removeFriend = useRemoveFriend()
  const [activeTab, setActiveTab] = useState<FriendsTab>('online')
  const [localSearch, setLocalSearch] = useState('')
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useFriendsRealtime()

  const friends = friendsHub.data?.friends ?? []
  const incomingRequests = friendsHub.data?.incomingRequests ?? []
  const outgoingRequests = friendsHub.data?.outgoingRequests ?? []
  const requestCount = incomingRequests.length + outgoingRequests.length
  const onlineFriends = friends.filter(
    (friend) => friend.presenceStatus === 'online' || friend.presenceStatus === 'away',
  )
  const normalizedLocalSearch = normalizeFriendSearch(localSearch)
  const filteredFriends = (activeTab === 'online' ? onlineFriends : friends).filter(
    (friend) =>
      !normalizedLocalSearch ||
      normalizeFriendSearch(
        `${friend.displayName ?? ''} ${friend.username} ${friend.statusLabel}`,
      ).includes(normalizedLocalSearch),
  )
  const selectedFriend =
    friends.find((friend) => friend.friendshipId === selectedFriendshipId) ??
    friends[0] ??
    null
  const currentProfileLabel = profile?.displayName || profile?.username || 'Player'

  async function handleAccept(friendshipId: string) {
    await runFriendAction(async () => {
      await respondRequest.mutateAsync({ friendshipId, accept: true })
      setNotice('Friend request accepted.')
    })
  }

  async function handleDecline(friendshipId: string) {
    await runFriendAction(async () => {
      await respondRequest.mutateAsync({ friendshipId, accept: false })
      setNotice('Friend request declined.')
    })
  }

  async function handleCancel(friendshipId: string) {
    await runFriendAction(async () => {
      await cancelRequest.mutateAsync(friendshipId)
      setNotice('Friend request canceled.')
    })
  }

  async function handleRemove(friend: FriendHubFriend) {
    const friendName = getFriendDisplayName(friend)

    if (!window.confirm(`Remove ${friendName} from your friends list?`)) {
      return
    }

    await runFriendAction(async () => {
      await removeFriend.mutateAsync(friend.friendshipId)
      if (selectedFriendshipId === friend.friendshipId) {
        setSelectedFriendshipId(null)
      }
      setNotice(`${friendName} was removed from your friends list.`)
    })
  }

  function handleMessage(friend: FriendHubFriend) {
    setSelectedFriendshipId(friend.friendshipId)
    setActiveTab('messages')
  }

  function handleJoin(friend: FriendHubFriend) {
    if (friend.joinTableId) {
      navigate(`/tables/${friend.joinTableId}`)
    }
  }

  function handleSpectate(friend: FriendHubFriend) {
    if (friend.spectateGameId) {
      navigate(`/spectate/games/${friend.spectateGameId}`)
    }
  }

  async function runFriendAction(action: () => Promise<void>) {
    setError('')
    setNotice('')

    try {
      await action()
      return true
    } catch (caughtError) {
      setError(getFriendlyFriendsError(caughtError))
      return false
    }
  }

  const mutationBusy =
    sendRequest.isPending ||
    respondRequest.isPending ||
    cancelRequest.isPending ||
    removeFriend.isPending

  return (
    <div className="min-h-svh bg-[#17130a] text-[#ece1d1]">
      <FriendsSideRail />
      <FriendsTopBar
        currentProfileLabel={currentProfileLabel}
        localSearch={localSearch}
        onAddFriend={() => setIsAddFriendOpen(true)}
        onLocalSearchChange={setLocalSearch}
      />

      <main className="min-h-svh bg-[radial-gradient(circle_at_50%_18%,rgba(31,138,91,0.28),transparent_26rem),radial-gradient(circle_at_88%_12%,rgba(249,189,34,0.12),transparent_18rem),linear-gradient(180deg,#0b3d2e,#061f18_52%,#17130a)] px-4 pb-28 pt-20 shadow-[inset_0_0_80px_rgba(0,0,0,0.72)] lg:ml-64 lg:px-6 lg:pb-8">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6bd8cb]">
                  Club circle
                </p>
                <h1 className="mt-2 font-serif text-4xl font-black leading-tight text-[#ffdf9f] md:text-5xl">
                  Friends Hub
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="min-h-11 gap-2 px-4 py-2"
                  onClick={() => setIsAddFriendOpen(true)}
                >
                  <UserPlus aria-hidden="true" size={17} />
                  Add Friend
                </Button>
              </div>
            </div>

            <FriendsTabs
              activeTab={activeTab}
              allCount={friends.length}
              onlineCount={onlineFriends.length}
              onChange={setActiveTab}
              requestCount={requestCount}
            />
          </section>

          {notice ? <FeedbackBanner message={notice} tone="success" /> : null}
          {error ? <FeedbackBanner message={error} tone="error" /> : null}

          <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
            <section className="min-w-0">
              {friendsHub.isLoading ? (
                <StateCard
                  copy="Loading friend activity and requests."
                  title="Opening Friends Hub..."
                  type="loading"
                />
              ) : null}

              {friendsHub.isError ? (
                <StateCard
                  copy={getFriendlyFriendsError(friendsHub.error)}
                  title="Could not load friends."
                  type="error"
                />
              ) : null}

              {!friendsHub.isLoading && !friendsHub.isError ? (
                <FriendsTabContent
                  activeTab={activeTab}
                  friends={filteredFriends}
                  incomingRequests={incomingRequests}
                  mutationBusy={mutationBusy}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                  onDecline={handleDecline}
                  onJoin={handleJoin}
                  onMessage={handleMessage}
                  onRemove={handleRemove}
                  onSpectate={handleSpectate}
                  outgoingRequests={outgoingRequests}
                  selectedFriendshipId={selectedFriend?.friendshipId ?? null}
                />
              ) : null}
            </section>

            <aside className="hidden min-w-0 lg:block">
              <DirectMessagePanel
                friend={selectedFriend}
                onAddFriend={() => setIsAddFriendOpen(true)}
                onSelectFriend={setSelectedFriendshipId}
              />
            </aside>
          </div>
        </div>
      </main>

      <MobileFriendsBottomNav />
      <button
        className="fixed bottom-24 right-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-2xl border border-[#ffdf9f]/35 bg-[#fbbf24] px-4 text-sm font-black text-[#6c4f00] shadow-[0_18px_50px_rgba(0,0,0,0.42)] transition hover:brightness-110 lg:hidden"
        onClick={() => setIsAddFriendOpen(true)}
        type="button"
      >
        <UserPlus aria-hidden="true" size={20} />
        <span className="hidden sm:inline">Add Friend</span>
      </button>

      {activeTab === 'messages' ? (
        <div className="fixed inset-x-0 bottom-[5.75rem] z-30 max-h-[70svh] overflow-y-auto px-4 lg:hidden">
          <DirectMessagePanel
            compact
            friend={selectedFriend}
            onAddFriend={() => setIsAddFriendOpen(true)}
            onSelectFriend={setSelectedFriendshipId}
          />
        </div>
      ) : null}

      {isAddFriendOpen ? (
        <AddFriendModal
          isSending={sendRequest.isPending || respondRequest.isPending}
          onAccept={(friendshipId) =>
            runFriendAction(async () => {
              await respondRequest.mutateAsync({ friendshipId, accept: true })
              setNotice('Friend request accepted.')
            })
          }
          onClose={() => setIsAddFriendOpen(false)}
          onSend={(profileId) =>
            runFriendAction(async () => {
              await sendRequest.mutateAsync(profileId)
              setNotice('Friend request sent.')
            })
          }
        />
      ) : null}
    </div>
  )
}

function FriendsTabContent({
  activeTab,
  friends,
  incomingRequests,
  mutationBusy,
  onAccept,
  onCancel,
  onDecline,
  onJoin,
  onMessage,
  onRemove,
  onSpectate,
  outgoingRequests,
  selectedFriendshipId,
}: {
  activeTab: FriendsTab
  friends: FriendHubFriend[]
  incomingRequests: FriendRequest[]
  mutationBusy: boolean
  onAccept: (friendshipId: string) => Promise<void>
  onCancel: (friendshipId: string) => Promise<void>
  onDecline: (friendshipId: string) => Promise<void>
  onJoin: (friend: FriendHubFriend) => void
  onMessage: (friend: FriendHubFriend) => void
  onRemove: (friend: FriendHubFriend) => Promise<void>
  onSpectate: (friend: FriendHubFriend) => void
  outgoingRequests: FriendRequest[]
  selectedFriendshipId: string | null
}) {
  if (activeTab === 'requests') {
    return (
      <RequestsPanel
        incomingRequests={incomingRequests}
        mutationBusy={mutationBusy}
        onAccept={onAccept}
        onCancel={onCancel}
        onDecline={onDecline}
        outgoingRequests={outgoingRequests}
      />
    )
  }

  if (activeTab === 'messages') {
    return (
      <div className="grid gap-4 lg:hidden">
        <FriendGrid
          emptyCopy="Accepted friends will appear here once you connect."
          friends={friends}
          onJoin={onJoin}
          onMessage={onMessage}
          onRemove={onRemove}
          onSpectate={onSpectate}
          selectedFriendshipId={selectedFriendshipId}
        />
      </div>
    )
  }

  return (
    <FriendGrid
      emptyCopy={
        activeTab === 'online'
          ? 'No friends are active right now. Add friends or check All Friends.'
          : 'Your friends list is empty. Search by username to start building it.'
      }
      friends={friends}
      onJoin={onJoin}
      onMessage={onMessage}
      onRemove={onRemove}
      onSpectate={onSpectate}
      selectedFriendshipId={selectedFriendshipId}
    />
  )
}

function FriendGrid({
  emptyCopy,
  friends,
  onJoin,
  onMessage,
  onRemove,
  onSpectate,
  selectedFriendshipId,
}: {
  emptyCopy: string
  friends: FriendHubFriend[]
  onJoin: (friend: FriendHubFriend) => void
  onMessage: (friend: FriendHubFriend) => void
  onRemove: (friend: FriendHubFriend) => Promise<void>
  onSpectate: (friend: FriendHubFriend) => void
  selectedFriendshipId: string | null
}) {
  if (friends.length === 0) {
    return (
      <div className={`${panelClass} grid min-h-64 place-items-center p-6 text-center`}>
        <div>
          <UsersRound aria-hidden="true" className="mx-auto text-[#6bd8cb]" size={34} />
          <p className="mt-4 text-lg font-black text-[#ece1d1]">No friends to show</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#d3c5ac]">{emptyCopy}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {friends.map((friend) => (
        <FriendCard
          friend={friend}
          isSelected={selectedFriendshipId === friend.friendshipId}
          key={friend.friendshipId}
          onJoin={onJoin}
          onMessage={onMessage}
          onRemove={onRemove}
          onSpectate={onSpectate}
        />
      ))}
    </div>
  )
}

function FriendCard({
  friend,
  isSelected,
  onJoin,
  onMessage,
  onRemove,
  onSpectate,
}: {
  friend: FriendHubFriend
  isSelected: boolean
  onJoin: (friend: FriendHubFriend) => void
  onMessage: (friend: FriendHubFriend) => void
  onRemove: (friend: FriendHubFriend) => Promise<void>
  onSpectate: (friend: FriendHubFriend) => void
}) {
  const displayName = getFriendDisplayName(friend)
  const isOnline = friend.presenceStatus === 'online'
  const isAway = friend.presenceStatus === 'away'

  return (
    <div
      className={cn(
        `${goldRimClass} rounded-xl transition duration-200 hover:-translate-y-1`,
        isSelected && 'shadow-[0_0_0_2px_rgba(107,216,203,0.38)]',
      )}
    >
      <article className={`${innerPanelClass} flex min-h-64 flex-col gap-4 p-4`}>
        <div className="flex items-start gap-3">
          <FriendAvatar
            avatarUrl={friend.avatarUrl}
            displayName={displayName}
            presenceStatus={friend.presenceStatus}
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-2xl font-black leading-tight text-[#ece1d1]">
              {displayName}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-[#d3c5ac]">
              @{friend.username}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em]',
                  isOnline
                    ? 'border-[#6bd8cb]/40 bg-[#29a195]/16 text-[#89f5e7]'
                    : isAway
                      ? 'border-[#30d8fd]/34 bg-[#30d8fd]/10 text-[#afecff]'
                      : 'border-[#4f4633] bg-[#2f291f] text-[#d3c5ac]',
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    isOnline
                      ? 'bg-[#29a195]'
                      : isAway
                        ? 'bg-[#30d8fd]'
                        : 'bg-[#9c8f79]',
                  )}
                />
                {friend.statusLabel}
              </span>
              <span className="rounded-full border border-[#4f4633] bg-[#2f291f] px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#d3c5ac]">
                {friend.levelLabel}
              </span>
            </div>
          </div>
          <button
            aria-label={`More actions for ${displayName}`}
            className="grid size-10 place-items-center rounded-lg border border-[#4f4633] text-[#d3c5ac] transition hover:bg-[#3a3429] hover:text-[#ece1d1]"
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="rounded-lg border border-[#4f4633]/70 bg-[#201b11]/70 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f9bd22]">
            Current activity
          </p>
          <p className="mt-1 text-sm leading-6 text-[#d3c5ac]">
            {friend.tableName ?? friend.statusLabel}
          </p>
        </div>

        <div className="mt-auto grid gap-2 border-t border-[#4f4633]/60 pt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          {canJoinFriend(friend) ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#fbbf24] px-4 text-sm font-black text-[#6c4f00] transition hover:brightness-110"
              onClick={() => onJoin(friend)}
              type="button"
            >
              <Gamepad2 aria-hidden="true" size={17} />
              Join Table
            </button>
          ) : canSpectateFriend(friend) ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#fbbf24]/55 px-4 text-sm font-black text-[#ffdf9f] transition hover:bg-[#fbbf24]/10"
              onClick={() => onSpectate(friend)}
              type="button"
            >
              <Eye aria-hidden="true" size={17} />
              Spectate
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#4f4633] px-4 text-sm font-black text-[#d3c5ac]">
              Friend
            </span>
          )}
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#4f4633] px-3 text-sm font-black text-[#ece1d1] transition hover:bg-[#3a3429]"
            onClick={() => onMessage(friend)}
            type="button"
          >
            <MessageCircle aria-hidden="true" size={17} />
            <span className="sm:hidden xl:inline">Message</span>
          </button>
          <button
            aria-label={`Remove ${displayName}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#93000a]/60 px-3 text-sm font-black text-[#ffb4ab] transition hover:bg-[#93000a]/24"
            onClick={() => void onRemove(friend)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
          </button>
        </div>
      </article>
    </div>
  )
}

function RequestsPanel({
  incomingRequests,
  mutationBusy,
  onAccept,
  onCancel,
  onDecline,
  outgoingRequests,
}: {
  incomingRequests: FriendRequest[]
  mutationBusy: boolean
  onAccept: (friendshipId: string) => Promise<void>
  onCancel: (friendshipId: string) => Promise<void>
  onDecline: (friendshipId: string) => Promise<void>
  outgoingRequests: FriendRequest[]
}) {
  const hasRequests = incomingRequests.length > 0 || outgoingRequests.length > 0

  if (!hasRequests) {
    return (
      <div className={`${panelClass} grid min-h-64 place-items-center p-6 text-center`}>
        <div>
          <UserPlus aria-hidden="true" className="mx-auto text-[#f9bd22]" size={34} />
          <p className="mt-4 text-lg font-black text-[#ece1d1]">No pending requests</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#d3c5ac]">
            Incoming and outgoing friend requests will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {incomingRequests.map((request) => (
        <RequestCard
          action="incoming"
          isBusy={mutationBusy}
          key={request.friendshipId}
          onAccept={onAccept}
          onCancel={onCancel}
          onDecline={onDecline}
          request={request}
        />
      ))}
      {outgoingRequests.map((request) => (
        <RequestCard
          action="outgoing"
          isBusy={mutationBusy}
          key={request.friendshipId}
          onAccept={onAccept}
          onCancel={onCancel}
          onDecline={onDecline}
          request={request}
        />
      ))}
    </div>
  )
}

function RequestCard({
  action,
  isBusy,
  onAccept,
  onCancel,
  onDecline,
  request,
}: {
  action: 'incoming' | 'outgoing'
  isBusy: boolean
  onAccept: (friendshipId: string) => Promise<void>
  onCancel: (friendshipId: string) => Promise<void>
  onDecline: (friendshipId: string) => Promise<void>
  request: FriendRequest
}) {
  const displayName = request.displayName || request.username

  return (
    <div className={`${goldRimClass} rounded-xl`}>
      <article className={`${innerPanelClass} flex flex-col gap-4 p-4`}>
        <div className="flex items-center gap-3">
          <FriendAvatar
            avatarUrl={request.avatarUrl}
            displayName={displayName}
            presenceStatus="offline"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-xl font-black text-[#ece1d1]">
              {displayName}
            </h2>
            <p className="truncate text-sm font-semibold text-[#d3c5ac]">
              @{request.username}
            </p>
          </div>
        </div>
        <p className="rounded-lg border border-[#4f4633]/70 bg-[#201b11]/70 p-3 text-sm leading-6 text-[#d3c5ac]">
          {action === 'incoming'
            ? 'Wants to connect with you on Domino Vibes.'
            : 'Waiting for this player to respond.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {action === 'incoming' ? (
            <>
              <Button
                className="min-h-10 gap-2 px-4 py-2"
                disabled={isBusy}
                onClick={() => void onAccept(request.friendshipId)}
              >
                <Check aria-hidden="true" size={16} />
                Accept
              </Button>
              <Button
                className="min-h-10 gap-2 px-4 py-2"
                disabled={isBusy}
                onClick={() => void onDecline(request.friendshipId)}
                variant="secondary"
              >
                <X aria-hidden="true" size={16} />
                Decline
              </Button>
            </>
          ) : (
            <Button
              className="min-h-10 gap-2 px-4 py-2"
              disabled={isBusy}
              onClick={() => void onCancel(request.friendshipId)}
              variant="secondary"
            >
              <X aria-hidden="true" size={16} />
              Cancel
            </Button>
          )}
        </div>
      </article>
    </div>
  )
}

function DirectMessagePanel({
  compact = false,
  friend,
  onAddFriend,
  onSelectFriend,
}: {
  compact?: boolean
  friend: FriendHubFriend | null
  onAddFriend: () => void
  onSelectFriend: (friendshipId: string) => void
}) {
  if (!friend) {
    return (
      <div className={`${panelClass} grid min-h-72 place-items-center p-6 text-center`}>
        <div>
          <MessageCircle aria-hidden="true" className="mx-auto text-[#6bd8cb]" size={34} />
          <p className="mt-4 text-lg font-black text-[#ece1d1]">No private thread yet</p>
          <p className="mt-2 text-sm leading-6 text-[#d3c5ac]">
            Add a friend to unlock friends-only direct messages.
          </p>
          <Button className="mt-4 min-h-10 gap-2 px-4 py-2" onClick={onAddFriend}>
            <UserPlus aria-hidden="true" size={16} />
            Add Friend
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'rounded-xl shadow-2xl' : 'sticky top-20'}>
      <div className={`${goldRimClass} rounded-xl`}>
        <div className={`${innerPanelClass} overflow-hidden`}>
          <div className="border-b border-[#4f4633] bg-[#2f291f] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6bd8cb]">
                  Direct Messages
                </p>
                <h2 className="mt-1 font-serif text-2xl font-black text-[#ffdf9f]">
                  {getFriendDisplayName(friend)}
                </h2>
              </div>
              <button
                aria-label="Keep this direct message selected"
                className="grid size-10 place-items-center rounded-lg border border-[#4f4633] text-[#d3c5ac]"
                onClick={() => onSelectFriend(friend.friendshipId)}
                type="button"
              >
                <MessageCircle aria-hidden="true" size={17} />
              </button>
            </div>
          </div>
          <div className="p-3">
            <ChatPanel
              compact
              defaultOpen
              roomId={friend.friendshipId}
              roomType="direct"
              title={getFriendDisplayName(friend)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function AddFriendModal({
  isSending,
  onAccept,
  onClose,
  onSend,
}: {
  isSending: boolean
  onAccept: (friendshipId: string) => Promise<boolean>
  onClose: () => void
  onSend: (profileId: string) => Promise<boolean>
}) {
  const [query, setQuery] = useState('')
  const [success, setSuccess] = useState('')
  const normalizedQuery = normalizeFriendSearch(query)
  const searchQuery = useFriendSearch(query)
  const results = searchQuery.data ?? []
  const showMinLength = normalizedQuery.length > 0 && normalizedQuery.length < friendSearchMinLength

  async function handleSend(profileId: string) {
    setSuccess('')

    if (await onSend(profileId)) {
      setSuccess('Friend request sent.')
    }
  }

  async function handleAccept(friendshipId: string) {
    setSuccess('')

    if (await onAccept(friendshipId)) {
      setSuccess('Friend request accepted.')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className={`${goldRimClass} max-h-[88svh] w-full overflow-hidden rounded-t-xl sm:max-w-2xl sm:rounded-xl`}>
        <section className={`${innerPanelClass} max-h-[88svh] overflow-y-auto`}>
          <div className="flex items-start justify-between gap-3 border-b border-[#4f4633] bg-[#2f291f] p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6bd8cb]">
                Add Friend
              </p>
              <h2 className="mt-1 font-serif text-2xl font-black text-[#ffdf9f]">
                Search players
              </h2>
            </div>
            <button
              aria-label="Close add friend"
              className="grid size-10 place-items-center rounded-lg border border-[#4f4633] text-[#d3c5ac] transition hover:bg-[#3a3429]"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="grid gap-4 p-4">
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.12em] text-[#d3c5ac]">
                Username or display name
              </span>
              <span className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8f79]"
                  size={18}
                />
                <input
                  autoFocus
                  className="min-h-12 w-full rounded-full border border-[#4f4633] bg-[#201b11] py-2 pl-10 pr-4 text-[#ece1d1] outline-none transition placeholder:text-[#9c8f79] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20"
                  maxLength={40}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by username..."
                  value={query}
                />
              </span>
            </label>

            {showMinLength ? (
              <p className="rounded-lg border border-[#4f4633] bg-[#201b11] px-3 py-2 text-sm font-semibold text-[#d3c5ac]">
                Type at least {friendSearchMinLength} characters to search.
              </p>
            ) : null}

            {success ? (
              <p className="rounded-lg border border-[#6bd8cb]/35 bg-[#29a195]/15 px-3 py-2 text-sm font-semibold text-[#89f5e7]">
                {success}
              </p>
            ) : null}

            {searchQuery.isLoading ? (
              <p className="inline-flex items-center gap-2 rounded-lg border border-[#4f4633] bg-[#201b11] px-3 py-2 text-sm font-semibold text-[#d3c5ac]">
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                Searching players...
              </p>
            ) : null}

            {searchQuery.isError ? (
              <p className="rounded-lg border border-[#93000a]/60 bg-[#93000a]/20 px-3 py-2 text-sm font-semibold text-[#ffb4ab]">
                {getFriendlyFriendsError(searchQuery.error)}
              </p>
            ) : null}

            {normalizedQuery.length >= friendSearchMinLength &&
            !searchQuery.isLoading &&
            !searchQuery.isError &&
            results.length === 0 ? (
              <p className="rounded-lg border border-[#4f4633] bg-[#201b11] px-3 py-4 text-center text-sm font-semibold text-[#d3c5ac]">
                No matching players found.
              </p>
            ) : null}

            <div className="grid gap-2">
              {results.map((result) => (
                <FriendSearchResultRow
                  isSending={isSending}
                  key={result.profileId}
                  onAccept={handleAccept}
                  onSend={handleSend}
                  result={result}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function FriendSearchResultRow({
  isSending,
  onAccept,
  onSend,
  result,
}: {
  isSending: boolean
  onAccept: (friendshipId: string) => Promise<void>
  onSend: (profileId: string) => Promise<void>
  result: FriendSearchResult
}) {
  const action = getSearchResultAction(result)
  const displayName = result.displayName || result.username
  const actionLabel =
    action === 'accept'
      ? 'Accept'
      : action === 'pending'
        ? 'Pending'
        : action === 'friends'
          ? 'Friends'
          : 'Add'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#4f4633] bg-[#201b11] p-3">
      <FriendAvatar
        avatarUrl={result.avatarUrl}
        displayName={displayName}
        presenceStatus="offline"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-black text-[#ece1d1]">{displayName}</p>
        <p className="truncate text-sm font-semibold text-[#d3c5ac]">@{result.username}</p>
      </div>
      <Button
        className="min-h-10 gap-2 px-4 py-2"
        disabled={isSending || action === 'pending' || action === 'friends'}
        onClick={() => {
          if (action === 'accept' && result.friendshipId) {
            void onAccept(result.friendshipId)
            return
          }

          if (action === 'send') {
            void onSend(result.profileId)
          }
        }}
        variant={action === 'send' || action === 'accept' ? 'primary' : 'secondary'}
      >
        {action === 'accept' ? <Check aria-hidden="true" size={16} /> : null}
        {actionLabel}
      </Button>
    </div>
  )
}

function FriendsTabs({
  activeTab,
  allCount,
  onlineCount,
  onChange,
  requestCount,
}: {
  activeTab: FriendsTab
  allCount: number
  onlineCount: number
  onChange: (tab: FriendsTab) => void
  requestCount: number
}) {
  const tabs: Array<{ count?: number; label: string; value: FriendsTab }> = [
    { count: onlineCount, label: 'Online', value: 'online' },
    { count: requestCount, label: 'Requests', value: 'requests' },
    { count: allCount, label: 'All Friends', value: 'all' },
    { label: 'Messages', value: 'messages' },
  ]

  return (
    <div className="flex gap-5 overflow-x-auto border-b border-[#4f4633]/70 pb-1">
      {tabs.map((tab) => (
        <button
          className={cn(
            'relative whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-black uppercase tracking-[0.08em] transition',
            activeTab === tab.value
              ? 'border-[#f9bd22] text-[#ffdf9f]'
              : 'border-transparent text-[#d3c5ac] hover:text-[#ece1d1]',
          )}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
          {typeof tab.count === 'number' ? ` (${tab.count})` : null}
        </button>
      ))}
    </div>
  )
}

function FriendsTopBar({
  currentProfileLabel,
  localSearch,
  onAddFriend,
  onLocalSearchChange,
}: {
  currentProfileLabel: string
  localSearch: string
  onAddFriend: () => void
  onLocalSearchChange: (value: string) => void
}) {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#4f4633] bg-[#2f291f]/96 px-4 shadow-md backdrop-blur lg:pl-72">
      <Link className="font-serif text-2xl font-black text-[#fbbf24] lg:hidden" to="/">
        Domino Vibes
      </Link>
      <div className="hidden w-full max-w-md md:block">
        <label className="relative block">
          <span className="sr-only">Search current friends</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8f79]"
            size={18}
          />
          <input
            className="min-h-10 w-full rounded-full border border-[#4f4633] bg-[#201b11] py-2 pl-10 pr-4 text-sm text-[#ece1d1] outline-none transition placeholder:text-[#9c8f79] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20"
            onChange={(event) => onLocalSearchChange(event.target.value)}
            placeholder="Search friends..."
            value={localSearch}
          />
        </label>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="grid size-10 place-items-center rounded-full text-[#d3c5ac] transition hover:bg-[#3a3429] hover:text-[#ece1d1]"
          type="button"
        >
          <Bell aria-hidden="true" size={18} />
        </button>
        <button
          aria-label="Add friend"
          className="grid size-10 place-items-center rounded-full text-[#d3c5ac] transition hover:bg-[#3a3429] hover:text-[#ece1d1]"
          onClick={onAddFriend}
          type="button"
        >
          <UserPlus aria-hidden="true" size={18} />
        </button>
        <div className="hidden items-center gap-2 border-l border-[#4f4633] pl-3 sm:flex">
          <span className="grid size-9 place-items-center rounded-full border border-[#fbbf24]/40 bg-[#3a3429] text-[#ffdf9f]">
            <UserRound aria-hidden="true" size={17} />
          </span>
          <span className="max-w-28 truncate text-sm font-black text-[#ece1d1]">
            {currentProfileLabel}
          </span>
        </div>
      </div>
    </header>
  )
}

function FriendsSideRail() {
  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#4f4633] bg-[#241f15] shadow-xl lg:flex">
      <div className="border-b border-[#4f4633] px-4 py-6">
        <p className="font-serif text-3xl font-black leading-tight text-[#fbbf24]">
          Domino Vibes
        </p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#d3c5ac]">
          Elite Social Club
        </p>
      </div>
      <ul className="flex-1 space-y-1 px-2 py-4">
        <SideRailItem icon={<Home size={18} />} label="Home" to="/" />
        <SideRailItem icon={<Table2 size={18} />} label="Play" to="/lobby" />
        <SideRailItem active icon={<UsersRound size={18} />} label="Friends" to="/friends" />
        <SideRailItem icon={<Eye size={18} />} label="Watch" soon />
        <SideRailItem icon={<UserRound size={18} />} label="Profile" to="/profile" />
      </ul>
    </nav>
  )
}

function SideRailItem({
  active = false,
  icon,
  label,
  soon = false,
  to,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  soon?: boolean
  to?: string
}) {
  const className = cn(
    'flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-black uppercase tracking-[0.06em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bd8cb]',
    active
      ? 'translate-x-1 border-l-4 border-[#f9bd22] bg-[#3a3429] text-[#ffdf9f]'
      : 'text-[#d3c5ac] hover:bg-[#2f291f] hover:text-[#ece1d1]',
  )
  const content = (
    <>
      {icon}
      <span>{label}</span>
      {soon ? (
        <span className="ml-auto rounded-full border border-[#4f4633] px-2 py-1 text-[0.56rem] text-[#9c8f79]">
          Soon
        </span>
      ) : null}
    </>
  )

  return (
    <li>
      {to && !soon ? (
        <Link aria-current={active ? 'page' : undefined} className={className} to={to}>
          {content}
        </Link>
      ) : (
        <div aria-disabled className={`${className} opacity-70`}>
          {content}
        </div>
      )}
    </li>
  )
}

function MobileFriendsBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-[#4f4633] bg-[#3a3429] px-3 pb-4 pt-2 shadow-2xl lg:hidden">
      <MobileNavItem icon={<Home size={20} />} label="Home" to="/" />
      <MobileNavItem icon={<Table2 size={20} />} label="Play" to="/lobby" />
      <MobileNavItem active icon={<UsersRound size={20} />} label="Friends" to="/friends" />
      <MobileNavItem icon={<UserRound size={20} />} label="Profile" to="/profile" />
    </nav>
  )
}

function MobileNavItem({
  active = false,
  icon,
  label,
  to,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  to: string
}) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex min-w-16 flex-col items-center justify-center rounded-xl bg-[#fbbf24] p-2 text-[#6c4f00]'
          : 'flex min-w-16 flex-col items-center justify-center rounded-lg p-2 text-[#d3c5ac] hover:bg-[#2f291f]'
      }
      to={to}
    >
      {icon}
      <span className="mt-1 text-xs font-bold">{label}</span>
    </Link>
  )
}

function FriendAvatar({
  avatarUrl,
  displayName,
  presenceStatus,
}: {
  avatarUrl: string | null
  displayName: string
  presenceStatus: FriendHubFriend['presenceStatus']
}) {
  return (
    <span className="relative block size-14 shrink-0">
      <span className={`${goldRimClass} block size-14 rounded-full`}>
        <span className="grid size-full overflow-hidden rounded-full bg-[#3a3429] text-[#ffdf9f]">
          {avatarUrl ? (
            <img
              alt={`${displayName} avatar`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              src={avatarUrl}
            />
          ) : (
            <span className="grid h-full w-full place-items-center">
              <UserRound aria-hidden="true" size={24} />
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#241f15]',
          presenceStatus === 'online'
            ? 'bg-[#29a195]'
            : presenceStatus === 'away'
              ? 'bg-[#30d8fd]'
              : 'bg-[#9c8f79]',
        )}
      />
    </span>
  )
}

function FeedbackBanner({
  message,
  tone,
}: {
  message: string
  tone: 'success' | 'error'
}) {
  return (
    <p
      className={
        tone === 'success'
          ? 'rounded-xl border border-[#6bd8cb]/35 bg-[#29a195]/15 px-4 py-3 text-sm font-semibold text-[#89f5e7]'
          : 'rounded-xl border border-[#93000a]/60 bg-[#93000a]/20 px-4 py-3 text-sm font-semibold text-[#ffb4ab]'
      }
      role="status"
    >
      {message}
    </p>
  )
}

function getFriendDisplayName(friend: FriendHubFriend) {
  return friend.displayName || friend.username
}
