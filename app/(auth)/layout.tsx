export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen w-full bg-[#f8f9fa]">
            {children}
        </div>
    )
}
