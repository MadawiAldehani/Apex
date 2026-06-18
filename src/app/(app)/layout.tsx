import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileHeader from '@/components/layout/MobileHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <MobileHeader userName={profile?.name} />

      {/* Content — shifted right on desktop, full-width on mobile */}
      <div className="lg:ml-64 lg:pt-0 pt-14 pb-20 lg:pb-0">
        <main className="p-4 lg:p-6 max-w-full">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
