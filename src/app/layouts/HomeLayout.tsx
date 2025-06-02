import { RequestInfo } from "rwsdk/worker";
import { link } from '@/app/shared/links'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'

const HomeLayout = ({ ctx, children }: RequestInfo & { children: React.ReactNode }) => {
  return (
    <div className="">
      <header className="w-full h-16 bg-primary flex items-center justify-between px-8 shadow-md">
        <a href={link("/home")} className="flex items-center gap-2">
          <img src="/images/!logo.png" alt="KNS" className="h-10 w-10 rounded-full object-contain" />
          <span className="text-white text-xl font-bold tracking-wide">ILCA-KNS</span>
        </a>
        <nav>
          {ctx?.user && ctx.user.username ? (
            <ul className="flex items-center gap-4">
              <li>
                <a href={link("/test")} className="text-white hover:underline">Test</a>
              </li>
              <li>
                <a href={link("/user/:username/profile", { username: ctx.user.username })} className="text-white hover:underline">Profile</a>
              </li>
              <li>
                <a href={link("/user/:username/settings", { username: ctx.user.username })} className="text-white hover:underline">Settings</a>
              </li>
              <li>
                <a href={link("/user/logout")} className="text-white hover:underline">Logout</a>
              </li>
              <li>
                <a href={link("/user/:username/profile", { username: ctx.user.username })}>
                  <Avatar>
                    <AvatarFallback>{ctx.user.username[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </a>
              </li>
              <li className="text-white font-medium">
                <a href={link("/user/:username/profile", { username: ctx.user.username })} className="hover:underline">{ctx.user.username}</a>
              </li>
            </ul>
          ) : (
            <ul className="flex items-center gap-4">
              <li>
                <a href={link("/user/login")} className="text-white hover:underline">Login</a>
              </li>
              <li>
                <a href={link("/user/signup")} className="text-white hover:underline">Signup</a>
              </li>
            </ul>
          )}
        </nav>
      </header>
      <main className="">
        {children}
      </main>
    </div>
  );
};

export { HomeLayout }
