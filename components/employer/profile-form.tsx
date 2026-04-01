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

const employerProfileSchema = z.object({
    companyName: z.string().min(2, {
        message: 'Company name must be at least 2 characters.',
    }),
    businessRegistrationNumber: z.string().optional(), // regex validation can be added
    address: z.string().min(5, {
        message: 'Address is required to show location to job seekers.',
    }),
    contactPhone: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
});

type EmployerProfileFormValues = z.infer<typeof employerProfileSchema>;

const defaultValues: Partial<EmployerProfileFormValues> = {
    companyName: '',
    address: '',
    description: '',
};

export default function EmployerProfileForm() {
    const form = useForm<EmployerProfileFormValues>({
        resolver: zodResolver(employerProfileSchema),
        defaultValues,
        mode: 'onChange',
    });

    function onSubmit(data: EmployerProfileFormValues) {
        console.log('Submitted:', data);
        // TODO: API call to update profile
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Input placeholder="123 Gangnam-gu, Seoul" {...field} />
                            </FormControl>
                            <FormDescription>
                                Full address of your workplace.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                                <Input placeholder="02-1234-5678" {...field} />
                            </FormControl>
                            <FormDescription>
                                Public contact number for job seekers.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about your company culture and business."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Save Profile</Button>
            </form>
        </Form>
    );
}
