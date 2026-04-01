import EmployerProfileForm from '@/components/employer/profile-form';
import { Separator } from '@/components/ui/separator';

export default function EmployerProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Company Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your company information and branding.
                </p>
            </div>
            <Separator />
            <EmployerProfileForm />
        </div>
    );
}
