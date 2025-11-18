import { Suspense } from 'react'
import { RequestInfo } from 'rwsdk/worker'
import { link } from '@/app/shared/links'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { ClientToaster } from '@/app/components/ClientToaster'

interface HomeLayoutProps extends RequestInfo {
  children: React.ReactNode
  /**
   * When true, hides the primary navigation menu.
   * Useful for pages that provide their own navigation (e.g. sidebar layouts).
   */
  hideNavigation?: boolean
}

const HomeLayout = ({ ctx, children, hideNavigation }: HomeLayoutProps) => {
  const username = ctx?.user?.username

  const showAuthenticatedNav = !!username && !hideNavigation
  const showUnauthenticatedNav = (!ctx?.user || !username) && !hideNavigation

  return (
    <div className="">
      <header className="w-full h-16 bg-primary flex items-center justify-between px-8 shadow-md">
        <a href={link('/home')} className="flex items-center gap-2">
          <img src="/images/!logo.png" alt="KNS" className="h-10 w-10 rounded-full object-contain" />
          <span className="text-white text-xl font-bold tracking-wide">ILCA-KNS</span>
        </a>

        {showAuthenticatedNav && (
          <nav>
            <ul className="flex items-center gap-4">
              <li>
                <a href={link('/test')} className="text-white hover:underline">
                  Test
                </a>
              </li>
              <li>
                <a href={link('/tasks')} className="text-white hover:underline">
                  Tasks
                </a>
              </li>
              <li>
                <a href={link('/user/:username/profile', { username })} className="text-white hover:underline">
                  Profile
                </a>
              </li>
              <li>
                <a href={link('/user/:username/settings', { username })} className="text-white hover:underline">
                  Settings
                </a>
              </li>
              <li>
                <a href={link('/user/logout')} className="text-white hover:underline">
                  Logout
                </a>
              </li>
              <li>
                <a href={link('/user/:username/profile', { username })}>
                  <Avatar>
                    <AvatarFallback>{username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </a>
              </li>
              <li className="text-white font-medium">
                <a href={link('/user/:username/profile', { username })} className="hover:underline">
                  {username}
                </a>
              </li>
            </ul>
          </nav>
        )}

        {showUnauthenticatedNav && (
          <nav>
            <ul className="flex items-center gap-4">
              <li>
                <a href={link('/user/login')} className="text-white hover:underline">
                  Login
                </a>
              </li>
              <li>
                <a href={link('/user/signup')} className="text-white hover:underline">
                  Signup
                </a>
              </li>
            </ul>
          </nav>
        )}

        {hideNavigation && username && (
          <div className="flex items-center gap-4 text-white">
            <a href={link('/user/:username/profile', { username })}>
              <Avatar>
                <AvatarFallback>{username[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </a>
            <a href={link('/user/:username/profile', { username })} className="hover:underline font-medium">
              {username}
            </a>
          </div>
        )}
      </header>
      <main className="">
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>{children}</Suspense>
      </main>
      <ClientToaster />
    </div>
  )
}

export { HomeLayout }
