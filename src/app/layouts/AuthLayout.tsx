const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-bg min-h-screen min-w-screen px-2 md:p-12">
      {children}
    </div>
  )
}

export { AuthLayout }