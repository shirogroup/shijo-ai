'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Pencil, CalendarDays, Hash, Film, Repeat2, UserCircle, Linkedin,
  Search, FileText, Tags, HelpCircle, Eye,
  Megaphone, FlaskConical, Users, Lightbulb, LayoutDashboard, Globe,
  Mail, Zap, Newspaper,
  BrainCircuit, Video, BookOpen
} from 'lucide-react';

const categories = [
  {
    label: 'Social Media',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    tools: [
      { icon: Pencil, name: 'Post Caption Generator', description: 'Scroll-stopping captions with hooks and CTAs for any platform', free: true },
      { icon: CalendarDays, name: 'Social Content Planner', description: 'AI-generated content calendars — 7, 14, or 30 days' },
      { icon: Hash, name: 'Hashtag Optimizer', description: 'Research-backed hashtag sets ranked by reach potential', free: true },
      { icon: Film, name: 'Carousel & Reels Script', description: 'Slide copy and short-form video scripts' },
      { icon: Repeat2, name: 'Content Repurposer', description: 'Turn one blog post into threads, tweets, and stories' },
      { icon: UserCircle, name: 'Social Bio Optimizer', description: 'Keyword-rich bios that convert visitors to followers', free: true },
      { icon: Linkedin, name: 'LinkedIn Post Generator', description: 'Professional thought-leadership posts that drive engagement', free: true },
    ],
  },
  {
    label: 'SEO',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    tools: [
      { icon: Search, name: 'Keyword Research', description: 'Semantic keyword clusters with intent and difficulty scoring' },
      { icon: FileText, name: 'SEO Content Brief', description: 'Full outlines with headings, questions, and competitor gaps' },
      { icon: Tags, name: 'SEO Meta Generator', description: 'Title tags and meta descriptions optimized for click-through', free: true },
      { icon: HelpCircle, name: 'FAQ Generator', description: 'Schema-ready FAQ sections from any topic or page URL' },
      { icon: Eye, name: 'AI Overview Optimizer', description: 'Optimize content for Google AI Overviews and featured snippets' },
    ],
  },
  {
    label: 'Ads & Copy',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    tools: [
      { icon: Megaphone, name: 'Ad Copy Generator', description: 'Google, Meta, and LinkedIn ad copy in every format' },
      { icon: FlaskConical, name: 'Ad Headline A/B Tester', description: 'Generate headline variants scored by clarity and click appeal' },
      { icon: Users, name: 'Audience Targeting Profiles', description: 'ICP personas with demographics, psychographics, and hooks' },
      { icon: Lightbulb, name: 'Pain-to-Hook Converter', description: 'Turn customer pain points into compelling ad hooks' },
      { icon: LayoutDashboard, name: 'Sales Angle Generator', description: 'Multiple positioning angles for any product or offer' },
      { icon: Globe, name: 'Landing Page Copy Generator', description: 'Full above-the-fold copy: headline, subhead, bullets, CTA' },
    ],
  },
  {
    label: 'Email',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    tools: [
      { icon: Mail, name: 'Email Sequence Generator', description: 'Multi-step drip campaigns for any funnel stage' },
      { icon: Zap, name: 'Subject Line Generator', description: '10+ subject line variants A/B-tested for open rates' },
      { icon: Newspaper, name: 'Newsletter Generator', description: 'Weekly newsletter drafts with sections and CTAs' },
    ],
  },
  {
    label: 'Content',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    tools: [
      { icon: BrainCircuit, name: 'Content Idea Generator', description: 'Trending topic clusters based on your niche and goals' },
      { icon: Video, name: 'Video Content Suite', description: 'Blog-to-video scripts, clip breakdowns, and repurposing' },
      { icon: BookOpen, name: 'Blog Post Outline', description: 'SEO-optimized outlines with H2s, key points, and word counts' },
    ],
  },
];

const totalTools = categories.reduce((sum, cat) => sum + cat.tools.length, 0);
const freeTools = categories.reduce((sum, cat) => sum + cat.tools.filter(t => t.free).length, 0);

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {totalTools} Tools, <span className="text-primary">One Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for SEO, social media, ads, email, and content — powered by AI
          </p>
          <p className="text-sm text-muted-foreground mt-2">{freeTools} tools free forever, no credit card needed</p>
        </div>

        <div className="space-y-12 max-w-7xl mx-auto">
          {categories.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 className={`text-lg font-bold mb-4 ${category.color}`}>{category.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool, toolIndex) => {
                  const Icon = tool.icon;
                  const delay = catIndex * 0.05 + toolIndex * 0.03;
                  return (
                    <motion.div
                      key={toolIndex}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay }}
                      viewport={{ once: true }}
                    >
                      <Card className="p-5 h-full hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.bgColor}`}>
                            <Icon className={`w-5 h-5 ${category.color}`} />
                          </div>
                          {tool.free && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">FREE</Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-bold mb-1">{tool.name}</h4>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">New tools added monthly</p>
        </div>
      </div>
    </section>
  );
}
