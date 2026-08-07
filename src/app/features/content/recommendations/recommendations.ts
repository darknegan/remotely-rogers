import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { Tag } from 'primeng/tag';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface Recommendation {
  badge: string;
  title: string;
  description: string;
  detail: string;
  imageUrl: string;
  websiteUrl: string;
  severity: TagSeverity;
}

interface LocalTip {
  text: string;
  detail: string;
  icon: string;
}

interface DayPlanStep {
  label: string;
  title: string;
  description: string;
  accent?: boolean;
}

interface TripIdea {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  severity: TagSeverity;
  imageUrl: string;
  websiteUrl: string;
}

@Component({
  selector: 'app-recommendations',
  imports: [Card, Divider, Panel, Tag],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
})
export class Recommendations {
  readonly picks: Recommendation[] = [
    {
      badge: 'Brunch',
      title: 'The Buttered Biscuit',
      description:
        'Famous brunch worth the short drive — biscuits, cinnamon rolls, and hearty plates that guests rave about all season.',
      detail: 'Weekend mornings · short drive from cabins',
      severity: 'warn',
      imageUrl:
        'https://thebutteredbiscuit.com/wp-content/uploads/2025/01/social-share-featured-image-1.jpg',
      websiteUrl: 'https://thebutteredbiscuit.com/',
    },
    {
      badge: 'Museum',
      title: 'Crystal Bridges',
      description:
        'World-class American art on a stunning Bentonville campus — combine a museum morning with lunch at the on-site café.',
      detail: 'Bentonville · 25 min drive',
      severity: 'info',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/d/df/Crystal_Bridges_Museum_of_American_Art_May_2017_17.jpg',
      websiteUrl: 'https://crystalbridges.org/',
    },
    {
      badge: 'On the water',
      title: 'Beaver Lake',
      description:
        'Boating, kayaking, paddleboarding, and scenic overlooks — the go-to lake day for guests who want water and views.',
      detail: 'Marinas & public access · 20 min drive',
      severity: 'success',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/9/9b/Prairie_Creek_Marina%2C_Beaver_Lake_Arkansas.JPG',
      websiteUrl: 'https://www.swl.usace.army.mil/Missions/Recreation/Beaver-Lake/',
    },
    {
      badge: 'Coffee',
      title: 'Downtown Rogers',
      description:
        'Local cafés, boutiques, and brick-lined streets — perfect for a mid-day break, client coffee, or slow afternoon stroll.',
      detail: 'Walkable square · 12 min drive',
      severity: 'secondary',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Downtown_Rogers.jpg',
      websiteUrl:
        'https://www.destinationrogers.com/downtown-things-to-do/guide-to-downtown-rogers-arkansas-a-must-visit-destination/',
    },
    {
      badge: 'Live music',
      title: 'Railyard Live',
      description:
        'Outdoor concerts and food trucks in downtown Rogers — summer evenings with a lively, local feel.',
      detail: 'Seasonal series · downtown Rogers',
      severity: 'warn',
      imageUrl:
        'https://railyardlive.com/site/images/user-images/img_20210702_204645.webp',
      websiteUrl: 'https://railyardlive.com/',
    },
    {
      badge: 'History',
      title: 'Pea Ridge National Military Park',
      description:
        'A preserved Civil War battlefield with peaceful trails and interpretive history — a meaningful half-day excursion.',
      detail: 'Scenic drives · hiking trails',
      severity: 'contrast',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/c/c0/Pea_Ridge_National_Military_Park_Elkhorn_Tavern_01.jpg',
      websiteUrl: 'https://www.nps.gov/peri/',
    },
  ];

  readonly localTips: LocalTip[] = [
    {
      text: 'Start mornings slow',
      detail: 'Brunch in Rogers, then lake or trail — avoid rushing the best parts',
      icon: 'pi pi-sun',
    },
    {
      text: 'Bentonville is a day trip',
      detail: 'Pair Crystal Bridges with lunch and an afternoon downtown',
      icon: 'pi pi-map',
    },
    {
      text: 'Book dining ahead on weekends',
      detail: 'Popular spots fill up — especially during event season',
      icon: 'pi pi-calendar',
    },
    {
      text: 'Keep a rain backup',
      detail: 'Museums and downtown shops are perfect for weather days',
      icon: 'pi pi-cloud',
    },
    {
      text: 'Ask us for updates',
      detail: 'Seasonal events like Railyard Live change year to year',
      icon: 'pi pi-comment',
    },
    {
      text: 'Drive times are short',
      detail: 'Most picks are 8–25 minutes from Remotely Rogers',
      icon: 'pi pi-car',
    },
  ];

  readonly dayPlan: DayPlanStep[] = [
    {
      label: 'Morning',
      title: 'Coffee & brunch',
      description:
        'Grab coffee downtown or head to The Buttered Biscuit for a relaxed start before the day picks up.',
      accent: true,
    },
    {
      label: 'Afternoon',
      title: 'Lake or culture',
      description:
        'Choose Beaver Lake for outdoor time, or drive to Bentonville for Crystal Bridges and a walkable afternoon.',
    },
    {
      label: 'Evening',
      title: 'Downtown Rogers',
      description:
        'Dinner, live music at Railyard Live, or a stroll through the square — end the day local.',
    },
  ];

  readonly tripIdeas: TripIdea[] = [
    {
      title: 'Outdoor day',
      subtitle: 'Lake · trails · fresh air',
      description:
        'Beaver Lake in the morning, Hobbs State Park or Lake Atalanta in the afternoon — best for active guests.',
      badge: 'Nature',
      severity: 'success',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/9/9b/Prairie_Creek_Marina%2C_Beaver_Lake_Arkansas.JPG',
      websiteUrl: 'https://www.swl.usace.army.mil/Missions/Recreation/Beaver-Lake/',
    },
    {
      title: 'Culture trip',
      subtitle: 'Museum · history · downtown',
      description:
        'Crystal Bridges plus Rogers Historical Museum or Pea Ridge — ideal for mixed-age groups and rainy days.',
      badge: 'Arts & history',
      severity: 'info',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/d/df/Crystal_Bridges_Museum_of_American_Art_May_2017_17.jpg',
      websiteUrl: 'https://crystalbridges.org/',
    },
    {
      title: 'Foodie evening',
      subtitle: 'Dinner · music · local flavor',
      description:
        'Start with downtown dining, catch Railyard Live when in season, and walk the square after dark.',
      badge: 'Evenings',
      severity: 'warn',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Downtown_Rogers.jpg',
      websiteUrl:
        'https://www.destinationrogers.com/downtown-things-to-do/guide-to-downtown-rogers-arkansas-a-must-visit-destination/',
    },
  ];
}
