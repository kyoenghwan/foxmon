'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const jobPostSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    jobType: z.string().min(1, 'Job type is required'),
    employmentType: z.enum(['PART_TIME', 'FULL_TIME', 'INTERN', 'CONTRACT']),
    region: z.string().min(1, 'Region is required'),
    wageType: z.enum(['HOURLY', 'DAILY', 'MONTHLY']),
    wageAmount: z.coerce.number().min(0), // coerce handles string to number conversion
    description: z.string().min(20, 'Description must be detailed'),
    deadline: z.string().optional(), // Date input returns string
});

type JobPostFormValues = z.infer<typeof jobPostSchema>;

const defaultValues: Partial<JobPostFormValues> = {
    employmentType: 'PART_TIME',
    wageType: 'HOURLY',
    wageAmount: 0,
};

export default function JobPostForm() {
    const form = useForm<JobPostFormValues>({
        // @ts-ignore
        resolver: zodResolver(jobPostSchema),
        defaultValues,
    });

    function onSubmit(data: JobPostFormValues) {
        console.log('Submitted Job:', data);
        // TODO: API call to create job post
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 max-w-2xl">
                <FormField
                    control={form.control as any}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Weekend Cafe Barista" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control as any}
                        name="jobType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Industry / Job Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="cafe">Cafe / Coffee</SelectItem>
                                        <SelectItem value="restaurant">Restaurant</SelectItem>
                                        <SelectItem value="retail">Convenience Store / Retail</SelectItem>
                                        <SelectItem value="office">Office Support</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control as any}
                        name="employmentType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Employment Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PART_TIME">Part Time (Alba)</SelectItem>
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="CONTRACT">Contract</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control as any}
                        name="wageType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wage Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select wage type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="HOURLY">Hourly</SelectItem>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control as any}
                        name="wageAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (KRW)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="10000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control as any}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Region</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Seoul, Gangnam-gu" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <FormField
                    control={form.control as any}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Detailed Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe the main responsibilities, requirements, and benefits."
                                    className="min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" size="lg" className="w-full">Post Job</Button>
            </form>
        </Form>
    );
}
