import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { SelectButton } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface FeaturedActivity {
  title: string;
  description: string;
  detail: string;
  badge: string;
  severity: TagSeverity;
  imageUrl: string;
  websiteUrl: string;
  categories: string[];
  large?: boolean;
}

interface AdventureStep {
  label: string;
  title: string;
  description: string;
  accent?: boolean;
}

interface OutdoorSpot {
  label: string;
  detail: string;
  icon: string;
}

export interface TrailSpot {
  name: string;
  type: string;
  note: string;
  description: string;
  distance: string;
  imageUrl: string;
  websiteUrl: string;
  severity: TagSeverity;
}

export interface CultureSpot {
  title: string;
  description: string;
  detail: string;
  badge: string;
  icon: string;
  imageUrl: string;
  websiteUrl: string;
  severity: TagSeverity;
  categories: string[];
}

export interface DiningSpot {
  name: string;
  cuisine: string;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  severity: TagSeverity;
}

@Component({
  selector: 'app-activities',
  imports: [FormsModule, Card, Divider, Panel, Tag],
  templateUrl: './activities.html',
  styleUrl: './activities.scss',
})
export class Activities {
  readonly categoryOptions = [
    { label: 'All', value: 'All' },
    { label: 'Outdoor', value: 'Outdoor' },
    { label: 'Biking', value: 'Biking' },
    { label: 'History', value: 'History' },
    { label: 'Dining', value: 'Dining' },
    { label: 'Nightlife', value: 'Nightlife' },
    { label: 'Weekend', value: 'Weekend trips' },
  ];

  selectedCategory = 'All';

  readonly featured: FeaturedActivity[] = [
    {
      title: 'Hobbs State Park',
      description:
        'Arkansas’s largest state park — miles of hiking trails, wildlife viewing, and Beaver Lake access for a full outdoor day.',
      detail: 'Weekend trips · 25 min drive',
      badge: 'Outdoor · Featured',
      severity: 'success',
      categories: ['Outdoor', 'Weekend trips'],
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/1/16/Sinking_Stream_in_Hobbs_State_Park_%26_Conservation_Area.jpg',
      websiteUrl: 'https://www.americasstateparks.org/state-park/hobbs/',
      large: true,
    },
    {
      title: 'Lake Atalanta',
      description:
        'Morning walks, fishing, and peaceful lake views — one of the easiest outdoor escapes close to downtown Rogers.',
      detail: 'Trails & fishing · 8 min drive',
      badge: 'Outdoor',
      severity: 'success',
      categories: ['Outdoor'],
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/7/76/Lake_Atalanta.jpg',
      websiteUrl:
        'https://www.destinationrogers.com/get-inspired/articles/lake-atalanta-features-improved-trails-and-facilities/',
    },
    {
      title: 'World-Class Biking',
      description:
        'Slaughter Pen, Coler, and Lake Atalanta — nationally recognized mountain biking within a short drive of your cabin.',
      detail: 'All skill levels · rent or bring your bike',
      badge: 'Biking',
      severity: 'warn',
      categories: ['Biking'],
      imageUrl:
        'https://www.oztrails.com/wp-content/uploads/2025/10/DSC1768-scaled-1.jpg',
      websiteUrl: 'https://nwabiketrails.com/',
    },
  ];

  readonly outdoorSpots: OutdoorSpot[] = [
    {
      label: 'Lake Atalanta',
      detail: 'Walking trails, fishing, and flow trails close to downtown',
      icon: 'pi pi-map',
    },
    {
      label: 'Prairie Creek Marina',
      detail: 'Kayaking, boating, and Beaver Lake access',
      icon: 'pi pi-compass',
    },
    {
      label: 'War Eagle Cavern',
      detail: 'Guided cave tours — great for families and rainy days',
      icon: 'pi pi-eye',
    },
    {
      label: 'Hobbs State Park',
      detail: 'Longer hikes, wildlife, and lake overlooks',
      icon: 'pi pi-tree',
    },
  ];

  readonly adventureDay: AdventureStep[] = [
    {
      label: 'Morning',
      title: 'Trails or lake',
      description:
        'Start with Lake Atalanta or a Hobbs State Park hike — quiet, scenic, and close to your cabin.',
      accent: true,
    },
    {
      label: 'Afternoon',
      title: 'Ride or explore',
      description:
        'Hit Bentonville bike trails or drive to Beaver Lake for paddling — or browse downtown Rogers if you want a slower pace.',
    },
    {
      label: 'Evening',
      title: 'Downtown dinner & music',
      description:
        'End with local dining and Railyard Live when in season — a easy cap to an active Ozarks day.',
    },
  ];

  readonly trails: TrailSpot[] = [
    {
      name: 'Lake Atalanta',
      type: 'Flow trails · Beginner friendly',
      note: 'Close to downtown',
      distance: '8 min from Remotely Rogers',
      description:
        'Rolling flow trails, a pump track, and lakeside paths — ideal for a quick ride before meetings or an easy family pedal.',
      severity: 'warn',
      imageUrl:
        'https://www.oztrails.com/wp-content/uploads/2025/10/lake-atalanta-trails.webp',
      websiteUrl: 'https://www.oztrails.com/trail/lake-atalanta/',
    },
    {
      name: 'Slaughter Pen Trails',
      type: 'Premier riding · Bentonville',
      note: 'Technical options',
      distance: '20 min drive',
      description:
        'Nationally ranked trail network with progressive jump lines, berms, and cross-country loops through the Ozark woods.',
      severity: 'warn',
      imageUrl:
        'https://www.oztrails.com/wp-content/uploads/2025/10/DSC1768-scaled-1.jpg',
      websiteUrl: 'https://www.oztrails.com/trail/slaughter-pen/',
    },
    {
      name: 'Coler Mountain Bike Preserve',
      type: 'Trails + cafés · Bentonville',
      note: 'Wooded adventure',
      distance: '22 min drive',
      description:
        'Gravity trails, cross-country routes, and a trailhead café — grab coffee, ride hard, and refuel without leaving the trail.',
      severity: 'warn',
      imageUrl:
        'https://www.oztrails.com/wp-content/uploads/2025/10/Coler-Preserve-in-Bentonville-AR-by-GH-Studios-01.jpg',
      websiteUrl: 'https://www.oztrails.com/trail/coler-mtb-preserve/',
    },
    {
      name: 'Fitzgerald Mountain',
      type: 'Advanced terrain · Springdale',
      note: 'Experienced riders',
      distance: '25 min drive',
      description:
        'Rock gardens, ledges, and fast descents for confident riders — one of the region’s most challenging local networks.',
      severity: 'contrast',
      imageUrl:
        'https://www.oztrails.com/wp-content/uploads/2025/10/Fitzgerald-Header-Image.jpg',
      websiteUrl: 'https://www.oztrails.com/trail/fitzgerald-mountain/',
    },
  ];

  readonly cultureSpots: CultureSpot[] = [
    {
      title: 'Historic Downtown Rogers',
      description:
        'Stroll brick-lined streets, browse local boutiques, and catch live events on the square — the heart of Rogers since the railroad era.',
      detail: 'First Friday art walks · walkable dining · 12 min drive',
      badge: 'History · Nightlife',
      icon: 'pi pi-building',
      severity: 'secondary',
      categories: ['History', 'Nightlife', 'Dining'],
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/4/45/Downtown_Rogers.jpg',
      websiteUrl:
        'https://www.destinationrogers.com/downtown-things-to-do/guide-to-downtown-rogers-arkansas-a-must-visit-destination/',
    },
    {
      title: 'Rogers Historical Museum',
      description:
        'Interactive exhibits on Ozark heritage, railroad history, and the people who shaped Northwest Arkansas — great for a rainy afternoon.',
      detail: 'Family-friendly · downtown Rogers',
      badge: 'Museum',
      icon: 'pi pi-book',
      severity: 'info',
      categories: ['History'],
      imageUrl:
        'https://bunny-wp-pullzone-a6bxrid7oy.b-cdn.net/wp-content/uploads/2022/08/rogers_museum2_f.jpg',
      websiteUrl: 'https://www.rogershistoricalmuseum.org/',
    },
    {
      title: 'Railyard Live',
      description:
        'Summer concert series in downtown Rogers with food trucks, local vendors, and a lively community atmosphere under the stars.',
      detail: 'Seasonal events · free & ticketed shows',
      badge: 'Live music',
      icon: 'pi pi-megaphone',
      severity: 'warn',
      categories: ['Nightlife'],
      imageUrl:
        'https://railyardlive.com/site/images/user-images/img_20210702_204645.webp',
      websiteUrl: 'https://railyardlive.com/',
    },
  ];

  readonly diningSpots: DiningSpot[] = [
    {
      name: 'The Buttered Biscuit',
      cuisine: 'Brunch · Southern',
      description:
        'A guest favorite for biscuits, cinnamon rolls, and hearty breakfast plates — worth the short drive on slow weekend mornings.',
      severity: 'warn',
      imageUrl:
        'https://thebutteredbiscuit.com/wp-content/uploads/2025/01/social-share-featured-image-1.jpg',
      websiteUrl: 'https://thebutteredbiscuit.com/',
    },
    {
      name: 'Smokin’ Joe’s Ribhouse',
      cuisine: 'BBQ · Casual',
      description:
        'Slow-smoked ribs, pulled pork, and classic Arkansas BBQ sides — relaxed and filling after a day on the trails.',
      severity: 'contrast',
      imageUrl:
        'https://smokinjoesribhouse.com/wp-content/uploads/2021/03/image-6.jpeg',
      websiteUrl: 'https://smokinjoesribhouse.com/',
    },
    {
      name: 'Louise Café',
      cuisine: 'Brunch · Coffee',
      description:
        'Modern café at Thaden Fieldhouse — diner-style brunch, excellent coffee, and a relaxed spot for a mid-day break or client meet-up.',
      severity: 'secondary',
      imageUrl:
        'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/clients/bentonville/louise_thadenfield_Instagram_3061_ig_17988582355426656_3229baba-6901-4875-8619-732a77890610.jpg',
      websiteUrl: 'https://www.louise.cafe/',
    },
    {
      name: 'House 1830',
      cuisine: 'Vietnamese · Upscale',
      description:
        'Upscale Vietnamese and Southeast Asian cuisine in modern downtown Rogers — family-recipe dishes ideal for a special dinner or celebrating a team milestone.',
      severity: 'success',
      imageUrl:
        'https://static.wixstatic.com/media/24f163_3e72bf86db3f4e71a1f016d1e518574f%7Emv2.jpeg/v1/fit/w_1200,h_640,al_c/24f163_3e72bf86db3f4e71a1f016d1e518574f%7Emv2.jpeg',
      websiteUrl: 'https://www.house1830.com/',
    },
    {
      name: 'Tekila’s',
      cuisine: 'Mexican · Cantina',
      description:
        'Margaritas, fajitas, and a lively patio — an easy group dinner after exploring downtown or biking Bentonville.',
      severity: 'warn',
      imageUrl:
        'https://images.getbento.com/accounts/18452ceb54c968f3654a0ef10f4f45ae/media/images/84853IMG_5460.jpeg?w=1200&fit=crop&auto=compress,format',
      websiteUrl: 'https://www.tekilasbargrill.com/',
    },
    {
      name: 'Crystal Bridges Café',
      cuisine: 'Museum · Lunch',
      description:
        'Light fare on the Crystal Bridges campus in Bentonville — pair lunch with world-class art on a culture day trip.',
      severity: 'info',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/5/5a/Crystal_Bridges_Museum_of_American_Art_May_2017_19_%28Eleven_Restaurant%29.jpg',
      websiteUrl: 'https://crystalbridges.org/food-and-drink',
    },
  ];

  matchesCategory(categories: string[]): boolean {
    if (this.selectedCategory === 'All') {
      return true;
    }

    return categories.includes(this.selectedCategory);
  }

  get filteredFeatured(): FeaturedActivity[] {
    return this.featured.filter((item) => this.matchesCategory(item.categories));
  }

  get showFeaturedLayout(): boolean {
    const items = this.filteredFeatured;
    return items.some((item) => item.large) && items.length > 1;
  }

  get showOutdoorSection(): boolean {
    return this.matchesCategory(['Outdoor', 'Weekend trips']);
  }

  get showBikingSection(): boolean {
    return this.matchesCategory(['Biking']);
  }

  get filteredCultureSpots(): CultureSpot[] {
    return this.cultureSpots.filter((spot) => this.matchesCategory(spot.categories));
  }

  get showDiningSection(): boolean {
    return this.matchesCategory(['Dining']);
  }

  get showCultureSection(): boolean {
    return this.filteredCultureSpots.length > 0 || this.showDiningSection;
  }

  get hasVisibleContent(): boolean {
    return (
      this.filteredFeatured.length > 0 ||
      this.showOutdoorSection ||
      this.showBikingSection ||
      this.showCultureSection
    );
  }

  isFeaturedLarge(item: FeaturedActivity): boolean {
    return !!item.large && this.showFeaturedLayout;
  }
}
