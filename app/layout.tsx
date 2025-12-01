export const metadata = {
  title: 'NexChatCC',
  description: 'NexChat Community Chat API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
