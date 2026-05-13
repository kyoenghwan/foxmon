import EmployerProfileForm from '@/components/employer/profile-form';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getSiteSettings } from '@/actions/admin/siteSettings';
import { TelegramConnectButton } from '@/components/employer/telegram-connect-button';

export default async function EmployerProfilePage() {
    const session = await auth();
    const userId = session?.user?.id;

    let isLinked = false;
    if (userId) {
        const { data } = await supabaseAdmin.from('users').select('telegram_chat_id').eq('id', userId).single();
        if (data?.telegram_chat_id) isLinked = true;
    }

    const { data: settings } = await getSiteSettings();
    const botUsername = settings?.telegram_bot_username || '';
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Company Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your company information and branding.
                </p>
            </div>
            <Separator />
            
            {userId && (
                <TelegramConnectButton 
                    userId={userId} 
                    botUsername={botUsername} 
                    isLinked={isLinked} 
                />
            )}
            
            <Separator />
            <EmployerProfileForm />
        </div>
    );
}
