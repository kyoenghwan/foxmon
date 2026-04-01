import JobPostForm from '@/components/employer/job-post-form';
import { Separator } from '@/components/ui/separator';

export default function NewJobPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Post a New Job</h3>
                <p className="text-sm text-muted-foreground">
                    Create a new job posting to find the perfect candidate.
                </p>
            </div>
            <Separator />
            <JobPostForm />
        </div>
    );
}
