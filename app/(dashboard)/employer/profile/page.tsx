import EmployerProfileForm from '@/components/employer/profile-form';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TelegramConnectButton } from '@/components/employer/telegram-connect-button';

export default async function EmployerProfilePage() {
    const session = await auth();
    const userId = session?.user?.id;

    let isLinked = false;
    if (userId) {
        const { data } = await supabaseAdmin.from('users').select('telegram_chat_id').eq('id', userId).single();
        if (data?.telegram_chat_id) isLinked = true;
    }

    let botUsername = '';
    const { data: setting } = await supabaseAdmin.from('site_settings').select('key_value').eq('key_name', 'telegram_bot_username').single();
    if (setting) botUsername = setting.key_value;

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
