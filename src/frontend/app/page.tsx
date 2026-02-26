/**
 * Home Page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { homeApi } from '@/lib/api';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import { MapPin, Share2, Users, ArrowRight, TreesIcon } from 'lucide-react';
import { Campground } from '@/types';
import Image from 'next/image';

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.HOME_DATA],
    queryFn: () => homeApi.getHomeData(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load data</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-br from-emerald-600 to-teal-500 py-24 text-white"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(13, 148, 136, 0.9), rgba(20, 184, 166, 0.8)), url(https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl">
            <TreesIcon className="mx-auto mb-4 h-16 w-16" />
            Welcome to Stonehaven
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
            Discover amazing campgrounds, share your favorite spots, and connect with
            fellow outdoor enthusiasts. Your next adventure starts here.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={ROUTES.CAMPGROUNDS}>
              <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100">
                <MapPin className="mr-2 h-5 w-5" />
                Explore Campgrounds
              </Button>
            </Link>
            <Link href={ROUTES.CAMPGROUND_NEW}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <span className="mr-2">+</span>
                Add Your Campground
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Why Choose Stonehaven?</h2>
            <p className="text-lg text-gray-600">
              The ultimate platform for campers and outdoor lovers
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={MapPin}
              title="Discover Amazing Spots"
              description="Find hidden gems and popular campgrounds with detailed descriptions, photos, and real reviews from fellow campers."
            />
            <FeatureCard
              icon={Share2}
              title="Share Your Experience"
              description="Add your favorite campgrounds, share photos, and help others discover the perfect outdoor getaway."
            />
            <FeatureCard
              icon={Users}
              title="Join the Community"
              description="Connect with like-minded outdoor enthusiasts, share tips, and get inspired for your next camping adventure."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <StatCard
              number={data.stats.campgrounds}
              label="Campgrounds"
            />
            <StatCard number={data.stats.users} label="Happy Campers" />
            <StatCard number={data.stats.reviews} label="Reviews" />
            <StatCard number={24} label="Countries" />
          </div>
        </div>
      </section>

      {/* Featured Campgrounds */}
      {data.featuredCampgrounds && data.featuredCampgrounds.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h3 className="mb-4 text-3xl font-bold text-gray-900">
                Featured Campgrounds
              </h3>
              <p className="text-lg text-gray-600">
                Check out some of our most popular spots
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {data.featuredCampgrounds.map((campground: Campground) => (
                <CampgroundPreviewCard key={campground._id} campground={campground} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-emerald-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="mb-4 text-3xl font-bold">Ready to Start Your Adventure?</h3>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of campers who trust Stonehaven for their outdoor adventures
          </p>
          <Link href={ROUTES.REGISTER}>
            <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100">
              Join Now - It&apos;s Free!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card hover className="text-center">
      <CardContent className="p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h4 className="mb-3 text-xl font-bold text-gray-900">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  number: number;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <div className="text-center">
      <p className="mb-2 text-4xl font-extrabold text-emerald-600">{number}</p>
      <p className="text-sm font-medium uppercase tracking-wide text-gray-600">{label}</p>
    </div>
  );
}

interface CampgroundPreviewCardProps {
  campground: Campground;
}

function CampgroundPreviewCard({ campground }: CampgroundPreviewCardProps) {
  const imageUrl =
    campground.images && campground.images.length > 0
      ? campground.images[0].url
      : 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

  return (
    <Card hover className="overflow-hidden">
      <div className="relative h-64 w-full">
        <Image
          src={imageUrl}
          alt={campground.title}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-6">
        <h5 className="mb-2 text-xl font-bold text-gray-900">{campground.title}</h5>
        <p className="mb-4 text-gray-600">{campground.location}</p>
        <Link href={ROUTES.CAMPGROUND_DETAIL(campground._id)}>
          <Button variant="outline" size="sm" className="w-full">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
