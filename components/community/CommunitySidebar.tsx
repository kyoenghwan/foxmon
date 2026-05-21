'use client';

import { MessageSquare, ShoppingBag, Store, Star, Lightbulb, AlertTriangle, Users, Lock } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';
import { getCommunitySidebarSections } from '@/lib/community-boards';

const ICONS: Record<string, typeof Users> = {
  free: Users,
  tips: Lightbulb,
  foxtalk: MessageSquare,
  foxmarket: ShoppingBag,
  reviews: Star,
  secret: Lock,
  report: AlertTriangle,
  business: Store,
};

interface CommunitySidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  userRole?: string | null;
}

export function CommunitySidebar({ currentTab, onTabChange, userRole }: CommunitySidebarProps) {
  const sectionGroups = getCommunitySidebarSections(userRole);

  const sections: SidebarSection[] = sectionGroups.map((g) => ({
    title: g.title,
    items: g.items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: ICONS[item.id] || Users,
    })),
  }));

  return (
    <SidebarNav
      title="커뮤니티"
      sections={sections}
      activeId={currentTab}
      onItemClick={onTabChange}
    />
  );
}
