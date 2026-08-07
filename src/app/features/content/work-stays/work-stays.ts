import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { Tag } from 'primeng/tag';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface WorkAmenity {
  badge: string;
  title: string;
  description: string;
  detail: string;
  severity: TagSeverity;
  imageUrl: string;
}

interface WorkFeature {
  text: string;
  detail: string;
  icon: string;
}

interface StayOption {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  severity: TagSeverity;
  imageUrl: string;
}

interface WorkdayStep {
  time: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-work-stays',
  imports: [Card, Divider, Panel, Tag],
  templateUrl: './work-stays.html',
  styleUrl: './work-stays.scss',
})
export class WorkStays {
  readonly amenities: WorkAmenity[] = [
    {
      badge: 'Workspace',
      title: 'Private A-frame offices',
      description:
        'Every cabin includes a dedicated desk, ergonomic chair, and strong Wi‑Fi — your own quiet office surrounded by trees.',
      detail: 'Desk · natural light · cabin privacy',
      severity: 'success',
      imageUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      badge: 'Focus',
      title: 'Nature between meetings',
      description:
        'Take calls indoors, then walk the property between sessions. Trails, lake views, and fresh air without a commute.',
      detail: '70 private acres · no crowds',
      severity: 'info',
      imageUrl:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    },
    {
      badge: 'Groups',
      title: 'Team & corporate retreats',
      description:
        'Book multiple cabins for offsites and retreats — shared outdoor space, separate workspaces, and one property to gather.',
      detail: 'Multi-cabin booking · flexible lengths',
      severity: 'warn',
      imageUrl:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  readonly features: WorkFeature[] = [
    {
      text: 'High-speed Wi‑Fi in every cabin',
      detail: 'Stream, video call, and upload without worry',
      icon: 'pi pi-wifi',
    },
    {
      text: 'Dedicated workspace with natural light',
      detail: 'Desk setup in each A-frame',
      icon: 'pi pi-desktop',
    },
    {
      text: 'Quiet, private 70-acre setting',
      detail: 'No shared walls with strangers',
      icon: 'pi pi-tree',
    },
    {
      text: 'Flexible weekly and extended stays',
      detail: 'Ideal for workations & sabbaticals',
      icon: 'pi pi-calendar',
    },
    {
      text: 'Easy access to Rogers and Bentonville',
      detail: 'Coffee, dining, and coworking nearby',
      icon: 'pi pi-map',
    },
    {
      text: 'On-site parking at each cabin',
      detail: 'Pull up, unload, and settle in',
      icon: 'pi pi-car',
    },
  ];

  readonly stayOptions: StayOption[] = [
    {
      title: 'Solo work week',
      subtitle: '1 cabin · 5–7 nights',
      description:
        'Perfect for a focused sprint — deep work by day, trails and downtown Rogers after hours.',
      badge: 'Most popular',
      severity: 'success',
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Extended stay',
      subtitle: '4+ weeks · live & work',
      description:
        'Settle into cabin life with a longer booking — ideal for remote employees and seasonal relocations.',
      badge: 'Extended',
      severity: 'info',
      imageUrl:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Team offsite',
      subtitle: 'Multiple cabins · shared acreage',
      description:
        'Bring the whole team for strategy sessions, workshops, and evenings around the fire pit.',
      badge: 'Groups',
      severity: 'warn',
      imageUrl:
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    },
  ];

  readonly workdayFlow: WorkdayStep[] = [
    {
      time: 'Morning',
      title: 'Coffee & deep work',
      description: 'Start with quiet focus at your cabin desk before the day gets noisy.',
    },
    {
      time: 'Midday',
      title: 'Walk or ride',
      description: 'Break up screen time with a trail loop or quick trip into Rogers.',
    },
    {
      time: 'Afternoon',
      title: 'Calls & collaboration',
      description: 'Reliable Wi‑Fi for video meetings — then sign off and unplug outdoors.',
    },
  ];
}
